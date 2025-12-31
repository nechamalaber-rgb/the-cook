
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, Flame, ChevronRight, ArrowLeft, ArrowRight, Play, CheckCircle, Heart, Loader2, Utensils, History, Activity, X, Eye, Scan, Sparkles, ChefHat as ChefIcon, AlertTriangle, Plus } from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, Category } from '../types';
import { parseRecipeFromImage } from '../services/geminiService';

const categorizeIngredient = (name: string): Category => {
    const lower = name.toLowerCase();
    if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper|salad|berry|lemon|lime|herb|cilantro|parsley|kale|broccoli|cabbage|cucumber|mushroom/)) return Category.PRODUCE;
    if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy|curd|sour cream|parmesan|mozzarella|cheddar|brie/)) return Category.DAIRY;
    if (lower.match(/chicken|beef|pork|meat|fish|salmon|tuna|steak|sausage|bacon|turkey|shrimp|lamb|prawn|tilapia/)) return Category.MEAT;
    if (lower.match(/frozen|ice|pizza|nugget|peas|sorbet|gelato/)) return Category.FROZEN;
    if (lower.match(/water|soda|juice|beer|wine|coffee|tea|drink|sparkling/)) return Category.BEVERAGE;
    return Category.PANTRY; // Default to pantry for staples like oil, flour, spices, etc.
};

const formatFractions = (text: string) => {
  return text
    .replace(/1\/2/g, '½')
    .replace(/1\/4/g, '¼')
    .replace(/3\/4/g, '¾')
    .replace(/1\/3/g, '⅓')
    .replace(/2\/3/g, '⅔')
    .replace(/1\/8/g, '⅛')
    .replace(/\s½/g, '½') 
    .replace(/\s¼/g, '¼')
    .replace(/\s¾/g, '¾');
};

const formatInstruction = (step: string) => {
    const firstSpaceIndex = step.indexOf(' ');
    if (firstSpaceIndex === -1) return <strong className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{step}</strong>;
    const verb = step.substring(0, firstSpaceIndex);
    const rest = step.substring(firstSpaceIndex);
    return (
        <span>
            <strong className="font-black text-slate-900 dark:text-white uppercase tracking-tight mr-1">{verb}</strong>
            <span className="text-slate-600 dark:text-slate-300">{formatFractions(rest)}</span>
        </span>
    );
};

interface RecipeViewProps {
  pantryItems: Ingredient[];
  setPantryItems: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  preferences: UserPreferences;
  onAddToShoppingList: (items: string[]) => void;
  savedRecipes: Recipe[];
  onToggleSave: (recipe: Recipe) => void;
  mealHistory: MealLog[];
  onLogMeal: (recipe: Recipe) => void;
  onScheduleMeal: (recipe: Recipe, date: string, mealType: string) => void; 
  generatedRecipes: Recipe[];
  setGeneratedRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;
  cookingMode: boolean;
  setCookingMode: React.Dispatch<React.SetStateAction<boolean>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  activeTab: 'discover' | 'saved';
  setActiveTab: React.Dispatch<React.SetStateAction<'discover' | 'saved'>>;
}

