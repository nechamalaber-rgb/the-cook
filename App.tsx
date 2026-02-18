
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Calendar as CalendarIcon, X, Crown, Info, MessageSquarePlus, ShieldCheck, UserPlus, HelpCircle, Layers, ClipboardList, CreditCard, AlertCircle, Loader2, User, LogOut, ChevronDown, UserCircle, Zap } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate, HashRouter } from 'react-router-dom';
import { Logo } from './components/Logo';
import { Ingredient, ShoppingItem, UserPreferences, Category, Recipe, Pantry, MealLog, RecipeGenerationOptions, Order, OrderStatus } from './types';
import SignInView from './components/SignInView';
import ChefChat from './components/ChefChat';
import DashboardView from './components/DashboardView';
import PantryView from './components/PantryView';
import RecipeView from './components/RecipeView';
import ShoppingListView from './components/ShoppingListView';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import AboutView from './components/AboutView';
import PlansView from './components/PlansView';
import PaymentSuccessView from './components/PaymentSuccessView';
import { Walkthrough } from './components/Walkthrough';
import { generateSingleSmartRecipe, generateRecipeImage } from './services/geminiService';
import { autoCategorize, parseQuantityValue, mergeQuantities } from './utils';
import { supabase, getUserProfile } from './services/supabase';
import { Session } from '@supabase/supabase-js';

