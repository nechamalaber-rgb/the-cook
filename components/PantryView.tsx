
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Plus, Loader2, X, Minus, Search, 
  ChevronRight, Sparkles, Camera,
  LayoutGrid,
  Search as SearchIcon,
  Focus,
  Calendar,
  Tag,
  UtensilsCrossed,
  ListPlus,
  Trash2,
  Clock,
  ChevronLeft,
  Filter,
  PackageCheck,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Ingredient, Category, Pantry } from '../types';
import { parseReceiptOrImage, generatePantryAssetImage, organizePastedText } from '../services/geminiService';
import { autoCategorize, parseQuantityValue, mergeQuantities } from '../src/utils';

const getCategoryTheme = (category: string) => {
    switch (category) {
        case Category.PRODUCE: return { dot: 'bg-lime-500', text: 'text-lime-500', bg: 'bg-[#1a2e1a]', border: 'border-lime-500/20' };
        case Category.MEAT: return { dot: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-[#2e1a1a]', border: 'border-rose-500/20' };
        case Category.DAIRY: return { dot: 'bg-[#3b82f6]', text: 'text-[#3b82f6]', bg: 'bg-[#1a1f2e]', border: 'border-[#3b82f6]/30' };
        case Category.BAKERY: return { dot: 'bg-amber-600', text: 'text-amber-500', bg: 'bg-[#2e2a1a]', border: 'border-amber-500/20' };
        case Category.PANTRY: return { dot: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-[#2e231a]', border: 'border-orange-500/20' };
        default: return { dot: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-[#1a1a1c]', border: 'border-slate-700' };
    }
};

interface PantryViewProps {
  pantries: Pantry[];
  activePantryId: string;
  setActivePantryId: (id: string) => void;
  onAddPantry: (name: string) => void;
  items: Ingredient[];
  setItems: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  onConsumeGeneration?: () => boolean;
}

const PantryView: React.FC<PantryViewProps> = ({ items, setItems, onConsumeGeneration }) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [newItemName, setNewItemName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<Category | 'All'>('All');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visualizingIds, setVisualizingIds] = useState<Set<string>>(new Set());

  const categories = ['All', ...Object.values(Category)];

  useEffect(() => {
    const processVisuals = async () => {
        const missing = items.filter(i => !i.imageUrl && !visualizingIds.has(i.id)).slice(0, 1);
        if (missing.length === 0) return;
        const item = missing[0];
        setVisualizingIds(prev => new Set(prev).add(item.id));
        try {
            const data = await generatePantryAssetImage(item.name, item.quantity);
            if (data) setItems(prev => prev.map(i => i.id === item.id ? { ...i, imageUrl: data } : i));
        } catch (e) { console.warn(e); } 
        finally { setVisualizingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; }); }
    };
    const timer = setTimeout(processVisuals, 1000);
    return () => clearTimeout(timer);
  }, [items, visualizingIds]);

  const handleManualAdd = () => {
    if (!newItemName) return;
    const name = newItemName.trim();
    const existing = items.find(i => i.name.toLowerCase() === name.toLowerCase());

    if (existing) {
        setItems(prev => prev.map(i => i.id === existing.id 
            ? { ...i, quantity: mergeQuantities(i.quantity, '1 Unit') } 
            : i
        ));
    } else {
        const cat = autoCategorize(name);
        const incoming: Ingredient = {
          id: Date.now().toString(), 
          name, 
          category: cat, 
          quantity: '1 Unit',
          addedDate: new Date().toISOString().split('T')[0], 
          imageUrl: '' 
        };
        setItems(prev => [incoming, ...prev]);
    }
    setNewItemName(''); setIsAdding(false);
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    if (onConsumeGeneration && !onConsumeGeneration()) return;
    
    setIsProcessingBulk(true);
    try {
        const parsed = await organizePastedText(bulkText);
        setItems(prev => {
            let current = [...prev];
            parsed.forEach((newItem: any) => {
                const existing = current.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
                if (existing) {
                    current = current.map(i => i.id === existing.id 
                        ? { ...i, quantity: mergeQuantities(i.quantity, newItem.quantity || '1') } 
                        : i
                    );
                } else {
                    current = [{
                      id: (Date.now() + Math.random()).toString(), 
                      name: newItem.name, 
                      category: autoCategorize(newItem.name), 
                      quantity: newItem.quantity || '1', 
                      addedDate: new Date().toISOString().split('T')[0], 
                      imageUrl: ''
                    }, ...current];
                }
            });
            return current;
        });
        setBulkText('');
        setIsAdding(false);
    } catch (e) {
        alert("Could not read your list. Try typing them one by one.");
    } finally {
        setIsProcessingBulk(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onConsumeGeneration && !onConsumeGeneration()) return;
    setIsScanning(true);
    try {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((res) => {
            reader.onload = () => res((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const result = await parseReceiptOrImage(base64Data, file.type);
        if (result.items && result.items.length > 0) {
            setItems(prev => {
                let current = [...prev];
                result.items.forEach((newItem: any) => {
                    const existing = current.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
                    if (existing) {
                        current = current.map(i => i.id === existing.id 
                            ? { ...i, quantity: mergeQuantities(i.quantity, newItem.quantity || '1') } 
                            : i
                        );
                    } else {
                        current = [{
                          id: (Date.now() + Math.random()).toString(), 
                          name: newItem.name, 
                          category: autoCategorize(newItem.name), 
                          quantity: newItem.quantity || '1', 
                          addedDate: new Date().toISOString().split('T')[0], 
                          imageUrl: ''
                        }, ...current];
                    }
                });
                return current;
            });
        }
    } catch (e) { alert("Scan failed."); }
    finally { setIsScanning(false); }
  };

  const adjustQuantity = (id: string, delta: number) => {
      setItems(prev => prev.map(item => {
          if (item.id !== id) return item;
          const { num, suffix } = parseQuantityValue(item.quantity || '1');
          const newNum = Math.max(1, num + delta); 
          const newVal = suffix ? `${newNum} ${suffix}`.trim() : `${newNum}`;
          return { ...item, quantity: newVal };
      }));
  };

  const filteredItems = useMemo(() => {
      let filtered = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (activeCategoryFilter !== 'All') {
          filtered = filtered.filter(item => item.category === activeCategoryFilter);
      }
      return filtered;
  }, [items, searchQuery, activeCategoryFilter]);

  return (
    <div className="animate-fade-in pb-48 w-full max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-4 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 opacity-60">
             <LayoutGrid size={14} className="text-primary-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">STOCKED ITEMS</span>
          </div>
          <h1 className="text-5xl md:text-[6.5rem] font-serif font-black text-white tracking-tighter leading-none italic">Food.</h1>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
             <div id="pantry-search-box" className="flex-1 md:w-72 relative">
                 <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search kitchen..." className="w-full bg-[#111827] border border-white/10 outline-none pl-6 pr-12 py-5 rounded-[1.8rem] text-sm font-bold text-white shadow-inner placeholder:text-slate-500 focus:border-primary-500/50 transition-all" />
                 <SearchIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             </div>
             
             <button 
               onClick={() => fileInputRef.current?.click()} 
               className="p-5 bg-primary-500/20 border border-primary-500/40 text-primary-400 rounded-[1.8rem] hover:bg-primary-500 hover:text-white transition-all flex items-center justify-center shadow-lg group relative"
             >
                 {isScanning ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
             </button>

            <button id="pantry-add-btn" onClick={() => setIsAdding(true)} className="flex items-center justify-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-[1.8rem] font-black shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
              <Plus size={20}/> Add Food
            </button>
        </div>
      </div>

      {/* CATEGORY BAR */}
      <div className="px-4 mb-10 overflow-x-auto no-scrollbar flex items-center gap-2 pb-2">
           <div className="bg-white/5 p-1 rounded-2xl flex items-center gap-1 border border-white/5">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategoryFilter(cat as any)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategoryFilter === cat ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {cat}
                    </button>
                ))}
           </div>
      </div>

      {/* PANTRY GRID */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6 px-4">
          {filteredItems.map(item => {
              const { num } = parseQuantityValue(item.quantity || '1');
              const theme = getCategoryTheme(item.category);
              const isLoadingImage = visualizingIds.has(item.id);

              return (
                  <div key={item.id} className={`group relative rounded-[2.5rem] p-0 border transition-all duration-500 flex flex-col overflow-hidden aspect-square ${theme.bg} ${theme.border} hover:scale-[1.03] shadow-lg`}>
                      <div onClick={() => setSelectedItem(item)} className="absolute inset-0 flex items-center justify-center cursor-pointer p-0 bg-slate-800/20">
                           {(isLoadingImage || !item.imageUrl) ? (
                               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                                   <Loader2 size={24} className="animate-spin text-primary-500/40" />
                               </div>
                           ) : (
                                <img src={item.imageUrl} className="w-full h-full object-cover opacity-100 transition-transform duration-[4s] group-hover:scale-110" alt="" />
                           )}
                      </div>
                           
                      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-12">
                          <div className="space-y-0.5 pointer-events-none">
                              <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${theme.text}`}>{item.category.split(' ')[0]}</p>
                              <h3 className="font-black text-white text-sm leading-tight italic tracking-tighter line-clamp-1 uppercase font-serif">{item.name}</h3>
                          </div>
                          <div className="bg-slate-900/95 rounded-2xl p-1.5 flex items-center justify-between border border-white/10 shadow-xl" onClick={e => e.stopPropagation()}>
                              <button onClick={() => adjustQuantity(item.id, -1)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><Minus size={14}/></button>
                              <span className="text-xs font-black text-white px-2">{num}</span>
                              <button onClick={() => adjustQuantity(item.id, 1)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"><Plus size={14}/></button>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-[280px] px-2 animate-slide-up">
          <div className="bg-white rounded-full p-2 shadow-[0_40px_80px_-10px_rgba(0,0,0,0.6)] flex items-center justify-between border border-white/20">
              <div className="flex items-center gap-2 pl-4">
                  <div className="p-2.5 bg-primary-500 rounded-full text-white shadow-lg"><Sparkles size={18} className="animate-pulse" /></div>
              </div>
              <button 
                onClick={() => navigate('/studio')}
                className="bg-primary-600 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-primary-500 active:scale-95 transition-all flex items-center gap-3"
              >
                RECIPES <ChevronRight size={16} />
              </button>
          </div>
      </div>

      {/* ITEM DETAIL MODAL */}
      {selectedItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-md rounded-[4rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,1)] border border-white/10 animate-slide-up">
                  <div className="relative h-72 bg-slate-900 flex items-center justify-center border-b border-white/5 group overflow-hidden">
                      {selectedItem.imageUrl ? (
                          <img src={selectedItem.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6s]" alt="" />
                      ) : (
                          <Focus size={64} className="text-slate-800" />
                      )}
                      <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-full hover:bg-black transition-colors backdrop-blur-md"><X size={20}/></button>
                  </div>
                  <div className="p-10 space-y-8">
                      <div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${getCategoryTheme(selectedItem.category).text}`}>
                                {selectedItem.category}
                            </span>
                          </div>
                          <h2 className="text-4xl md:text-5xl font-black font-serif text-white tracking-tighter uppercase italic leading-none">{selectedItem.name}</h2>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-2 shadow-inner">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> Inventory</span>
                              <span className="text-white font-black text-base uppercase">{selectedItem.quantity}</span>
                          </div>
                          <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-2 shadow-inner">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Logged</span>
                              <span className="text-white font-black text-base uppercase">{selectedItem.addedDate}</span>
                          </div>
                      </div>

                      <button 
                        onClick={() => navigate('/studio')}
                        className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-primary-500 transition-all flex items-center justify-center gap-3"
                      >
                         <UtensilsCrossed size={18}/> Find Recipes
                      </button>

                      <div className="flex gap-4">
                          <button onClick={() => { setItems(prev => prev.filter(i => i.id !== selectedItem.id)); setSelectedItem(null); }} className="py-5 px-6 rounded-[1.8rem] bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                          <button onClick={() => setSelectedItem(null)} className="flex-1 py-5 bg-slate-800 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-700 transition-all">Dismiss</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ADD FOOD MODAL */}
      {isAdding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-lg rounded-[4rem] p-12 md:p-16 shadow-[0_50px_150px_rgba(0,0,0,1)] border border-white/10 animate-slide-up">
                  <div className="flex justify-between items-center mb-12">
                      <h2 className="text-4xl font-black font-serif text-white tracking-tighter italic">Add Food.</h2>
                      <button onClick={() => setIsAdding(false)} className="p-3 bg-slate-800 text-slate-400 rounded-full hover:text-white transition-colors"><X size={28}/></button>
                  </div>
                  
                  <div className="bg-slate-900/50 p-2 rounded-[2rem] flex gap-2 mb-10 border border-white/10 shadow-inner">
                      <button 
                        onClick={() => setAddMode('single')}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${addMode === 'single' ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Plus size={14} /> Item
                      </button>
                      <button 
                        onClick={() => setAddMode('bulk')}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${addMode === 'bulk' ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <ClipboardList size={14} /> Manifest
                      </button>
                  </div>

                  <div className="space-y-10">
                      {addMode === 'single' ? (
                        <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4 italic">Individual Entry</label>
                             <input 
                                id="pantry-manual-input"
                                type="text" 
                                value={newItemName} 
                                onChange={e => setNewItemName(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleManualAdd()} 
                                placeholder="What did you get?" 
                                className="w-full bg-[#050505] border-2 border-white/5 rounded-[2rem] p-8 outline-none font-black text-xl text-white shadow-inner placeholder:text-slate-800 focus:border-primary-500/50 transition-all" 
                                autoFocus 
                             />
                          </div>
                          <button id="pantry-finalize-btn" onClick={handleManualAdd} className="w-full py-7 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Add to Kitchen</button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4 italic">Bulk List Import</label>
                              <textarea 
                                value={bulkText} 
                                onChange={e => setBulkText(e.target.value)} 
                                placeholder="e.g. 2 gallons milk, bread, bunch of bananas..." 
                                className="w-full h-48 bg-[#050505] border-2 border-white/5 rounded-[2rem] p-8 outline-none font-black text-white shadow-inner resize-none text-base placeholder:text-slate-800 focus:border-primary-500/50 transition-all" 
                                autoFocus 
                              />
                          </div>
                          <button 
                            id="pantry-sync-btn"
                            onClick={handleBulkAdd} 
                            disabled={isProcessingBulk}
                            className="w-full py-7 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                          >
                            {isProcessingBulk ? <Loader2 className="animate-spin" size={20}/> : <PackageCheck size={20}/>}
                            {isProcessingBulk ? 'Syncing...' : 'Sync Manifest'}
                          </button>
                        </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PantryView;
