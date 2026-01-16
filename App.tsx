
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Calendar as CalendarIcon, X, Crown, Info, MessageSquarePlus, ShieldCheck, UserPlus, HelpCircle, Layers, ClipboardList, CreditCard } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Logo } from './components/Logo';
import { Ingredient, ShoppingItem, UserPreferences, Category, Recipe, Pantry, MealLog, RecipeGenerationOptions, Order, OrderStatus } from './types';
import SignInView from './components/SignInView';
import LandingView from './components/LandingView';
import ChefChat from './components/ChefChat';
import DashboardView from './components/DashboardView';
import PantryView from './components/PantryView';
import RecipeView from './components/RecipeView';
import ShoppingListView from './components/ShoppingListView';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import AboutView from './components/AboutView';
import { Walkthrough } from './components/Walkthrough';
import { generateSingleSmartRecipe } from './services/geminiService';

// SHARED UTILITIES
export const autoCategorize = (name: string): Category => {
    const lower = name.toLowerCase();
    if (lower.match(/steak|beef|chicken|pork|meat|fish|salmon|tuna|lamb|turkey|shrimp|bacon|sausage|ham|prawn|tilapia|ribs|fillet|loin|venison|duck|quail|prosciutto|salami|chorizo|jerky/)) return Category.MEAT;
    if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy|curd|sour cream|parmesan|mozzarella|cheddar|brie|feta|goat|ricotta|heavy cream|half and half|provolone|swiss|gruyere|kefir|ghee/)) {
        if (lower.match(/peanut butter|almond butter|nut butter/)) return Category.PANTRY;
        return Category.DAIRY;
    }
    if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper|salad|berry|lemon|lime|broccoli|cabbage|cucumber|mushroom|kale|zucchini|asparagus|cilantro|parsley|dill|thyme|rosemary|sage|basil|mint|ginger|shallot|leek|celery|avocado|grape|orange|strawberry|blueberry|raspberry|mango|pineapple|peach|plum|cherry|date|fig|pear|corn|pea|bean|radish|beet|cauliflower|brussels/)) return Category.PRODUCE;
    if (lower.match(/honey|syrup|oil|flour|sugar|salt|spice|pasta|rice|bean|lentil|source|vinegar|ketchup|mustard|mayo|canned|soup|cereal|oats|nut|seed|cumin|paprika|turmeric|cinnamon|vanilla|pepper|broth|stock|bouillon|yeast|baking|jam|jelly|peanut butter|almond butter|tahini|soy sauce|teriyaki|salsa|hot sauce/)) return Category.PANTRY;
    if (lower.match(/water|soda|juice|beer|wine|coffee|tea|drink|sparkling|cola|pepsi|coke|whiskey|vodka|spirit|gin|rum|tequila|espresso|latte|tonic|ale/)) return Category.BEVERAGE;
    if (lower.match(/bagel|bread|toast|sourdough|tortilla|wrap|roll|bun|muffin|pita|naan|baguette|ciabatta|croissant|focaccia|chips|snack|cracker|pretzel|cookie|cake|pastry|brownie/)) return Category.BAKERY;
    if (lower.match(/frozen| ice |pizza|nugget|peas|sorbet|gelato|waffle|fries|patties/)) return Category.FROZEN;
    return Category.PANTRY; 
};

export const parseQuantityValue = (q: any): { num: number; suffix: string } => {
    const strQ = String(q || '1');
    const match = strQ.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
        return { num: parseFloat(match[1]), suffix: match[2] || '' };
    }
    return { num: 1, suffix: strQ };
};

const DEFAULT_INITIAL_ITEMS: Ingredient[] = [
    { id: 'init-cheese', name: 'Cheese', category: Category.DAIRY, quantity: '1 Unit', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-dough', name: 'Pizza Dough', category: Category.BAKERY, quantity: '1 Unit', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' },
    { id: 'init-sauce', name: 'Sauce', category: Category.PANTRY, quantity: '1 Unit', addedDate: new Date().toISOString().split('T')[0], imageUrl: '' }
];

