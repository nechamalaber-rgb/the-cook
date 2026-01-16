
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
  DownloadCloud, DollarSign, TrendingUp, BarChart, Eye, Clock, Flame, Globe
} from 'lucide-react';
import { ShoppingItem, Category, Ingredient, UserPreferences, MealLog, Order, OrderStatus, Recipe } from '../types';
import { processChefChatPlan, organizePastedText, findNearbyStores, parsePastOrderText, generateRecipeImage } from '../services/geminiService';
import { parseQuantityValue } from '../App';

const STORE_OPTIONS = [
    { name: 'Any Store', url: 'https://www.google.com/search?q=', home: 'https://www.google.com', color: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-500' },
    { name: 'Walmart', url: 'https://www.walmart.com/search?q=', home: 'https://www.walmart.com', color: 'bg-[#0071ce]', border: 'border-[#0071ce]', text: 'text-[#0071ce]' },
    { name: 'Target', url: 'https://www.target.com/s?searchTerm=', home: 'https://www.target.com', color: 'bg-[#cc0000]', border: 'border-[#cc0000]', text: 'text-[#cc0000]' },
    { name: 'Costco', url: 'https://www.costco.com/CatalogSearch?dept=All&keyword=', home: 'https://www.costco.com', color: 'bg-[#0060a9]', border: 'border-[#0060a9]', text: 'text-[#0060a9]' },
    { name: 'Instacart', url: 'https://www.instacart.com/store/s?k=', home: 'https://www.instacart.com', color: 'bg-[#ff8200]', border: 'border-[#ff8200]', text: 'text-[#ff8200]' },
    { name: 'Whole Foods', url: 'https://www.amazon.com/s?k=', home: 'https://www.amazon.com/wholefoods', color: 'bg-[#00674b]', border: 'border-[#00674b]', text: 'text-[#00674b]' },
];

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
  onScheduleMeal
}) => {
  const [activeView, setActiveView] = useState<'cart' | 'history'>('cart');
  const [newItemName, setNewItemName] = useState('');
  const [newItemStore, setNewItemStore] = useState('Any Store');
  const [chatInput, setChatInput] = useState('');
  const [viewGrouping, setViewGrouping] = useState<'category' | 'store' | 'source'>('category');
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  
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

  const activeStoreObj = STORE_OPTIONS.find(s => s.name === newItemStore) || STORE_OPTIONS[0];

  const categorizeItem = (name: string): Category => {
      const lower = name.toLowerCase();
      if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper/)) return Category.PRODUCE;
      if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy/)) return Category.DAIRY;
      if (lower.match(/chicken|beef|pork|meat|fish|salmon|tuna|steak/)) return Category.MEAT;
      return Category.PANTRY;
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem: ShoppingItem = {
      id: Date.now().toString() + Math.random(),
      name: newItemName.trim(),
      quantity: '1',
      price: 5.99, 
      category: categorizeItem(newItemName), 
      checked: false,
      store: newItemStore === 'Any Store' ? undefined : newItemStore,
      source: 'Manual'
    };
    setItems(prev => [newItem, ...prev]);
    setNewItemName('');
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

  const handleImportOrder = async () => {
      if (!importOrderText.trim()) return;
      setIsProcessingImport(true);
      try {
          const result = await parsePastOrderText(importOrderText);
          const mappedItems: ShoppingItem[] = result.items.map((item, i) => ({
              id: `imported-${Date.now()}-${i}`,
              name: item.name,
              quantity: item.quantity,
              category: item.category as Category || categorizeItem(item.name),
              price: item.price,
              checked: true,
              store: 'Imported',
              source: 'Receipt'
          }));
          setImportedOrderData({
              items: mappedItems,
              total: result.total,
              date: result.date || new Date().toISOString().split('T')[0]
          });
      } catch (e) {
          console.error(e);
          alert("Could not process order text.");
      } finally {
          setIsProcessingImport(false);
      }
  };

  const confirmImportOrder = () => {
      if (!importedOrderData) return;
      const newOrder: Order = {
          id: `imp-${Date.now()}`,
          date: importedOrderData.date,
          total: importedOrderData.total,
          items: importedOrderData.items,
          status: 'completed',
          createdAt: new Date().toISOString()
      };
      
      if (onSavePastOrder) {
        onSavePastOrder(newOrder);
      } else {
        console.warn("onSavePastOrder not provided");
      }
      
      setIsImportingOrder(false);
      setImportedOrderData(null);
      setImportOrderText('');
      setActiveView('history');
  };

  const handleChatPlan = async () => {
    if (!chatInput.trim()) return;
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
                                                {concept.missingItems.length > 4 && <li className="text-[9px] text-slate-500 italic">+{concept.missingItems.length - 4} more</li>}
                                            </ul>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => openConceptDetail(index)}
                                                    className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2"
                                                >
                                                    <Eye size={12} /> Details
                                                </button>
                                                <button 
                                                    onClick={() => commitToCart(index)}
                                                    className="py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg"
                                                >
                                                    Add Items
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => scheduleConcept(index)}
                                                className="py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-indigo-500/30 flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <Calendar size={12} /> Save to Calendar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {culinaryConcepts.length > 1 && (
                                <button onClick={() => commitToCart()} className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black text-index uppercase tracking-[0.3em] shadow-xl hover:bg-primary-500 transition-all">
                                    Append All Concepts to Cart
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-10">
                <button 
                  onClick={() => setIsImportingOrder(true)}
                  className="flex-1 py-5 bg-[#0071ce] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                >
                  <DownloadCloud size={18} /> Import Order
                </button>
                <button 
                  onClick={syncToWalmart}
                  className="flex-1 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                >
                  <ExtLink size={18} /> Send Cart to Walmart
                </button>
            </div>

            <div className="space-y-12">
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-2 items-center mb-6">
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 w-full lg:w-auto">
                            {['category', 'store', 'source'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewGrouping(mode as any)}
                                    className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewGrouping === mode ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    {mode === 'source' ? 'Recipe' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="hidden lg:block w-px h-8 bg-slate-100 dark:bg-slate-800"></div>

                        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto px-2 lg:px-0">
                            {STORE_OPTIONS.map(store => (
                                <button
                                    key={store.name}
                                    onClick={() => setNewItemStore(store.name)}
                                    className={`px-4 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        newItemStore === store.name 
                                        ? `${store.color} text-white ${store.border} shadow-md` 
                                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {store.name}
                                </button>
                            ))}
                        </div>

                        <div className="hidden lg:block w-px h-8 bg-slate-100 dark:bg-slate-800"></div>

                        <button 
                            onClick={() => setIsBulkAdding(true)} 
                            className="shrink-0 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-full lg:w-auto justify-center"
                        >
                            <ClipboardList size={16} /> Bulk Paste
                        </button>
                    </div>

                    <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-900 p-2.5 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3">
                      <div className="flex items-center gap-3 flex-1 pl-4">
                          <Plus size={20} className="text-slate-300" />
                          <input
                            type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={`Add item to ${newItemStore}...`}
                            className="flex-1 bg-transparent py-5 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold"
                          />
                      </div>
                      <button type="submit" className={`px-10 py-4 md:py-0 h-[56px] rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all hover:brightness-110 ${activeStoreObj.color}`}>Add to {newItemStore}</button>
                    </form>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-32 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem] bg-white dark:bg-slate-900/30">
                      <ShoppingCart size={40} className="mx-auto mb-6 text-slate-200" />
                      <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white mb-2 italic">Cart Idle.</h3>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No supplies currently queued for replenishment.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {sortedCategories.map(groupKey => {
                      const groupItems = groupedItems[groupKey];
                      return (
                        <div key={groupKey} className="animate-slide-up space-y-4">
                          <div className="flex items-center gap-4 px-4 sticky top-20 z-20 bg-slate-50/80 dark:bg-[#090e1a]/95 backdrop-blur-md py-4 rounded-xl">
                              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center gap-3">
                                 <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" /> {groupKey}
                              </h3>
                              <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                          </div>
                          
                          <div className="space-y-2">
                              {groupItems.map(item => (
                                  <div key={item.id} className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                      item.checked ? 'bg-slate-50 dark:bg-slate-800/40 opacity-60 border-transparent' : 'bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 hover:border-primary-500/30'
                                  }`}>
                                      <button 
                                          onClick={() => toggleCheck(item.id)}
                                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                                              item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 text-transparent hover:border-emerald-500'
                                          }`}
                                      >
                                          <Check size={14} strokeWidth={4} />
                                      </button>

                                      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                          <div className="flex-1">
                                              <span className={`font-black text-sm block tracking-tight leading-tight ${item.checked ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{item.name}</span>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                  <div className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(item.category)}`} />
                                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                                                  {item.store && (
                                                      <>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.store}</span>
                                                      </>
                                                  )}
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                              <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded">
                                                  ${(item.price || 4.99).toFixed(2)}
                                              </span>
                                          </div>
                                      </div>

                                      <div className="flex items-center gap-2 pl-4 border-l border-slate-100 dark:border-slate-800">
                                          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5">
                                              <button onClick={() => adjustQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><Minus size={12}/></button>
                                              <span className="text-xs font-black text-slate-900 dark:text-white w-6 text-center">{item.quantity}</span>
                                              <button onClick={() => adjustQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"><Plus size={12}/></button>
                                          </div>
                                          <button onClick={() => deleteItem(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="pt-8 flex flex-col items-center gap-4">
                        <button 
                          onClick={onPlaceOrder}
                          className="w-full max-w-md py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <CreditCard size={20} /> Finalize Purchase & Sync Pantry
                        </button>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: ${cartStats.totalValue.toFixed(2)} • {cartStats.total} assets</p>
                    </div>
                  </div>
                )}
            </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                       <DollarSign size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Lifetime</span>
                   </div>
                   <p className="text-2xl font-black font-serif text-slate-900 dark:text-white">${historyStats.totalSpend.toFixed(2)}</p>
               </div>
               <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                       <BarChart size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Avg. Order</span>
                   </div>
                   <p className="text-2xl font-black font-serif text-slate-900 dark:text-white">${historyStats.avgOrder.toFixed(2)}</p>
               </div>
               <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                       <Receipt size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Orders</span>
                   </div>
                   <p className="text-2xl font-black font-serif text-slate-900 dark:text-white">{historyStats.count}</p>
               </div>
               <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                       <Store size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Top Store</span>
                   </div>
                   <p className="text-xl font-black font-serif text-slate-900 dark:text-white truncate">{historyStats.topStore}</p>
               </div>
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white font-serif">Order Archive</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Track & Reorder Past Supplies</p>
                </div>
                <button 
                  onClick={() => setIsImportingOrder(true)}
                  className="px-6 py-4 bg-[#0071ce] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:brightness-110 transition-all"
                >
                   <DownloadCloud size={16} /> Import Walmart Order
                </button>
            </div>

            {orderHistory.length === 0 ? (
                <div className="text-center py-32 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem] bg-white dark:bg-slate-900/30">
                    <History size={40} className="mx-auto mb-6 text-slate-200" />
                    <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white mb-2 italic">No History.</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Finalize your first purchase to save everything here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {orderHistory.map(order => (
                        <div key={order.id} className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col relative overflow-hidden group hover:border-primary-500 transition-all cursor-pointer" onClick={() => setSelectedReceipt(order)}>
                            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transition-transform group-hover:scale-110">
                                <Receipt size={120} />
                            </div>
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-primary-500" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{formatTimeAgo(order.createdAt || order.date)}</span>
                                    </div>
                                    <h3 className="text-xl font-black font-serif italic text-slate-900 dark:text-white">Receipt #{order.id.slice(-6)}</h3>
                                </div>
                                <div className="relative group/status" onClick={e => e.stopPropagation()}>
                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 cursor-pointer ${getStatusColor(order.status)}`}>
                                        {order.status} <ChevronDown size={10} />
                                    </div>
                                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-[100] p-1">
                                        {(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as OrderStatus[]).map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => onUpdateOrderStatus(order.id, s)}
                                                className={`w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors ${order.status === s ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'text-slate-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 mb-8 min-h-[140px]">
                                {order.items.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono border-b border-dashed border-slate-100 dark:border-slate-800 pb-1.5">
                                        <div className="flex items-center gap-2 pr-4 overflow-hidden flex-1">
                                            <span className="text-primary-500 shrink-0">•</span>
                                            <span className="truncate">{item.name}</span>
                                            {item.store && <span className="text-[7px] bg-slate-100 dark:bg-slate-800 px-1 rounded uppercase shrink-0">{item.store}</span>}
                                        </div>
                                        <span className="shrink-0 text-slate-400 uppercase">x{item.quantity}</span>
                                    </div>
                                ))}
                                {order.items.length > 4 && (
                                    <p className="text-[9px] font-black text-slate-300 uppercase italic">+{order.items.length - 4} additional assets</p>
                                )}
                            </div>

                            <div className="mb-6 flex justify-between items-center px-2">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Value</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white font-serif">${order.total.toFixed(2)}</span>
                            </div>

                            <button 
                                onClick={(e) => { e.stopPropagation(); onReorder(order.items); }}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <RotateCcw size={14} /> Reorder Everything
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {activeConceptIndex !== null && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 animate-fade-in">
              <div className="bg-white dark:bg-[#0c1220] w-full max-w-4xl rounded-[3rem] shadow-2xl border-4 border-slate-900 overflow-hidden flex flex-col h-[90vh] animate-slide-up">
                  <div className="relative h-[250px] md:h-[350px] bg-slate-900 flex-shrink-0">
                      {isGeneratingConceptImage ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-slate-950/80 z-20">
                             <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400">Drawing Gourmet Concept...</span>
                          </div>
                      ) : culinaryConcepts[activeConceptIndex].imageUrl ? (
                          <img src={culinaryConcepts[activeConceptIndex].imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600"><Utensils size={64} /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      <button onClick={() => setActiveConceptIndex(null)} className="absolute top-6 right-6 p-3 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-all z-30 shadow-xl"><X size={20}/></button>
                      
                      <div className="absolute bottom-6 left-10 right-10">
                          <div className="flex items-center gap-3 mb-4">
                              <span className="px-3 py-1 bg-emerald-50 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">New Concept</span>
                              <div className="flex items-center gap-2 text-white/60 text-[9px] font-black uppercase tracking-widest">
                                  <Clock size={12} /> {culinaryConcepts[activeConceptIndex].fullRecipe.instructions.length > 5 ? '45m' : '20m'}
                                  <Flame size={12} className="text-rose-400" /> 450 kcal
                              </div>
                          </div>
                          <h2 className="text-3xl md:text-5xl font-black font-serif text-white italic tracking-tighter leading-none">{culinaryConcepts[activeConceptIndex].title}</h2>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 md:p-14 space-y-12 no-scrollbar scroll-smooth">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                          <div className="lg:col-span-5 space-y-10">
                              <section>
                                  <div className="flex items-center gap-3 mb-6">
                                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl"><Beaker size={20}/></div>
                                      <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white italic">Manifest Ingredients</h3>
                                  </div>
                                  <div className="space-y-3">
                                      {culinaryConcepts[activeConceptIndex].fullRecipe.ingredients.map((ing, i) => (
                                          <div key={i} className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-300 group">
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 group-hover:scale-150 transition-transform"></div>
                                              <span className="italic">{ing}</span>
                                          </div>
                                      ))}
                                  </div>
                              </section>
                              
                              {culinaryConcepts[activeConceptIndex].groundingLinks && culinaryConcepts[activeConceptIndex].groundingLinks!.length > 0 && (
                                  <section>
                                      <div className="flex items-center gap-3 mb-6">
                                          <div className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl"><Globe size={20}/></div>
                                          <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white italic">Web Sources</h3>
                                      </div>
                                      <div className="space-y-2">
                                          {culinaryConcepts[activeConceptIndex].groundingLinks!.map((link, idx) => (
                                              <a 
                                                  key={idx} 
                                                  href={link} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary-500 transition-all group"
                                              >
                                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[180px]">Verified Source {idx + 1}</span>
                                                  <ExternalLink size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                                              </a>
                                          ))}
                                      </div>
                                  </section>
                              )}
                          </div>
                          
                          <div className="lg:col-span-7 space-y-10">
                              <section>
                                  <div className="flex items-center gap-3 mb-6">
                                      <div className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl"><History size={20}/></div>
                                      <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white italic">Execution Protocol</h3>
                                  </div>
                                  <div className="space-y-8 pb-10">
                                      {culinaryConcepts[activeConceptIndex].fullRecipe.instructions.map((step, i) => (
                                          <div key={i} className="flex gap-6 group">
                                              <div className="text-2xl font-black text-slate-100 dark:text-slate-800 font-serif italic group-hover:text-primary-500 transition-colors shrink-0">0{i+1}</div>
                                              <p className="text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{step}</p>
                                          </div>
                                      ))}
                                  </div>
                              </section>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/5 flex flex-col md:flex-row gap-4 shrink-0">
                      <div className="flex-1 flex gap-4">
                          <button onClick={() => setActiveConceptIndex(null)} className="flex-1 py-5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Close</button>
                          <button 
                            onClick={() => scheduleConcept(activeConceptIndex)}
                            className="flex-1 py-5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-500/30 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                              <Calendar size={16} /> Save to Calendar
                          </button>
                      </div>
                      <button 
                        onClick={() => commitToCart(activeConceptIndex)}
                        className="flex-[1.2] py-5 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                          <ShoppingCart size={16} /> Add Missing Items to Cart
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-950 w-full max-lg rounded-[3rem] p-8 md:p-12 shadow-2xl animate-slide-up border-4 border-slate-900 relative max-h-[90vh] flex flex-col">
                  <div className="absolute top-6 right-6 z-10">
                      <button onClick={() => setSelectedReceipt(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
                  </div>
                  
                  <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl z-20">
                      Digital Receipt
                  </div>
                  
                  <div className="text-center mb-6 border-b-2 border-dashed border-slate-200 dark:border-slate-800 pb-6 shrink-0 pt-2">
                      <h2 className="text-4xl font-black font-serif italic text-slate-900 dark:text-white mb-2">Prepzu Studio</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Supply Logistics Archive • {selectedReceipt.date}</p>
                      <div className="mt-4 flex justify-center gap-4">
                         <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Receipt ID</span>
                            <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-300">#{selectedReceipt.id.slice(-8)}</span>
                         </div>
                         <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <span className="text-[8px] font-black text-emerald-400 uppercase block mb-1">Status</span>
                            <span className="text-sm font-black text-emerald-600 uppercase">{selectedReceipt.status}</span>
                         </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4 min-h-0 no-scrollbar">
                      {selectedReceipt.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-start text-sm">
                              <div className="flex flex-col flex-1 pr-4">
                                  <span className="font-black text-slate-900 dark:text-white italic tracking-tighter leading-tight">x{item.quantity} {item.name}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.store || 'Standard Store'}</span>
                              </div>
                              <span className="font-mono text-slate-500 font-bold whitespace-nowrap">${((item.price || 4.99) * parseQuantityValue(item.quantity).num).toFixed(2)}</span>
                          </div>
                      ))}
                  </div>

                  <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800 pt-6 space-y-3 shrink-0">
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">${selectedReceipt.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Studio Fee</span>
                          <span className="font-mono font-bold text-emerald-500">$0.00</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <span className="text-xl font-black font-serif italic text-slate-900 dark:text-white">Final Total</span>
                          <span className="text-2xl font-black font-mono text-primary-500">${selectedReceipt.total.toFixed(2)}</span>
                      </div>
                  </div>

                  <div className="mt-8 flex gap-4 shrink-0">
                      <button onClick={() => { onReorder(selectedReceipt.items); setSelectedReceipt(null); }} className="flex-1 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Repeat Order</button>
                      <button onClick={() => setSelectedReceipt(null)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Close History</button>
                  </div>
              </div>
          </div>
      )}

      {isImportingOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl p-4 animate-fade-in">
              <div className="bg-[#f3f0e6] dark:bg-[#0c1220] w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-white/5 max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center mb-8 shrink-0">
                      <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white italic">Import Order.</h2>
                      <button onClick={() => { setIsImportingOrder(false); setImportedOrderData(null); }} className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-rose-600 hover:text-white transition-all"><X size={24}/></button>
                  </div>

                  {!importedOrderData ? (
                      <div className="space-y-8 flex-1 flex flex-col min-h-0">
                          <div className="bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex-1 flex flex-col">
                              <p className="text-xs font-bold text-slate-500 leading-relaxed mb-4">
                                  Paste the full text of your Walmart, Instacart, or email receipt below. Prepzu will extract the items, calculate the total spend, and archive it to your history.
                              </p>
                              <textarea 
                                value={importOrderText} onChange={(e) => setImportOrderText(e.target.value)}
                                placeholder="Paste order details here..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-4 outline-none font-medium dark:text-white flex-1 resize-none text-xs"
                              />
                          </div>
                          <button 
                            onClick={handleImportOrder} disabled={!importOrderText.trim() || isProcessingImport}
                            className="w-full py-5 bg-[#0071ce] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-[#005fb3] transition-all shrink-0"
                          >
                            {isProcessingImport ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} Analyze Order
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-8 animate-fade-in flex-1 flex flex-col min-h-0">
                          <div className="bg-white dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center flex-1 flex flex-col overflow-hidden">
                               <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-emerald-500/30 shrink-0">
                                   <Check size={32} strokeWidth={3} />
                               </div>
                               <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif mb-2 shrink-0">Order Analyzed</h3>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 shrink-0">{importedOrderData.items.length} Items Found</p>
                               
                               <div className="flex justify-center items-baseline gap-2 mb-8 shrink-0">
                                   <span className="text-4xl font-black text-primary-500 font-serif">${importedOrderData.total.toFixed(2)}</span>
                                   <span className="text-xs font-bold text-slate-400">Total Spend</span>
                               </div>

                               <div className="overflow-y-auto no-scrollbar text-left space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 flex-1">
                                   {importedOrderData.items.map((item, i) => (
                                       <div key={i} className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                           <span>{item.quantity} x {item.name}</span>
                                           <span>${(item.price || 0).toFixed(2)}</span>
                                       </div>
                                   ))}
                               </div>
                          </div>
                          <div className="flex gap-4 shrink-0">
                              <button onClick={() => setImportedOrderData(null)} className="flex-1 py-5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">Back</button>
                              <button 
                                onClick={confirmImportOrder}
                                className="flex-[2] py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                              >
                                Save to History
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {isBulkAdding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl p-4 animate-fade-in">
              <div className="bg-[#f3f0e6] dark:bg-[#0c1220] w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-white/5">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white italic">Bulk Manifest.</h2>
                      <button onClick={() => setIsBulkAdding(false)} className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-rose-600 hover:text-white transition-all"><X size={24}/></button>
                  </div>
                  <div className="space-y-8">
                      <textarea 
                        value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                        placeholder="1 gallon Milk&#10;3 Apples&#10;2 lbs Chicken..."
                        className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 outline-none font-bold dark:text-white h-64 resize-none"
                      />
                      <button 
                        onClick={handleBulkAdd} disabled={!bulkText.trim() || isProcessingBulk}
                        className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isProcessingBulk ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} Synthesize Manifest
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ShoppingListView;
