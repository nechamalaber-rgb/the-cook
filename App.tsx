
import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Loader2, LogOut, Calendar as CalendarIcon, LayoutGrid, Mail, Phone, X, Diamond, Zap, LogIn, Crown, CheckCircle2, Clock, Flame, Timer, ArrowRight, LifeBuoy, BookOpen, CreditCard, AlertCircle, Info, Lightbulb, MessageCircle, Gift, AlertOctagon, BellRing, MessageSquarePlus, CreditCard as PlansIcon, ShieldCheck, Key, ExternalLink, Star, Fingerprint, Lock } from 'lucide-react';
import { Logo } from './components/Logo';
import { Ingredient, ShoppingItem, UserPreferences, Category, Recipe, Pantry, MealLog, RecipeGenerationOptions } from './types';
import SignInView from './components/SignInView';
import LandingView from './components/LandingView';
import ChefChat from './components/ChefChat';
import { generateSmartRecipes } from './services/geminiService';
import { StudioDiscovery } from './components/StudioDiscovery';
import { autoCategorize } from './components/PantryView';

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
  chefPersonality: 'Strict',
  generationsCount: 4,
  twoFactorEnabled: false,
  betaReasoningEnabled: false,
  onboardingCompleted: false
};

const PageLoader = () => (
  <div className="flex flex-col h-[50vh] w-full items-center justify-center p-8 text-center animate-fade-in">
    <div className="relative mb-8">
      <Loader2 className="animate-spin text-primary-500" size={48} />
      <Logo className="w-8 h-8 absolute inset-0 m-auto opacity-20" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Initializing Studio Link...</span>
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Security Handshake States
  const [isKeySelectionRequired, setIsKeySelectionRequired] = useState(false);
  const [isSecurityVerifying, setIsSecurityVerifying] = useState(false);
  
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const checkSecurity = async () => {
        if (currentUserEmail) {
            setIsSecurityVerifying(true);
            try {
              // Safety: check if API is available before calling
              const studio = (window as any).aistudio;
              if (studio && typeof studio.hasSelectedApiKey === 'function') {
                const hasKey = await studio.hasSelectedApiKey();
                setIsKeySelectionRequired(!hasKey);
                
                if (hasKey && !preferences.onboardingCompleted && location.pathname !== '/') {
                    setShowDiscovery(true);
                }
              } else {
                console.warn("AI Studio context not detected. Bypassing security wall.");
                setIsKeySelectionRequired(false);
              }
            } catch (err) {
              console.error("Security handshake error", err);
              setIsKeySelectionRequired(false); // Fail open to avoid black-screen lockdown
            } finally {
              // Slight delay for visual transition smoothness
              setTimeout(() => setIsSecurityVerifying(false), 300);
            }
        }
    };
    checkSecurity();
  }, [currentUserEmail, preferences.onboardingCompleted, location.pathname]);

  const handleOpenKeySelector = async () => {
    try {
        await (window as any).aistudio.openSelectKey();
        setIsKeySelectionRequired(false);
        showToast("Studio Security Authenticated.", "success");
        if (!preferences.onboardingCompleted) setShowDiscovery(true);
    } catch (e) {
        console.error("Key selection failed", e);
    }
  };

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

  const activePantry = useMemo(() => {
    return pantries.find(p => p.id === activePantryId) || { id: 'default', name: 'Main Kitchen', items: [] };
  }, [pantries, activePantryId]);

  const checkAccess = (actionName: string = "To use this feature", featureType: 'basic' | 'planner' | 'logging' | 'generate' | 'shopping_export' = 'basic'): boolean => {
    if (!currentUserEmail) {
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
        return false;
    }
    return true;
  };

  const handleSignIn = (name: string, email: string, options: { startTrial?: boolean, goal?: string, plan?: string } = {}) => {
      const normalizedEmail = email.toLowerCase().trim();
      const prefix = `ks_user_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}_`;
      const existingPrefsStr = localStorage.getItem(`${prefix}prefs`);
      let newPrefs: UserPreferences = existingPrefsStr ? JSON.parse(existingPrefsStr) : { ...DEFAULT_PREFS };
      
      newPrefs.userName = name;
      newPrefs.email = normalizedEmail;

      if (options.startTrial && !newPrefs.trialUsed) {
          newPrefs.subscriptionTier = 'none'; 
          newPrefs.isProMember = false; 
          newPrefs.trialUsed = true;
          newPrefs.trialStartedAt = new Date().toISOString();
          (newPrefs as any).selectedGoal = options.goal;
      }

      localStorage.setItem(`${prefix}prefs`, JSON.stringify(newPrefs));
      localStorage.setItem('ks_session_email', normalizedEmail);
      setCurrentUserEmail(normalizedEmail);
      setPreferences(newPrefs);
      setIsAuthModalOpen(false);
      setShowLanding(false);
      navigate('/studio');
      showToast(`Welcome, ${name}! Studio initialized.`);
  };
  
  const handleSignOut = () => { localStorage.removeItem('ks_session_email'); setCurrentUserEmail(null); setShowLanding(true); setIsInitialized(false); navigate('/'); };
  
  const setActivePantryItems: React.Dispatch<React.SetStateAction<Ingredient[]>> = (value) => { 
    setPantries(prev => prev.map(p => { 
        if (p.id === activePantryId) return { ...p, items: typeof value === 'function' ? (value as any)(p.items) : value }; 
        return p; 
    })); 
  };

  const handleAddPantry = (name: string) => { if (!checkAccess("To create studios", 'basic')) return; const newPantry: Pantry = { id: Date.now().toString(), name, items: [] }; setPantries(prev => [...prev, newPantry]); setActivePantryId(newPantry.id); };
  
  const addMissingToShopping = (items: string[]) => { 
    if (!checkAccess("To export lists", 'basic')) return;
    if (items.length === 0) {
        showToast("No missing items to add", 'info');
        return;
    }
    
    const newItems: ShoppingItem[] = items.map(name => ({
        id: Math.random().toString(),
        name: name,
        category: autoCategorize(name),
        checked: false
    }));

    setShoppingList(prev => [...newItems, ...prev]); 
    showToast(`${items.length} items added to cart`, 'success');
  };

  const handleMoveToPantry = (item: ShoppingItem) => {
    const newPantryItem: Ingredient = {
      id: Date.now().toString() + Math.random(),
      name: item.name,
      category: item.category === Category.OTHER ? autoCategorize(item.name) : item.category as Category,
      quantity: '1 unit',
      addedDate: new Date().toISOString().split('T')[0]
    };
    
    setPantries(prev => prev.map(p => {
        if (p.id === activePantryId) {
            return { ...p, items: [newPantryItem, ...p.items] };
        }
        return p;
    }));
    
    showToast(`${item.name} integrated into pantry`);
  };

  const handleGenerateRecipes = async (options: RecipeGenerationOptions) => {
    if (!checkAccess("To generate recipes", 'generate')) return;
    setIsGeneratingRecipes(true);
    try {
      const recipes = await generateSmartRecipes(activePantry.items, preferences, options, savedRecipes);
      setGeneratedRecipes(recipes || []);
      if(recipes && recipes.length > 0) {
        showToast(`${recipes.length} curations synthesized`, 'success');
      } else {
        showToast("Studio logic found no matches", 'info');
      }
    } catch (e) {
      console.error("Generation failed", e);
      showToast("Sync link failed.", 'error');
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
    showToast("Consumption logged", 'success');
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
    showToast(`Scheduled: ${recipe.title}`, 'success');
  };

  const handleToggleSave = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      if (exists) {
          showToast("Archived item removed", 'info');
          return prev.filter(r => r.id !== recipe.id);
      }
      showToast("Curation archived", 'success');
      return [recipe, ...prev];
    });
  };

  const handleUpdateRecipe = (recipeId: string, updatedData: Partial<Recipe>) => {
    setGeneratedRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, ...updatedData } : r));
    setSavedRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, ...updatedData } : r));
    if (activeRecipe?.id === recipeId) {
      setActiveRecipe(prev => prev ? { ...prev, ...updatedData } : null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e1a] font-sans transition-colors duration-500 flex flex-col overflow-x-hidden">
      
      {/* SECURITY OVERLAY: ENHANCED THEMED LOADING */}
      {isSecurityVerifying && (
          <div className="fixed inset-0 z-[3000] bg-[#0c1220] flex flex-col items-center justify-center animate-fade-in transition-all">
              <div className="relative mb-12 transform scale-125">
                  <div className="absolute -inset-16 bg-primary-500/10 blur-[80px] rounded-full animate-pulse-soft"></div>
                  <div className="relative z-10 p-1">
                    <Loader2 className="animate-spin text-primary-400" size={80} strokeWidth={1.5} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Logo className="w-10 h-10 opacity-30" />
                    </div>
                  </div>
              </div>
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em] mb-2 font-serif">Initializing</h2>
                <div className="flex items-center justify-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-6 animate-pulse">Establishing encrypted Studio link...</p>
              </div>
          </div>
      )}

      {showLanding && location.pathname !== '/about' ? (
        <LandingView onStart={() => {setShowLanding(false); navigate('/studio');}} onSignIn={() => {setAuthModalMode('signup'); setIsAuthModalOpen(true);}} onSignOut={handleSignOut} currentUser={currentUserEmail} />
      ) : (
        <>
          {/* STUDIO LOCK: REDESIGNED SECURITY GATEWAY */}
          {isKeySelectionRequired && !isSecurityVerifying && (
              <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center p-8 animate-fade-in text-center overflow-y-auto">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[120px]"></div>

                  <div className="max-w-xl w-full space-y-12 relative z-10 py-12">
                      <div className="flex flex-col items-center gap-8">
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] text-slate-950 dark:text-white border-[4px] border-primary-500 shadow-[20px_20px_0px_0px_rgba(176,141,106,0.2)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all group">
                            <Logo className="w-20 h-20 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2">
                           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500">
                               <Fingerprint size={14} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Environment Locked</span>
                           </div>
                           <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Studio Auth</h1>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                          <h2 className="text-3xl font-black text-primary-400 font-serif leading-tight">
                              Private Instance Required.
                          </h2>
                          <p className="text-slate-400 font-medium leading-relaxed text-lg px-4">
                              To ensure your culinary manifests remain private and high-fidelity, you must authenticate your personal AI link once.
                          </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-3">
                              <div className="flex items-center gap-3 text-white font-black uppercase text-[9px] tracking-widest">
                                  <ShieldCheck size={16} className="text-emerald-500" /> Vault Security
                              </div>
                              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                  Your credentials are never stored. Logic is processed in your local sandbox.
                              </p>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-3">
                              <div className="flex items-center gap-3 text-white font-black uppercase text-[9px] tracking-widest">
                                  <Zap size={16} className="text-amber-500" /> Instant Setup
                              </div>
                              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                  Link your Google Gemini key once to unlock VEO and Synthesis Pro.
                              </p>
                          </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={handleOpenKeySelector}
                          className="w-full py-8 bg-primary-500 hover:bg-primary-600 border-[4px] border-slate-950 dark:border-slate-800 rounded-[2.5rem] font-black text-white text-xl uppercase tracking-[0.4em] shadow-[0px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-2 transition-all flex items-center justify-center gap-4 active:scale-95"
                        >
                          <Lock size={24} /> Establish Link
                        </button>
                        <button 
                          onClick={handleSignOut}
                          className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors py-4"
                        >
                          Return to Terminal
                        </button>
                      </div>
                  </div>
              </div>
          )}

          {showDiscovery && (
              <StudioDiscovery onComplete={() => {
                  setShowDiscovery(false);
                  setPreferences(prev => ({ ...prev, onboardingCompleted: true }));
                  showToast("Onboarding cycle complete.", "success");
              }} />
          )}

          <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-[#0c1220]/80 border-b border-slate-200 dark:border-slate-800/50 z-50 flex items-center justify-between px-4 md:px-8 backdrop-blur-xl transition-all">
              <div onClick={() => {setShowLanding(true); navigate('/');}} className="flex items-center gap-2.5 cursor-pointer group">
                <div className="p-1.5 bg-primary-400 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg"><Logo className="w-7 h-7" /></div>
                <div className="flex flex-col">
                  <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tighter leading-none">Prepzu</span>
                </div>
              </div>
              <nav className="flex items-center gap-1 md:gap-2">
                  <NavLink to="/pantry" id="nav-inventory" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><HomeIcon size={20} className="md:hidden" /><span className="hidden md:inline">Inventory</span></NavLink>
                  <NavLink to="/studio" id="nav-studio" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><Sparkles size={20} className="md:hidden" /><span className="hidden md:inline">Studio</span></NavLink>
                  <NavLink to="/calendar" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><CalendarIcon size={20} className="md:hidden" /><span className="hidden md:inline">Planner</span></NavLink>
                  <NavLink to="/shopping" id="nav-cart" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><ShoppingBag size={20} className="md:hidden" /><span className="hidden md:inline">Cart</span></NavLink>
                  <NavLink to="/plans" className={({isActive}) => `p-2.5 md:px-4 lg:px-5 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><Zap size={20} className="md:hidden" /><span className="hidden md:inline">Plans</span></NavLink>
              </nav>
              <div className="flex items-center gap-1 md:gap-3">
                  {!preferences.isProMember && currentUserEmail && (
                    <button 
                      onClick={() => navigate('/plans')}
                      className="hidden sm:flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all mr-2"
                    >
                      <Crown size={14} /> Join Pro
                    </button>
                  )}
                  {!currentUserEmail && (
                    <button 
                      onClick={() => { setAuthModalMode('signup'); setIsAuthModalOpen(true); }}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:scale-105 transition-all"
                    >
                      Sign Up
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
                <Route path="/calendar" element={<CalendarView mealHistory={mealHistory} savedRecipes={savedRecipes} preferences={preferences} pantryItems={activePantry.items} onScheduleMeal={handleScheduleMeal} setMealHistory={setMealHistory} onUpdateMealStatus={(id, status) => setMealHistory(prev => prev.map(m => m.id === id ? {...m, status} : m))} onDeleteMealLog={(id) => setMealHistory(prev => prev.filter(m => m.id !== id))} onAddToShoppingList={addMissingToShopping} setActiveRecipe={setActiveRecipe} onRequireAccess={(a) => checkAccess(a, 'basic')} />} />
                <Route path="/recipes" element={<RecipeView pantryItems={activePantry.items} setPantryItems={setActivePantryItems} preferences={preferences} onAddToShoppingList={addMissingToShopping} savedRecipes={savedRecipes} onToggleSave={handleToggleSave} mealHistory={mealHistory} onLogMeal={handleLogMeal} selectedRecipe={activeRecipe} setSelectedRecipe={setActiveRecipe} cookingMode={isCookingMode} setCookingMode={setIsCookingMode} currentStep={cookingStep} setCurrentStep={setCookingStep} activeTab={recipeTab} setActiveTab={setRecipeTab} onScheduleMeal={handleScheduleMeal} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onUpdateRecipe={handleUpdateRecipe} />} />
                <Route path="/shopping" element={<ShoppingListView items={shoppingList} setItems={setShoppingList} moveToPantry={handleMoveToPantry} pantryItems={activePantry.items} preferences={preferences} mealHistory={mealHistory} onRequireAccess={(a, t) => checkAccess(a, t as any)} onSaveConcept={handleUpdateRecipe as any} />} />
                <Route path="/plans" element={<PlansView preferences={preferences} />} />
                <Route path="/settings" element={<SettingsView preferences={preferences} setPreferences={setPreferences} mealHistory={mealHistory} pantries={pantries} setPantries={setPantries} onSignOut={handleSignOut} onGoToLanding={() => setShowLanding(true)} showToast={showToast} />} />
                <Route path="/about" element={<AboutView />} />
            </Routes></Suspense>
          </main>
          
          <button 
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-8 right-8 z-[100] p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl shadow-primary-500/20 hover:scale-110 active:scale-95 transition-all group"
          >
            <MessageSquarePlus size={28} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
          </button>
          
          <ChefChat 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            pantryItems={activePantry.items}
            activeRecipe={activeRecipe}
          />
        </>
      )}

      {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] animate-slide-up">
              <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : toast.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' : 'bg-slate-900/90 text-white border-slate-700'}`}>
                  {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
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