const DEFAULT_PREFS: UserPreferences = {
  darkMode: true, 
  themeColor: 'classic',
  isProMember: true, 
  subscriptionTier: 'pro',
  trialUsed: true,
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
  cookingStyle: 'simple'
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => localStorage.getItem('ks_session_email'));
  const [showLanding, setShowLanding] = useState(() => !localStorage.getItem('ks_session_email'));
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
    setPreferences({ ...DEFAULT_PREFS, ...loadedPrefs, darkMode: true, isProMember: true, subscriptionTier: 'pro' });
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
        localStorage.setItem(`${prefix}prefs`, JSON.stringify({ ...preferences, darkMode: true, isProMember: true, subscriptionTier: 'pro' }));
    } catch (e) { console.warn("Storage quota exceeded."); }
  }, [pantries, shoppingList, orderHistory, savedRecipes, mealHistory, preferences, currentUserEmail]);

  useEffect(() => { document.documentElement.classList.add('dark'); }, []);

  useEffect(() => {
    if (!showLanding && !preferences.onboardingCompleted && !showWalkthrough) {
        if (localStorage.getItem('ks_onboarding_final_seen') === 'true') return;
        const timer = setTimeout(() => setShowWalkthrough(true), 1500);
        return () => clearTimeout(timer);
    }
  }, [showLanding, preferences.onboardingCompleted, showWalkthrough]);

  const activePantry = useMemo(() => {
    return pantries.find(p => p.id === activePantryId) || { id: 'default', name: 'Main Kitchen', items: [] };
  }, [pantries, activePantryId]);

  const handleSignIn = (name: string, email: string) => {
      const normalizedEmail = email.toLowerCase().trim();
      localStorage.setItem('ks_session_email', normalizedEmail);
      setCurrentUserEmail(normalizedEmail);
      setIsAuthModalOpen(false);
      setShowLanding(false);
      navigate('/pantry');
      showToast(`Welcome back, ${name}!`);
  };
  
  const handleSignOut = () => { 
    localStorage.removeItem('ks_session_email'); 
    setCurrentUserEmail(null); 
    setShowLanding(true); 
    navigate('/'); 
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
    const newPantryItem: Ingredient = {
      id: Date.now().toString() + Math.random(),
      name: item.name,
      category: item.category === Category.OTHER ? autoCategorize(item.name) : item.category as Category,
      quantity: item.quantity || '1 unit',
      addedDate: new Date().toISOString().split('T')[0]
    };
    setPantries(prev => prev.map(p => {
        if (p.id === activePantryId) return { ...p, items: [newPantryItem, ...p.items] };
        return p;
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
    showToast("Order synchronized to pantry assets.");
  };

  const handleSavePastOrder = (order: Order) => {
    setOrderHistory(prev => [order, ...prev]);
    order.items.forEach(handleMoveToPantry);
    showToast("Order imported.");
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
    const targetCount = options.recipeCount || 4; // User requested 4 specific variations

    try {
      // SEQUENTIAL LOADING: Generate one by one to strictly follow the mission order (1-4)
      for (let i = 0; i < targetCount; i++) {
          try {
            const recipe = await generateSingleSmartRecipe(activePantry.items, preferences, {
                ...options,
                recipeCount: 1,
            }, i);
            
            if (recipe && recipe.title) {
              setGeneratedRecipes(prev => [...prev, recipe]);
            }
          } catch (recipeErr) {
            console.warn("Logic gate rejected specific curation segment.", recipeErr);
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

  const handleAddRecipe = (recipe: Recipe) => {
    setSavedRecipes(prev => [recipe, ...prev]);
    showToast("Recipe saved");
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
  };

  const onRequireAccess = (action: string) => {
    if (!currentUserEmail) {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-[#090e1a] font-sans flex flex-col overflow-x-hidden">
      <Walkthrough show={showWalkthrough} onComplete={completeWalkthrough} />
      {showLanding && location.pathname !== '/about' ? (
        <LandingView onStart={() => {setShowLanding(false); navigate('/pantry');}} onSignIn={() => {setAuthModalMode('signup'); setIsAuthModalOpen(true);}} onSignOut={handleSignOut} currentUser={currentUserEmail} />
      ) : (
        <>
          <header className="fixed top-0 left-0 right-0 h-20 bg-[#090e1a]/90 border-b border-slate-800/50 z-50 flex items-center justify-between px-4 md:px-8 backdrop-blur-xl">
              <div onClick={() => {setShowLanding(true); navigate('/');}} className="flex items-center gap-2.5 cursor-pointer group shrink-0">
                <div className="p-1.5 bg-primary-400 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg"><Logo className="w-7 h-7" /></div>
                <span className="font-serif font-black text-xl text-white tracking-tighter leading-none hidden sm:inline">Prepzu</span>
              </div>
              <nav className="flex items-center gap-1 md:gap-2">
                  <NavLink to="/pantry" id="nav-inventory" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><HomeIcon size={20} className="md:hidden" /><span className="hidden md:inline">Pantry</span></NavLink>
                  <NavLink to="/studio" id="nav-studio" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><Sparkles size={20} className="md:hidden" /><span className="hidden md:inline">Recipes</span></NavLink>
                  <NavLink to="/calendar" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><CalendarIcon size={20} className="md:hidden" /><span className="hidden md:inline">Calendar</span></NavLink>
                  <NavLink to="/shopping" id="nav-cart" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><ShoppingBag size={20} className="md:hidden" /><span className="hidden md:inline">Cart</span></NavLink>
                  <NavLink to="/about" className={({isActive}) => `p-2.5 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}><CreditCard size={20} className="md:hidden" /><span className="hidden md:inline">Plans</span></NavLink>
              </nav>
              <div id="main-header-auth-zone" className="flex items-center gap-2 md:gap-3 shrink-0">
                  {!currentUserEmail ? (
                    <button onClick={() => { setAuthModalMode('signup'); setIsAuthModalOpen(true); }} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all whitespace-nowrap"><UserPlus size={14} /> Sign Up Free</button>
                  ) : (
                    <>
                      <NavLink to="/about" className={({isActive}) => `p-2.5 rounded-xl transition-all ${isActive ? 'text-primary-600 bg-slate-900/40' : 'text-slate-400'}`} title="Plans"><HelpCircle size={20} /></NavLink>
                      <NavLink to="/settings" id="nav-settings" className={({isActive}) => `p-2.5 rounded-xl transition-all ${isActive ? 'text-primary-600 bg-slate-900/40' : 'text-slate-400'}`}><Settings size={20} /></NavLink>
                    </>
                  )}
              </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 pb-4 md:px-6 md:pb-6 lg:px-12 pt-32 flex-1 w-full flex flex-col relative animate-fade-in">
            <Routes>
                <Route path="/" element={<Navigate to="/pantry" replace />} />
                <Route path="/pantry" element={<PantryView pantries={pantries} activePantryId={activePantryId} setActivePantryId={setActivePantryId} onAddPantry={handleAddPantry} items={activePantry.items} setItems={setActivePantryItems} />} />
                <Route path="/studio" element={<DashboardView pantryItems={activePantry.items} mealHistory={mealHistory} preferences={preferences} setPreferences={setPreferences} savedRecipes={savedRecipes} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onLogMeal={handleLogMeal} onScheduleMeal={handleScheduleMeal} setActiveRecipe={setActiveRecipe} onToggleSave={handleToggleSave} isGenerating={isGeneratingRecipes} onGenerate={handleGenerateRecipes} onCancelGeneration={() => setIsGeneratingRecipes(false)} onRequireAccess={onRequireAccess} onAddRecipe={handleAddRecipe} onAddToShoppingList={addMissingToShopping} />} />
                <Route path="/calendar" element={<CalendarView mealHistory={mealHistory} savedRecipes={savedRecipes} preferences={preferences} pantryItems={activePantry.items} onScheduleMeal={handleScheduleMeal} setMealHistory={setMealHistory} onUpdateMealStatus={(id, status) => setMealHistory(prev => prev.map(m => m.id === id ? {...m, status} : m))} onDeleteMealLog={(id) => setMealHistory(prev => prev.filter(m => m.id !== id))} onAddToShoppingList={addMissingToShopping} setActiveRecipe={setActiveRecipe} onRequireAccess={onRequireAccess} />} />
                <Route path="/recipes" element={<RecipeView pantryItems={activePantry.items} setPantryItems={setActivePantryItems} preferences={preferences} onAddToShoppingList={addMissingToShopping} savedRecipes={savedRecipes} onToggleSave={handleToggleSave} mealHistory={mealHistory} onLogMeal={handleLogMeal} selectedRecipe={activeRecipe} setSelectedRecipe={setActiveRecipe} cookingMode={isCookingMode} setCookingMode={setIsCookingMode} currentStep={cookingStep} setCurrentStep={setCookingStep} activeTab={recipeTab} setActiveTab={setRecipeTab} onScheduleMeal={handleScheduleMeal} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onUpdateRecipe={handleUpdateRecipe} />} />
                <Route path="/shopping" element={<ShoppingListView items={shoppingList} setItems={setShoppingList} orderHistory={orderHistory} onPlaceOrder={handleCompleteOrder} onReorder={handleReorder} onUpdateOrderStatus={handleUpdateOrderStatus} pantryItems={activePantry.items} preferences={preferences} mealHistory={mealHistory} onRequireAccess={onRequireAccess} onSaveConcept={handleUpdateRecipe as any} onSavePastOrder={handleSavePastOrder} onScheduleMeal={handleScheduleMeal} />} />
                <Route path="/settings" element={<SettingsView preferences={preferences} setPreferences={setPreferences} mealHistory={mealHistory} pantries={pantries} setPantries={setPantries} onSignOut={handleSignOut} onGoToLanding={() => setShowLanding(true)} showToast={showToast} />} />
                <Route path="/about" element={<AboutView />} />
                <Route path="/plans" element={<Navigate to="/studio" replace />} />
            </Routes>
          </main>
          <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 z-[100] p-4 bg-white text-slate-900 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"><MessageSquarePlus size={28} /></button>
          <ChefChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} pantryItems={activePantry.items} activeRecipe={activeRecipe} cartItems={shoppingList} lastOrder={orderHistory[0]} />
        </>
      )}
      {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] animate-slide-up">
              <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md bg-slate-900/90 text-white border border-slate-700`}>
                  <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
              </div>
          </div>
      )}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-4xl">
                <SignInView onSignIn={handleSignIn} onClose={() => setIsAuthModalOpen(false)} isModal initialMode={authModalMode} />
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
