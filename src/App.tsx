
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Calendar as CalendarIcon, X, Crown, Info, MessageSquarePlus, ShieldCheck, UserPlus, HelpCircle, Layers, ClipboardList, CreditCard, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Ingredient, ShoppingItem, UserPreferences, Category, Recipe, Pantry, MealLog, RecipeGenerationOptions, Order, OrderStatus } from '../types';
import SignInView from '../components/SignInView';
import ChefChat from '../components/ChefChat';
import DashboardView from '../components/DashboardView';
import PantryView from '../components/PantryView';
import RecipeView from '../components/RecipeView';
import ShoppingListView from '../components/ShoppingListView';
import SettingsView from '../components/SettingsView';
import CalendarView from '../components/CalendarView';
import AboutView from '../components/AboutView';
import PlansView from '../components/PlansView';
import { Walkthrough } from '../components/Walkthrough';
import { generateSingleSmartRecipe, generateRecipeImage } from '../services/geminiService';
import { autoCategorize, parseQuantityValue, mergeQuantities } from './utils';

const DEFAULT_INITIAL_ITEMS: Ingredient[] = [
    { id: 'init-cheese', name: 'Cheese', category: Category.DAIRY, quantity: '1 Unit', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-dough', name: 'Pizza Dough', category: Category.BAKERY, quantity: '1 Unit', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-sauce', name: 'Sauce', category: Category.PANTRY, quantity: '1 Unit', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' }
];

const DEFAULT_PREFS: UserPreferences = {
  darkMode: true, 
  themeColor: 'classic',
  isProMember: false, 
  subscriptionTier: 'none',
  trialUsed: false,
  dailyUsage: { date: new Date().toISOString().split('T')[0], count: 0 },
  dietaryRestrictions: [],
  cuisinePreferences: ['American', 'Healthy'],
  allergies: [],
  appliances: ['Stove', 'Oven', 'Air Fryer'],
  skillLevel: 'Intermediate',
  strictness: 'Strict',
  isKosher: false,
  healthGoal: 'Maintain',
  nutritionalGoals: { maxCaloriesPerMeal: '800', minProteinPerMeal: '30' },
  measurementSystem: 'Imperial',
  emailNotifications: true,
  spiceLevel: 'Medium',
  budget: 'Moderate',
  blacklist: [],
  householdSize: 2,
  chefPersonality: 'Strict',
  generationsCount: 4,
  onboardingCompleted: false,
  activeWalkthroughStep: 0,
  personalTasteBio: 'I appreciate fresh produce and efficient meals.',
  cookingStyle: 'simple',
  freeGenerationsUsed: 0
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => localStorage.getItem('ks_session_email'));
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [pantries, setPantries] = useState<Pantry[]>([]);
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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const user = currentUserEmail || 'guest';
    const prefix = `ks_user_${user.replace(/[^a-zA-Z0-9]/g, '_')}_`;
    const safeParse = (key: string, fallback: any) => {
        try {
            const data = localStorage.getItem(key);
            if (!data || data === 'undefined') return fallback;
            const parsed = JSON.parse(data);
            return parsed === null ? fallback : parsed;
        } catch (e) { return fallback; }
    };

    const initialPantries = safeParse(`${prefix}pantries`, [{ id: 'default', name: 'Main Kitchen', items: DEFAULT_INITIAL_ITEMS }]);
    setPantries(initialPantries);
    const loadedPrefs = safeParse(`${prefix}prefs`, DEFAULT_PREFS);
    setPreferences({ ...DEFAULT_PREFS, ...loadedPrefs, darkMode: true });
    setShoppingList(safeParse(`${prefix}shopping`, []));
    setOrderHistory(safeParse(`${prefix}orders`, []));
    setSavedRecipes(safeParse(`${prefix}recipes`, []));
    setMealHistory(safeParse(`${prefix}history`, []));
    if (initialPantries.length > 0) setActivePantryId(initialPantries[0].id);
  }, [currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail) return;
    const prefix = `ks_user_${currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_')}_`;
    try {
        localStorage.setItem(`${prefix}pantries`, JSON.stringify(pantries));
        localStorage.setItem(`${prefix}shopping`, JSON.stringify(shoppingList));
        localStorage.setItem(`${prefix}orders`, JSON.stringify(orderHistory));
        localStorage.setItem(`${prefix}recipes`, JSON.stringify(savedRecipes));
        localStorage.setItem(`${prefix}history`, JSON.stringify(mealHistory));
        localStorage.setItem(`${prefix}prefs`, JSON.stringify({ ...preferences, darkMode: true }));
    } catch (e) { console.warn("Storage quota exceeded."); }
  }, [pantries, shoppingList, orderHistory, savedRecipes, mealHistory, preferences, currentUserEmail]);

  useEffect(() => { document.documentElement.classList.add('dark'); }, []);

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('ks_onboarding_final_seen') === 'true';
    if (!hasSeenWalkthrough && !showWalkthrough && !preferences.onboardingCompleted) {
        const timer = setTimeout(() => setShowWalkthrough(true), 1200);
        return () => clearTimeout(timer);
    }
  }, [preferences.onboardingCompleted, showWalkthrough]);

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

  const handleSignIn = (name: string, email: string) => {
      const normalizedEmail = email.toLowerCase().trim();
      localStorage.setItem('ks_session_email', normalizedEmail);
      setCurrentUserEmail(normalizedEmail);
      setIsAuthModalOpen(false);
      navigate('/pantry');
      showToast(`Welcome back, ${name}!`);
  };
  
  const handleSignOut = () => { 
    localStorage.removeItem('ks_session_email'); 
    setCurrentUserEmail(null); 
    navigate('/pantry'); 
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
      localStorage.setItem('ks_onboarding_final_seen', 'true');
      setShowWalkthrough(false);
      const updatedPrefs = { ...preferences, onboardingCompleted: true };
      setPreferences(updatedPrefs);
      const user = currentUserEmail || 'guest';
      const prefix = `ks_user_${user.replace(/[^a-zA-Z0-9]/g, '_')}_`;
      localStorage.setItem(`${prefix}prefs`, JSON.stringify(updatedPrefs));
      navigate('/pantry', { replace: true });
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
                <NavLink to="/settings" id="nav-settings" className={({isActive}) => `p-2.5 rounded-xl transition-all ${isActive ? 'text-primary-600 bg-slate-900/40' : 'text-slate-400'}`}><Settings size={20} /></NavLink>
              ) : (
                <button id="nav-signup-btn" onClick={() => { setAuthModalMode('signup'); setIsAuthModalOpen(true); }} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all whitespace-nowrap"><UserPlus size={14} /> Join Free</button>
              )}
          </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 pb-4 md:px-6 md:pb-6 lg:px-12 pt-32 flex-1 w-full flex flex-col relative animate-fade-in">
        <Routes>
            <Route path="/" element={<Navigate to="/pantry" replace />} />
            <Route path="/pantry" element={<PantryView pantries={pantries} activePantryId={activePantryId} setActivePantryId={setActivePantryId} onAddPantry={handleAddPantry} items={activePantry.items} setItems={setActivePantryItems} onConsumeGeneration={handleConsumeGeneration} />} />
            <Route path="/studio" element={<DashboardView pantryItems={activePantry.items} mealHistory={mealHistory} preferences={preferences} setPreferences={setPreferences} savedRecipes={savedRecipes} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onLogMeal={handleLogMeal} onScheduleMeal={handleScheduleMeal} setActiveRecipe={setActiveRecipe} onToggleSave={handleToggleSave} isGenerating={isGeneratingRecipes} onGenerate={handleGenerateRecipes} onCancelGeneration={() => setIsGeneratingRecipes(false)} onRequireAccess={(a) => !!currentUserEmail} onAddRecipe={(r) => setSavedRecipes(prev => [r, ...prev])} onAddToShoppingList={addMissingToShopping} onConsumeGeneration={handleConsumeGeneration} />} />
            <Route path="/calendar" element={<CalendarView mealHistory={mealHistory} savedRecipes={savedRecipes} preferences={preferences} pantryItems={activePantry.items} onScheduleMeal={handleScheduleMeal} setMealHistory={setMealHistory} onUpdateMealStatus={(id, status) => setMealHistory(prev => prev.map(m => m.id === id ? {...m, status} : m))} onDeleteMealLog={(id) => setMealHistory(prev => prev.filter(m => m.id !== id))} onAddToShoppingList={addMissingToShopping} setActiveRecipe={setActiveRecipe} onRequireAccess={(a) => !!currentUserEmail} onConsumeGeneration={handleConsumeGeneration} />} />
            <Route path="/recipes" element={<RecipeView pantryItems={activePantry.items} setPantryItems={setActivePantryItems} preferences={preferences} onAddToShoppingList={addMissingToShopping} savedRecipes={savedRecipes} onToggleSave={handleToggleSave} mealHistory={mealHistory} onLogMeal={handleLogMeal} selectedRecipe={activeRecipe} setSelectedRecipe={setActiveRecipe} cookingMode={isCookingMode} setCookingMode={setIsCookingMode} currentStep={cookingStep} setCurrentStep={setCookingStep} activeTab={recipeTab} setActiveTab={setRecipeTab} onScheduleMeal={handleScheduleMeal} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onUpdateRecipe={handleUpdateRecipe} />} />
            <Route path="/shopping" element={<ShoppingListView items={shoppingList} setItems={setShoppingList} orderHistory={orderHistory} onPlaceOrder={handleCompleteOrder} onReorder={handleReorder} onUpdateOrderStatus={handleUpdateOrderStatus} pantryItems={activePantry.items} preferences={preferences} mealHistory={mealHistory} onRequireAccess={(a) => !!currentUserEmail} onSaveConcept={handleUpdateRecipe as any} onSavePastOrder={(o) => setOrderHistory(prev => [o, ...prev])} onScheduleMeal={handleScheduleMeal} onConsumeGeneration={handleConsumeGeneration} />} />
            <Route path="/settings" element={<SettingsView preferences={preferences} setPreferences={setPreferences} mealHistory={mealHistory} pantries={pantries} setPantries={setPantries} onSignOut={handleSignOut} onGoToLanding={() => {}} showToast={showToast} />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/plans" element={<PlansView preferences={preferences} />} />
        </Routes>
      </main>
      
      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 z-[100] p-3.5 bg-white text-slate-900 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-slate-950"><MessageSquarePlus size={22} /></button>
      <ChefChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} pantryItems={activePantry.items} activeRecipe={activeRecipe} />

      {isAuthModalOpen && (
        <SignInView isModal initialMode={authModalMode} onClose={() => setIsAuthModalOpen(false)} onSignIn={(name, email) => handleSignIn(name, email)} />
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

export default App;
