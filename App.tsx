import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, Settings, Home as HomeIcon, Sparkles, Loader2, LogOut, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import { Logo } from './components/Logo';
import { Ingredient, ShoppingItem, UserPreferences, Category, Recipe, Pantry, MealLog, RecipeGenerationOptions } from './types';
import SignInView from './components/SignInView';
import LandingView from './components/LandingView';
import { generateSmartRecipes, generateRecipeImage } from './services/geminiService';

const DashboardView = lazy(() => import('./components/DashboardView'));
const PantryView = lazy(() => import('./components/PantryView'));
const RecipeView = lazy(() => import('./components/RecipeView'));
const ShoppingListView = lazy(() => import('./components/ShoppingListView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const AboutView = lazy(() => import('./components/AboutView'));

const DEFAULT_INITIAL_ITEMS: Ingredient[] = [
  { id: '1', name: 'Eggs', category: Category.DAIRY, quantity: '6 large', addedDate: '2023-10-25' },
  { id: '2', name: 'Spinach', category: Category.PRODUCE, quantity: '1 bag', addedDate: '2023-10-26' },
  { id: '3', name: 'Chicken', category: Category.MEAT, quantity: '2 lbs', addedDate: '2023-10-27' },
];

const DEFAULT_PREFS: UserPreferences = {
  darkMode: true,
  isProMember: false,
  dietaryRestrictions: [],
  cuisinePreferences: [],
  allergies: [],
  appliances: ['Oven', 'Stove', 'Air Fryer'],
  skillLevel: 'Intermediate',
  strictness: 'Flexible',
  isKosher: false,
  healthGoal: 'Maintain',
  nutritionalGoals: { maxCaloriesPerMeal: '', minProteinPerMeal: '' },
  measurementSystem: 'Imperial',
  emailNotifications: true
};

const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <Loader2 className="animate-spin text-primary-500" size={40} />
  </div>
);

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('ks_session_email');
  });

  const [showLanding, setShowLanding] = useState(() => !sessionStorage.getItem('ks_studio_entered'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
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
    const user = currentUserEmail || 'guest';
    const prefix = `ks_user_${user}_`;
    
    const savedPantries = localStorage.getItem(`${prefix}pantries`);
    const savedShop = localStorage.getItem(`${prefix}shopping`);
    const savedRec = localStorage.getItem(`${prefix}recipes`);
    const savedHist = localStorage.getItem(`${prefix}history`);
    const savedPrefs = localStorage.getItem(`${prefix}prefs`);

    if (savedPantries) {
      const parsed = JSON.parse(savedPantries);
      setPantries(parsed);
      if (parsed.length > 0) setActivePantryId(parsed[0].id);
    } else {
      setPantries([{ id: 'default', name: 'Main Kitchen', items: DEFAULT_INITIAL_ITEMS }]);
    }

    if (savedShop) setShoppingList(JSON.parse(savedShop));
    else setShoppingList([]);

    if (savedRec) setSavedRecipes(JSON.parse(savedRec));
    else setSavedRecipes([]);

    if (savedHist) setMealHistory(JSON.parse(savedHist));
    else setMealHistory([]);

    if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
    else setPreferences(DEFAULT_PREFS);

  }, [currentUserEmail]);

  useEffect(() => {
    const user = currentUserEmail || 'guest';
    const prefix = `ks_user_${user}_`;
    
    localStorage.setItem(`${prefix}pantries`, JSON.stringify(pantries));
    localStorage.setItem(`${prefix}shopping`, JSON.stringify(shoppingList));
    localStorage.setItem(`${prefix}recipes`, JSON.stringify(savedRecipes));
    localStorage.setItem(`${prefix}history`, JSON.stringify(mealHistory));
    localStorage.setItem(`${prefix}prefs`, JSON.stringify(preferences));
  }, [pantries, shoppingList, savedRecipes, mealHistory, preferences, currentUserEmail]);

  useEffect(() => {
    if (preferences.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [preferences.darkMode]);

  const activePantry = pantries.find(p => p.id === activePantryId) || pantries[0] || { items: [] };
  const activeItems = activePantry.items || [];

  const handleGenerateRecipes = async (options: RecipeGenerationOptions) => {
    setIsGeneratingRecipes(true);
    try {
      const recipes = await generateSmartRecipes(activeItems, preferences, options);
      setGeneratedRecipes(recipes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const handleSignIn = (name: string, email: string, isKosher: boolean, emailNotifications: boolean) => {
      localStorage.setItem('ks_session_email', email.toLowerCase());
      setCurrentUserEmail(email.toLowerCase());
      
      const userPrefix = `ks_user_${email.toLowerCase()}_`;
      const hasPrefs = localStorage.getItem(`${userPrefix}prefs`);

      setPreferences(prev => ({ 
          ...prev, 
          userName: name, 
          isKosher, 
          emailNotifications,
          email: email.toLowerCase(),
          // Start 3-day free trial for new signs-ups
          trialStartedAt: !hasPrefs ? new Date().toISOString() : prev.trialStartedAt,
          isProMember: !hasPrefs ? true : prev.isProMember,
          subscriptionTier: !hasPrefs ? 'pro' : prev.subscriptionTier
      }));
      
      setIsAuthModalOpen(false);
      setShowLanding(false);
      sessionStorage.setItem('ks_studio_entered', 'true');
      navigate('/pantry');
  };
  
  const handleStartWithoutAuth = () => {
    setShowLanding(false);
    sessionStorage.setItem('ks_studio_entered', 'true');
    navigate('/pantry');
  };

  const handleSignOut = () => {
     localStorage.removeItem('ks_session_email');
     setCurrentUserEmail(null);
     setShowLanding(true);
     sessionStorage.removeItem('ks_studio_entered');
     navigate('/');
  };

  const handleLogMeal = (recipe: Recipe) => {
    const newLog: MealLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      mealType: 'Dinner',
      recipeTitle: recipe.title,
      recipeId: recipe.id,
      calories: recipe.calories,
      status: 'completed'
    };
    setMealHistory(prev => [...prev, newLog]);
  };

  const handleToggleSaveRecipe = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const isSaved = prev.some(r => r.id === recipe.id);
      if (isSaved) return prev.filter(r => r.id !== recipe.id);
      return [...prev, recipe];
    });
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

  const isAboutPage = location.pathname === '/about';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500 flex flex-col">
      {showLanding && !isAboutPage ? (
        <LandingView onStart={handleStartWithoutAuth} onSignIn={() => setIsAuthModalOpen(true)} currentUser={currentUserEmail} />
      ) : (
        <>
          <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/50 z-50 flex items-center justify-between px-4 md:px-12 backdrop-blur-xl">
             <div onClick={() => setShowLanding(true)} className="flex items-center gap-2.5 cursor-pointer group">
                 <div className="p-1.5 bg-primary-400 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg">
                    <Logo className="w-7 h-7" />
                 </div>
                 <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tighter hidden sm:inline">Savor Studio</span>
             </div>

             <nav className="flex items-center gap-1 md:gap-2">
                 <NavLink to="/pantry" className={({isActive}) => `p-2.5 md:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900 dark:hover:text-primary-300'}`}>
                    <HomeIcon size={20} className="md:hidden" />
                    <span className="hidden md:inline">Inventory</span>
                 </NavLink>
                 <NavLink to="/studio" className={({isActive}) => `p-2.5 md:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900 dark:hover:text-primary-300'}`}>
                    <div className="relative">
                        <Sparkles size={20} className="md:hidden" />
                        {isGeneratingRecipes && <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full animate-pulse md:hidden" />}
                    </div>
                    <span className="hidden md:inline flex items-center gap-2">
                        Studio 
                        {isGeneratingRecipes && <Loader2 size={12} className="animate-spin text-accent-500" />}
                    </span>
                 </NavLink>
                 <NavLink to="/calendar" className={({isActive}) => `p-2.5 md:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900 dark:hover:text-primary-300'}`}>
                    <CalendarIcon size={20} className="md:hidden" />
                    <span className="hidden md:inline">Planner</span>
                 </NavLink>
                 <NavLink to="/shopping" className={({isActive}) => `p-2.5 md:px-6 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900 dark:hover:text-primary-300'}`}>
                    <ShoppingBag size={20} className="md:hidden" />
                    <span className="hidden md:inline">Cart</span>
                 </NavLink>
             </nav>

             <div className="flex items-center gap-1 md:gap-3">
                <NavLink to="/settings" className={({isActive}) => `p-2.5 rounded-xl transition-all ${isActive ? 'text-primary-600 bg-slate-100 dark:bg-slate-900/40' : 'text-slate-400 hover:text-slate-900 dark:hover:text-primary-300'}`}>
                    <Settings size={20} />
                </NavLink>
             </div>
          </header>

          <main className="max-w-4xl mx-auto p-4 md:p-12 pt-24 md:pt-32 flex-1 w-full">
            <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<PantryView pantries={pantries} activePantryId={activePantryId} setActivePantryId={setActivePantryId} onAddPantry={handleAddPantry} items={activeItems} setItems={setActivePantryItems} />} />
                  <Route path="/pantry" element={<PantryView pantries={pantries} activePantryId={activePantryId} setActivePantryId={setActivePantryId} onAddPantry={handleAddPantry} items={activeItems} setItems={setActivePantryItems} />} />
                  <Route path="/studio" element={<DashboardView pantryItems={activeItems} mealHistory={mealHistory} preferences={preferences} savedRecipes={savedRecipes} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} onLogMeal={handleLogMeal} setActiveRecipe={setActiveRecipe} onToggleSave={handleToggleSaveRecipe} isGenerating={isGeneratingRecipes} onGenerate={handleGenerateRecipes} />} />
                  <Route path="/calendar" element={<CalendarView mealHistory={mealHistory} savedRecipes={savedRecipes} preferences={preferences} />} />
                  <Route path="/recipes" element={<RecipeView pantryItems={activeItems} setPantryItems={setActivePantryItems} preferences={preferences} onAddToShoppingList={() => {}} savedRecipes={savedRecipes} onToggleSave={handleToggleSaveRecipe} mealHistory={mealHistory} onLogMeal={handleLogMeal} onScheduleMeal={() => {}} generatedRecipes={generatedRecipes} setGeneratedRecipes={setGeneratedRecipes} selectedRecipe={activeRecipe} setSelectedRecipe={setActiveRecipe} cookingMode={isCookingMode} setCookingMode={setIsCookingMode} currentStep={cookingStep} setCurrentStep={setCookingStep} activeTab={recipeTab} setActiveTab={setRecipeTab} />} />
                  <Route path="/shopping" element={<ShoppingListView items={shoppingList} setItems={setShoppingList} moveToPantry={(item) => {
                      const newItem: Ingredient = { id: Math.random().toString(), name: item.name, category: item.category, quantity: '1', addedDate: new Date().toISOString() };
                      setActivePantryItems(prev => [...prev, newItem]);
                  }} pantryItems={activeItems} mealHistory={mealHistory} />} />
                  <Route path="/settings" element={<SettingsView preferences={preferences} setPreferences={setPreferences} mealHistory={mealHistory} onSignOut={handleSignOut} onGoToLanding={() => setShowLanding(true)} />} />
                  <Route path="/about" element={<AboutView />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
          </main>
        </>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <SignInView onSignIn={handleSignIn} onClose={() => setIsAuthModalOpen(false)} isModal />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}