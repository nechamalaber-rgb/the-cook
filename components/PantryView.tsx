
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, Loader2, ScanLine, X, Box, Minus, Search, Grid, List, 
  AlertTriangle, History, Layers, ChevronRight,
  ChevronDown, Filter, Sparkles, Wand2, Camera,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Ingredient, Category, Pantry } from '../types';
import { parseReceiptOrImage, organizePastedText, generatePantryAssetImage } from '../services/geminiService';
import { autoCategorize, parseQuantityValue } from '../App';

const getCategoryColor = (category: string) => {
    switch (category) {
        case Category.PRODUCE: return 'bg-lime-500';
        case Category.MEAT: return 'bg-rose-500';
        case Category.DAIRY: return 'bg-sky-500';
        case Category.BAKERY: return 'bg-amber-700';
        case Category.PANTRY: return 'bg-amber-600';
        case Category.FROZEN: return 'bg-indigo-500';
        case Category.BEVERAGE: return 'bg-violet-500';
        default: return 'bg-slate-400';
    }
};

interface PantryViewProps {
  pantries: Pantry[];
  activePantryId: string;
  setActivePantryId: (id: string) => void;
  onAddPantry: (name: string) => void;
  items: Ingredient[];
  setItems: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

const PantryView: React.FC<PantryViewProps> = ({ 
  items, 
  setItems
}) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState<Category | 'Auto'>( 'Auto' );
  const [newItemExpiry, setNewItemExpiry] = useState('');

  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [synthesizingIds, setSynthesizingIds] = useState<Set<string>>(new Set());

  const triggerImageSynthesis = async (id: string, name: string, quantity: string) => {
      setSynthesizingIds(prev => new Set(prev).add(id));
      const aiUrl = await generatePantryAssetImage(name, quantity);
      if (aiUrl) {
          setItems(prev => prev.map(item => item.id === id ? { ...item, imageUrl: aiUrl } : item));
      }
      setSynthesizingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
  };

  useEffect(() => {
    const missing = items.filter(i => !i.imageUrl && !synthesizingIds.has(i.id));
    if (missing.length > 0) {
        missing.forEach(item => triggerImageSynthesis(item.id, item.name, item.quantity));
    }
  }, [items.length]);

  const handleManualAdd = () => {
    if (!newItemName) return;
    const cat = newItemCategory === 'Auto' ? autoCategorize(newItemName) : newItemCategory as Category;
    const id = Date.now().toString();
    const incoming: Ingredient = {
      id,
      name: newItemName.trim(),
      category: cat,
      quantity: (newItemQuantity || '1').trim(),
      addedDate: new Date().toISOString().split('T')[0],
      expiryDate: newItemExpiry || undefined,
      imageUrl: '' 
    };
    setItems(prev => [incoming, ...prev]);
    triggerImageSynthesis(id, incoming.name, incoming.quantity);
    setNewItemName(''); setNewItemQuantity('1'); setNewItemExpiry(''); setIsAdding(false);
  };

  const handleBulkAdd = async () => {
      if (!bulkText.trim()) return;
      setIsProcessingBulk(true);
      try {
          const parsedItems = await organizePastedText(bulkText);
          if (parsedItems && parsedItems.length > 0) {
              const newItems: Ingredient[] = parsedItems.map((item: any, idx: number) => {
                  const cat = item.category as Category || autoCategorize(item.name);
                  return {
                    id: (Date.now() + idx).toString(),
                    name: item.name,
                    category: cat,
                    quantity: item.quantity || '1',
                    addedDate: new Date().toISOString().split('T')[0],
                    imageUrl: ''
                  };
              });
              setItems(prev => [...newItems, ...prev]);
              newItems.forEach(item => triggerImageSynthesis(item.id, item.name, item.quantity));
              setBulkText('');
              setIsAdding(false);
          } else {
              alert("The chef couldn't identify any ingredients in that text. Try being more direct.");
          }
      } catch (e) {
          console.error("Bulk parse error:", e);
          alert("Could not synchronize list. Please ensure the text contains food items.");
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
        if (result.items && result.items.length > 0) {
            const incoming: Ingredient[] = result.items.map((item: any, idx: number) => {
              const cat = autoCategorize(item.name);
              return {
                id: Date.now().toString() + idx,
                name: item.name,
                category: cat,
                quantity: item.quantity || '1',
                addedDate: new Date().toISOString().split('T')[0],
                imageUrl: ''
              };
            });
            setItems(prev => [...incoming, ...prev]);
            incoming.forEach(item => triggerImageSynthesis(item.id, item.name, item.quantity));
        }
    } catch (e) { alert("Scan failed."); }
    finally { setIsScanning(false); }
  };

