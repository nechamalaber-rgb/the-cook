import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Loader2, LogOut, Calendar as CalendarIcon, LayoutGrid, Mail, Phone, X, Diamond, Zap, LogIn, Crown, CheckCircle2, Clock, Flame, Timer, ArrowRight, LifeBuoy, BookOpen, CreditCard, AlertCircle, Info, Lightbulb, MessageCircle, Gift, AlertOctagon, BellRing } from 'lucide-react';
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
  // Fix: Assign a single value from the allowed options instead of using bitwise OR which incorrectly results in 0 (number)
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
  const [showTrialToast, setShowTrialToast] = useState(false);

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
    if (preferences.subscriptionTier === 'pro' || preferences.subscriptionTier === 'elite') return false;
    return getDaysRemaining() <= 0;
  };

  const daysRemaining = getDaysRemaining();
  const isTrialFinished = isTrialExpired();
  const isTrialActive = preferences.trialStartedAt && daysRemaining > 0 && !preferences.isProMember;
  const showTrialButton = !preferences.isProMember && !preferences.trialStartedAt;

  useEffect(() => {
    if (!isTrialActive || showLanding) return;

    const interval = setInterval(() => {
      setShowTrialToast(true);
      setTimeout(() => setShowTrialToast(false), 8000);
    }, 120000);

    return () => clearInterval(interval);
  }, [isTrialActive, showLanding]);

  const activePantry = useMemo(() => {
    return pantries.find(p => p.id === activePantryId) || { id: 'default', name: 'Main Kitchen', items: [] };
  }, [pantries, activePantryId]);

  const checkAccess = (actionName: string = "To use this feature", featureType: 'basic' | 'planner' | 'logging' | 'generate' | 'shopping_export' = 'basic'): boolean => {
    if (!currentUserEmail) {
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
        return false;
    }
    
    if (isTrialExpired()) {
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
          newPrefs.subscriptionTier = 'none'; 
          newPrefs.isProMember = false;
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
    if (isTrialExpired()) {
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
                  <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tighter leading-none">Prepzu</span>
                  {isTrialActive && (
                    <div className="flex items-center gap-1 mt-0.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md">{daysRemaining.toFixed(1)} Days Left</span>
                    </div>
                  )}
                  {isTrialFinished && (
                    <div className="flex items-center gap-1 mt-0.5">
                       <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-500/20">
                         <AlertOctagon size={10} /> Trial Expired
                       </span>
                    </div>
                  )}
                </div>
              </div>
              <nav className="flex items-center gap-1 md:gap-2">
                  <NavLink to="/pantry" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><HomeIcon size={20} className="md:hidden" /><span className="hidden md:inline">Inventory</span></NavLink>
                  <NavLink to="/studio" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><Sparkles size={20} className="md:hidden" /><span className="hidden md:inline">Studio</span></NavLink>
                  <NavLink to="/calendar" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><CalendarIcon size={20} className="md:hidden" /><span className="hidden md:inline">Planner</span></NavLink>
                  <NavLink to="/shopping" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><ShoppingBag size={20} className="md:hidden" /><span className="hidden md:inline">Cart</span></NavLink>
              </nav>
              <div className="flex items-center gap-1 md:gap-3">
                  {(showTrialButton || isTrialFinished) && (
                    <button 
                      onClick={() => {
                        if (isTrialFinished) {
                            navigate('/plans');
                        } else {
                            setAuthModalMode('signup');
                            setIsAuthModalOpen(true);
                        }
                      }}
                      className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all ${isTrialFinished ? 'bg-rose-600 text-white animate-pulse' : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white animate-pulse'}`}
                    >
                      <Gift size={14} /> {isTrialFinished ? 'Upgrade to Pro' : 'Start 3-Day Trial'}
                    </button>
                  )}
                  <NavLink to="/settings" className={({isActive}) => `p-2.5 rounded-xl transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400'}`}><Settings size={20} /></NavLink>
              </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 pb-4 md:px-6 md:pb-6 lg:px-12 lg:pb-12 pt-32 md:pt-36 flex-1 w-full flex flex-col relative">
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

      {showTrialToast && (
        <div className="fixed bottom-24 right-8 z-[200] max-w-sm animate-slide-up">
           <div className="bg-white dark:bg-slate-900 border border-primary-500/30 rounded-2xl p-5 shadow-2xl flex items-start gap-4 backdrop-blur-md">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl shrink-0">
                <BellRing size={20} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Trial Reminder</h4>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  Your free trial is ending soon. Upgrade now for permanent studio access!
                </p>
                <div className="mt-3 flex items-center gap-3">
                   <button 
                     onClick={() => { setShowTrialToast(false); navigate('/plans'); }}
                     className="px-4 py-2 bg-primary-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20"
                   >
                     Upgrade Now
                   </button>
                   <button onClick={() => setShowTrialToast(false)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Dismiss</button>
                </div>
              </div>
              <button onClick={() => setShowTrialToast(false)} className="text-slate-300 hover:text-slate-500"><X size={14}/></button>
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