
import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Loader2, LogOut, Calendar as CalendarIcon, LayoutGrid, Mail, Phone, X, Diamond, Zap, LogIn, Crown, CheckCircle2, Clock, Flame, Timer, ArrowRight, LifeBuoy, BookOpen, CreditCard, AlertCircle, Info, Lightbulb } from 'lucide-react';
import { Logo } from './components/Logo';
import { Ingredient, ShoppingItem, UserPreferences, Category, Recipe, Pantry, MealLog, RecipeGenerationOptions } from './types';
import SignInView from './components/SignInView';
import LandingView from './components/LandingView';
import { generateSmartRecipes } from './services/geminiService';

const DashboardView = lazy(() => import('./components/DashboardView'));
const PantryView = lazy(() => import('./components/PantryView'));
const RecipeView = lazy(() => import('./components/RecipeView'));
const ShoppingListView = lazy(() => import('./components/ShoppingListView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const PlansView = lazy(() => import('./components/PlansView'));
const AboutView = lazy(() => import('./components/AboutView'));

const DEFAULT_INITIAL_ITEMS: Ingredient[] = [
  { id: '1', name: 'Eggs', category: Category.DAIRY, quantity: '6 large', addedDate: '2023-10-25' },
  { id: '2', name: 'Spinach', category: Category.PRODUCE, quantity: '1 bag', addedDate: '2023-10-26' },
  { id: '3', name: 'Chicken', category: Category.MEAT, quantity: '2 lbs', addedDate: '2023-10-27' },
];

const DEFAULT_PREFS: UserPreferences = {
  darkMode: true,
  themeColor: 'classic',
  isProMember: false,
  subscriptionTier: 'none',
  trialUsed: false,
  dailyUsage: { date: new Date().toISOString().split('T')[0], count: 0 },
  dietaryRestrictions: [],
  cuisinePreferences: [],
  allergies: [],
  appliances: ['Oven', 'Stove', 'Air Fryer'],
  skillLevel: 'Intermediate',
  strictness: 'Strict',
  isKosher: false,
  healthGoal: 'Maintain',
  nutritionalGoals: { maxCaloriesPerMeal: '', minProteinPerMeal: '' },
  measurementSystem: 'Imperial',
  emailNotifications: true,
  spiceLevel: 'Medium',
  budget: 'Moderate',
  blacklist: [],
  householdSize: 2,
  chefPersonality: 'Creative',
  generationsCount: 4
};

const PageLoader = () => (
  <div className="flex flex-col h-[50vh] w-full items-center justify-center p-8 text-center animate-fade-in">
    <div className="relative mb-8"><Loader2 className="animate-spin text-primary-500" size={48} /><Logo className="w-8 h-8 absolute inset-0 m-auto opacity-20" /></div>
  </div>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => localStorage.getItem('ks_session_email'));
  
  const [showLanding, setShowLanding] = useState(() => {
    const hasSession = localStorage.getItem('ks_session_email');
    return !hasSession;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [isInitialized, setIsInitialized] = useState(false);

  const [pantries, setPantries] = useState<Pantry[]>([]);
  const [activePantryId, setActivePantryId] = useState<string>('default');
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealHistory, setMealHistory] = useState<MealLog[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [cookingStep, setCookingStep] = useState(0);
  const [recipeTab, setRecipeTab] = useState<'discover' | 'saved'>('discover');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS);
  const [showPantryTip, setShowPantryTip] = useState(false);

  useEffect(() => {
    setIsInitialized(false); 
    const user = currentUserEmail || 'guest';
    const prefix = `ks_user_${user.replace(/[^a-zA-Z0-9]/g, '_')}_`;
    
    const savedPantries = localStorage.getItem(`${prefix}pantries`);
    const savedPrefs = localStorage.getItem(`${prefix}prefs`);
    const savedShop = localStorage.getItem(`${prefix}shopping`);
    const savedRec = localStorage.getItem(`${prefix}recipes`);
    const savedHist = localStorage.getItem(`${prefix}history`);

    if (savedPantries) { 
        const parsed = JSON.parse(savedPantries); 
        setPantries(parsed); 
        if (parsed.length > 0) setActivePantryId(parsed[0].id); 
    } else { 
        setPantries([{ id: 'default', name: 'Main Kitchen', items: DEFAULT_INITIAL_ITEMS }]); 
    }

    if (savedPrefs) { 
        const p = JSON.parse(savedPrefs);
        setPreferences(prev => ({ ...DEFAULT_PREFS, ...p })); 
    } else { 
        setPreferences(DEFAULT_PREFS); 
    }

    if (savedShop) setShoppingList(JSON.parse(savedShop));
    if (savedRec) setSavedRecipes(JSON.parse(savedRec));
    if (savedHist) setMealHistory(JSON.parse(savedHist));

    setIsInitialized(true);
  }, [currentUserEmail]);

  useEffect(() => {
    if (!isInitialized) return;
    const user = currentUserEmail || 'guest';
    const prefix = `ks_user_${user.replace(/[^a-zA-Z0-9]/g, '_')}_`;
    if (pantries.length > 0) localStorage.setItem(`${prefix}pantries`, JSON.stringify(pantries));
    localStorage.setItem(`${prefix}shopping`, JSON.stringify(shoppingList));
    localStorage.setItem(`${prefix}recipes`, JSON.stringify(savedRecipes));
    localStorage.setItem(`${prefix}history`, JSON.stringify(mealHistory));
    localStorage.setItem(`${prefix}prefs`, JSON.stringify(preferences));
  }, [pantries, shoppingList, savedRecipes, mealHistory, preferences, currentUserEmail, isInitialized]);

  useEffect(() => {
    if (preferences.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [preferences.darkMode]);

  const getDaysRemaining = () => {
    if (!preferences.trialStartedAt) return 0;
    const start = new Date(preferences.trialStartedAt).getTime();
    const now = new Date().getTime();
    const diff = (now - start) / (1000 * 3600 * 24);
    return Math.max(0, 3 - diff);
  };

  const isTrialExpired = () => {
    if (!preferences.trialStartedAt) return false;
    return getDaysRemaining() <= 0;
  };

  const activePantry = useMemo(() => {
    return pantries.find(p => p.id === activePantryId) || { id: 'default', name: 'Main Kitchen', items: [] };
  }, [pantries, activePantryId]);

  // Day 2 Trigger logic
  useEffect(() => {
    if (isInitialized && preferences.trialStartedAt && !isTrialExpired()) {
        const daysRem = getDaysRemaining();
        if (daysRem <= 2 && daysRem > 1 && activePantry.items.length < 5) {
            setShowPantryTip(true);
        }
    }
  }, [isInitialized, preferences.trialStartedAt, activePantry.items.length]);

  const checkAccess = (actionName: string = "To use this feature", featureType: 'basic' | 'planner' | 'logging' | 'generate' | 'shopping_export' = 'basic'): boolean => {
    if (!currentUserEmail) {
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
        return false;
    }
    const { subscriptionTier, trialStartedAt } = preferences;
    
    if (trialStartedAt && !isTrialExpired()) return true;
    
    if (isTrialExpired() && subscriptionTier === 'none') {
        if (location.pathname !== '/plans') {
            navigate('/plans');
        }
        return false;
    }

    if (!subscriptionTier || subscriptionTier === 'none') {
        alert("Subscription required for Studio features.");
        navigate('/plans');
        return false;
    }
    return true;
  };

  const handleSignIn = (name: string, email: string, activateTrial: boolean = false) => {
      const normalizedEmail = email.toLowerCase().trim();
      const prefix = `ks_user_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}_`;
      const existingPrefsStr = localStorage.getItem(`${prefix}prefs`);
      let newPrefs: UserPreferences = existingPrefsStr ? JSON.parse(existingPrefsStr) : { ...DEFAULT_PREFS };
      newPrefs.userName = name;
      newPrefs.email = normalizedEmail;
      if (activateTrial && !newPrefs.trialUsed) {
          newPrefs.subscriptionTier = 'pro'; 
          newPrefs.isProMember = true;
          newPrefs.trialUsed = true;
          newPrefs.trialStartedAt = new Date().toISOString();
      }
      localStorage.setItem(`${prefix}prefs`, JSON.stringify(newPrefs));
      localStorage.setItem('ks_session_email', normalizedEmail);
      setCurrentUserEmail(normalizedEmail);
      setPreferences(newPrefs);
      setIsAuthModalOpen(false);
      setShowLanding(false);
      navigate('/studio');
  };
  
  const handleSignOut = () => { localStorage.removeItem('ks_session_email'); setCurrentUserEmail(null); setShowLanding(true); setIsInitialized(false); navigate('/'); };
  
  const setActivePantryItems: React.Dispatch<React.SetStateAction<Ingredient[]>> = (value) => { 
    if (isTrialExpired() && preferences.subscriptionTier === 'none' && activePantry.items.length >= 10) {
        alert("Freemium Studio Full. Upgrade to Pro to add more than 10 items.");
        navigate('/plans');
        return;
    }

    setPantries(prev => prev.map(p => { 
        if (p.id === activePantryId) return { ...p, items: typeof value === 'function' ? (value as any)(p.items) : value }; 
        return p; 
    })); 
  };

  const handleAddPantry = (name: string) => { if (!checkAccess("To create studios", 'basic')) return; const newPantry: Pantry = { id: Date.now().toString(), name, items: [] }; setPantries(prev => [...prev, newPantry]); setActivePantryId(newPantry.id); };
  const addMissingToShopping = (items: string[]) => { if (!checkAccess("To export lists", 'basic')) return; setShoppingList(prev => [...prev, ...items.map(name => ({ id: Math.random().toString(), name, category: Category.OTHER, checked: false }))]); alert(`${items.length} missing items added.`); };

  const handleGenerateRecipes = async (options: RecipeGenerationOptions) => {
    if (!checkAccess("To generate recipes", 'generate')) return;
    setIsGeneratingRecipes(true);
    try {
      const recipes = await generateSmartRecipes(activePantry.items, preferences, options, savedRecipes);
      setGeneratedRecipes(recipes || []);
    } catch (e) {
      console.error("Generation failed", e);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const handleLogMeal = (recipe: Recipe) => {
    const newLog: MealLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: 'Dinner',
      recipeTitle: recipe.title,
      recipeId: recipe.id,
      calories: recipe.calories,
      status: 'completed'
    };
    setMealHistory(prev => [newLog, ...prev]);
  };

  const handleScheduleMeal = (recipe: Recipe, date: string, mealType: string) => {
    const newLog: MealLog = {
      id: Date.now().toString(),
      date,
      time: '19:00',
      mealType: mealType as any,
      recipeTitle: recipe.title,
      recipeId: recipe.id,
      calories: recipe.calories,
      status: 'planned'
    };
    setMealHistory(prev => [newLog, ...prev]);
  };

  const handleToggleSave = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      if (exists) return prev.filter(r => r.id !== recipe.id);
      return [recipe, ...prev];
    });
  };

  const daysRemaining = getDaysRemaining();
  const isTrialActive = preferences.trialStartedAt && !isTrialExpired();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500 flex flex-col">
      {showLanding && location.pathname !== '/about' ? (
        <LandingView onStart={() => {setShowLanding(false); navigate('/studio');}} onSignIn={() => {setAuthModalMode('signup'); setIsAuthModalOpen(true);}} onSignOut={handleSignOut} currentUser={currentUserEmail} />
      ) : (
        <>
          <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/50 z-50 flex items-center justify-between px-4 md:px-8 backdrop-blur-xl transition-all">
              <div onClick={() => {setShowLanding(true); navigate('/');}} className="flex items-center gap-2.5 cursor-pointer group">
                <div className="p-1.5 bg-primary-400 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg"><Logo className="w-7 h-7" /></div>
                <div className="flex flex-col">
                  <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tighter leading-none">GatherHome</span>
                  {isTrialActive && (
                    <div className="flex items-center gap-1 mt-0.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md">{daysRemaining.toFixed(1)} Days Left</span>
                    </div>
                  )}
                </div>
              </div>
              <nav className="flex items-center gap-1 md:gap-2">
                  <NavLink to="/pantry" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><HomeIcon size={20} className="md:hidden" /><span className="hidden md:inline">Inventory</span></NavLink>
                  <NavLink to="/studio" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><Sparkles size={20} className="md:hidden" /><span className="hidden md:inline">Studio</span></NavLink>
                  <NavLink to="/calendar" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><CalendarIcon size={20} className="md:hidden" /><span className="hidden md:inline">Planner</span></NavLink>
                  <NavLink to="/shopping" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><ShoppingBag size={20} className="md:hidden" /><span className="hidden md:inline">Cart</span></NavLink>
                  <NavLink to="/plans" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><CreditCard size={20} className="md:hidden" /><span className="hidden md:inline">Plans</span></NavLink>
              </nav>
              <div className="flex items-center gap-1 md:gap-3">
                  {!currentUserEmail && (
                      <button 
                        onClick={() => {setAuthModalMode('signup'); setIsAuthModalOpen(true);}} 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Start 3-Day Free Trial
                      </button>
                  )}
                  <NavLink to="/settings" className={({isActive}) => `p-2.5 rounded-xl transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400'}`}><Settings size={20} /></NavLink>
              </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 pb-4 md:px-6 md:pb-6 lg:px-12 lg:pb-12 pt-32 md:pt-36 flex-1 w-full flex flex-col">
            {isTrialActive && (
                <div className="mb-6 mx-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <Timer className="text-amber-600" size={20} />
                        <span className="text-sm font-bold text-amber-800 dark:text-amber-200">
                            {daysRemaining.toFixed(1)} days remaining in trial. 
                            {activePantry.items.length >= 8 && <span className="ml-2 opacity-80 text-xs">(Limit: {activePantry.items.length}/10 for Freemium)</span>}
                        </span>
                    </div>
                    <button onClick={() => navigate('/plans')} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2">
                      Upgrade Now <ArrowRight size={12}/>
                    </button>
                </div>
            )}

            {isTrialExpired() && preferences.subscriptionTier === 'none' && (
                <div className="mb-6 mx-4 p-5 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg">
                          <AlertCircle size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black font-serif text-rose-900 dark:text-white">Trial Ended</h3>
                            <p className="text-sm font-bold text-rose-800/70 dark:text-rose-400">Your Studio is now in Freemium mode. Your first 10 items are safe.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => navigate('/plans')} className="flex-1 md:flex-none px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20">Restore Pro Access</button>
                        <button onClick={() => setShowLanding(false)} className="flex-1 md:flex-none px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest">Stay on Freemium</button>
                    </div>
                </div>
            )}

            {showPantryTip && (
               <div className="mb-6 mx-4 p-5 bg-indigo-600 text-white rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-slide-down shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-4 bg-white/20 rounded-2xl">
                      <Lightbulb size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black font-serif leading-tight">Studio Tip: Digitizing Staples</h3>
                      <p className="text-indigo-100 text-sm font-medium mt-1">Categorizing items like "Spices" or "Rice" helps our AI curate better recipes. Try adding them now!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                    <button onClick={() => {setShowPantryTip(false); navigate('/pantry');}} className="flex-1 md:flex-none px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Try Now</button>
                    <button onClick={() => setShowPantryTip(false)} className="p-2 text-white/50 hover:text-white"><X size={20}/></button>
                  </div>
               </div>
            )}

            <Suspense fallback={<PageLoader />}><Routes>
                <Route path="/" element={<Navigate to="/pantry" replace />} />
                <Route path="/pantry" element={<PantryView pantries={pantries} activePantryId={activePantryId} setActivePantryId={setActivePantryId} onAddPantry={handleAddPantry} items={activePantry.items} setItems={setActivePantryItems} onRequireAccess={(a) => checkAccess(a, 'basic')} />} />
                <Route path="/studio" element={<DashboardView pantryItems={activePantry.items} mealHistory={mealHistory} preferences={preferences} setPreferences={setPreferences} savedRecipes={savedRecipes} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onLogMeal={handleLogMeal} onScheduleMeal={handleScheduleMeal} setActiveRecipe={setActiveRecipe} onToggleSave={handleToggleSave} isGenerating={isGeneratingRecipes} onGenerate={handleGenerateRecipes} onCancelGeneration={() => setIsGeneratingRecipes(false)} onRequireAccess={(a) => checkAccess(a, 'generate')} />} />
                <Route path="/calendar" element={<CalendarView mealHistory={mealHistory} savedRecipes={savedRecipes} preferences={preferences} pantryItems={activePantry.items} onScheduleMeal={handleScheduleMeal} onUpdateMealStatus={(id, status) => setMealHistory(prev => prev.map(m => m.id === id ? {...m, status} : m))} onDeleteMealLog={(id) => setMealHistory(prev => prev.filter(m => m.id !== id))} />} />
                <Route path="/recipes" element={<RecipeView pantryItems={activePantry.items} setPantryItems={setActivePantryItems} preferences={preferences} onAddToShoppingList={addMissingToShopping} savedRecipes={savedRecipes} onToggleSave={handleToggleSave} mealHistory={mealHistory} onLogMeal={handleLogMeal} selectedRecipe={activeRecipe} setSelectedRecipe={setActiveRecipe} cookingMode={isCookingMode} setCookingMode={setIsCookingMode} currentStep={cookingStep} setCurrentStep={setCookingStep} activeTab={recipeTab} setActiveTab={setRecipeTab} onScheduleMeal={handleScheduleMeal} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} />} />
                <Route path="/shopping" element={<ShoppingListView items={shoppingList} setItems={setShoppingList} moveToPantry={(item) => {}} pantryItems={activePantry.items} mealHistory={mealHistory} onRequireAccess={(a, t) => checkAccess(a, t as any)} />} />
                <Route path="/plans" element={<PlansView preferences={preferences} />} />
                <Route path="/settings" element={<SettingsView preferences={preferences} setPreferences={setPreferences} mealHistory={mealHistory} pantries={pantries} setPantries={setPantries} onSignOut={handleSignOut} onGoToLanding={() => setShowLanding(true)} />} />
                <Route path="/about" element={<AboutView />} />
            </Routes></Suspense>
          </main>
        </>
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
