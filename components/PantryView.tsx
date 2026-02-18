import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Plus, Loader2, X, Minus, 
  ChevronRight, Sparkles, Camera,
  LayoutGrid,
  Search as SearchIcon,
  PackageCheck,
  AlignJustify,
  Trash2,
  Calendar,
  History,
  Tag,
  ClipboardList,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Ingredient, Category, Pantry } from '../types';
import { parseReceiptOrImage, generatePantryAssetImage, organizePastedText } from '../services/geminiService';
import { autoCategorize, parseQuantityValue, mergeQuantities } from '../utils';

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
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Ingredient | null>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newItemName, setNewItemName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<Category | 'All'>('All');
  
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

  const handleManualAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    setNewItemName(''); 
    setIsAdding(false);
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    setIsProcessingBulk(true);
    try {
        const parsed = await organizePastedText(bulkText);
        const newItems = parsed.map((item: any, idx: number) => ({
            id: (Date.now() + idx).toString(),
            name: item.name,
            category: item.category as Category || autoCategorize(item.name),
            quantity: item.quantity || '1 Unit',
            addedDate: new Date().toISOString().split('T')[0],
            imageUrl: ''
        }));
        setItems(prev => [...newItems, ...prev]);
        setBulkText('');
        setIsBulkAdding(false);
    } catch (e) { console.error(e); }
    finally { setIsProcessingBulk(false); }
  };

  const adjustQuantity = (id: string, delta: number) => {
      setItems(prev => prev.map(item => {
          if (item.id !== id) return item;
          const { num, suffix } = parseQuantityValue(item.quantity || '1');
          const newNum = Math.max(0, num + delta); 
          if (newNum === 0) return null as any;
          const newVal = suffix ? `${newNum} ${suffix}`.trim() : `${newNum}`;
          return { ...item, quantity: newVal };
      }).filter(Boolean));
  };

  const removeItem = (id: string) => {
      setItems(prev => prev.filter(i => i.id !== id));
      setViewingItem(null);
  };

  const filteredItems = useMemo(() => {
      let filtered = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (activeCategoryFilter !== 'All') {
          filtered = filtered.filter(item => item.category === activeCategoryFilter);
      }
      return filtered;
  }, [items, searchQuery, activeCategoryFilter]);

  return (
    <div className="animate-fade-in pb-20 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 px-1 gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 opacity-50">
             <LayoutGrid size={10} className="text-primary-400" />
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Central Hub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter leading-none italic">Manifest.</h1>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
             <div className="flex-1 md:w-64 relative" id="pantry-search-box">
                 <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-[#111827] border border-white/10 outline-none pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold text-white shadow-inner placeholder:text-slate-600 focus:border-primary-500/40" />
                 <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
             </div>
             
             <div className="relative">
                <button 
                    id="pantry-add-btn"
                    onClick={() => setAddMenuOpen(!addMenuOpen)}
                    className="flex items-center gap-2 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[9px]"
                >
                    <Plus size={14}/> Add <ChevronDown size={12} className={`transition-transform ${addMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {addMenuOpen && (
                    <div className="absolute top-12 right-0 w-48 bg-[#0c1220] border border-white/10 rounded-2xl shadow-2xl z-[50] overflow-hidden py-2 animate-slide-up ring-1 ring-white/5">
                        <button onClick={() => { setIsAdding(true); setAddMenuOpen(false); }} className="w-full px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:bg-white/5 hover:text-white transition-all text-left">
                            <Tag size={14} /> Manual Entry
                        </button>
                        <button onClick={() => { setIsBulkAdding(true); setAddMenuOpen(false); }} className="w-full px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:bg-white/5 hover:text-white transition-all text-left">
                            <ClipboardList size={14} /> Bulk Manifest
                        </button>
                        <button onClick={() => { fileInputRef.current?.click(); setAddMenuOpen(false); }} className="w-full px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:bg-white/5 hover:text-white transition-all text-left">
                            <Camera size={14} /> Scan Image
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                    </div>
                )}
             </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
           <div className="overflow-x-auto no-scrollbar flex items-center gap-2 py-1">
                <div className="bg-white/5 p-0.5 rounded-lg flex items-center gap-0.5 border border-white/5">
                     {categories.map(cat => (
                         <button
                             key={cat}
                             onClick={() => setActiveCategoryFilter(cat as any)}
                             className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategoryFilter === cat ? 'bg-primary-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                         >
                             {cat}
                         </button>
                     ))}
                </div>
           </div>
           <div className="bg-white/5 p-0.5 rounded-lg flex items-center gap-0.5 border border-white/5">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-600 hover:text-slate-400'}`}><LayoutGrid size={14} /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-600 hover:text-slate-400'}`}><AlignJustify size={14} /></button>
           </div>
      </div>

      {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageCheck size={32} className="text-slate-800 mb-3" />
              <h3 className="text-white font-black font-serif italic text-lg uppercase tracking-tight">Nothing Found</h3>
          </div>
      ) : (
          viewMode === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {filteredItems.map(item => {
                      const { num } = parseQuantityValue(item.quantity || '1');
                      const theme = getCategoryTheme(item.category);
                      const isLoadingImage = visualizingIds.has(item.id);

                      return (
                          <div 
                            key={item.id} 
                            onClick={() => setViewingItem(item)}
                            className={`group relative rounded-2xl p-0 border transition-all duration-300 flex flex-col overflow-hidden aspect-square ${theme.bg} ${theme.border} hover:scale-[1.02] shadow-sm cursor-pointer`}
                          >
                              <div className="absolute inset-0 flex items-center justify-center p-0 bg-slate-800/10">
                                   {(isLoadingImage || !item.imageUrl) ? (
                                       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm">
                                           <Loader2 size={12} className="animate-spin text-primary-500/40" />
                                       </div>
                                   ) : (
                                        <img src={item.imageUrl} className="w-full h-full object-cover opacity-100 transition-transform duration-[4s] group-hover:scale-105" alt="" />
                                   )}
                              </div>
                                   
                              <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pt-6">
                                  <div className="space-y-0.5 pointer-events-none">
                                      <h3 className="font-black text-white text-[10px] leading-tight italic line-clamp-1 uppercase font-serif tracking-tight">{item.name}</h3>
                                  </div>
                                  <div className="bg-slate-900/90 rounded-lg p-1 flex items-center justify-between border border-white/10 shadow-sm" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => adjustQuantity(item.id, -1)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><Minus size={10}/></button>
                                      <span className="text-[10px] font-black text-white px-1">{num}</span>
                                      <button onClick={() => adjustQuantity(item.id, 1)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"><Plus size={10}/></button>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          ) : (
              <div className="flex flex-col gap-1.5">
                  {filteredItems.map(item => {
                      const theme = getCategoryTheme(item.category);
                      const { num } = parseQuantityValue(item.quantity || '1');
                      return (
                          <div key={item.id} onClick={() => setViewingItem(item)} className={`flex items-center gap-3 p-2.5 rounded-xl border ${theme.bg} ${theme.border} bg-opacity-30 backdrop-blur-sm transition-all group cursor-pointer`}>
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-950/40">
                                   {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PackageCheck className="text-slate-800" size={18}/></div>}
                              </div>
                              <div className="flex-1">
                                  <h3 className="text-white font-black uppercase text-sm italic font-serif leading-none">{item.name}</h3>
                                  <p className={`text-[8px] font-black uppercase tracking-widest ${theme.text}`}>{item.category}</p>
                              </div>
                              <div className="bg-slate-950/40 rounded-lg p-1 flex items-center gap-3 border border-white/5" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => adjustQuantity(item.id, -1)} className="w-6 h-6 rounded-md text-slate-500 hover:text-white"><Minus size={12}/></button>
                                    <span className="text-[10px] font-black text-white min-w-[16px] text-center">{num}</span>
                                    <button onClick={() => adjustQuantity(item.id, 1)} className="w-6 h-6 rounded-md text-slate-500 hover:text-white"><Plus size={12}/></button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )
      )}

      {/* SINGLE ADD MODAL */}
      {isAdding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black font-serif italic text-white uppercase tracking-tight">Manual Add</h3>
                      <button onClick={() => setIsAdding(false)} className="p-2 text-slate-600 hover:text-white"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleManualAdd} className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Ingredient</label>
                          <input 
                            autoFocus type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                            placeholder="e.g. Avocado, Whole Milk..."
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-white font-bold outline-none focus:border-primary-500"
                          />
                      </div>
                      <button type="submit" className="w-full py-4 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-primary-500 hover:text-white active:scale-95 transition-all">
                          Populate Vault
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* BULK ADD MODAL */}
      {isBulkAdding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black font-serif italic text-white uppercase tracking-tight">Bulk Manifest</h3>
                      <button onClick={() => setIsBulkAdding(false)} className="p-2 text-slate-600 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-relaxed">Paste your full list (e.g. "2 eggs, milk, 500g chicken"). AI will categorize everything for you.</p>
                      <textarea 
                        value={bulkText} 
                        onChange={e => setBulkText(e.target.value)}
                        placeholder="Type or paste list..."
                        className="w-full h-40 bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-white font-bold outline-none focus:border-primary-500 transition-all resize-none"
                      />
                      <button 
                        onClick={handleBulkAdd}
                        disabled={isProcessingBulk || !bulkText.trim()}
                        className="w-full py-4 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessingBulk ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} 
                        Sync Manifest
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ITEM DETAIL MODAL */}
      {viewingItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-sm rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-slide-up">
                  <div className="relative h-48 bg-slate-950">
                      {viewingItem.imageUrl ? (
                          <img src={viewingItem.imageUrl} className="w-full h-full object-cover opacity-80" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-800">
                               <PackageCheck size={64} />
                          </div>
                      )}
                      <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-all"><X size={18}/></button>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] to-transparent" />
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                               <span className={`w-2 h-2 rounded-full ${getCategoryTheme(viewingItem.category).dot}`} />
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{viewingItem.category}</p>
                          </div>
                          <h2 className="text-3xl font-black text-white font-serif italic uppercase tracking-tight">{viewingItem.name}</h2>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-2 text-slate-500 mb-1">
                                  <History size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Logged</span>
                              </div>
                              <p className="text-xs font-bold text-white">{viewingItem.addedDate}</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-2 text-slate-500 mb-1">
                                  <Calendar size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Expires</span>
                              </div>
                              <p className="text-xs font-bold text-white">{viewingItem.expiryDate || 'Not Tracked'}</p>
                          </div>
                      </div>

                      <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                          <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Current Volume</p>
                              <p className="text-xl font-black text-white">{viewingItem.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                               <button onClick={() => adjustQuantity(viewingItem.id, -1)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"><Minus size={14}/></button>
                               <button onClick={() => adjustQuantity(viewingItem.id, 1)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"><Plus size={14}/></button>
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button onClick={() => setViewingItem(null)} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Dismiss</button>
                          <button onClick={() => removeItem(viewingItem.id)} className="px-6 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PantryView;