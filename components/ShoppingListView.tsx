import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Check, Trash2, ShoppingBag, Sparkles, Loader2, 
  Store, CheckCircle2, Send,
  ChefHat, X, ClipboardList,
  Wand2, Package, LayoutGrid, ListChecks, 
  ArrowUpRight, RefreshCw,
  Copy, ExternalLink, Share2, Link, Save, Utensils, Beaker, Clipboard,
  FileText, MoveRight, Minus, MapPin, Search, Layers, Grid, Map as MapIcon, ChevronRight,
  History, Receipt, RotateCcw, Calendar, CheckSquare, Tag, CreditCard, ChevronDown, ExternalLink as ExtLink, ShoppingCart as CartIcon,
  DownloadCloud, DollarSign, TrendingUp, BarChart, Eye, Clock, Flame, Globe, ArrowRight, ShoppingCart, AlertCircle, Heart
} from 'lucide-react';
import { ShoppingItem, Category, Ingredient, UserPreferences, MealLog, Order, OrderStatus, Recipe } from '../types';
import { processChefChatPlan, organizePastedText, generateRecipeImage } from '../services/geminiService';
import { parseQuantityValue } from '../utils';

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
  onAddRecipe: (recipe: Recipe) => void;
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
  pantryItems = [], 
  preferences,
  onScheduleMeal,
  onConsumeGeneration,
  onAddRecipe
}) => {
  const [activeView, setActiveView] = useState<'cart' | 'history'>('cart');
  const [newItemStore, setNewItemStore] = useState('Any Store');
  const [chatInput, setChatInput] = useState('');
  const [viewGrouping, setViewGrouping] = useState<'category' | 'store' | 'source'>('category');
  
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [isManualAdding, setIsManualAdding] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', quantity: '1', price: '', category: 'Pantry', store: 'Any Store' });

  const [status, setStatus] = useState<'idle' | 'loading' | 'reveal'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
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
  const [isBuilderExpanded, setIsBuilderExpanded] = useState(false);

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
    if (onConsumeGeneration && !onConsumeGeneration()) return; 

    setIsProcessingBulk(true);
    try {
        const parsed = await organizePastedText(bulkText);
        const newItems = parsed.map((item: any, idx: number) => ({
            id: (Date.now() + idx).toString() + Math.random(),
            name: item.name,
            quantity: item.quantity || '1',
            price: item.price || 4.50,
            category: item.category as Category || categorizeItem(item.name),
            checked: false,
            store: item.store || (newItemStore === 'Any Store' ? undefined : newItemStore),
            source: 'Bulk Import'
        }));
        setItems(prev => [...newItems, ...prev]);
        setBulkText('');
        setIsBulkAdding(false);
    } catch (e) { alert("Failed to parse manifest."); }
    finally { setIsProcessingBulk(false); }
  };

  const handleManualAdd = () => {
      if (!manualItem.name.trim()) return;
      
      const newItem: ShoppingItem = {
          id: Date.now().toString() + Math.random(),
          name: manualItem.name,
          quantity: manualItem.quantity || '1',
          price: parseFloat(manualItem.price) || 0,
          category: manualItem.category as Category,
          checked: false,
          store: manualItem.store === 'Any Store' ? undefined : manualItem.store,
          source: 'Manual Entry'
      };
      setItems(prev => [newItem, ...prev]);
      setManualItem({ name: '', quantity: '1', price: '', category: 'Pantry', store: 'Any Store' });
      setIsManualAdding(false);
  };

  const handleChatPlan = async () => {
    if (!chatInput.trim()) return;
    if (onConsumeGeneration && !onConsumeGeneration()) return; 

    setStatus('loading');
    setErrorMessage('');
    try {
        const result = await processChefChatPlan(pantryItems, chatInput, preferences || {} as UserPreferences);
        
        if (result.plans && result.plans.length > 0) {
           setCulinaryConcepts(result.plans.map((p: any) => ({
               title: p.concept,
               description: p.description,
               missingItems: p.items || [],
               fullRecipe: p.fullRecipe,
               groundingLinks: p.groundingLinks
           })));
           setStatus('reveal');
        } else {
           setStatus('idle');
           setErrorMessage("COULDN'T GENERATE A VALID PLAN. TRY ADDING MORE DETAILS TO YOUR REQUEST.");
        }
    } catch (err) { 
        console.error("Plan generation error:", err);
        setStatus('idle');
        setErrorMessage("SERVICE INTERRUPTION. PLEASE TRY AGAIN IN A MOMENT.");
    }
  };

  const openConceptDetail = async (index: number) => {
    setActiveConceptIndex(index);
    const concept = culinaryConcepts[index];
    if (!concept.imageUrl) {
        setIsGeneratingConceptImage(true);
        try {
            const imgData = await generateRecipeImage(concept.title, concept.fullRecipe.ingredients, preferences?.householdSize || 2);
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

  const saveConceptToRecipes = (index: number) => {
    const concept = culinaryConcepts[index];
    const newRecipe: Recipe = {
        id: `concept-${Date.now()}-${index}`,
        title: concept.title,
        description: concept.description,
        ingredients: concept.fullRecipe.ingredients,
        instructions: concept.fullRecipe.instructions,
        timeMinutes: 45,
        difficulty: 'Medium',
        calories: 450,
        missingIngredients: concept.missingItems.map(i => i.name),
        matchScore: 100,
        imageUrl: concept.imageUrl,
        groundingLinks: concept.groundingLinks
    };
    onAddRecipe(newRecipe);
    alert(`"${concept.title}" saved to My Recipes.`);
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

  const syncToInstacart = () => {
    if (items.length === 0) {
        alert("Your cart is empty. Add items before syncing to Instacart.");
        return;
    }
    // Instacart partner recipes format: ingredients[]=item1&ingredients[]=item2
    const params = items.map(i => `ingredients[]=${encodeURIComponent(i.name)}`).join('&');
    const url = `https://www.instacart.com/store/partner_recipes?${params}`;
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

  return (
    <div className="animate-fade-in pb-48 md:pb-32 max-w-5xl mx-auto px-4 lg:px-0 pt-20 md:pt-32 min-h-screen relative">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary-500/5 blur-[120px] pointer-events-none -z-10"></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-10 mb-6 md:mb-16 px-2">
        <div className="space-y-2 md:space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-500 rounded-lg text-white shadow-lg shadow-primary-500/20">
               <ShoppingBag size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">Supply Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white font-serif tracking-tighter italic leading-none">
            The <span className="text-primary-500">Cart.</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto mt-6 md:mt-0">
            <div className="bg-[#1a1f2e]/80 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 shadow-xl border border-white/5 w-full md:w-auto" id="cart-view-toggles">
                <button 
                  onClick={() => setActiveView('cart')}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeView === 'cart' ? 'bg-primary-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <ShoppingCart size={16} /> Active Cart
                </button>
                <button 
                  onClick={() => setActiveView('history')}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeView === 'history' ? 'bg-primary-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <History size={16} /> Saved History
                </button>
            </div>
            {items.length > 0 && activeView === 'cart' && (
            <div className="bg-[#1a1f2e]/80 backdrop-blur-md border border-white/5 p-3 md:p-5 rounded-2xl shadow-xl flex items-center gap-4 w-full md:w-auto min-w-[140px]">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center relative shrink-0 border border-emerald-500/20">
                      <Tag size={18} className="text-emerald-500" />
                  </div>
                  <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Estimated Total</p>
                      <p className="text-xl font-black text-white leading-none tracking-tight">${cartStats.totalValue.toFixed(2)}</p>
                  </div>
              </div>
            )}
        </div>
      </div>

      {activeView === 'cart' ? (
        <div className="space-y-8 md:space-y-6">
            {/* COLLAPSIBLE BUILDER SECTION */}
            <div
              className={`bg-[#0c1220] rounded-3xl md:rounded-[2.5rem] border border-white/5 shadow-2xl relative transition-all duration-500 w-full max-w-xl mx-auto md:mx-0 overflow-hidden group ${
                status === 'idle' && !isBuilderExpanded ? 'p-4 md:p-8' : 'p-5 md:p-10'
              }`}
              id="orchestrate-manifest-section"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/10 transition-colors duration-700"></div>
                <div className="relative z-10">
                    {status === 'idle' && (
                        <div className="animate-fade-in space-y-4 md:space-y-6">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2.5 md:p-3 bg-primary-500 rounded-full text-slate-950 border border-primary-500/20 shadow-lg">
                                    <ChefHat size={20} className="md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] mb-1">Build your shopping list</h2>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold italic leading-tight">"Tell the chef what you need. Try '5 dinners' or '5 dinners for under $20 each not using my pantry'."</p>
                                </div>
                            </div>

                            <div className="relative flex bg-[#1a1f2e] border border-white/10 rounded-full overflow-hidden shadow-inner focus-within:border-primary-500/50 transition-all group/input" id="cart-chat-input">
                                <input 
                                    type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                    placeholder="e.g. 5 dinners for under $"
                                    className="flex-1 bg-transparent px-6 py-5 outline-none text-white font-bold text-sm placeholder:text-slate-500 placeholder:italic min-w-0"
                                    onKeyDown={e => e.key === 'Enter' && handleChatPlan()}
                                />
                                <div className="p-1.5 md:p-2 flex items-center">
                                    <button onClick={handleChatPlan} className="w-10 h-10 md:w-12 md:h-12 bg-primary-500 rounded-full flex items-center justify-center text-slate-950 hover:scale-105 transition-all shrink-0 shadow-lg group-focus-within/input:shadow-primary-500/20">
                                        <Send size={18} className="md:w-5 md:h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            {errorMessage && (
                                <div className="flex items-center justify-center gap-3 p-4 bg-rose-950/30 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in">
                                    <AlertCircle size={16} className="shrink-0" /> {errorMessage}
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="py-24 text-center animate-fade-in flex flex-col items-center">
                            <Loader2 size={40} className="animate-spin text-primary-500 mb-6" />
                            <h4 className="text-white font-black uppercase tracking-[0.4em] text-xs">AI IS DESIGNING MANIFEST...</h4>
                        </div>
                    )}

                    {status === 'reveal' && culinaryConcepts.length > 0 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-white font-serif uppercase tracking-tight italic">Proposed Concepts ({culinaryConcepts.length})</h3>
                                <button onClick={() => { setStatus('idle'); setCulinaryConcepts([]); }} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {culinaryConcepts.map((concept, index) => (
                                    <div key={index} className="p-6 rounded-[2rem] bg-[#0c1220] border border-white/10 shadow-xl flex flex-col h-full hover:border-primary-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-black font-serif text-white italic tracking-tighter uppercase">{concept.title}</h3>
                                            <button 
                                                onClick={() => saveConceptToRecipes(index)}
                                                className="p-2 text-slate-500 hover:text-rose-500 bg-white/5 rounded-lg transition-colors"
                                                title="Save to Recipes"
                                            >
                                                <Heart size={16} />
                                            </button>
                                        </div>
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

            {/* MAIN SHOPPING LIST ACTIONS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-3 mt-12 md:mt-0 bg-transparent md:bg-slate-900/30 md:p-2 md:rounded-2xl md:border md:border-white/5 md:backdrop-blur-sm">
                <div className="flex items-center bg-[#1a1f2e] md:bg-[#0c1220] p-1 md:p-0.5 rounded-full border border-white/5 md:border-white/10 shadow-inner">
                    <button onClick={() => setViewGrouping('category')} className={`px-6 md:px-3 py-2.5 md:py-2 rounded-full text-[10px] md:text-[9px] font-black uppercase tracking-widest transition-all ${viewGrouping === 'category' ? 'bg-[#0c1220] md:bg-primary-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>CATEGORY</button>
                    <button onClick={() => setViewGrouping('store')} className={`px-6 md:px-3 py-2.5 md:py-2 rounded-full text-[10px] md:text-[9px] font-black uppercase tracking-widest transition-all ${viewGrouping === 'store' ? 'bg-[#0c1220] md:bg-primary-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>STORE</button>
                </div>
                
                <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto max-w-[360px] md:max-w-none">
                    <button id="cart-walmart-sync" onClick={() => syncToWalmart()} className="col-span-2 md:col-span-1 flex-1 md:flex-none px-6 md:px-5 py-4 md:py-3 bg-[#0071ce] text-white rounded-xl font-black text-[10px] md:text-[9px] uppercase tracking-widest hover:bg-[#005fb0] transition-all flex items-center justify-center gap-2 shadow-lg md:shadow-md whitespace-nowrap">
                         WALMART SYNC <ExternalLink size={14} className="md:w-3 md:h-3" />
                    </button>
                    <button onClick={() => setIsManualAdding(true)} className="col-span-2 md:col-span-1 flex-1 md:flex-none px-6 md:px-5 py-4 md:py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] md:text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg md:shadow-md whitespace-nowrap">
                         <Plus size={16} className="md:w-3.5 md:h-3.5" /> ADD ITEMS
                    </button>
                </div>
            </div>

            {/* SHOPPING LIST CONTENT */}
            <div className="space-y-12 pb-64">
                {sortedCategories.map(group => {
                    const groupItems = groupedItems[group];
                    const groupTotal = groupItems.reduce((sum, item) => sum + ((item.price || 0) * parseQuantityValue(item.quantity).num), 0);
                    return (
                        <div key={group} className="space-y-6">
                            <div className="flex justify-between items-end px-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">{group}</h3>
                                <span className="text-[9px] font-black text-slate-600 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">${groupTotal.toFixed(2)}</span>
                            </div>
                            <div className="grid gap-4 md:gap-6">
                                {groupItems.map(item => (
                                    <div key={item.id} className="bg-[#0c1220] border border-white/5 p-5 md:p-6 rounded-[2rem] flex items-center justify-between shadow-xl group/item hover:border-primary-500/20 transition-all gap-4 md:gap-6">
                                        <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                                            <button 
                                                onClick={() => toggleCheck(item.id)}
                                                className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-slate-700 hover:border-primary-500'}`}
                                            >
                                                {item.checked && <Check size={16} strokeWidth={3} />}
                                            </button>
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                <h4 className={`font-black text-sm md:text-lg uppercase tracking-tight italic truncate ${item.checked ? 'text-slate-600 line-through' : 'text-white'}`}>{item.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{item.quantity}</span>
                                                    <span className="text-slate-700">•</span>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${STORE_OPTIONS.find(s => s.name === item.store)?.color || 'bg-slate-800 text-slate-400'}`}>
                                                        {item.store || 'Standard Store'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-6 shrink-0">
                                            <div className="flex items-center gap-2 md:gap-3 bg-slate-900 p-1.5 md:p-2 rounded-xl border border-white/5 shadow-inner">
                                                <button onClick={() => adjustQuantity(item.id, -1)} className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors"><Minus size={14} className="md:w-4 md:h-4"/></button>
                                                <span className="text-xs md:text-sm font-black text-white px-2 md:px-3 min-w-[20px] text-center">{parseQuantityValue(item.quantity).num}</span>
                                                <button onClick={() => adjustQuantity(item.id, 1)} className="p-1.5 text-slate-500 hover:text-emerald-500 transition-colors"><Plus size={14} className="md:w-4 md:h-4"/></button>
                                            </div>
                                            <span className="text-[10px] md:text-xs font-black text-slate-400 w-12 md:w-16 text-right">
                                                ${((item.price || 0) * parseQuantityValue(item.quantity).num).toFixed(2)}
                                            </span>
                                            <button onClick={() => deleteItem(item.id)} className="p-2 md:p-3 text-slate-700 hover:text-rose-500 md:opacity-0 md:group-hover/item:opacity-100 transition-all"><Trash2 size={18} className="md:w-5 md:h-5"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {items.length > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-[320px] px-4 animate-slide-up">
                    <button 
                        onClick={onPlaceOrder}
                        className="w-full py-6 bg-white text-slate-950 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 ring-4 ring-black/10"
                    >
                        Place Order <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
      ) : (
        <div className="space-y-6">
            {orderHistory.length === 0 ? (
                <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
                    <History size={48} className="mx-auto mb-6 text-slate-800" />
                    <h3 className="text-2xl font-black font-serif text-white italic uppercase tracking-tighter">No History Yet.</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Your archived manifests will appear here.</p>
                </div>
            ) : (
                orderHistory.map(order => (
                    <div key={order.id} className="bg-[#0c1220] border border-white/5 rounded-[2.5rem] p-8 shadow-sm group">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{order.date}</span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>{order.status}</span>
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tight italic font-serif">Manifest #{order.id.slice(-6).toUpperCase()}</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{order.items.length} Items Logged</p>
                            </div>
                            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                <span className="text-3xl font-black text-white font-serif tracking-tighter">${order.total.toFixed(2)}</span>
                                <button onClick={() => onReorder(order.items)} className="px-6 py-2.5 bg-white/5 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-500 transition-all shadow-sm border border-white/10">Restore Manifest</button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      )}

      {/* MANUAL ADD MODAL */}
      {isManualAdding && (
          <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/95 backdrop-blur-md">
              <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                  <div className="relative bg-[#0c1220] w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10 animate-slide-up text-left my-8">
                      <div className="flex justify-between items-center mb-8">
                          <h2 className="text-2xl md:text-3xl font-black font-serif text-white italic tracking-tighter uppercase">New Item.</h2>
                          <button onClick={() => setIsManualAdding(false)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors"><X size={28}/></button>
                      </div>
                      <div className="space-y-6">
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Item Name</label>
                              <input 
                                type="text" 
                                value={manualItem.name} 
                                onChange={e => setManualItem({...manualItem, name: e.target.value})} 
                                placeholder="e.g. Almond Milk" 
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 outline-none font-bold text-white focus:border-primary-500 transition-all"
                                autoFocus
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Quantity</label>
                                  <input 
                                    type="text" 
                                    value={manualItem.quantity} 
                                    onChange={e => setManualItem({...manualItem, quantity: e.target.value})} 
                                    placeholder="e.g. 1 gallon" 
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 outline-none font-bold text-white focus:border-primary-500 transition-all"
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Est. Price ($)</label>
                                  <input 
                                    type="number" 
                                    value={manualItem.price} 
                                    onChange={e => setManualItem({...manualItem, price: e.target.value})} 
                                    placeholder="0.00" 
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 outline-none font-bold text-white focus:border-primary-500 transition-all"
                                  />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Category</label>
                                  <select 
                                    value={manualItem.category} 
                                    onChange={e => setManualItem({...manualItem, category: e.target.value})} 
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 outline-none font-bold text-white focus:border-primary-500 transition-all appearance-none"
                                  >
                                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Store</label>
                                  <select 
                                    value={manualItem.store} 
                                    onChange={e => setManualItem({...manualItem, store: e.target.value})} 
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 outline-none font-bold text-white focus:border-primary-500 transition-all appearance-none"
                                  >
                                      {STORE_OPTIONS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                  </select>
                              </div>
                          </div>

                          <button 
                            onClick={handleManualAdd}
                            disabled={!manualItem.name.trim()}
                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                          >
                            <Plus size={18} /> Add to Manifest
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* BULK ADD MODAL */}
      {isBulkAdding && (
          <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/95 backdrop-blur-md">
              <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                  <div className="relative bg-[#0c1220] w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10 animate-slide-up text-left my-8">
                      <div className="flex justify-between items-center mb-8">
                          <h2 className="text-2xl md:text-3xl font-black font-serif text-white italic tracking-tighter uppercase">Quick Import.</h2>
                          <button onClick={() => setIsBulkAdding(false)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors"><X size={28}/></button>
                      </div>
                      <div className="space-y-6">
                          <textarea 
                            value={bulkText} 
                            onChange={e => setBulkText(e.target.value)} 
                            placeholder="e.g. 2 packs of eggs, organic milk, 3lb beef..." 
                            className="w-full h-48 bg-slate-900 border border-white/10 rounded-2xl p-6 outline-none font-bold text-white focus:border-primary-500 transition-all resize-none shadow-inner" 
                          />
                          <button 
                            onClick={handleBulkAdd}
                            disabled={isProcessingBulk || !bulkText.trim()}
                            className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            {isProcessingBulk ? <Loader2 className="animate-spin" size={18} /> : <ClipboardList size={18} />}
                            {isProcessingBulk ? 'Processing Intelligence...' : 'Populate Manifest'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CONCEPT DETAIL MODAL */}
      {activeConceptIndex !== null && culinaryConcepts[activeConceptIndex] && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 md:p-6 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-3xl rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 animate-slide-up flex flex-col max-h-[95vh]">
                  <div className="relative h-64 md:h-[420px] bg-slate-900 flex items-center justify-center border-b border-white/5 overflow-hidden group/modalimg">
                      {culinaryConcepts[activeConceptIndex].imageUrl ? (
                          <img src={culinaryConcepts[activeConceptIndex].imageUrl} className="w-full h-full object-cover transition-transform duration-[8s] group-hover/modalimg:scale-110" alt="" />
                      ) : (
                          <div className="flex flex-col items-center gap-4">
                              {isGeneratingConceptImage ? <Loader2 size={32} className="animate-spin text-primary-500" /> : <Utensils size={48} className="text-slate-800" />}
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isGeneratingConceptImage ? 'Neural Rendering...' : 'No Visuals'}</span>
                          </div>
                      )}
                      <button onClick={() => setActiveConceptIndex(null)} className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-all z-20"><X size={20}/></button>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-transparent to-transparent opacity-60"></div>
                  </div>
                  <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-start gap-4">
                          <div>
                              <h2 className="text-3xl font-black font-serif text-white italic tracking-tighter uppercase">{culinaryConcepts[activeConceptIndex].title}</h2>
                              <p className="text-slate-400 text-sm mt-2 italic">"{culinaryConcepts[activeConceptIndex].description}"</p>
                          </div>
                          <button 
                            onClick={() => saveConceptToRecipes(activeConceptIndex!)}
                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                          >
                            <Heart size={16} fill="currentColor" /> Save
                          </button>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-500 border-b border-white/5 pb-2">Required Supplies</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {culinaryConcepts[activeConceptIndex].missingItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                      <span className="text-xs font-bold text-slate-200">{item.name}</span>
                                      <span className="text-[10px] text-slate-500 font-black">${(item.price || 5.00).toFixed(2)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {culinaryConcepts[activeConceptIndex].fullRecipe && (
                          <div className="space-y-6 pt-4 border-t border-white/5">
                              <div className="space-y-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-500 flex items-center gap-2">
                                      <Utensils size={12}/> Ingredients
                                  </h4>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {culinaryConcepts[activeConceptIndex].fullRecipe.ingredients?.map((ing, i) => (
                                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                              <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                                              {ing}
                                          </li>
                                      ))}
                                  </ul>
                              </div>

                              <div className="space-y-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-500 flex items-center gap-2">
                                      <FileText size={12}/> Instructions
                                  </h4>
                                  <div className="space-y-3">
                                      {culinaryConcepts[activeConceptIndex].fullRecipe.instructions?.map((step, i) => (
                                          <div key={i} className="flex gap-3 text-xs text-slate-300">
                                              <span className="font-black text-slate-500 shrink-0 mt-0.5">0{i + 1}</span>
                                              <p className="leading-relaxed">{step}</p>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 pt-4">
                          <button onClick={() => scheduleConcept(activeConceptIndex!)} className="py-5 bg-primary-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-primary-500 active:scale-95 transition-all">
                              <Calendar size={18}/> Schedule Plan
                          </button>
                          <button onClick={() => commitToCart(activeConceptIndex!)} className="py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                              <ShoppingCart size={18}/> Commit to Cart
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