const RecipeView: React.FC<RecipeViewProps> = ({ 
  pantryItems,
  setPantryItems, 
  preferences, 
  onAddToShoppingList,
  savedRecipes,
  onToggleSave,
  onLogMeal,
  selectedRecipe,
  setSelectedRecipe,
  cookingMode,
  setCookingMode,
  currentStep,
  setCurrentStep,
  activeTab,
  setActiveTab
}) => {
  const navigate = useNavigate();
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const [isScanningRecipe, setIsScanningRecipe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCooking = () => {
    setCookingMode(true);
    setCurrentStep(0);
  };

  const categorizedIngredients = useMemo(() => {
    if (!selectedRecipe) return {};
    const groups: Record<string, string[]> = {};
    selectedRecipe.ingredients.forEach(ing => {
        const cat = categorizeIngredient(ing);
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(ing);
    });
    return groups;
  }, [selectedRecipe]);

  const handleFinishCooking = () => {
    if (!selectedRecipe) return;
    setUpdatingInventory(true);
    onLogMeal(selectedRecipe);
    const updatedPantry = pantryItems.filter(pItem => {
        const isUsed = selectedRecipe.ingredients.some(rIng => 
            rIng.toLowerCase().includes(pItem.name.toLowerCase()) || 
            pItem.name.toLowerCase().includes(rIng.toLowerCase())
        );
        return !isUsed;
    });
    setTimeout(() => {
        setPantryItems(updatedPantry);
        setUpdatingInventory(false);
        setCookingMode(false);
        setSelectedRecipe(null);
        navigate('/pantry');
    }, 800);
  };

  const handleGoBackToMenu = () => {
    setSelectedRecipe(null);
    navigate('/studio');
  };

  return (
    <div className="animate-fade-in pb-24 min-h-screen">
      {!selectedRecipe ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-slate-200 dark:border-slate-800 shadow-inner"><ChefIcon size={48} /></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-serif mb-4">No Recipe Selected</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm font-bold uppercase text-xs tracking-widest leading-relaxed mb-10">Select a meal from your Kitchen Studio to begin.</p>
              <div className="flex flex-col sm:flex-row gap-4"><button onClick={() => navigate('/studio')} className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"><Sparkles size={18} /> New Menu</button><button onClick={() => navigate('/studio')} className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg border border-slate-200 dark:border-slate-800 hover:scale-105 active:scale-95 transition-all"><Heart size={18} /> My Saved</button></div>
          </div>
      ) : cookingMode ? (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in text-white">
            <div className="px-8 py-8 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-slate-800"><div><h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Step {currentStep + 1} of {selectedRecipe.instructions.length}</h2><h1 className="text-xl font-black text-white font-serif truncate max-w-[200px] sm:max-w-md">{selectedRecipe.title}</h1></div><button onClick={() => setCookingMode(false)} className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all shadow-xl"><X size={24} /></button></div>
            <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 text-center overflow-y-auto">{updatingInventory ? (<div className="text-center animate-fade-in"><Loader2 size={64} className="animate-spin text-primary-500 mx-auto mb-8" /><h2 className="text-4xl font-black mb-2 font-serif text-white tracking-tighter">Updating Stock...</h2><p className="text-slate-400 font-black uppercase text-xs tracking-widest">Inventory Logistics in progress</p></div>) : (<><div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-3xl font-black text-primary-500 mb-10 border border-slate-800 shadow-2xl">{currentStep + 1}</div><p className="text-3xl md:text-5xl font-black leading-tight md:leading-snug mb-8 font-serif px-4 max-w-4xl">{formatInstruction(selectedRecipe.instructions[currentStep])}</p></>)}</div>
            {!updatingInventory && (<div className="p-8 pb-12 bg-slate-900/50 backdrop-blur-md border-t border-slate-800"><div className="flex gap-4 max-w-2xl mx-auto"><button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex-1 py-6 rounded-3xl bg-slate-800 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"><ArrowLeft size={18}/> Back</button>{currentStep < selectedRecipe.instructions.length - 1 ? (<button onClick={() => setCurrentStep(currentStep + 1)} className="flex-[2] py-6 rounded-3xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-95">Next Step <ArrowRight size={18}/></button>) : (<button onClick={handleFinishCooking} className="flex-[2] py-6 rounded-3xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95">Finalize & Log <CheckCircle size={18}/></button>)}</div></div>)}
        </div>
      ) : (
        <div className="rounded-[3rem] shadow-2xl overflow-hidden bg-white dark:bg-slate-900 pb-12 border border-slate-100 dark:border-slate-800 relative animate-fade-in">
            <div className="p-8 md:p-12 bg-slate-900 text-white min-h-[400px] flex flex-col justify-end relative">
                {selectedRecipe.imageUrl && <img src={selectedRecipe.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <button onClick={handleGoBackToMenu} className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all border border-white/10"><ArrowLeft size={16}/> Menu</button>
                        <button onClick={() => onToggleSave(selectedRecipe)} className={`p-4 rounded-2xl backdrop-blur-md transition-all shadow-xl ${savedRecipes.some(r => r.id === selectedRecipe.id) ? 'bg-white text-rose-500' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}><Heart size={24} fill={savedRecipes.some(r => r.id === selectedRecipe.id) ? "currentColor" : "none"} /></button>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black font-serif leading-tight max-w-3xl mb-10 tracking-tighter">{selectedRecipe.title}</h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md"><Clock size={18} className="text-primary-400" /><span className="text-xs font-black uppercase tracking-widest">{selectedRecipe.timeMinutes} MINS</span></div>
                        <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md"><Activity size={18} className="text-emerald-400" /><span className="text-xs font-black uppercase tracking-widest">{selectedRecipe.difficulty} LEVEL</span></div>
                        <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md"><Flame size={18} className="text-rose-400" /><span className="text-xs font-black uppercase tracking-widest">{selectedRecipe.calories || '450'} KCAL</span></div>
                    </div>
                </div>
            </div>
            
            <div className="p-8 md:p-12">
                
                {selectedRecipe.missingIngredients && selectedRecipe.missingIngredients.length > 0 && (
                    <div className="mb-12 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-down shadow-inner">
                        <div className="flex-1">
                            <h3 className="text-amber-800 dark:text-amber-400 font-black text-lg flex items-center gap-2 font-serif">
                                <AlertTriangle size={24} />
                                Pantry Shortage
                            </h3>
                            <p className="text-amber-700 dark:text-amber-500 text-sm font-medium mt-1 leading-relaxed">
                                You're missing items for this specific request: 
                                <span className="font-bold ml-1">{selectedRecipe.missingIngredients.join(', ')}</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => onAddToShoppingList(selectedRecipe.missingIngredients)}
                            className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform whitespace-nowrap flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Missing to Cart
                        </button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-6 mb-16">
                    <button onClick={startCooking} className="flex-[2] py-6 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary-900/20 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"><Play fill="currentColor" size={20} /> Enter Cook Mode</button>
                    <button onClick={handleFinishCooking} disabled={updatingInventory} className="flex-1 py-6 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">{updatingInventory ? <Loader2 className="animate-spin"/> : <CheckCircle size={18} />} Mark as Cooked</button>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-slate-900 dark:text-white font-serif uppercase tracking-tight"><Utensils className="text-primary-600" size={28}/> Studio Palette</h3>
                        <div className="space-y-8">
                            {Object.keys(categorizedIngredients).length > 0 ? Object.entries(categorizedIngredients).map(([cat, ings]) => (
                                <div key={cat} className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2 border-l-2 border-primary-500">{cat}</h4>
                                    <ul className="space-y-2">
                                        {(ings as string[]).map((ing, i) => (
                                            <li key={i} className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-4 shadow-sm transition-all hover:border-primary-200">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0"></div>
                                                {formatFractions(ing)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )) : (
                                <ul className="space-y-4">
                                    {selectedRecipe.ingredients.map((ing, i) => (
                                        <li key={i} className="p-5 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center gap-4 shadow-sm"><div className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></div>{formatFractions(ing)}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
                            <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                                    <Sparkles size={14} /> Optional Upgrades (Still Easy)
                                </h4>
                                <ul className="space-y-3">
                                    {selectedRecipe.tips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-slate-900 dark:text-white font-serif uppercase tracking-tight"><History className="text-primary-600" size={28}/> Studio Logic</h3>
                        <div className="space-y-10">
                            {selectedRecipe.instructions.map((step, i) => (
                                <div key={i} className="flex gap-6 group">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-600 font-black text-sm flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">{i+1}</div>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium pt-2 text-base">{formatInstruction(step)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RecipeView;
