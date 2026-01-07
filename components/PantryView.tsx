
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, ScanLine, X, Box, Minus, Search, Grid, List, Sparkles, AlertTriangle, FolderPlus, Calendar, Clock, ChevronRight, Save, Info } from 'lucide-react';
import { Ingredient, Category, Pantry } from '../types';
import { parseReceiptOrImage, organizePastedText, generateIngredientImage } from '../services/geminiService';

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

const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expired', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30', icon: <AlertTriangle size={10} /> };
    if (diffDays <= 3) return { label: `${diffDays === 0 ? 'Today' : diffDays + 'd left'}`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: <Clock size={10} /> };
    return { label: `${diffDays} days`, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', icon: null };
};

export const autoCategorize = (name: string): Category => {
    const lower = name.toLowerCase();
    if (lower.match(/steak|beef|chicken|pork|meat|fish|salmon|tuna|lamb|turkey|shrimp|bacon|sausage|ham|prawn|tilapia|ribs|fillet|loin|venison|duck|quail|prosciutto|salami|chorizo|jerky/)) return Category.MEAT;
    if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy|curd|sour cream|parmesan|mozzarella|cheddar|brie|feta|goat|ricotta|heavy cream|half and half|provolone|swiss|gruyere|kefir|ghee/)) {
        if (lower.match(/peanut butter|almond butter|nut butter/)) return Category.PANTRY;
        return Category.DAIRY;
    }
    if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper|salad|berry|lemon|lime|broccoli|cabbage|cucumber|mushroom|kale|zucchini|asparagus|cilantro|parsley|dill|thyme|rosemary|sage|basil|mint|ginger|shallot|leek|celery|avocado|grape|orange|strawberry|blueberry|raspberry|mango|pineapple|peach|plum|cherry|date|fig|pear|corn|pea|bean|radish|beet|cauliflower|brussels/)) return Category.PRODUCE;
    if (lower.match(/honey|syrup|oil|flour|sugar|salt|spice|pasta|rice|bean|lentil|sauce|vinegar|ketchup|mustard|mayo|canned|soup|cereal|oats|nut|seed|cumin|paprika|turmeric|cinnamon|vanilla|pepper|broth|stock|bouillon|yeast|baking|jam|jelly|peanut butter|almond butter|tahini|soy sauce|teriyaki|salsa|hot sauce/)) return Category.PANTRY;
    if (lower.match(/water|soda|juice|beer|wine|coffee|tea|drink|sparkling|cola|pepsi|coke|whiskey|vodka|spirit|gin|rum|tequila|espresso|latte|tonic|ale/)) return Category.BEVERAGE;
    if (lower.match(/bagel|bread|toast|sourdough|tortilla|wrap|roll|bun|muffin|pita|naan|baguette|ciabatta|croissant|focaccia|chips|snack|cracker|pretzel|cookie|cake|pastry|brownie/)) return Category.BAKERY;
    if (lower.match(/frozen|ice|pizza|nugget|peas|sorbet|gelato|waffle|fries|patties/)) return Category.FROZEN;
    return Category.PANTRY; 
};

export const parseQuantityValue = (q: string): { num: number; suffix: string } => {
    if (!q) return { num: 1, suffix: '' };
    const match = q.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
        return { num: parseFloat(match[1]), suffix: match[2] || '' };
    }
    return { num: 1, suffix: q };
};

interface PantryViewProps {
  pantries: Pantry[];
  activePantryId: string;
  setActivePantryId: (id: string) => void;
  onAddPantry: (name: string) => void;
  items: Ingredient[];
  setItems: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  onRequireAccess: (action: string) => boolean;
}

