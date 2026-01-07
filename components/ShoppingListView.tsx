
import React, { useState, useMemo } from 'react';
import { 
  Plus, Check, Trash2, ShoppingCart, Sparkles, Loader2, 
  Store, CheckCircle2, ShoppingBag, Send,
  ChefHat, X, PlusCircle, ArrowRight, ClipboardList, Zap,
  Wand2, Info, Beef, Star, Flame, Clock, 
  Package, LayoutGrid, BarChart3, ListChecks, 
  ArrowUpRight, Target, Box, MessageSquare, RefreshCw,
  Copy, ExternalLink, Share2, Link, Save
} from 'lucide-react';
import { ShoppingItem, Category, Ingredient, UserPreferences, MealLog } from '../types';
import { processChefChatPlan } from '../services/geminiService';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  moveToPantry: (item: ShoppingItem) => void;
  pantryItems?: Ingredient[];
  preferences?: UserPreferences;
  mealHistory?: MealLog[];
  onRequireAccess?: (action: string, type?: string) => boolean;
  onSaveConcept?: (concept: {title: string, description: string, missingItems: any[]}) => void;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ 
  items, 
  setItems, 
  moveToPantry, 
  pantryItems = [], 
  preferences,
  onRequireAccess,
  onSaveConcept
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  
  // Status: idle | loading | reveal
  const [status, setStatus] = useState<'idle' | 'loading' | 'reveal'>('idle');
  const [culinaryConcept, setCulinaryConcept] = useState<{title: string, description: string, missingItems: any[]} | null>(null);

  const categorizeItem = (name: string): Category => {
      const lower = name.toLowerCase();
      if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper|salad|berry|lemon|lime/)) return Category.PRODUCE;
      if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy/)) return Category.DAIRY;
      if (lower.match(/chicken|beef|pork|meat|fish|salmon|tuna|steak|sausage|bacon|turkey/)) return Category.MEAT;
      if (lower.match(/bread|pasta|rice|cereal|flour|sugar|oil|spice|can|soup|sauce|snack|chip|cracker|nut/)) return Category.PANTRY;
      if (lower.match(/frozen|ice|pizza|nugget/)) return Category.FROZEN;
      if (lower.match(/water|soda|juice|beer|wine|coffee|tea|drink/)) return Category.BEVERAGE;
      return Category.OTHER;
  };
  
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    
    const newItem: ShoppingItem = {
      id: Date.now().toString() + Math.random(),
      name: newItemName.trim(),
      category: categorizeItem(newItemName), 
      checked: false
    };
    
    setItems(prev => [newItem, ...prev]);
    setNewItemName('');
  };

  const handleChatPlan = async () => {
    if (!chatInput.trim()) return;
    if (onRequireAccess && !onRequireAccess("To orchestrate a meal plan")) return;
    
    setStatus('loading');
    try {
        const result = await processChefChatPlan(pantryItems, chatInput, preferences || {} as UserPreferences);
        setCulinaryConcept({
            title: result.concept,
            description: result.description,
            missingItems: result.items
        });
        setStatus('reveal');
        setChatInput('');
    } catch (err) {
        setStatus('idle');
    }
  };

  const commitToCart = () => {
      if (!culinaryConcept) return;
      const newItems: ShoppingItem[] = culinaryConcept.missingItems.map(item => ({
          id: Date.now().toString() + Math.random(),
          name: item.name,
          category: item.category as Category || categorizeItem(item.name),
          checked: false
      }));
      setItems(prev => [...newItems, ...prev]);
      setStatus('idle');
      setCulinaryConcept(null);
  };

  const toggleCheck = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleMoveCheckedToPantry = () => {
    const checkedItems = items.filter(i => i.checked);
    if (checkedItems.length === 0) return;
    checkedItems.forEach(item => moveToPantry(item));
    setItems(prev => prev.filter(i => !i.checked));
  };

  const copyManifest = () => {
    const text = items.map(i => i.name).join('\n');
    navigator.clipboard.writeText(text);
    setExportNotice("Manifest Copied to Clipboard");
    setTimeout(() => setExportNotice(null), 3000);
  };

  const syncToWalmart = () => {
    const topItems = items.slice(0, 3).map(i => encodeURIComponent(i.name)).join('+');
    window.open(`https://www.walmart.com/search?q=${topItems || 'grocery'}`, '_blank');
  };

  const syncToInstacart = () => {
    const topItems = items.slice(0, 3).map(i => encodeURIComponent(i.name)).join('+');
    window.open(`https://www.instacart.com/store/s?k=${topItems || 'grocery'}`, '_blank');
  };

  const groupedItems = useMemo(() => {
      const groups: Record<string, ShoppingItem[]> = {};
      items.forEach(item => {
          if (!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [items]);

  const categoryOrder = [Category.PRODUCE, Category.DAIRY, Category.MEAT, Category.PANTRY, Category.BAKERY, Category.FROZEN, Category.BEVERAGE, Category.OTHER];
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
      return categoryOrder.indexOf(a as Category) - categoryOrder.indexOf(b as Category);
  });

  const cartStats = useMemo(() => {
    const checked = items.filter(i => i.checked).length;
    return {
      total: items.length,
      checked: checked,
      percent: items.length > 0 ? Math.round((checked / items.length) * 100) : 0,
      categories: sortedCategories.length
    };
  }, [items, sortedCategories]);

  return (
    <div className="animate-fade-in pb-32 max-w-5xl mx-auto px-4 lg:px-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/20">
               <ShoppingBag size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500">Logistics Studio</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter font-serif leading-none">
            Supply <span className="text-primary-400 italic font-normal">Cart.</span>
          </h1>
        </div>

        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle 
                            cx="24" cy="24" r="20" 
                            fill="none" stroke="currentColor" strokeWidth="4" 
                            className="text-emerald-500" 
                            strokeDasharray="125.6" 
                            strokeDashoffset={125.6 - (125.6 * cartStats.percent) / 100} 
                            strokeLinecap="round"
                          />
                      </svg>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">{cartStats.percent}%</span>
                  </div>
                  <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Stock Progress</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{cartStats.checked}/{cartStats.total} <span className="text-[10px] font-bold text-slate-400">Items</span></p>
                  </div>
              </div>
          </div>
        )}
      </div>

      <div className="space-y-12">
          
          {/* INTERACTIVE CHEF COMMAND CENTER (CHAT VERSION) */}
          <div className={`bg-slate-900 dark:bg-black rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-700 ${status === 'reveal' ? 'ring-4 ring-primary-500/20 scale-[1.01]' : ''}`}>
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl shadow-xl transition-all duration-500 ${status === 'reveal' ? 'bg-emerald-500 scale-110 shadow-emerald-500/20' : 'bg-primary-500 shadow-primary-500/20'}`}>
                            {status === 'reveal' ? <Wand2 size={24} className="text-white" /> : <ChefHat size={24} className="text-white" />}
                          </div>
                          <div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Chef Command Center</h3>
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">
                                {status === 'reveal' ? 'Culinary Synthesis' : 'Pantry Orchestration'}
                            </h2>
                          </div>
                      </div>
                      {status !== 'idle' && (
                          <button onClick={() => setStatus('idle')} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
                              <X size={20} />
                          </button>
                      )}
                  </div>

                  {status === 'idle' && (
                      <div className="animate-fade-in space-y-10">
                          <div className="flex flex-col md:flex-row gap-12 items-center">
                              <div className="flex-1 space-y-8 text-center md:text-left">
                                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                                      Tell me what you want to achieve with your <span className="text-white font-bold">{pantryItems.length} active items</span>. I'll reveal a concept and automatically gap-fill your cart.
                                  </p>
                              </div>
                              <div className="hidden lg:grid grid-cols-1 gap-4 w-72">
                                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                                      <div className="flex items-center gap-3 mb-3">
                                          <MessageSquare size={18} className="text-primary-400" />
                                          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Voice Command</span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed">"I want a high-protein dinner that uses my chicken."</p>
                                  </div>
                              </div>
                          </div>

                          <div className="relative group/input">
                              <div className="absolute -inset-1 bg-gradient-to-r from-primary-600/30 to-primary-400/10 rounded-[2.5rem] blur opacity-50 group-focus-within/input:opacity-100 transition-opacity"></div>
                              <div className="relative flex bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                                  <input 
                                      autoFocus
                                      type="text"
                                      value={chatInput}
                                      onChange={e => setChatInput(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && handleChatPlan()}
                                      placeholder="Ex: I want a quick italian lunch using my spinach..."
                                      className="flex-1 bg-transparent px-10 py-8 outline-none text-white font-bold text-lg placeholder:text-slate-700"
                                  />
                                  <button 
                                    onClick={handleChatPlan}
                                    disabled={!chatInput.trim()}
                                    className="bg-primary-600 hover:bg-primary-500 px-12 flex items-center justify-center text-white disabled:opacity-20 transition-all active:scale-95"
                                  >
                                    <Send size={24} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {status === 'loading' && (
                      <div className="py-24 text-center animate-fade-in flex flex-col items-center">
                          <div className="relative mb-8">
                             <div className="w-20 h-20 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin"></div>
                             <ChefHat className="absolute inset-0 m-auto text-primary-500 opacity-50" size={32} />
                          </div>
                          <h4 className="text-white font-black uppercase tracking-[0.4em] text-xs">Chef is Thinking</h4>
                          <p className="text-slate-500 text-[10px] font-bold mt-4 uppercase tracking-[0.2em] animate-pulse">Scanning Gaps & Designing Concept</p>
                      </div>
                  )}

                  {status === 'reveal' && culinaryConcept && (
                      <div className="animate-slide-up space-y-12">
                          <div className="p-10 md:p-14 rounded-[3.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-emerald-500 to-primary-500"></div>
                              
                              <div className="flex-1 text-center lg:text-left space-y-6">
                                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                      <Star size={14} className="text-emerald-500" fill="currentColor" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Chef's Selection</span>
                                  </div>
                                  
                                  <h2 className="text-4xl md:text-5xl font-black font-serif text-slate-900 dark:text-white leading-[1] tracking-tighter">
                                      {culinaryConcept.title}
                                  </h2>
                                  
                                  <p className="text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed text-lg max-w-lg">
                                      "{culinaryConcept.description}"
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-6 mt-8 justify-center lg:justify-start">
                                      <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-400">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Utilizing Inventory
                                      </div>
                                      <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-400">
                                          <div className="w-2 h-2 rounded-full bg-primary-500"></div> Gap Identified
                                      </div>
                                  </div>

                                  <button 
                                    onClick={() => onSaveConcept && onSaveConcept(culinaryConcept)}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-500 transition-all border border-transparent hover:border-primary-500/30"
                                  >
                                    <Save size={14} /> Save Concept to Archives
                                  </button>
                              </div>

                              <div className="w-full lg:w-80 space-y-4 shrink-0">
                                  <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 relative group">
                                      <div className="flex items-center justify-between mb-6">
                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Missing Essentials</h5>
                                        <Package size={16} className="text-slate-300" />
                                      </div>
                                      <ul className="space-y-4">
                                          {culinaryConcept.missingItems.slice(0, 5).map((item, i) => (
                                              <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                                  <span className="flex-1 truncate">{item.name}</span>
                                              </li>
                                          ))}
                                          {culinaryConcept.missingItems.length > 5 && (
                                              <li className="text-[10px] font-bold text-primary-500 uppercase tracking-widest pt-2 pl-5">
                                                  +{culinaryConcept.missingItems.length - 5} More Items
                                              </li>
                                          )}
                                      </ul>
                                  </div>
                              </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-6">
                              <button 
                                onClick={() => setStatus('idle')}
                                className="flex-1 py-6 bg-white/5 border border-white/10 text-slate-500 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                              >
                                <RefreshCw className="w-4 h-4" /> Try Different Goal
                              </button>
                              <button 
                                onClick={commitToCart}
                                className="flex-[2] py-6 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(176,141,106,0.25)] hover:bg-primary-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                              >
                                Add Missing Items to Cart <ArrowUpRight size={22} />
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* LOGISTICS EXPORT HUB */}
          {items.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 animate-fade-in relative">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-primary-500">
                            <Share2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Logistics Export Hub</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Sync cart with external supply chains</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-3 w-full lg:w-auto">
                        <button 
                            onClick={copyManifest}
                            className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-primary-500 hover:text-primary-500 transition-all shadow-sm group"
                        >
                            <Copy size={16} className="group-hover:scale-110 transition-transform" /> Copy Manifest
                        </button>
                        <button 
                            onClick={syncToWalmart}
                            className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-[#0071ce] hover:text-[#0071ce] transition-all shadow-sm"
                        >
                            <ExternalLink size={16} /> Walmart Sync
                        </button>
                        <button 
                            onClick={syncToInstacart}
                            className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-[#ff8200] hover:text-[#ff8200] transition-all shadow-sm"
                        >
                            <ExternalLink size={16} /> Instacart Sync
                        </button>
                    </div>
                </div>

                {exportNotice && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce shadow-2xl">
                        {exportNotice}
                    </div>
                )}
            </div>
          )}

          {/* MAIN CART AREA */}
          <div className="space-y-12">
              
              {/* MANUAL ADD INPUT */}
              <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3 text-slate-400">
                          <LayoutGrid size={16} />
                          <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Individual Entries</h3>
                      </div>
                  </div>
                  
                  <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-900 p-2.5 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex gap-3 ring-8 ring-primary-500/5 focus-within:ring-primary-500/10 transition-all duration-500">
                    <div className="pl-6 flex items-center text-slate-300">
                        <Plus size={20} />
                    </div>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Add individual logistics item..."
                      className="flex-1 bg-transparent py-5 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold text-base"
                    />
                    <button 
                      type="submit"
                      disabled={!newItemName.trim()}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 disabled:opacity-20"
                    >
                      Append Entry
                    </button>
                  </form>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-32 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem] bg-white dark:bg-slate-900/30 flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-8 border-2 border-slate-100 dark:border-slate-700">
                        <ShoppingCart size={40} />
                    </div>
                    <h3 className="text-3xl font-black font-serif text-slate-900 dark:text-white mb-3 tracking-tighter">Supply Line Idle</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-12 max-w-[280px] leading-relaxed">The logistics chain is currently clear. Use the Command Center to populate essentials.</p>
                </div>
              ) : (
                <div className="space-y-16">
                  {sortedCategories.map(category => {
                    const categoryItems = groupedItems[category];
                    return (
                      <div key={category} className="animate-slide-up space-y-6">
                        <div className="flex items-center gap-4 px-4">
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-3 whitespace-nowrap">
                               <span className="w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(176,141,106,0.6)]"></span>
                               {category}
                            </h3>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryItems.map(item => (
                              <div 
                                key={item.id} 
                                className={`group flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${
                                  item.checked 
                                  ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 opacity-60' 
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 translate-y-0 hover:-translate-y-1'
                                }`}
                              >
                                {item.checked && <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-900/30 backdrop-grayscale pointer-events-none"></div>}
                                
                                <button
                                  onClick={() => toggleCheck(item.id)}
                                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all flex-shrink-0 relative z-10 ${
                                    item.checked 
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-transparent hover:border-primary-400'
                                  }`}
                                >
                                  <Check size={20} strokeWidth={4} />
                                </button>
                                
                                <div className="flex-1 min-w-0 relative z-10">
                                    <span className={`block font-black text-lg truncate transition-all ${item.checked ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                      {item.name}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mt-1">Ref: {item.id.slice(-6)}</span>
                                </div>

                                <button 
                                  onClick={() => deleteItem(item.id)}
                                  className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all relative z-10 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {items.some(i => i.checked) && (
                    <div className="pt-8 animate-fade-in flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-6 text-slate-400">
                            <ListChecks size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{items.filter(i => i.checked).length} Items Ready for Integration</span>
                        </div>
                        <button 
                          onClick={handleMoveCheckedToPantry}
                          className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-[0_30px_60px_-12px_rgba(5,150,105,0.4)] hover:bg-emerald-500 hover:scale-[1.01] transition-all flex items-center justify-center gap-5 active:scale-[0.98] ring-8 ring-emerald-500/5 group"
                        >
                          <CheckCircle2 size={28} className="group-hover:rotate-12 transition-transform" />
                          Establish in Studio Inventory
                        </button>
                    </div>
                  )}
                </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default ShoppingListView;