  const adjustQuantity = (id: string, delta: number) => {
      setItems(prev => prev.map(item => {
          if (item.id !== id) return item;
          const { num, suffix } = parseQuantityValue(item.quantity);
          const newNum = Math.max(0, num + delta);
          return { ...item, quantity: suffix ? `${newNum} ${suffix}`.trim() : `${newNum}` };
      }).filter(item => parseQuantityValue(item.quantity).num > 0));
  };

  const filteredItems = useMemo(() => {
      return items
        .filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        });
  }, [items, searchQuery, activeCategory]);

  const removeAsset = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="animate-fade-in pb-32 w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 px-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-xl text-slate-900 shadow-xl">
                 <Box size={18} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Inventory Registry</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter leading-none italic">
            Pantry.
          </h1>
          <div className="flex items-center gap-6">
             <div className="bg-slate-800 rounded-xl p-1 flex shadow-inner">
                 <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 shadow-sm text-primary-400' : 'text-slate-500'}`}><Grid size={16}/></button>
                 <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 shadow-sm text-primary-400' : 'text-slate-500'}`}><List size={16}/></button>
             </div>
             <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">{items.length} Active Assets</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
             <div className="flex-1 md:w-64 relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-500 transition-colors" size={18} />
                 <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search manifest..." className="w-full bg-slate-900 border border-slate-800 outline-none pl-12 pr-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 transition-all text-white" />
             </div>
            <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-primary-500 border border-slate-800 shadow-sm transition-all active:scale-95 group">
                {isScanning ? <Loader2 size={24} className="animate-spin" /> : <ScanLine size={24} className="group-hover:scale-110 transition-transform" />}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            <button id="pantry-add-btn" onClick={() => { setIsAdding(true); setAddMode('single'); }} className="flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[11px]">
              <Plus size={20}/> New Asset
            </button>
        </div>
      </div>

      {items.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-8 px-2 relative z-50">
              <div className="relative">
                  <button 
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800 px-6 py-3 rounded-xl shadow-sm hover:border-primary-500 transition-all group min-w-[200px]"
                  >
                      <div className="flex items-center gap-3">
                          <Filter size={16} className="text-primary-500" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">{activeCategory}</span>
                      </div>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-2 animate-slide-up flex flex-col gap-1 z-[60]">
                          <button
                              onClick={() => { setActiveCategory('All'); setIsCategoryDropdownOpen(false); }}
                              className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'All' ? 'bg-slate-800 text-primary-500' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'}`}
                          >
                              All Manifest Assets
                          </button>
                          <div className="h-px bg-slate-800 mx-3 my-1" />
                          <div className="max-h-[300px] overflow-y-auto no-scrollbar flex flex-col gap-1">
                              {Object.values(Category).map(cat => (
                                  <button
                                      key={cat}
                                      onClick={() => { setActiveCategory(cat); setIsCategoryDropdownOpen(false); }}
                                      className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeCategory === cat ? 'bg-slate-800 text-primary-500' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'}`}
                                  >
                                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(cat)}`} />
                                      {cat}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-1" : "space-y-4 px-2"}>
              {filteredItems.map(item => {
                  const { num } = parseQuantityValue(item.quantity);
                  const isLow = num <= 1;
                  const isSynthesizing = synthesizingIds.has(item.id);

                  if (viewMode === 'list') {
                      return (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className="group cursor-pointer flex items-center justify-between p-4 bg-slate-900 rounded-[1.8rem] border border-slate-800 shadow-sm hover:border-slate-700 transition-all relative">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-700/50 shrink-0 relative">
                                    {isSynthesizing ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                            <Wand2 size={20} className="text-primary-500 animate-pulse" />
                                        </div>
                                    ) : item.imageUrl ? (
                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt=""/>
                                    ) : (
                                        <Box size={24} className="text-slate-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-white text-lg leading-tight truncate italic tracking-tighter">{item.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(item.category)}`} />
                                        <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">{item.category}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                <div className="bg-slate-800 rounded-2xl p-1 flex items-center gap-4 border border-white/5">
                                    <button onClick={() => adjustQuantity(item.id, -1)} className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><Minus size={16}/></button>
                                    <span className={`text-xs font-black w-10 text-center uppercase tracking-widest ${isLow ? 'text-rose-500' : 'text-white'}`}>{item.quantity}</span>
                                    <button onClick={() => adjustQuantity(item.id, 1)} className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"><Plus size={16}/></button>
                                </div>
                            </div>
                        </div>
                      );
                  }

                  return (
                      <div key={item.id} className="group relative bg-slate-900 rounded-[2.5rem] p-3 border border-slate-800 hover:border-primary-500/50 hover:shadow-2xl transition-all flex flex-col overflow-hidden animate-fade-in aspect-square">
                          
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
                              {isLow ? (
                                  <div className="bg-rose-600 text-white p-2 rounded-xl shadow-xl animate-pulse pointer-events-auto">
                                      <AlertTriangle size={14}/>
                                  </div>
                              ) : <div />}
                          </div>

                          <div onClick={() => setSelectedItem(item)} className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center cursor-pointer transition-transform duration-700 group-hover:scale-105">
                               {isSynthesizing ? (
                                   <div className="flex flex-col items-center justify-center gap-3">
                                       <div className="relative">
                                          <div className="w-14 h-14 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin"></div>
                                          <Wand2 size={20} className="absolute inset-0 m-auto text-primary-500 animate-pulse" />
                                       </div>
                                       <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary-600">Synthesizing...</span>
                                   </div>
                               ) : item.imageUrl ? (
                                   <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                               ) : (
                                   <Box size={48} className="text-slate-800" strokeWidth={1} />
                               )}
                          </div>

                          {/* Info Overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-5 pt-12 transform translate-y-1 group-hover:translate-y-0 transition-transform z-10">
                              <div className="mb-3">
                                  <h3 className="font-black text-white text-base leading-tight truncate italic tracking-tighter">{item.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                      <div className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(item.category)}`} />
                                      <p className="text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">{item.category}</p>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between bg-slate-800/90 rounded-xl p-1 border border-white/5" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => adjustQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><Minus size={14}/></button>
                                  <span className={`text-[10px] font-black px-2 truncate tracking-widest uppercase ${isLow ? 'text-rose-600' : 'text-slate-200'}`}>{item.quantity}</span>
                                  <button onClick={() => adjustQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"><Plus size={14}/></button>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-slide-up">
              <div className="bg-white/95 backdrop-blur-2xl rounded-[2.2rem] p-4 border border-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center justify-between gap-6 ring-1 ring-white/10">
                  <div className="flex items-center gap-3 pl-2">
                      <div className="p-3 bg-primary-500 rounded-xl text-white shadow-lg">
                          <Sparkles size={18} className="animate-pulse" />
                      </div>
                      <div>
                          <p className="text-slate-900 font-black text-xs uppercase tracking-tight leading-none mb-1 italic">Ready to cook?</p>
                          <p className="text-slate-500 font-bold text-[8px] uppercase tracking-widest">Logic Cycle Synchronized</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => navigate('/studio')}
                    className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group"
                  >
                    Curate <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>
        </>
      ) : (
        <div className="max-w-xl mx-auto py-24 px-6 text-center">
            <div className="bg-slate-900 rounded-[3.5rem] border border-white/5 p-16 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><Layers size={140} /></div>
                
                <div className="flex flex-col items-center max-w-sm mx-auto relative z-10">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-700 mb-8">
                        <Box size={32} strokeWidth={1} />
                    </div>
                    
                    <h2 className="text-3xl font-black font-serif text-white mb-4 italic tracking-tighter">Manifest Empty.</h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                      Establish your central kitchen manifest to begin the automated curation cycle.
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4 p-6 bg-slate-800/50 rounded-3xl border border-white/5 hover:border-primary-500 hover:scale-105 transition-all">
                            <Camera size={24} className="text-primary-500"/>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Scan Logic</span>
                        </button>
                        <button onClick={() => { setIsAdding(true); setAddMode('bulk'); }} className="flex flex-col items-center gap-4 p-6 bg-slate-800/50 rounded-3xl border border-white/5 hover:border-primary-500 hover:scale-105 transition-all">
                            <ClipboardList size={24} className="text-indigo-500"/>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Paste Manifest</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {selectedItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 animate-slide-up">
                  <div className="relative h-[300px] bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                      {synthesizingIds.has(selectedItem.id) ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-4">
                              <Wand2 size={48} className="text-primary-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">Rendering Asset Architecture...</span>
                          </div>
                      ) : selectedItem.imageUrl ? (
                          <img src={selectedItem.imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800"><Box size={48} className="text-slate-600" /></div>
                      )}
                      <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-3 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-all z-20 shadow-2xl"><X size={20}/></button>
                  </div>

                  <div className="p-8 md:p-12 space-y-10 bg-[#0c1220]">
                      <div className="flex justify-between items-start">
                          <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(selectedItem.category)}`} />
                                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-500">{selectedItem.category}</span>
                              </div>
                              <h2 className="text-3xl md:text-5xl font-black font-serif text-white leading-none italic tracking-tighter">{selectedItem.name}</h2>
                          </div>
                      </div>

                      <div className="px-8 py-8 bg-slate-900 text-white rounded-3xl border border-white/5 shadow-2xl flex justify-between items-center">
                          <div className="text-center flex-1 border-r border-white/5">
                              <span className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest block">Stored Quantity</span>
                              <span className="text-3xl font-black italic">{selectedItem.quantity}</span>
                          </div>
                          <div className="text-center flex-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest block">Logical Status</span>
                              <span className="text-base font-black text-emerald-500 uppercase tracking-widest">Established</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <section className="space-y-2">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                  <History size={16} className="text-primary-500" /> Registry Log
                              </h3>
                              <div className="flex justify-between items-center p-4 bg-slate-900 rounded-2xl border border-white/5 text-[10px] font-bold">
                                  <span className="text-slate-500 uppercase tracking-widest">REGISTERED</span>
                                  <span className="text-white uppercase">{selectedItem.addedDate}</span>
                              </div>
                          </section>

                          <section className="space-y-2">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                  <CalendarDays size={16} className="text-rose-500" /> Expiry Protocol
                              </h3>
                              <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 text-center">
                                  {selectedItem.expiryDate ? (
                                      <p className="text-xl font-black text-rose-500 font-serif italic">{selectedItem.expiryDate}</p>
                                  ) : (
                                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] py-1">Stable Cycle</p>
                                  )}
                              </div>
                          </section>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button onClick={() => { if (window.confirm("Terminate this asset?")) { removeAsset(selectedItem.id); setSelectedItem(null); } }} className="flex-1 py-5 rounded-2xl bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm">Terminate</button>
                          <button onClick={() => setSelectedItem(null)} className="flex-[2] py-5 rounded-2xl bg-white text-slate-900 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all">Close Inspector</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ADD ITEM MODAL */}
      {isAdding && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl animate-slide-up border border-white/5">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-black font-serif text-white tracking-tighter italic">Add Asset.</h2>
                      <button onClick={() => setIsAdding(false)} className="p-3 bg-slate-800 text-slate-400 rounded-full hover:bg-rose-600 hover:text-white transition-all"><X size={20}/></button>
                  </div>

                  <div className="flex bg-slate-900 p-1.5 rounded-2xl mb-8 border border-white/5">
                      <button onClick={() => setAddMode('single')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'single' ? 'bg-slate-800 text-primary-500 shadow-sm' : 'text-slate-500'}`}>Single Entry</button>
                      <button onClick={() => setAddMode('bulk')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'bulk' ? 'bg-slate-800 text-primary-500 shadow-sm' : 'text-slate-500'}`}>Bulk Synthesis</button>
                  </div>

                  {addMode === 'single' ? (
                      <div className="space-y-6">
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Asset Signature</label>
                              <input 
                                type="text" 
                                value={newItemName} 
                                onChange={e => setNewItemName(e.target.value)} 
                                placeholder="e.g. Avocado" 
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none font-bold text-white text-base focus:border-primary-500 transition-all" 
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Volume</label>
                                  <input 
                                    type="text" 
                                    value={newItemQuantity} 
                                    onChange={e => setNewItemQuantity(e.target.value)} 
                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none font-bold text-white text-base focus:border-primary-500 transition-all" 
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Category</label>
                                  <select 
                                    value={newItemCategory} 
                                    onChange={e => setNewItemCategory(e.target.value as any)}
                                    className="w-full h-[66px] bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 outline-none font-bold text-white appearance-none text-xs focus:border-primary-500 transition-all"
                                  >
                                      <option value="Auto">Auto-Detect</option>
                                      {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                              </div>
                          </div>
                          <button onClick={handleManualAdd} className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4">Establish Asset</button>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <textarea 
                            value={bulkText} 
                            onChange={e => setBulkText(e.target.value)} 
                            placeholder="1 gallon Milk&#10;3 Large Apples&#10;Organic Chicken..." 
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-[2rem] p-6 outline-none font-bold text-white h-48 resize-none text-sm focus:border-primary-500 transition-all shadow-inner" 
                          />
                          <button 
                            onClick={handleBulkAdd} 
                            disabled={isProcessingBulk} 
                            className="w-full py-6 bg-white text-slate-900 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                          >
                              {isProcessingBulk ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                              Synchronize List
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default PantryView;