const PantryView: React.FC<PantryViewProps> = ({ 
  pantries, 
  activePantryId, 
  setActivePantryId, 
  onAddPantry,
  items, 
  setItems
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingPantry, setIsAddingPantry] = useState(false);
  const [newPantryName, setNewPantryName] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'list'>('single');
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState<Category | 'Auto'>( 'Auto' );
  const [newItemExpiry, setNewItemExpiry] = useState('');

  const [bulkList, setBulkList] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageGenerating, setImageGenerating] = useState<Record<string, boolean>>({});

  // Details Modal State
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const triggerImageGen = useCallback(async (item: Ingredient) => {
    if (item.imageUrl || imageGenerating[item.id]) return;
    setImageGenerating(prev => ({ ...prev, [item.id]: true }));
    try {
        const data = await generateIngredientImage(item.name);
        if (data) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, imageUrl: `data:image/png;base64,${data}` } : i));
        }
    } catch (e) {
        console.error("Image gen failed", item.name);
    } finally {
        setImageGenerating(prev => ({ ...prev, [item.id]: false }));
    }
  }, [imageGenerating, setItems]);

  useEffect(() => {
    items.forEach(item => {
        if (!item.imageUrl && !imageGenerating[item.id]) {
            triggerImageGen(item);
        }
    });
  }, [items, imageGenerating, triggerImageGen]);

  const mergeItems = (existing: Ingredient[], incoming: Ingredient[]): Ingredient[] => {
    const result = [...existing];
    incoming.forEach(newItem => {
        const existingIndex = result.findIndex(i => i.name.toLowerCase() === newItem.name.toLowerCase());
        if (existingIndex !== -1) {
            const oldQ = parseQuantityValue(result[existingIndex].quantity);
            const newQ = parseQuantityValue(newItem.quantity);
            const mergedVal = oldQ.num + newQ.num;
            const suffix = oldQ.suffix || newQ.suffix;
            result[existingIndex] = {
                ...result[existingIndex],
                quantity: suffix ? `${mergedVal} ${suffix}`.trim() : `${mergedVal}`,
                expiryDate: newItem.expiryDate || result[existingIndex].expiryDate
            };
        } else {
            result.unshift(newItem);
        }
    });
    return result;
  };

  const handleManualAdd = () => {
    if (!newItemName) return;
    const names = newItemName.includes(',') ? newItemName.split(',').map(n => n.trim()).filter(n => n) : [newItemName.trim()];
    const incoming: Ingredient[] = names.map((name, idx) => ({
      id: (Date.now() + idx).toString(),
      name,
      category: newItemCategory === 'Auto' ? autoCategorize(name) : newItemCategory as Category,
      quantity: (newItemQuantity || '1').trim(),
      addedDate: new Date().toISOString().split('T')[0],
      expiryDate: newItemExpiry || undefined
    }));
    setItems(prev => mergeItems(prev, incoming));
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemExpiry('');
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
            category: (item.category as Category) || autoCategorize(item.name),
            quantity: item.quantity || '1',
            addedDate: new Date().toISOString().split('T')[0]
        }));
        setItems(prev => mergeItems(prev, incoming));
        setBulkList('');
        setIsAdding(false);
    } catch (e) { console.error(e); } finally { setIsProcessingBulk(false); }
  };

  const normalizeCategory = (inputCat: string, nameHint: string): Category => {
      if (Object.values(Category).includes(inputCat as Category)) return inputCat as Category;
      return autoCategorize(nameHint);
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
          category: normalizeCategory(item.category || '', item.name),
          quantity: item.quantity || '1',
          addedDate: new Date().toISOString().split('T')[0]
        }));
        setItems(prev => mergeItems(prev, incoming));
    } catch (e) { alert("Failed to scan."); }
    finally { setIsScanning(false); }
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedItem?.id === id) setIsDetailOpen(false);
  };
  
  const adjustQuantity = (id: string, delta: number) => {
      setItems(prev => {
          const updated = prev.map(item => {
              if (item.id !== id) return item;
              const { num, suffix } = parseQuantityValue(item.quantity);
              const newNum = Math.max(0, num + delta);
              return { ...item, quantity: suffix ? `${newNum} ${suffix}`.trim() : `${newNum}` };
          });
          return updated.filter(item => parseQuantityValue(item.quantity).num > 0);
      });
  };

  const updateItemDetail = (id: string, updates: Partial<Ingredient>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const filteredItems = useMemo(() => {
      return items
        .filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            // Sort by expiry primarily if available, then by quantity
            if (a.expiryDate && b.expiryDate) return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
            if (a.expiryDate) return -1;
            if (b.expiryDate) return 1;
            return parseQuantityValue(a.quantity).num - parseQuantityValue(b.quantity).num;
        });
  }, [items, searchQuery, activeCategory]);

  const openItemDetail = (item: Ingredient) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-1 gap-6">
        <div>
          <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tighter">Inventory</h1>
          <div className="flex items-center gap-4 mt-2">
             <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex">
                 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all focus:outline-none ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400'}`}><Grid size={16}/></button>
                 <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all focus:outline-none ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-400'}`}><List size={16}/></button>
             </div>
             <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{items.length} cards</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
             <div className="flex-1 md:w-64 relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                 <input 
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pantry..." 
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none outline-none pl-10 pr-4 py-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary-500/30 transition-all"
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
                    key={p.id} onClick={() => setActivePantryId(p.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 focus:outline-none ${activePantryId === p.id ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'}`}
                >
                    <Box size={14} /> {p.name}
                </button>
            ))}
            <button onClick={() => setIsAddingPantry(true)} className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-primary-500 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <FolderPlus size={14} /> New
            </button>
         </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 px-1">
         {['All', ...Object.values(Category)].map(cat => (
             <button
                key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${activeCategory === cat ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             >
                 {cat}
             </button>
         ))}
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-1" : "space-y-3 px-1"}>
          {filteredItems.map(item => {
              const categoryColor = getCategoryColor(item.category);
              const { num } = parseQuantityValue(item.quantity);
              const isLow = num <= 1;
              const exp = getExpiryStatus(item.expiryDate);

              if (viewMode === 'list') {
                  return (
                      <div key={item.id} onClick={() => openItemDetail(item)} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700`}>
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className={`w-1.5 h-1.5 rounded-full ${categoryColor}`}></div>}
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">{item.name}{isLow && <AlertTriangle size={12} className="text-amber-500" />}</h3>
                                  <div className="flex items-center gap-2">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</p>
                                      {exp && <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${exp.bg} ${exp.color} flex items-center gap-1`}>{exp.icon}{exp.label}</span>}
                                  </div>
                              </div>
                          </div>
                          <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
                                  <button onClick={() => adjustQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Minus size={12}/></button>
                                  <span className={`text-xs font-black w-12 text-center ${isLow ? 'text-amber-600' : ''}`}>{item.quantity}</span>
                                  <button onClick={() => adjustQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Plus size={12}/></button>
                              </div>
                              <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-rose-500 focus:outline-none"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  );
              }
              return (
                  <div key={item.id} onClick={() => openItemDetail(item)} className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 flex flex-col justify-between cursor-pointer">
                      {exp && (
                        <div className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${exp.bg} ${exp.color}`}>
                           {exp.icon} {exp.label}
                        </div>
                      )}
                      
                      <div className={`w-20 h-20 rounded-[1.5rem] overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700 relative group-hover:scale-105 transition-transform`}>
                           {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" /> : <div className={`w-2 h-2 rounded-full ${categoryColor}`}></div>}
                           {imageGenerating[item.id] && <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-center"><Loader2 size={12} className="animate-spin text-primary-500" /></div>}
                      </div>

                      <div className="mb-4 text-center">
                          <h3 className="font-black text-slate-900 dark:text-white text-sm leading-tight flex items-center justify-center gap-2 mb-1 px-1">
                            {item.name}{isLow && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                          </h3>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.category}</p>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl p-1.5 mt-auto" onClick={e => e.stopPropagation()}>
                          <button onClick={() => adjustQuantity(item.id, -1)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all"><Minus size={14}/></button>
                          <span className={`text-xs font-black px-2 truncate ${isLow ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>{item.quantity}</span>
                          <button onClick={() => adjustQuantity(item.id, 1)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all"><Plus size={14}/></button>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* ITEM DETAIL MODAL */}
      {isDetailOpen && selectedItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up overflow-hidden">
                  <div className="h-64 relative bg-slate-100 dark:bg-slate-800">
                      {selectedItem.imageUrl ? (
                          <img src={selectedItem.imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center">
                              <Box size={64} className="text-slate-200 dark:text-slate-700" />
                          </div>
                      )}
                      <button onClick={() => setIsDetailOpen(false)} className="absolute top-6 right-6 p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all"><X size={24}/></button>
                      <div className="absolute bottom-6 left-6 px-4 py-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Item Identity: {selectedItem.id.slice(-6)}</span>
                      </div>
                  </div>

                  <div className="p-10 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</label>
                              <input 
                                  type="text" value={selectedItem.name} 
                                  onChange={e => updateItemDetail(selectedItem.id, { name: e.target.value })}
                                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500"
                              />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity Manifest</label>
                              <input 
                                  type="text" value={selectedItem.quantity} 
                                  onChange={e => updateItemDetail(selectedItem.id, { quantity: e.target.value })}
                                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                  <Calendar size={12} /> Expiration Logic
                              </label>
                              <input 
                                  type="date" value={selectedItem.expiryDate || ''} 
                                  onChange={e => updateItemDetail(selectedItem.id, { expiryDate: e.target.value })}
                                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 appearance-none"
                              />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category Classification</label>
                              <select 
                                  value={selectedItem.category} 
                                  onChange={e => updateItemDetail(selectedItem.id, { category: e.target.value as Category })}
                                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 appearance-none"
                              >
                                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                          <button onClick={() => handleDelete(selectedItem.id)} className="flex-1 py-5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3"><Trash2 size={18}/> Discard Asset</button>
                          <button onClick={() => setIsDetailOpen(false)} className="flex-[2] py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-3"><Save size={18}/> Confirm Integrity</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Restock Studio</h2>
                      <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X /></button>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                      <button onClick={() => setAddMode('single')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${addMode === 'single' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}>Single Item</button>
                      <button onClick={() => setAddMode('list')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${addMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}>Bulk List</button>
                  </div>
                  {addMode === 'single' ? (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Item Name(s)</label>
                            <input autoFocus type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all text-lg" placeholder="e.g. Eggs, Milk" />
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
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2"><Calendar size={12}/> Expiration (Optional)</label>
                            <input type="date" value={newItemExpiry} onChange={e => setNewItemExpiry(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold dark:text-white outline-none focus:border-primary-500 appearance-none" />
                        </div>
                        <button onClick={handleManualAdd} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl mt-4 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">Confirm Stock</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Paste Shopping List</label>
                            <textarea autoFocus value={bulkList} onChange={e => setBulkList(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 transition-all h-40 resize-none text-sm" placeholder="1 dozen eggs, 1 gallon milk..." />
                        </div>
                        <button onClick={handleBulkAdd} disabled={isProcessingBulk} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl mt-4 flex items-center justify-center gap-2">
                            {isProcessingBulk ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                            {isProcessingBulk ? 'Importing...' : 'Import into Studio'}
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
