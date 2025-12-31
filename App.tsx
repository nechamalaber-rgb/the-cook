
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Loader2, LogOut, Calendar as CalendarIcon, LayoutGrid, Mail, Phone, X, Diamond, Zap, LogIn, Crown, CheckCircle2, Clock, Flame, Timer, ArrowRight, LifeBuoy, BookOpen } from 'lucide-react';
import { Logo } from './components/Logo';
import { Ingredient, ShoppingItem, UserPreferences, Category, Recipe, Pantry, MealLog, RecipeGenerationOptions } from './types';
import SignInView from './components/SignInView';
import LandingView from './components/LandingView';
import TrialUpsellPopup from './components/TrialUpsellPopup';
import { generateSmartRecipes, generateRecipeImage } from './services/geminiService';

const DashboardView = lazy(() => import('./components/DashboardView'));
const PantryView = lazy(() => import('./components/PantryView'));
const RecipeView = lazy(() => import('./components/RecipeView'));
const ShoppingListView = lazy(() => import('./components/ShoppingListView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const PlansView = lazy(() => import('./components/PlansView'));
const AboutView = lazy(() => import('./components/AboutView'));
const TutorialView = lazy(() => import('./components/TutorialView'));

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
  const [showMarketingPopup, setShowMarketingPopup] = useState(false);
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

  // High-frequency Trigger Logic: Every 2 minutes
  useEffect(() => {
    const triggerPopup = () => {
      const isPro = preferences.subscriptionTier === 'pro' || (preferences.trialStartedAt && !isTrialExpired());
      // Only show if not Pro, and not already looking at an auth modal or the popup itself
      if (!isPro && !isAuthModalOpen && !showMarketingPopup && !showLanding) {
        setShowMarketingPopup(true);
      }
    };

    const interval = setInterval(triggerPopup, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [preferences, isAuthModalOpen, showMarketingPopup, showLanding]);

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

  const isTrialExpired = () => {
    if (!preferences.trialStartedAt) return false;
    const start = new Date(preferences.trialStartedAt).getTime();
    const now = new Date().getTime();
    return (now - start) / (1000 * 3600 * 24) > 3;
  };

  const checkAccess = (actionName: string = "To use this feature", featureType: 'basic' | 'planner' | 'logging' | 'generate' | 'shopping_export' = 'basic'): boolean => {
    if (!currentUserEmail) {
        setIsAuthModalOpen(true);
        return false;
    }
    const { subscriptionTier, trialStartedAt } = preferences;
    if (!!trialStartedAt && !isTrialExpired()) return true;
    if (!subscriptionTier || subscriptionTier === 'none') {
        setShowMarketingPopup(true);
        return false;
    }
    return true;
  };

  const activePantry = pantries.find(p => p.id === activePantryId) || pantries[0] || { items: [] };
  const activeItems = activePantry.items || [];

  const handleGenerateRecipes = async (options: RecipeGenerationOptions) => {
    if (!checkAccess("To generate menus", 'generate')) return;
    setIsGeneratingRecipes(true);
    try { 
        const recipes = await generateSmartRecipes(activeItems, preferences, options, savedRecipes); 
        setGeneratedRecipes(recipes); 
    } catch (e) { console.error(e); } 
    finally { setIsGeneratingRecipes(false); }
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
      setShowMarketingPopup(false);
      setShowLanding(false);
      navigate('/studio');
  };
  
  const handleSignOut = () => { localStorage.removeItem('ks_session_email'); setCurrentUserEmail(null); setShowLanding(true); setIsInitialized(false); navigate('/'); };
  const setActivePantryItems: React.Dispatch<React.SetStateAction<Ingredient[]>> = (value) => { setPantries(prev => prev.map(p => { if (p.id === activePantryId) return { ...p, items: typeof value === 'function' ? (value as any)(p.items) : value }; return p; })); };
  const handleAddPantry = (name: string) => { if (!checkAccess("To create studios", 'basic')) return; const newPantry: Pantry = { id: Date.now().toString(), name, items: [] }; setPantries(prev => [...prev, newPantry]); setActivePantryId(newPantry.id); };
  const addMissingToShopping = (items: string[]) => { if (!checkAccess("To export lists", 'basic')) return; setShoppingList(prev => [...prev, ...items.map(name => ({ id: Math.random().toString(), name, category: Category.OTHER, checked: false }))]); alert(`${items.length} missing items added.`); };

  // Fix: Added handleLogMeal to track completed recipes
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

  // Fix: Added handleScheduleMeal for calendar planning
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

  // Fix: Added handleToggleSave to manage saved recipes list
  const handleToggleSave = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      if (exists) return prev.filter(r => r.id !== recipe.id);
      return [recipe, ...prev];
    });
  };

  const isTrialActive = preferences.trialStartedAt && preferences.isProMember && !isTrialExpired();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500 flex flex-col">
      {showLanding && location.pathname !== '/about' ? (
        <LandingView onStart={() => {setShowLanding(false); navigate('/studio');}} onSignIn={() => setIsAuthModalOpen(true)} onSignOut={handleSignOut} currentUser={currentUserEmail} />
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
                       <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Pro Trial</span>
                    </div>
                  )}
                </div>
              </div>
              <nav className="flex items-center gap-1 md:gap-2">
                  <NavLink to="/pantry" className={({isActive}) => `p-2.5 md:px-5 lg:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><HomeIcon size={20} className="md:hidden" /><span className="hidden md:inline">Inventory</span></NavLink>
                  <NavLink to="/studio" className={({isActive}) => `p-2.5 md:px-5 lg:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><Sparkles size={20} className="md:hidden" /><span className="hidden md:inline">Studio</span></NavLink>
                  <NavLink to="/calendar" className={({isActive}) => `p-2.5 md:px-5 lg:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><CalendarIcon size={20} className="md:hidden" /><span className="hidden md:inline">Planner</span></NavLink>
                  <NavLink to="/shopping" className={({isActive}) => `p-2.5 md:px-5 lg:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900'}`}><ShoppingBag size={20} className="md:hidden" /><span className="hidden md:inline">Cart</span></NavLink>
              </nav>
              <div className="flex items-center gap-1 md:gap-3">
                  {!currentUserEmail && (
                      <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Sign In</button>
                  )}
                  <NavLink to="/settings" className={({isActive}) => `p-2.5 rounded-xl transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400'}`}><Settings size={20} /></NavLink>
              </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 pb-4 md:px-6 md:pb-6 lg:px-12 lg:pb-12 pt-32 md:pt-36 flex-1 w-full flex flex-col">
            <Suspense fallback={<PageLoader />}><Routes>
                <Route path="/" element={<Navigate to="/pantry" replace />} />
                <Route path="/pantry" element={<PantryView pantries={pantries} activePantryId={activePantryId} setActivePantryId={setActivePantryId} onAddPantry={handleAddPantry} items={activeItems} setItems={setActivePantryItems} onRequireAccess={(a) => checkAccess(a, 'basic')} />} />
                <Route path="/studio" element={<DashboardView pantryItems={activeItems} mealHistory={mealHistory} preferences={preferences} setPreferences={setPreferences} savedRecipes={savedRecipes} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onLogMeal={handleLogMeal} onScheduleMeal={handleScheduleMeal} setActiveRecipe={setActiveRecipe} onToggleSave={handleToggleSave} isGenerating={isGeneratingRecipes} onGenerate={handleGenerateRecipes} onCancelGeneration={() => setIsGeneratingRecipes(false)} onRequireAccess={(a) => checkAccess(a, 'generate')} />} />
                <Route path="/calendar" element={<CalendarView mealHistory={mealHistory} savedRecipes={savedRecipes} preferences={preferences} pantryItems={activeItems} onScheduleMeal={handleScheduleMeal} onUpdateMealStatus={(id, status) => setMealHistory(prev => prev.map(m => m.id === id ? {...m, status} : m))} onDeleteMealLog={(id) => setMealHistory(prev => prev.filter(m => m.id !== id))} />} />
                <Route path="/recipes" element={<RecipeView pantryItems={activeItems} setPantryItems={setActivePantryItems} preferences={preferences} onAddToShoppingList={addMissingToShopping} savedRecipes={savedRecipes} onToggleSave={handleToggleSave} mealHistory={mealHistory} onLogMeal={handleLogMeal} selectedRecipe={activeRecipe} setSelectedRecipe={setActiveRecipe} cookingMode={isCookingMode} setCookingMode={setIsCookingMode} currentStep={cookingStep} setCurrentStep={setCookingStep} activeTab={recipeTab} setActiveTab={setRecipeTab} />} />
                <Route path="/shopping" element={<ShoppingListView items={shoppingList} setItems={setShoppingList} moveToPantry={(item) => {}} pantryItems={activeItems} mealHistory={mealHistory} onRequireAccess={(a, t) => checkAccess(a, t as any)} />} />
                <Route path="/plans" element={<PlansView preferences={preferences} />} />
                <Route path="/settings" element={<SettingsView preferences={preferences} setPreferences={setPreferences} mealHistory={mealHistory} pantries={pantries} setPantries={setPantries} onSignOut={handleSignOut} onGoToLanding={() => setShowLanding(true)} />} />
                <Route path="/about" element={<AboutView />} />
                <Route path="/tutorial" element={<TutorialView />} />
            </Routes></Suspense>
          </main>
        </>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-lg">
                <SignInView onSignIn={handleSignIn} onClose={() => setIsAuthModalOpen(false)} isModal />
            </div>
        </div>
      )}

      {showMarketingPopup && (
        <TrialUpsellPopup 
          onClose={() => setShowMarketingPopup(false)} 
          onClaim={() => { setShowMarketingPopup(false); setIsAuthModalOpen(true); }}
        />
      )}
    </div>
  );
};

export default App;
