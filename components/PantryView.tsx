import React, { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, Loader2, Package, ScanLine, Calendar, X, Box, ListPlus, Type, Info, FolderPlus, ChevronRight } from 'lucide-react';
import { Ingredient, Category, Pantry, UserPreferences } from '../types';
import { parseReceiptOrImage } from '../services/geminiService';

interface PantryViewProps {
  pantries: Pantry[];
  activePantryId: string;
  setActivePantryId: (id: string) => void;
  onAddPantry: (name: string) => void;
  items: Ingredient[];
  setItems: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  preferences?: UserPreferences;
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case Category.PRODUCE: return 'text-culinary-produce bg-culinary-produce/10';
        case Category.MEAT: return 'text-culinary-protein bg-culinary-protein/10';
        case Category.DAIRY: return 'text-culinary-dairy bg-culinary-dairy/10';
        case Category.PANTRY: return 'text-culinary-pantry bg-culinary-pantry/10';
        case Category.FROZEN: return 'text-culinary-frozen bg-culinary-frozen/10';
        case Category.BEVERAGE: return 'text-culinary-beverage bg-culinary-beverage/10';
        default: return 'text-slate-400 bg-slate-100';
    }
};

const getDotColor = (category: string) => {
    switch (category) {
        case Category.PRODUCE: return 'bg-culinary-produce';
        case Category.MEAT: return 'bg-culinary-protein';
        case Category.DAIRY: return 'bg-culinary-dairy';
        case Category.PANTRY: return 'bg-culinary-pantry';
        case Category.FROZEN: return 'bg-culinary-frozen';
        case Category.BEVERAGE: return 'bg-culinary-beverage';
        default: return 'bg-slate-400';
    }
};