const DEFAULT_INITIAL_ITEMS: Ingredient[] = [
    { id: 'init-chicken', name: '2 Chicken Breasts (halved and pounded thin)', category: Category.MEAT, quantity: '2 lbs', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-pretzel', name: 'Pretzel Buns', category: Category.BAKERY, quantity: '4 Units', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-panko', name: 'Kosher Panko Breadcrumbs', category: Category.PANTRY, quantity: '1 Box', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-eggs', name: 'Large Eggs', category: Category.DAIRY, quantity: '6 Units', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-flour', name: 'All-Purpose Flour', category: Category.PANTRY, quantity: '2 lbs', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-oil', name: 'Vegetable Oil', category: Category.PANTRY, quantity: '1 Bottle', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-onions', name: 'Yellow Onions', category: Category.PRODUCE, quantity: '2 Units', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-lettuce', name: 'Romaine Lettuce', category: Category.PRODUCE, quantity: '1 Head', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-pickles', name: 'Kosher Dill Pickles', category: Category.PANTRY, quantity: '1 Jar', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-mayo', name: 'Kosher Mayonnaise (Pareve)', category: Category.PANTRY, quantity: '1 Jar', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-mustard', name: 'Dijon Mustard', category: Category.PANTRY, quantity: '1 Jar', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-honey', name: 'Honey', category: Category.PANTRY, quantity: '1 Unit', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-spices', name: 'Garlic Powder and Smoked Paprika', category: Category.PANTRY, quantity: '1 Set', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' }
];

const DEFAULT_PREFS: UserPreferences = {
  darkMode: true, 
  themeColor: 'classic',
  isProMember: false, 
  subscriptionTier: 'none',
  dailyUsage: { date: new Date().toISOString().split('T')[0], count: 0 },
  dietaryRestrictions: [],
  cuisinePreferences: ['American', 'Healthy'],
  allergies: [],
  appliances: ['Oven', 'Stove', 'Air Fryer'],
  skillLevel: 'Intermediate',
  strictness: 'Strict',
  isKosher: true,
  healthGoal: 'Maintain',
  nutritionalGoals: { maxCaloriesPerMeal: '800', minProteinPerMeal: '30' },
  measurementSystem: 'Imperial',
  emailNotifications: true,
  recipeUpdateNotifications: true,
  promotionNotifications: false,
  spiceLevel: 'Medium',
  budget: 'Moderate',
  blacklist: [],
  householdSize: 2,
  chefPersonality: 'Strict',
  onboardingCompleted: false,
  personalTasteBio: 'I appreciate fresh produce and efficient meals.',
  cookingStyle: 'simple',
  freeGenerationsUsed: 0
};

interface PrepzuShellProps {
    session: Session | null;
}

const PrepzuShell: React.FC<PrepzuShellProps> = ({ session }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentUserEmail = session?.user?.email || null;
  const currentUserId = session?.user?.id || null;
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [pantries, setPantries] = useState<Pantry[]>([{ id: 'default', name: 'Main Kitchen', items: DEFAULT_INITIAL_ITEMS }]);
  const [activePantryId, setActivePantryId] = useState<string>('default');
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealHistory, setMealHistory] = useState<MealLog[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [cookingStep, setCookingStep] = useState(0);
  const [recipeTab, setRecipeTab] = useState<'discover' | 'saved'>('discover');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
        const userKey = currentUserEmail ? currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_') : 'guest';
        const prefix = `ks_user_${userKey}_`;

        const safeParse = (key: string, fallback: any) => {
            try {
                const item = localStorage.getItem(key);
                if (!item || item === 'undefined' || item === 'null') return fallback;
                return JSON.parse(item);
            } catch { return fallback; }
        };

        const localPantries = safeParse(`${prefix}pantries`, [{ id: 'default', name: 'Main Kitchen', items: DEFAULT_INITIAL_ITEMS }]);
        const localPrefs = safeParse(`${prefix}prefs`, DEFAULT_PREFS);
        const localShopping = safeParse(`${prefix}shopping`, []);
        const localOrders = safeParse(`${prefix}orders`, []);
        const localRecipes = safeParse(`${prefix}recipes`, []);
        const localHistory = safeParse(`${prefix}history`, []);

        if (localPantries && localPantries.length > 0) setPantries(localPantries);
        if (localPrefs) setPreferences({ ...DEFAULT_PREFS, ...localPrefs, darkMode: true });
        if (localShopping) setShoppingList(localShopping);
        if (localOrders) setOrderHistory(localOrders);
        if (localRecipes) setSavedRecipes(localRecipes);
        if (localHistory) setMealHistory(localHistory);
        
        if (localPantries.length > 0) setActivePantryId(localPantries[0].id);

        if (currentUserId) {
            try {
                const { data: profile } = await getUserProfile(currentUserId);
                if (profile) {
                    setPreferences(prev => ({
                        ...prev,
                        userName: profile.full_name || prev.userName,
                        isProMember: profile.is_pro_member,
                        subscriptionTier: profile.subscription_tier,
                        freeGenerationsUsed: profile.free_generations_used || 0
                    }));
                }
            } catch (e) {
                console.warn("Cloud sync failed", e);
            }
        }
    };
    loadData();
  }, [currentUserEmail, currentUserId]);

  useEffect(() => {
    const userKey = currentUserEmail ? currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_') : 'guest';
    const prefix = `ks_user_${userKey}_`;
    
    try {
        localStorage.setItem(`${prefix}pantries`, JSON.stringify(pantries));
        localStorage.setItem(`${prefix}shopping`, JSON.stringify(shoppingList));
        localStorage.setItem(`${prefix}orders`, JSON.stringify(orderHistory));
        localStorage.setItem(`${prefix}recipes`, JSON.stringify(savedRecipes));
        localStorage.setItem(`${prefix}history`, JSON.stringify(mealHistory));
        localStorage.setItem(`${prefix}prefs`, JSON.stringify(preferences));
    } catch (e) {
        console.warn("Local storage full", e);
    }
  }, [pantries, shoppingList, orderHistory, savedRecipes, mealHistory, preferences, currentUserEmail]);

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('ks_onboarding_v3_seen') === 'true';
    if (!hasSeenWalkthrough && !showWalkthrough) {
        const timer = setTimeout(() => setShowWalkthrough(true), 1500);
        return () => clearTimeout(timer);
    }
  }, [showWalkthrough]);

  const activePantry = useMemo(() => {
    return pantries.find(p => p.id === activePantryId) || { id: 'default', name: 'Main Kitchen', items: [] };
  }, [pantries, activePantryId]);

  const handleConsumeGeneration = (): boolean => {
    if (preferences.isProMember) return true;
    const used = preferences.freeGenerationsUsed || 0;
    if (used >= 3) {
        showToast("Free trial limit reached. Please upgrade.", 'info');
        navigate('/plans');
        return false;
    }
    const nextCount = used + 1;
    setPreferences(prev => ({ ...prev, freeGenerationsUsed: nextCount }));
    return true;
  };

  const handleSignOut = async () => { 
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    navigate('/pantry');
    showToast("Logged out successfully.");
  };
  
  const setActivePantryItems: React.Dispatch<React.SetStateAction<Ingredient[]>> = (value) => { 
    setPantries(prev => prev.map(p => { 
        if (p.id === activePantryId) return { ...p, items: typeof value === 'function' ? (value as any)(p.items) : value }; 
        return p; 
    })); 
  };

  const handleAddPantry = (name: string) => { 
    const newPantry: Pantry = { id: Date.now().toString(), name, items: [] }; 
    setPantries(prev => [...prev, newPantry]); 
    setActivePantryId(newPantry.id); 
  };

  const addMissingToShopping = (items: string[]) => { 
    const newItems: ShoppingItem[] = items.map(name => ({
        id: Math.random().toString(),
        name: name,
        category: autoCategorize(name),
        checked: false,
        price: 5.99 
    }));
    setShoppingList(prev => [...newItems, ...prev]); 
    showToast(`${items.length} items added to cart`);
  };

  const handleMoveToPantry = (item: ShoppingItem) => {
    setPantries(prev => prev.map(p => {
        if (p.id !== activePantryId) return p;
        const existing = p.items.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
            return {
                ...p,
                items: p.items.map(i => i.id === existing.id 
                    ? { ...i, quantity: mergeQuantities(i.quantity, item.quantity || '1 unit') } 
                    : i
                )
            };
        }
        const newPantryItem: Ingredient = {
          id: Date.now().toString() + Math.random(),
          name: item.name,
          category: item.category === Category.OTHER ? autoCategorize(item.name) : item.category as Category,
          quantity: item.quantity || '1 unit',
          addedDate: new Date().toISOString().split('T')[0]
        };
        return { ...p, items: [newPantryItem, ...p.items] };
    }));
  };

  const handleCompleteOrder = () => {
    if (shoppingList.length === 0) return;
    const totalPrice = shoppingList.reduce((acc, item) => acc + ((item.price || 0) * parseQuantityValue(item.quantity).num), 0);
    const order: Order = {
        id: `ord-` + Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        total: totalPrice,
        items: [...shoppingList],
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    shoppingList.forEach(handleMoveToPantry);
    setOrderHistory(prev => [order, ...prev]);
    setShoppingList([]);
    showToast("Items moved to pantry.");
  };

  const handleUpdateOrderStatus = (id: string, status: OrderStatus) => {
      setOrderHistory(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleReorder = (items: ShoppingItem[]) => {
    const freshItems = items.map(i => ({ ...i, id: Math.random().toString(), checked: false }));
    setShoppingList(prev => [...prev, ...freshItems]);
    showToast(`Reordered ${items.length} items.`);
    navigate('/shopping');
  };

  const handleGenerateRecipes = async (options: RecipeGenerationOptions) => {
    setIsGeneratingRecipes(true);
    setGeneratedRecipes([]); 
    const targetCount = options.recipeCount || 4; 
    let currentBatchTitles: string[] = [];

    try {
      for (let i = 0; i < targetCount; i++) {
          try {
            const recipe = await generateSingleSmartRecipe(activePantry.items, preferences, {
                ...options,
                recipeCount: 1,
                excludeTitles: currentBatchTitles
            }, i);
            
            if (recipe && recipe.title) {
              currentBatchTitles.push(recipe.title);
              setGeneratedRecipes(prev => [...prev, recipe]);

              if (i < 2) {
                  generateRecipeImage(recipe.title, recipe.ingredients, recipe.servings).then(imgData => {
                      if (imgData) {
                          const updatedRecipe = { ...recipe, imageUrl: `data:image/png;base64,${imgData}` };
                          setGeneratedRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
                      }
                  }).catch(e => console.warn("Background visual failed", e));
              }
            }
          } catch (recipeErr) {
            console.warn("One synthesis slot failed", recipeErr);
          }
      }
    } catch (e) {
      showToast("Critical synthesis failure", 'error');
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const handleLogMeal = (recipe: Recipe) => {
    const newLog: MealLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: recipe.mealType || 'Dinner',
      recipeTitle: recipe.title,
      recipeId: recipe.id,
      calories: recipe.calories,
      status: 'completed'
    };
    setMealHistory(prev => [newLog, ...prev]);
    showToast("Meal logged");
  };

  const handleScheduleMeal = (recipe: Recipe, date: string, mealType: string) => {
    const newLog: MealLog = {
      id: Date.now().toString(), date, time: '19:00', mealType: mealType as any,
      recipeTitle: recipe.title, recipeId: recipe.id, calories: recipe.calories, status: 'planned'
    };
    setMealHistory(prev => [newLog, ...prev]);
    showToast(`Scheduled: ${recipe.title}`);
  };

  const handleToggleSave = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      if (exists) return prev.filter(r => r.id !== recipe.id);
      return [recipe, ...prev];
    });
  };

  const handleUpdateRecipe = (recipeId: string, updatedData: Partial<Recipe>) => {
    setGeneratedRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, ...updatedData } : r));
    setSavedRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, ...updatedData } : r));
    if (activeRecipe?.id === recipeId) setActiveRecipe(prev => prev ? { ...prev, ...updatedData } : null);
  };

  const completeWalkthrough = () => {
      localStorage.setItem('ks_onboarding_v3_seen', 'true');
      setShowWalkthrough(false);
      const updatedPrefs = { ...preferences, onboardingCompleted: true };
      setPreferences(updatedPrefs);
      navigate('/pantry', { replace: true });
  };

  const handleRestartWalkthrough = () => {
      localStorage.removeItem('ks_onboarding_v3_seen');
      setShowWalkthrough(true);
      navigate('/pantry');
  };

  return (
    <div className="min-h-screen bg-[#090e1a] font-sans flex flex-col overflow-x-hidden">
      <Walkthrough show={showWalkthrough} onComplete={completeWalkthrough} />
      
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#090e1a]/90 border-b border-slate-800/50 z-[100] flex items-center justify-between px-4 md:px-8 backdrop-blur-xl">
          <div onClick={() => navigate('/pantry')} className="flex items-center gap-2.5 cursor-pointer group shrink-0">
            <div className="p-1.5 bg-primary-500 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg"><Logo className="w-7 h-7" /></div>
            <span className="font-serif font-black text-xl text-white tracking-tighter leading-none hidden sm:inline">Prepzu</span>
          </div>
          <nav className="flex items-center gap-1 md:gap-2">
              <NavLink to="/pantry" id="nav-inventory" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><HomeIcon size={20} className="md:hidden" /><span className="hidden md:inline">Pantry</span></NavLink>
              <NavLink to="/studio" id="nav-studio" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><Sparkles size={20} className="md:hidden" /><span className="hidden md:inline">Recipes</span></NavLink>
              <NavLink to="/calendar" id="nav-calendar" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><CalendarIcon size={20} className="md:hidden" /><span className="hidden md:inline">Planner</span></NavLink>
              <NavLink to="/shopping" id="nav-cart" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><ShoppingBag size={20} className="md:hidden" /><span className="hidden md:inline">Cart</span></NavLink>
          </nav>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {currentUserEmail ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-slate-900/50 hover:bg-slate-900 border border-white/5 rounded-2xl transition-all group"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] font-black text-white truncate max-w-[120px]">{currentUserEmail}</p>
                      <p className="text-[8px] font-bold text-primary-500 uppercase tracking-widest">{preferences.isProMember ? 'Pro Chef' : 'Guest Chef'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                      {preferences.isProMember ? <Crown size={14} /> : <User size={14} />}
                    </div>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute top-14 right-0 w-64 bg-[#0c1220] border border-white/10 rounded-3xl shadow-2xl z-[150] overflow-hidden p-2 animate-slide-up ring-1 ring-white/5 backdrop-blur-xl">
                      <div className="p-4 border-b border-white/5 mb-2 sm:hidden">
                        <p className="text-xs font-black text-white truncate">{currentUserEmail}</p>
                        <p className="text-[9px] font-bold text-primary-500 uppercase tracking-widest mt-1">{preferences.isProMember ? 'Pro Access' : 'Standard Access'}</p>
                      </div>

                      <button onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 text-[11px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-left group">
                        <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-primary-500 group-hover:text-white transition-colors"><UserCircle size={16} /></div>
                        Profile View
                      </button>

                      <button onClick={() => { navigate('/plans'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 text-[11px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-left group">
                        <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors"><CreditCard size={16} /></div>
                        Upgrade Plans
                      </button>

                      <button onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 text-[11px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-left group">
                        <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-slate-700 group-hover:text-white transition-colors"><Settings size={16} /></div>
                        Studio Settings
                      </button>

                      <div className="h-px bg-white/5 my-2" />

                      <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 text-[11px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all text-left group">
                        <div className="p-2 bg-rose-500/10 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors"><LogOut size={16} /></div>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button id="nav-signup-btn" onClick={() => { setAuthModalMode('signup'); setIsAuthModalOpen(true); }} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all whitespace-nowrap"><UserPlus size={14} /> Join Free</button>
              )}
          </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 pb-20 md:px-6 md:pb-24 lg:px-12 pt-32 flex-1 w-full flex flex-col relative animate-fade-in">
        <Routes>
            <Route path="/" element={<Navigate to="/pantry" replace />} />
            <Route path="/pantry" element={<PantryView pantries={pantries} activePantryId={activePantryId} setActivePantryId={setActivePantryId} onAddPantry={handleAddPantry} items={activePantry.items} setItems={setActivePantryItems} onConsumeGeneration={handleConsumeGeneration} />} />
            <Route path="/studio" element={<DashboardView pantryItems={activePantry.items} mealHistory={mealHistory} preferences={preferences} setPreferences={setPreferences} savedRecipes={savedRecipes} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onLogMeal={handleLogMeal} onScheduleMeal={handleScheduleMeal} setActiveRecipe={setActiveRecipe} onToggleSave={handleToggleSave} isGenerating={isGeneratingRecipes} onGenerate={handleGenerateRecipes} onCancelGeneration={() => setIsGeneratingRecipes(false)} onRequireAccess={(a) => true} onAddRecipe={(r) => setSavedRecipes(prev => [r, ...prev])} onAddToShoppingList={addMissingToShopping} onConsumeGeneration={handleConsumeGeneration} />} />
            <Route path="/calendar" element={<CalendarView mealHistory={mealHistory} savedRecipes={savedRecipes} preferences={preferences} pantryItems={activePantry.items} onScheduleMeal={handleScheduleMeal} setMealHistory={setMealHistory} onUpdateMealStatus={(id, status) => setMealHistory(prev => prev.map(m => m.id === id ? {...m, status} : m))} onDeleteMealLog={(id) => setMealHistory(prev => prev.filter(m => m.id !== id))} onAddToShoppingList={addMissingToShopping} setActiveRecipe={setActiveRecipe} onRequireAccess={(a) => true} onConsumeGeneration={handleConsumeGeneration} />} />
            <Route path="/recipes" element={<RecipeView pantryItems={activePantry.items} setPantryItems={setActivePantryItems} preferences={preferences} onAddToShoppingList={addMissingToShopping} savedRecipes={savedRecipes} onToggleSave={handleToggleSave} mealHistory={mealHistory} onLogMeal={handleLogMeal} selectedRecipe={activeRecipe} setSelectedRecipe={setActiveRecipe} cookingMode={isCookingMode} setCookingMode={setIsCookingMode} currentStep={cookingStep} setCurrentStep={setCookingStep} activeTab={recipeTab} setActiveTab={setRecipeTab} onScheduleMeal={handleScheduleMeal} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onUpdateRecipe={handleUpdateRecipe} />} />
            <Route path="/shopping" element={<ShoppingListView items={shoppingList} setItems={setShoppingList} orderHistory={orderHistory} onPlaceOrder={handleCompleteOrder} onReorder={handleReorder} onUpdateOrderStatus={handleUpdateOrderStatus} pantryItems={activePantry.items} preferences={preferences} mealHistory={mealHistory} onRequireAccess={(a) => true} onSavePastOrder={(o) => setOrderHistory(prev => [o, ...prev])} onScheduleMeal={handleScheduleMeal} onConsumeGeneration={handleConsumeGeneration} onAddRecipe={(r) => setSavedRecipes(prev => [r, ...prev])} />} />
            <Route path="/settings" element={<SettingsView preferences={preferences} setPreferences={setPreferences} onSignOut={handleSignOut} showToast={showToast} onRestartWalkthrough={handleRestartWalkthrough} />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/plans" element={<PlansView preferences={preferences} />} />
            <Route path="/success" element={<PaymentSuccessView setPreferences={setPreferences} />} />
        </Routes>
      </main>
      
      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 z-[100] p-3.5 bg-white text-slate-900 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-slate-950"><MessageSquarePlus size={22} /></button>
      <ChefChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} pantryItems={activePantry.items} activeRecipe={activeRecipe} />

      {isAuthModalOpen && (
        <SignInView isModal initialMode={authModalMode} onClose={() => setIsAuthModalOpen(false)} onSignIn={() => setIsAuthModalOpen(false)} />
      )}

      {toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
              <div className={`px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-slate-900 border border-white/10 flex items-center gap-4 text-white`}>
                  {toast.type === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  {toast.type === 'error' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                  {toast.type === 'info' && <div className="w-2 h-2 rounded-full bg-sky-500" />}
                  <span className="text-[11px] font-black uppercase tracking-widest leading-none">{toast.message}</span>
              </div>
          </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
        if (mounted) setIsInitializing(false);
    }, 1500);

    supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) {
            setSession(session);
            setIsInitializing(false);
            clearTimeout(safetyTimer);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
            setSession(session);
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
        clearTimeout(safetyTimer);
    };
  }, []);

  if (isInitializing) {
      return (
          <div className="min-h-screen bg-[#090e1a] flex items-center justify-center flex-col gap-6">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <div className="text-center">
                  <h2 className="text-white font-serif font-black text-2xl italic tracking-tight">Verifying Identity</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Securing Connection...</p>
              </div>
          </div>
      );
  }

  return (
    <HashRouter>
        <PrepzuShell session={session} />
    </HashRouter>
  );
};

export default App;
