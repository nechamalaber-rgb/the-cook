
import React, { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, Loader2, Package, ScanLine, Calendar, X, Box, ListPlus, Type, Info, FolderPlus, Edit3, Save, Minus, Filter, Search, Grid, List, Sparkles } from 'lucide-react';
import { Ingredient, Category, Pantry, UserPreferences } from '../types';
import { parseReceiptOrImage, organizePastedText } from '../services/geminiService';

// Add the missing PantryViewProps interface
interface PantryViewProps {
  pantries: Pantry[];
  activePantryId: string;
  setActivePantryId: (id: string) => void;
  onAddPantry: (name: string) => void;
  items: Ingredient[];
  setItems: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  onRequireAccess: (action: string) => boolean;
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case Category.PRODUCE: return 'bg-lime-500';
        case Category.MEAT: return 'bg-rose-500';
        case Category.DAIRY: return 'bg-sky-500';
        case Category.BAKERY: return 'bg-amber-700';
        case Category.PANTRY: return 'bg-amber-500';
        case Category.FROZEN: return 'bg-indigo-500';
        case Category.BEVERAGE: return 'bg-violet-500';
        default: return 'bg-slate-400';
    }
};

const autoCategorize = (name: string): Category => {
    const lower = name.toLowerCase();
    // Specific detection for "Vessels"
    if (lower.match(/bagel|bread|toast|sourdough|tortilla|wrap|roll|bun|muffin|pita|naan|baguette|ciabatta|croissant|focaccia/)) return Category.BAKERY;
    
    if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper|salad|berry|lemon|lime|broccoli|cabbage|cucumber|mushroom|kale|zucchini|asparagus/)) return Category.PRODUCE;
    if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy|curd|sour cream|parmesan|mozzarella|cheddar|brie|feta/)) return Category.DAIRY;
    if (lower.match(/chicken|beef|pork|meat|fish|salmon|tuna|steak|sausage|bacon|turkey|shrimp|lamb|prawn|tilapia|ham/)) return Category.MEAT;
    if (lower.match(/frozen|ice|pizza|nugget|peas|sortet|gelato|waffle/)) return Category.FROZEN;
    if (lower.match(/water|soda|juice|beer|wine|coffee|tea|drink|sparkling|kombucha/)) return Category.BEVERAGE;
    return Category.PANTRY; 
};

const parseQuantity = (q: string): { num: number; suffix: string } => {
    const match = q.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
        return { num: parseFloat(match[1]), suffix: match[2] || '' };
    }
    return { num: 1, suffix: q };
};

