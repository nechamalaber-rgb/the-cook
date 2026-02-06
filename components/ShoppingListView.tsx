
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Check, Trash2, ShoppingCart, Sparkles, Loader2, 
  Store, CheckCircle2, ShoppingBag, Send,
  ChefHat, X, ClipboardList,
  Wand2, Package, LayoutGrid, ListChecks, 
  ArrowUpRight, RefreshCw,
  Copy, ExternalLink, Share2, Link, Save, Utensils, Beaker, Clipboard,
  FileText, MoveRight, Minus, MapPin, Search, Layers, Grid, Map as MapIcon, ChevronRight,
  History, Receipt, RotateCcw, Calendar, CheckSquare, Tag, CreditCard, ChevronDown, ExternalLink as ExtLink, ShoppingCart as CartIcon,
  DownloadCloud, DollarSign, TrendingUp, BarChart, Eye, Clock, Flame, Globe, ArrowRight
} from 'lucide-react';
import { ShoppingItem, Category, Ingredient, UserPreferences, MealLog, Order, OrderStatus, Recipe } from '../types';
import { processChefChatPlan, organizePastedText, findNearbyStores, parsePastOrderText, generateRecipeImage } from '../services/geminiService';
import { parseQuantityValue } from '../src/utils';

const STORE_OPTIONS = [
    { name: 'Any Store', url: 'https://www.google.com/search?q=', home: 'https://www.google.com', color: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-500' },
    { name: 'Walmart', url: 'https://www.walmart.com/search?q=', home: 'https://www.walmart.com', color: 'bg-[#0071ce]', border: 'border-[#0071ce]', text: 'text-[#0071ce]' },
    { name: 'Target', url: 'https://www.target.com/s?searchTerm=', home: 'https://www.target.com', color: 'bg-[#cc0000]', border: 'border-[#cc0000]', text: 'text-[#cc0000]' },
    { name: 'Costco', url: 'https://www.costco.com/CatalogSearch?dept=All&keyword=', home: 'https://www.costco.com', color: 'bg-[#0060a9]', border: 'border-[#0060a9]', text: 'text-[#0060a9]' },
    { name: 'Instacart', url: 'https://www.instacart.com/store/s?k=', home: 'https://www.instacart.com', color: 'bg-[#ff8200]', border: 'border-[#ff8200]', text: 'text-[#ff8200]' },
    { name: 'Whole Foods', url: 'https://www.amazon.com/s?k=', home: 'https://www.amazon.com/wholefoods', color: 'bg-[#00674b]', border: 'border-[#00674b]', text: 'text-[#00674b]' },
];

const getCategoryTheme = (category: string) => {
    switch (category) {
        case Category.PRODUCE: return { bg: 'bg-lime-500', text: 'text-lime-500', border: 'border-lime-500', light: 'bg-lime-500/10' };
        case Category.MEAT: return { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', light: 'bg-rose-500/10' };
        case Category.DAIRY: return { bg: 'bg-sky-500', text: 'text-sky-500', border: 'border-sky-500', light: 'bg-sky-500/10' };
        case Category.BAKERY: return { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', light: 'bg-amber-600/10' };
        case Category.PANTRY: return { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', light: 'bg-orange-500/10' };
        case Category.FROZEN: return { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', light: 'bg-indigo-500/10' };
        case Category.BEVERAGE: return { bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500', light: 'bg-violet-500/10' };
        default: return { bg: 'bg-slate-400', text: 'text-slate-400', border: 'border-slate-400', light: 'bg-slate-400/10' };
    }
};

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'pending': return 'bg-slate-100 text-slate-600 border-slate-200';
        case 'confirmed': return 'bg-sky-100 text-sky-600 border-sky-200';
        case 'preparing': return 'bg-amber-100 text-amber-600 border-amber-200';
        case 'ready': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
        case 'completed': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
        case 'cancelled': return 'bg-rose-100 text-rose-600 border-rose-200';
        default: return 'bg-slate-100 text-slate-400';
    }
};

const formatTimeAgo = (dateInput: string) => {
    try {
        const date = new Date(dateInput);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (isNaN(diffInSeconds)) return dateInput;

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateInput;
    }
};

interface ShoppingListViewProps {
  items: ShoppingItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  orderHistory: Order[];
  onPlaceOrder: () => void;
  onReorder: (items: ShoppingItem[]) => void;
  onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
  pantryItems?: Ingredient[];
  preferences?: UserPreferences;
  mealHistory?: MealLog[];
  onRequireAccess?: (action: string, type?: string) => boolean;
  onSaveConcept?: (concept: {title: string, description: string, missingItems: any[], fullRecipe?: any}) => void;
  onSavePastOrder?: (order: Order) => void;
  onScheduleMeal: (recipe: Recipe, date: string, mealType: string) => void;
  onConsumeGeneration?: () => boolean;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ 
  items, 
  setItems, 
  orderHistory,
  onPlaceOrder,
  onReorder,
  onUpdateOrderStatus,
  pantryItems = [], 
  preferences,
  onRequireAccess,
  onSaveConcept,
  onSavePastOrder,
  onScheduleMeal,
  onConsumeGeneration
}) => {
  const [activeView, setActiveView] = useState<'cart' | 'history'>('cart');
  const [newItemName, setNewItemName] = useState('');
  const [newItemStore, setNewItemStore] = useState('Any Store');
  const [chatInput, setChatInput] = useState('');
  const [viewGrouping, setViewGrouping] = useState<'category' | 'store' | 'source'>('category');
  
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [isImportingOrder, setIsImportingOrder] = useState(false);
  const [importOrderText, setImportOrderText] = useState('');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importedOrderData, setImportedOrderData] = useState<{items: ShoppingItem[], total: number, date: string} | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'reveal'>('idle');
  const [culinaryConcepts, setCulinaryConcepts] = useState<Array<{
      title: string, 
      description: string, 
      missingItems: any[], 
      fullRecipe: { ingredients: string[], instructions: string[] },
      imageUrl?: string,
      groundingLinks?: string[]
  }>>([]);
  const [activeConceptIndex, setActiveConceptIndex] = useState<number | null>(null);
  const [isGeneratingConceptImage, setIsGeneratingConceptImage] = useState(false);

  const categorizeItem = (name: string): Category => {
      const lower = name.toLowerCase();
      if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper/)) return Category.PRODUCE;
      if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy/)) return Category.DAIRY;
      if (lower.match(/chicken|beef|pork|meat|fish|salmon|tuna|steak/)) return Category.MEAT;
      return Category.PANTRY;
  };

  const adjustQuantity = (id: string, delta: number) => {
      setItems(prev => prev.map(item => {
          if (item.id !== id) return item;
          const { num, suffix } = parseQuantityValue(item.quantity || '1');
          const newNum = Math.max(1, num + delta); 
          return { ...item, quantity: suffix ? `${newNum} ${suffix}`.trim() : `${newNum}` };
      }));
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    if (onConsumeGeneration && !onConsumeGeneration()) return; // Check limit

    setIsProcessingBulk(true);
    try {
        const parsed = await organizePastedText(bulkText);
        const newItems = parsed.map((item, idx) => ({
            id: (Date.now() + idx).toString() + Math.random(),
            name: item.name,
            quantity: item.quantity || '1',
            price: (item as any).price || 4.50,
            category: item.category as Category || categorizeItem(item.name),
            checked: false,
            store: newItemStore === 'Any Store' ? undefined : newItemStore,
            source: 'Bulk Import'
        }));
        setItems(prev => [...newItems, ...prev]);
        setBulkText('');
        setIsBulkAdding(false);
    } catch (e) { alert("Failed to parse manifest."); }
    finally { setIsProcessingBulk(false); }
  };

  const handleChatPlan = async () => {
    if (!chatInput.trim()) return;
    if (onConsumeGeneration && !onConsumeGeneration()) return; // Check limit

    setStatus('loading');
    try {
        const result = await processChefChatPlan(pantryItems, chatInput, preferences || {} as UserPreferences);
        
        if (result.plans && result.plans.length > 0) {
           setCulinaryConcepts(result.plans.map(p => ({
               title: p.concept,
               description: p.description,
               missingItems: p.items,
               fullRecipe: p.fullRecipe,
               groundingLinks: p.groundingLinks
           })));
        }
        setStatus('reveal');
    } catch (err) { setStatus('idle'); }
  };

  const openConceptDetail = async (index: number) => {
    setActiveConceptIndex(index);
    const concept = culinaryConcepts[index];
    if (!concept.imageUrl) {
        setIsGeneratingConceptImage(true);
        try {
            const imgData = await generateRecipeImage(concept.title, concept.fullRecipe.ingredients);
            if (imgData) {
                setCulinaryConcepts(prev => prev.map((c, i) => i === index ? { ...c, imageUrl: `data:image/png;base64,${imgData}` } : c));
            }
        } catch (e) {
            console.error("Image generation failed for concept", e);
        } finally {
            setIsGeneratingConceptImage(false);
        }
    }
  };

  const commitToCart = (index?: number) => {
      let itemsToAdd: {item: any, source: string}[] = [];
      if (index !== undefined) {
         itemsToAdd = culinaryConcepts[index].missingItems.map(i => ({ item: i, source: culinaryConcepts[index].title }));
      } else {
         culinaryConcepts.forEach(c => {
            c.missingItems.forEach(i => {
                itemsToAdd.push({ item: i, source: c.title });
            });
         });
      }

      const newItems: ShoppingItem[] = itemsToAdd.map(({item, source}) => ({
          id: Date.now().toString() + Math.random(),
          name: item.name,
          quantity: '1', 
          price: item.price || 5.00,
          category: item.category as Category || categorizeItem(item.name),
          checked: false,
          source: source
      }));
      setItems(prev => [...newItems, ...prev]);
      setViewGrouping('source');

      if (index === undefined || culinaryConcepts.length === 1) {
          setStatus('idle');
          setCulinaryConcepts([]);
          setChatInput('');
      } else {
          setCulinaryConcepts(prev => prev.filter((_, i) => i !== index));
      }
      setActiveConceptIndex(null);
  };

  const scheduleConcept = (index: number) => {
      const concept = culinaryConcepts[index];
      const newRecipe: Recipe = {
          id: `concept-${Date.now()}`,
          title: concept.title,
          description: concept.description,
          ingredients: concept.fullRecipe.ingredients,
          instructions: concept.fullRecipe.instructions,
          timeMinutes: 45,
          difficulty: 'Medium',
          calories: 450,
          missingIngredients: [],
          matchScore: 100,
          imageUrl: concept.imageUrl,
          groundingLinks: concept.groundingLinks
      };
      
      onScheduleMeal(newRecipe, new Date().toISOString().split('T')[0], 'Dinner');
      setActiveConceptIndex(null);
      if (window.confirm(`Scheduled "${concept.title}" for dinner today. Add missing ingredients to cart?`)) {
          commitToCart(index);
      }
  };

  const toggleCheck = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const syncToWalmart = () => {
    if (items.length === 0) {
        alert("Your cart is empty. Add items before syncing to Walmart.");
        return;
    }
    const query = items.map(i => i.name).join(' ');
    const url = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const groupedItems = useMemo(() => {
      const groups: Record<string, ShoppingItem[]> = {};
      items.forEach(item => {
          let key = '';
          if (viewGrouping === 'category') key = item.category;
          else if (viewGrouping === 'store') key = item.store || 'Any Store';
          else if (viewGrouping === 'source') key = item.source || 'Manual Entries';
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
      });
      return groups;
  }, [items, viewGrouping]);

  const sortedCategories = useMemo(() => {
      return Object.keys(groupedItems).sort();
  }, [groupedItems]);

  const cartStats = useMemo(() => {
    const checked = items.filter(i => i.checked).length;
    const totalVal = items.reduce((acc, i) => acc + ((i.price || 0) * parseQuantityValue(i.quantity).num), 0);
    return {
      total: items.length,
      checked: checked,
      percent: items.length > 0 ? Math.round((checked / items.length) * 100) : 0,
      totalValue: totalVal
    };
  }, [items]);

  const historyStats = useMemo(() => {
     const totalSpend = orderHistory.reduce((acc, o) => acc + o.total, 0);
     const avgOrder = orderHistory.length > 0 ? totalSpend / orderHistory.length : 0;
     
     const storeCounts: Record<string, number> = {};
     orderHistory.forEach(o => {
         o.items.forEach(i => {
             const s = i.store || 'Generic';
             storeCounts[s] = (storeCounts[s] || 0) + 1;
         });
     });
     let topStore = 'None';
     let max = 0;
     Object.entries(storeCounts).forEach(([s, c]) => {
         if (c > max) { max = c; topStore = s; }
     });

     return { totalSpend, avgOrder, topStore, count: orderHistory.length };
  }, [orderHistory]);

  return (
    <div className="animate-fade-in pb-32 max-w-5xl mx-auto px-4 lg:px-0">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/20">
               <ShoppingBag size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500">Supply Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter font-serif leading-none">
            {activeView === 'cart' ? 'The' : 'Order'}<span className="text-primary-400 italic font-normal"> {activeView === 'cart' ? 'Cart.' : 'History.'}</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-200 dark:border-slate-800" id="cart-view-toggles">
                <button 
                  onClick={() => setActiveView('cart')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeView === 'cart' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <CartIcon size={14}/> Active Cart
                </button>
                <button 
                  onClick={() => setActiveView('history')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeView === 'history' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <History size={14}/> Saved History
                </button>
            </div>
            {items.length > 0 && activeView === 'cart' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm flex items-center gap-4 w-full md:w-auto">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center relative shrink-0">
                      <Tag size={16} className="text-emerald-600" />
                  </div>
                  <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Estimated Total</p>
                      <p className="text-base font-black text-slate-900 dark:text-white leading-none">${cartStats.totalValue.toFixed(2)}</p>
                  </div>
              </div>
            )}
        </div>
      </div>

      {activeView === 'cart' ? (
        <div className="space-y-8">
            <div className={`bg-[#050505] rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden`} id="orchestrate-manifest-section">
                <div className="relative z-10">
                    {status === 'idle' && (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                      <div className="p-2.5 bg-primary-500 rounded-xl text-white">
                                        <ChefHat size={20} />
                                      </div>
                                      <h2 className="text-sm font-black text-white uppercase tracking-widest">Build Your Shopping List</h2>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium italic">"Tell the chef what you need. Try '5 dinners' or '5 dinners for under $20 each not using my pantry'."</p>
                                </div>
                            </div>

                            <div className="relative flex bg-[#0c1220] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl" id="cart-chat-input">
                                <input 
                                    type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                    placeholder="e.g. 5 dinners for under $20 each..."
                                    className="flex-1 bg-transparent px-8 py-6 outline-none text-white font-bold text-base placeholder:text-white/20"
                                    onKeyDown={e => e.key === 'Enter' && handleChatPlan()}
                                />
                                <button onClick={handleChatPlan} className="bg-primary-600 px-8 flex items-center justify-center text-white hover:bg-primary-500 transition-colors"><Send size={20} /></button>
                            </div>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="py-24 text-center animate-fade-in flex flex-col items-center">
                            <Loader2 size={40} className="animate-spin text-primary-500 mb-6" />
                            <h4 className="text-white font-black uppercase tracking-[0.4em] text-xs">AI is designing manifest...</h4>
                        </div>
                    )}

                    {status === 'reveal' && culinaryConcepts.length > 0 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-white font-serif">Proposed Concepts ({culinaryConcepts.length})</h3>
                                <button onClick={() => { setStatus('idle'); setCulinaryConcepts([]); }} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {culinaryConcepts.map((concept, index) => (
                                    <div key={index} className="p-6 rounded-[2rem] bg-[#0c1220] border border-white/10 shadow-xl flex flex-col h-full hover:border-primary-500/30 transition-all group">
                                        <h3 className="text-xl font-black font-serif text-white mb-2 italic">{concept.title}</h3>
                                        <p className="text-slate-400 text-xs italic mb-6 flex-1 line-clamp-3">"{concept.description}"</p>
                                        
                                        <div className="p-4 bg-[#050505] rounded-2xl border border-white/5 mb-6">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-primary-500 mb-3 flex items-center gap-2"><Package size={12}/> Needs</h5>
                                            <ul className="space-y-2">
                                                {concept.missingItems.slice(0, 4).map((item, i) => (
                                                    <li key={i} className="text-xs font-bold text-slate-300 flex items-center justify-between">
                                                        <span>{item.name}</span>
                                                        <span className="text-[10px] text-slate-500">${(item.price || 0).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                                {concept.missingItems.length > 4 && (
                                                    <li className="text-[9px] text-slate-500 italic pt-1">+{concept.missingItems.length - 4} more items</li>
                                                )}
                                            </ul>
                                        </div>

                                        <div className="mt-auto flex gap-3">
                                            <button 
                                                onClick={() => commitToCart(index)}
                                                className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-lg"
                                            >
                                                Add All
                                            </button>
                                            <button 
                                                onClick={() => openConceptDetail(index)}
                                                className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN SHOPPING LIST */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setViewGrouping('category')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewGrouping === 'category' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}>Category</button>
                        <button onClick={() => setViewGrouping('store')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewGrouping === 'store' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}>Store</button>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => syncToWalmart()} className="px-5 py-3 bg-[#0071ce] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2">
                             Walmart Sync <ExternalLink size={14} />
                        </button>
                        <button onClick={() => setIsBulkAdding(true)} className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                             <Plus size={14} /> Add Items
                        </button>
                    </div>
                </div>

                {sortedCategories.length > 0 ? (
                    <div className="space-y-8">
                        {sortedCategories.map(group => {
                            const theme = getCategoryTheme(group);
                            return (
                                <div key={group} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <div className={`px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center`}>
                                        <h3 className={`font-black text-sm uppercase tracking-widest flex items-center gap-3 ${viewGrouping === 'category' ? theme.text : 'text-slate-700 dark:text-slate-300'}`}>
                                            {viewGrouping === 'category' ? (
                                                <>
                                                    <div className={`w-3 h-3 rounded-full ${theme.bg} shadow-sm`} />
                                                    {group}
                                                </>
                                            ) : (
                                                group
                                            )}
                                        </h3>
                                        <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md">{groupedItems[group].length} Items</span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {groupedItems[group].map(item => {
                                            const itemTheme = getCategoryTheme(item.category);
                                            return (
                                                <div key={item.id} className={`p-4 flex items-center gap-4 group transition-colors ${item.checked ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                    <button 
                                                        onClick={() => toggleCheck(item.id)}
                                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'}`}
                                                    >
                                                        {item.checked && <Check size={14} strokeWidth={3} />}
                                                    </button>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            {/* Color Dot Indicator */}
                                                            <div className={`w-2 h-2 rounded-full ${itemTheme.bg} shrink-0 shadow-sm`} title={item.category} />
                                                            <span className={`font-bold text-sm truncate ${item.checked ? 'text-slate-400 line-through decoration-slate-400/50' : 'text-slate-900 dark:text-white'}`}>
                                                                {item.name}
                                                            </span>
                                                            {item.source && item.source !== 'Manual' && (
                                                                <span className="text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.source}</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium pl-4">
                                                            ${(item.price || 0).toFixed(2)} • {item.store || 'Any Store'}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-950 rounded-lg p-1">
                                                        <button onClick={() => adjustQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"><Minus size={12} /></button>
                                                        <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                                                        <button onClick={() => adjustQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"><Plus size={12} /></button>
                                                    </div>
                                                    
                                                    <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
                            <ShoppingCart size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white font-serif mb-2">Cart Empty</h3>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Add items or use the AI to generate a list.</p>
                    </div>
                )}
                
                {items.length > 0 && (
                    <div className="sticky bottom-8 z-30">
                        <div className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between pl-8 max-w-2xl mx-auto border border-slate-800">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Estimated</p>
                                <p className="text-2xl font-black font-serif">${cartStats.totalValue.toFixed(2)}</p>
                            </div>
                            <button 
                                onClick={onPlaceOrder}
                                className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-lg active:scale-95 flex items-center gap-3"
                            >
                                Checkout <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
            <div className="flex justify-between items-center mb-8">
                <div className="flex gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm min-w-[200px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Spend</p>
                        <p className="text-3xl font-black font-serif text-slate-900 dark:text-white">${historyStats.totalSpend.toFixed(2)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm min-w-[200px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Top Source</p>
                        <p className="text-2xl font-black font-serif text-primary-500 truncate">{historyStats.topStore}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsImportingOrder(true)}
                    className="px-6 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary-500 transition-all flex items-center gap-3 shadow-sm"
                >
                    <Receipt size={16} /> Import Receipt
                </button>
            </div>

            <div className="space-y-6">
                {orderHistory.map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 group hover:border-primary-500/30 transition-all">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl flex flex-col items-center justify-center min-w-[100px] text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{formatTimeAgo(order.createdAt)}</span>
                            <span className="text-2xl font-black font-serif text-slate-900 dark:text-white">${order.total.toFixed(2)}</span>
                            <div className={`mt-2 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </div>
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                        Order #{order.id.slice(-6)}
                                        {order.items.length > 0 && order.items[0].store && (
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase tracking-wider">{order.items[0].store}</span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium">{order.items.length} Items • {order.date}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onReorder(order.items)}
                                        className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl hover:bg-primary-500 hover:text-white transition-all"
                                        title="Reorder All"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {order.items.slice(0, 6).map((item, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                        {item.quantity} {item.name}
                                    </span>
                                ))}
                                {order.items.length > 6 && (
                                    <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 border border-slate-100 dark:border-slate-700">
                                        +{order.items.length - 6} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* MODALS */}
      {isBulkAdding && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Quick Add</h3>
                      <button onClick={() => setIsBulkAdding(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={24}/></button>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Store Source</label>
                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                              {STORE_OPTIONS.map(s => (
                                  <button 
                                    key={s.name}
                                    onClick={() => setNewItemStore(s.name)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${newItemStore === s.name ? `bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent` : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                  >
                                      {s.name}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Paste List or Type Items</label>
                          <textarea 
                              value={bulkText}
                              onChange={e => setBulkText(e.target.value)}
                              placeholder="e.g. 2 gallons milk, 1 loaf bread, 5 apples..."
                              className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 outline-none font-bold text-slate-900 dark:text-white text-sm resize-none focus:border-primary-500 transition-all"
                          />
                      </div>
                      <button 
                          onClick={handleBulkAdd}
                          disabled={isProcessingBulk}
                          className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-500 transition-all flex items-center justify-center gap-3 shadow-xl"
                      >
                          {isProcessingBulk ? <Loader2 size={18} className="animate-spin" /> : <ListChecks size={18} />}
                          Process Items
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      {activeConceptIndex !== null && culinaryConcepts[activeConceptIndex] && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-4xl h-[85vh] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2 bg-slate-950 relative">
                      {isGeneratingConceptImage ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rendering...</span>
                          </div>
                      ) : culinaryConcepts[activeConceptIndex].imageUrl ? (
                          <img src={culinaryConcepts[activeConceptIndex].imageUrl} className="w-full h-full object-cover" />
                      ) : (
                          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                              <ChefHat size={64} className="text-slate-800" />
                          </div>
                      )}
                      <div className="absolute top-6 left-6 z-10">
                          <span className="px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                              Concept Preview
                          </span>
                      </div>
                  </div>
                  <div className="w-full md:w-1/2 p-10 flex flex-col bg-[#0c1220]">
                      <div className="flex justify-between items-start mb-8">
                          <h2 className="text-3xl font-black font-serif text-white leading-tight italic">{culinaryConcepts[activeConceptIndex].title}</h2>
                          <button onClick={() => setActiveConceptIndex(null)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"><X size={20} /></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                          <div>
                              <p className="text-slate-400 text-sm font-medium leading-relaxed italic border-l-2 border-primary-500 pl-4">
                                  "{culinaryConcepts[activeConceptIndex].description}"
                              </p>
                          </div>

                          <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-4 flex items-center gap-2"><ShoppingCart size={14}/> Missing Ingredients</h4>
                              <div className="bg-slate-950 rounded-2xl p-2 border border-white/5">
                                  {culinaryConcepts[activeConceptIndex].missingItems.map((item, i) => (
                                      <div key={i} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0">
                                          <span className="text-xs font-bold text-slate-300">{item.name}</span>
                                          <span className="text-[10px] font-black text-slate-500">${(item.price || 0).toFixed(2)}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
                          <button 
                              onClick={() => commitToCart(activeConceptIndex)}
                              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-500 hover:text-white transition-all shadow-xl"
                          >
                              Add All Ingredients to Cart
                          </button>
                          <button 
                              onClick={() => scheduleConcept(activeConceptIndex)}
                              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-700 transition-all"
                          >
                              Schedule Meal Only
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ShoppingListView;