const PantryView: React.FC<PantryViewProps> = ({ 
  pantries, 
  activePantryId, 
  setActivePantryId, 
  onAddPantry,
  items, 
  setItems,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingPantry, setIsAddingPantry] = useState(false);
  const [newPantryName, setNewPantryName] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'list'>('single');
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState<Category>(Category.OTHER);
  const [bulkList, setBulkList] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualAdd = () => {
    if (!newItemName) return;
    const newItem: Ingredient = {
      id: Date.now().toString(),
      name: newItemName,
      category: newItemCategory,
      quantity: newItemQuantity || '1',
      addedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemQuantity('1');
    setIsAdding(false);
  };

  const handleCreatePantry = () => {
    if (!newPantryName.trim()) return;
    onAddPantry(newPantryName);
    setNewPantryName('');
    setIsAddingPantry(false);
  };

  const handleBulkAdd = () => {
    if (!bulkList.trim()) return;
    const lines = bulkList.split('\n').filter(l => l.trim());
    const newItems: Ingredient[] = lines.map((line, idx) => ({
      id: (Date.now() + idx).toString(),
      name: line.trim(),
      category: Category.PANTRY,
      quantity: '1',
      addedDate: new Date().toISOString().split('T')[0]
    }));
    setItems(prev => [...prev, ...newItems]);
    setBulkList('');
    setIsAdding(false);
  };

  const normalizeCategory = (inputCat: string): Category => {
      if (!inputCat) return Category.OTHER;
      const lower = inputCat.toLowerCase();
      if (lower.includes('produce') || lower.includes('fruit') || lower.includes('veg')) return Category.PRODUCE;
      if (lower.includes('dairy') || lower.includes('egg') || lower.includes('cheese') || lower.includes('milk')) return Category.DAIRY;
      if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef')) return Category.MEAT;
      return Category.PANTRY;
  };

  const handleDelete = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((res) => {
            reader.onload = () => res((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const result = await parseReceiptOrImage(base64Data);
        const newItems: Ingredient[] = result.items.map((item, idx) => ({
          id: Date.now().toString() + idx,
          name: item.name,
          category: normalizeCategory(item.category),
          quantity: item.quantity,
          addedDate: new Date().toISOString().split('T')[0]
        }));
        setItems(prev => [...prev, ...newItems]);
    } catch (e) { alert("Failed to scan."); }
    finally { setIsScanning(false); }
  };

  const getDaysUntilExpiry = (dateStr?: string) => {
    if (!dateStr) return 999;
    return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  };

  const groupedItems = useMemo(() => {
    const groups = Object.values(Category).reduce((acc, cat) => {
      acc[cat] = items.filter(item => item.category === cat);
      return acc;
    }, {} as Record<string, Ingredient[]>);
    return groups;
  }, [items]);

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 px-1 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tighter">Inventory</h1>
          <p className="text-slate-500 font-bold text-[10px] mt-1 uppercase tracking-widest">{items.length} total items in {pantries.find(p => p.id === activePantryId)?.name}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-primary-600 transition-all border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-2">
                {isScanning ? <Loader2 size={22} className="animate-spin" /> : <ScanLine size={22} />}
                <span className="sm:hidden text-xs font-bold uppercase tracking-widest">Scan</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            <button onClick={() => setIsAdding(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">
                <Plus size={20} />
                <span className="text-sm">Restock</span>
            </button>
        </div>
      </div>

      {/* PANTRY/STUDIO SWITCHER */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Your Studios</h2>
            <button 
                onClick={() => setIsAddingPantry(true)}
                className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 hover:text-primary-700 transition-colors"
            >
                <FolderPlus size={14} /> New Studio
            </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            {pantries.map(p => (
                <button
                    key={p.id}
                    onClick={() => setActivePantryId(p.id)}
                    className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 flex-shrink-0 flex items-center gap-2 ${
                        activePantryId === p.id 
                        ? 'bg-primary-950 border-primary-950 text-white shadow-xl' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
                    }`}
                >
                    <Box size={14} /> {p.name}
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-12 px-1">
        {(Object.entries(groupedItems) as [string, Ingredient[]][]).map(([category, catItems]) => {
            const catClass = getCategoryColor(category);
            const dotClass = getDotColor(category);
            const isEmpty = catItems.length === 0;

            return (
                <div key={category} className="animate-slide-up">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded-md ${catClass}`}>{category}</span>
                      <div className="h-px bg-slate-200 dark:bg-slate-800/40 flex-1"></div>
                    </h2>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/30">
                        {isEmpty ? (
                            <div className="py-4 flex items-center gap-3 opacity-40 group grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <div className={`w-1.5 h-1.5 rounded-full ${dotClass} opacity-20`}></div>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 italic">Empty — Add {category.toLowerCase()} to inventory</span>
                            </div>
                        ) : (
                            catItems.map(item => {
                                const days = getDaysUntilExpiry(item.expiryDate);
                                const isWarning = days <= 3;
                                return (
                                    <div key={item.id} className="group flex items-center justify-between py-5 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${dotClass} opacity-30 group-hover:opacity-100 transition-all scale-100 group-hover:scale-150`}></div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight">{item.name}</h3>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <Box size={10} className="text-primary-500" /> {item.quantity}
                                                    </span>
                                                    {item.expiryDate && (
                                                        <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${isWarning ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                                            <Calendar size={10} /> {isWarning ? (days < 0 ? 'Discard' : 'Expiring') : 'Good'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {items.length === 0 && (
          <div className="py-32 text-center animate-fade-in">
              <Package size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
              <h2 className="text-xl font-serif font-black text-slate-300 dark:text-slate-700">Studio is empty</h2>
              <p className="text-slate-400 dark:text-slate-600 mt-1 text-sm font-medium">Add ingredients to start the menu.</p>
          </div>
      )}

      {/* NEW PANTRY MODAL */}
      {isAddingPantry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white mb-6">Create New Studio</h2>
                  <div className="space-y-6">
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Studio Name</label>
                          <input 
                              autoFocus 
                              type="text" 
                              value={newPantryName} 
                              onChange={e => setNewPantryName(e.target.value)} 
                              onKeyDown={e => e.key === 'Enter' && handleCreatePantry()}
                              className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all" 
                              placeholder="e.g. Vacation Kitchen" 
                          />
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setIsAddingPantry(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                          <button onClick={handleCreatePantry} className="flex-1 py-4 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 transition-all">Confirm</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Add Items</h2>
                      <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X /></button>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                      <button 
                        onClick={() => setAddMode('single')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'single' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        <Type size={14} /> Single Item
                      </button>
                      <button 
                        onClick={() => setAddMode('list')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        <ListPlus size={14} /> Import List
                      </button>
                  </div>

                  {addMode === 'single' ? (
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Ingredient Name</label>
                            <input autoFocus type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all" placeholder="e.g. Avocado" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quantity</label>
                                <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all" placeholder="3 large" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label>
                                <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as Category)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white appearance-none">
                                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={handleManualAdd} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all mt-4">Restock Inventory</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Paste Shopping List</label>
                            <textarea 
                                autoFocus
                                value={bulkList} 
                                onChange={e => setBulkList(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all h-40 resize-none" 
                                placeholder="Eggs&#10;Whole Milk&#10;Spinach&#10;Potatoes" 
                            />
                        </div>
                        <button onClick={handleBulkAdd} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all mt-4">Import into Studio</button>
                    </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default PantryView;