const PantryView: React.FC<PantryViewProps> = ({ 
  pantries, 
  activePantryId, 
  setActivePantryId, 
  onAddPantry,
  items, 
  setItems,
  onRequireAccess
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingPantry, setIsAddingPantry] = useState(false);
  const [newPantryName, setNewPantryName] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'list'>('single');
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState<Category | 'Auto'>( 'Auto' );
  
  const [bulkList, setBulkList] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mergeItems = (existing: Ingredient[], incoming: Ingredient[]): Ingredient[] => {
    const result = [...existing];
    incoming.forEach(newItem => {
        const existingIndex = result.findIndex(i => i.name.toLowerCase() === newItem.name.toLowerCase());
        if (existingIndex !== -1) {
            const oldQ = parseQuantity(result[existingIndex].quantity);
            const newQ = parseQuantity(newItem.quantity);
            const mergedVal = oldQ.num + newQ.num;
            const suffix = oldQ.suffix || newQ.suffix;
            result[existingIndex] = {
                ...result[existingIndex],
                quantity: suffix ? `${mergedVal} ${suffix}`.trim() : `${mergedVal}`
            };
        } else {
            result.unshift(newItem);
        }
    });
    return result;
  };

  const handleManualAdd = () => {
    if (!newItemName) return;
    
    const names = newItemName.includes(',') 
        ? newItemName.split(',').map(n => n.trim()).filter(n => n)
        : [newItemName.trim()];

    const incoming: Ingredient[] = names.map((name, idx) => ({
      id: (Date.now() + idx).toString(),
      name,
      category: newItemCategory === 'Auto' ? autoCategorize(name) : newItemCategory as Category,
      quantity: newItemQuantity || '1',
      addedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));

    setItems(prev => mergeItems(prev, incoming));
    
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

  const handleBulkAdd = async () => {
    if (!bulkList.trim()) return;
    setIsProcessingBulk(true);
    try {
        const organized = await organizePastedText(bulkList);
        
        const incoming: Ingredient[] = organized.map((item, idx) => ({
            id: `bulk-${Date.now()}-${idx}`,
            name: item.name,
            category: item.category as Category,
            quantity: item.quantity,
            addedDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));

        setItems(prev => mergeItems(prev, incoming));
        setBulkList('');
        setIsAdding(false);
    } catch (e) {
        console.error("AI parse failed", e);
    } finally {
        setIsProcessingBulk(false);
    }
  };

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
        const incoming: Ingredient[] = result.items.map((item, idx) => ({
          id: Date.now().toString() + idx,
          name: item.name,
          category: normalizeCategory(item.category || item.name),
          quantity: item.quantity,
          addedDate: new Date().toISOString().split('T')[0]
        }));
        setItems(prev => mergeItems(prev, incoming));
    } catch (e) { alert("Failed to scan."); }
    finally { setIsScanning(false); }
  };

  const handleDelete = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const adjustQuantity = (id: string, delta: number) => {
      setItems(prev => prev.map(item => {
          if (item.id !== id) return item;
          const { num, suffix } = parseQuantity(item.quantity);
          const newNum = Math.max(0, num + delta);
          if (newNum === 0) return item; 
          return { ...item, quantity: suffix ? `${newNum} ${suffix}`.trim() : `${newNum}` };
      }));
  };

  const normalizeCategory = (inputCat: string): Category => {
      if (!inputCat) return Category.OTHER;
      const lower = inputCat.toLowerCase();
      if (lower.includes('bakery') || lower.includes('bread')) return Category.BAKERY;
      if (lower.includes('produce') || lower.includes('fruit') || lower.includes('veg')) return Category.PRODUCE;
      if (lower.includes('dairy') || lower.includes('egg') || lower.includes('cheese') || lower.includes('milk')) return Category.DAIRY;
      if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef')) return Category.MEAT;
      return autoCategorize(inputCat);
  };

  const filteredItems = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-1 gap-6">
        <div>
          <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tighter">Inventory</h1>
          <div className="flex items-center gap-4 mt-2">
             <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex">
                 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400'}`}><Grid size={16}/></button>
                 <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400'}`}><List size={16}/></button>
             </div>
             <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{items.length} cards</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
             <div className="flex-1 md:w-64 relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pantry..." 
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none outline-none pl-10 pr-4 py-3 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 transition-all"
                 />
             </div>

            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-primary-600 transition-all border border-slate-200 dark:border-slate-800 shadow-sm">
                {isScanning ? <Loader2 size={20} className="animate-spin" /> : <ScanLine size={20} />}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            
            <button onClick={() => setIsAdding(true)} className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">
                <Plus size={18} />
                <span className="text-xs uppercase tracking-widest hidden sm:inline">Add Item</span>
            </button>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto no-scrollbar pb-2">
         <div className="flex gap-3 px-1">
            {pantries.map(p => (
                <button
                    key={p.id}
                    onClick={() => setActivePantryId(p.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex-shrink-0 flex items-center gap-2 ${
                        activePantryId === p.id 
                        ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent shadow-lg' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'
                    }`}
                >
                    <Box size={14} /> {p.name}
                </button>
            ))}
            <button onClick={() => setIsAddingPantry(true)} className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-primary-500 hover:border-primary-400 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest flex-shrink-0">
                <FolderPlus size={14} /> New
            </button>
         </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 px-1">
         {['All', ...Object.values(Category)].map(cat => (
             <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    activeCategory === cat 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
             >
                 {cat}
             </button>
         ))}
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 px-1" : "space-y-3 px-1"}>
          {filteredItems.map(item => {
              const categoryColor = getCategoryColor(item.category);
              if (viewMode === 'list') {
                  return (
                      <div key={item.id} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                          <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${categoryColor}`}></div>
                              <div>
                                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</h3>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-6">
                              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
                                  <button onClick={() => adjustQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Minus size={12}/></button>
                                  <span className="text-xs font-bold w-12 text-center">{item.quantity}</span>
                                  <button onClick={() => adjustQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Plus size={12}/></button>
                              </div>
                              <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  );
              }
              return (
                  <div key={item.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-900 transition-all duration-300 flex flex-col justify-between aspect-square">
                      <div className={`w-6 h-6 rounded-lg ${categoryColor} bg-opacity-10 flex items-center justify-center`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${categoryColor}`}></div>
                      </div>
                      <div className="text-center my-1 flex-1 flex flex-col justify-center">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2">{item.name}</h3>
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider mt-1">{item.category}</p>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-1 mt-auto">
                          <button onClick={() => adjustQuantity(item.id, -1)} className="w-5 h-5 rounded-md hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><Minus size={10}/></button>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 px-1 truncate max-w-[50px]">{item.quantity}</span>
                          <button onClick={() => adjustQuantity(item.id, 1)} className="w-5 h-5 rounded-md hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><Plus size={10}/></button>
                      </div>
                      <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-md">
                        <Trash2 size={12} />
                      </button>
                  </div>
              );
          })}
      </div>

      {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Restock Studio</h2>
                      <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X /></button>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                      <button onClick={() => setAddMode('single')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${addMode === 'single' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}>Single Item</button>
                      <button onClick={() => setAddMode('list')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${addMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}>Bulk List</button>
                  </div>
                  {addMode === 'single' ? (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Item Name(s)</label>
                            <input autoFocus type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all text-lg" placeholder="e.g. Bagel, Cream Cheese" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Quantity</label>
                                <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all" placeholder="1" />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label>
                                <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white appearance-none">
                                    <option value="Auto">Auto-Organize</option>
                                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={handleManualAdd} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl mt-4">Confirm Stock</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Paste Shopping List</label>
                            <textarea autoFocus value={bulkList} onChange={e => setBulkList(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all h-40 resize-none text-sm" placeholder="5 eggs, 2 lbs chicken, 1 bag flour..." />
                        </div>
                        <button 
                            onClick={handleBulkAdd} 
                            disabled={isProcessingBulk}
                            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl mt-4 flex items-center justify-center gap-2"
                        >
                            {isProcessingBulk ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                            {isProcessingBulk ? 'Organizing & Deduplicating...' : 'Import into Studio'}
                        </button>
                    </div>
                  )}
              </div>
          </div>
      )}

      {isAddingPantry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white mb-6">Create New Studio</h2>
                  <div className="space-y-6">
                      <div>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Studio Name</label>
                          <input autoFocus type="text" value={newPantryName} onChange={e => setNewPantryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreatePantry()} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all" placeholder="e.g. Vacation Kitchen" />
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setIsAddingPantry(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
                          <button onClick={handleCreatePantry} className="flex-1 py-4 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Confirm</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PantryView;
