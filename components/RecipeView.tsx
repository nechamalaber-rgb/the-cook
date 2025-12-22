import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, Flame, ChevronRight, ArrowLeft, ArrowRight, Play, CheckCircle, Heart, Loader2, Utensils, History, Activity, X, Eye, Scan, Sparkles, ChefHat as ChefIcon } from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog } from '../types';
import { parseRecipeFromImage } from '../services/geminiService';

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

  const handleRecipePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsScanningRecipe(true);
      try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((r) => {
              reader.onload = () => r((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
          });
          const recipe = await parseRecipeFromImage(base64);
          if (recipe && recipe.title) {
              const fullRecipe: Recipe = { id: `scanned-${Date.now()}`, title: recipe.title || "Scanned Recipe", description: recipe.description || "Digitized from photo.", ingredients: recipe.ingredients || [], instructions: recipe.instructions || [], timeMinutes: recipe.timeMinutes || 30, difficulty: 'Medium', missingIngredients: [], matchScore: 100 };
              onToggleSave(fullRecipe);
              setActiveTab('saved');
          }
      } catch (err) { alert("Could not read recipe."); } finally { setIsScanningRecipe(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

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
        // Navigate to inventory after cooking as requested previously
        navigate('/pantry');
    }, 800);
  };

  const handleGoBackToMenu = () => {
    setSelectedRecipe(null);
    // Explicitly navigate back to studio where the recipe list is
    navigate('/studio');
  };

  return (
    <div className="animate-fade-in pb-24 min-h-screen">
      {!selectedRecipe && (
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 px-1">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-serif">Kitchen Studio</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic text-sm">
                  {preferences.strictness === 'Strict' ? 'Strictly within your pantry.' : 'Finding culinary inspiration.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={isScanningRecipe} className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 flex items-center gap-2 shadow-sm">
                    {isScanningRecipe ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
                    <span>Scan Recipe</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleRecipePhoto} />
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-200 dark:border-slate-800 ml-2">
                    <button onClick={() => setActiveTab('discover')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'discover' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400'}`}>Discover</button>
                    <button onClick={() => setActiveTab('saved')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'saved' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400'}`}>Saved</button>
                </div>
            </div>
          </div>
      )}

      {!selectedRecipe ? (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-slate-200 dark:border-slate-800 shadow-inner">
                <ChefIcon size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-serif mb-4">No Recipe Selected</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium leading-relaxed mb-10">
                You've successfully finished your session! Tap below to generate a new menu or view your favorites.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/studio')}
                  className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Sparkles size={18} /> New Menu
                </button>
                <button 
                  onClick={() => setActiveTab('saved')}
                  className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
                >
                    <Heart size={18} /> My Saved
                </button>
            </div>
        </div>
      ) : cookingMode ? (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in text-white">
            <div className="px-6 py-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
                <div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step {currentStep + 1} of {selectedRecipe.instructions.length}</h2>
                    <h1 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">{selectedRecipe.title}</h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setCookingMode(false); }} className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all">
                        <X size={24} />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 text-center overflow-y-auto">
                {updatingInventory ? (
                    <div className="text-center animate-fade-in">
                        <Loader2 size={64} className="animate-spin text-primary-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold mb-2 font-serif text-white">Updating Inventory...</h2>
                        <p className="text-slate-400 font-medium italic">Subtracting ingredients from stock</p>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-3xl font-black text-primary-500 mb-8 border border-slate-800 shadow-xl">{currentStep + 1}</div>
                        <p className="text-3xl md:text-5xl font-bold leading-tight md:leading-snug mb-8 font-serif px-4">{formatInstruction(selectedRecipe.instructions[currentStep])}</p>
                    </>
                )}
            </div>
            {!updatingInventory && (
                <div className="p-6 pb-12 bg-slate-900/50 backdrop-blur-md border-t border-slate-800">
                    <div className="flex gap-4 max-w-2xl mx-auto">
                        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex-1 py-5 rounded-2xl bg-slate-800 text-white font-bold text-lg disabled:opacity-50 hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                            <ArrowLeft /> Back
                        </button>
                        {currentStep < selectedRecipe.instructions.length - 1 ? (
                            <button onClick={() => setCurrentStep(currentStep + 1)} className="flex-[2] py-5 rounded-2xl bg-primary-600 text-white font-black text-lg hover:bg-primary-500 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                                Next Step <ArrowRight />
                            </button>
                        ) : (
                            <button onClick={handleFinishCooking} className="flex-[2] py-5 rounded-2xl bg-green-600 text-white font-black text-lg hover:bg-green-500 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                                Done & Log Meal <CheckCircle />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
      ) : (
        <div className="rounded-[2.5rem] shadow-2xl overflow-hidden bg-white dark:bg-slate-900 pb-12 border border-slate-100 dark:border-slate-800 relative animate-fade-in">
            <div className="p-6 md:p-12 bg-slate-900 text-white min-h-[350px] flex flex-col justify-end relative">
                {selectedRecipe.imageUrl && <img src={selectedRecipe.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <button onClick={handleGoBackToMenu} className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/30 transition-all border border-white/10"><ArrowLeft size={16}/> Menu</button>
                        <div className="flex gap-2">
                            <button onClick={() => onToggleSave(selectedRecipe)} className={`p-3 rounded-full backdrop-blur-md transition-all shadow-xl ${savedRecipes.some(r => r.id === selectedRecipe.id) ? 'bg-white text-rose-500' : 'bg-white/20 text-white hover:bg-white/30 border border-white/10'}`}>
                                <Heart size={20} fill={savedRecipes.some(r => r.id === selectedRecipe.id) ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-5xl font-bold font-serif leading-tight max-w-2xl">{selectedRecipe.title}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-6">
                        <span className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm text-xs font-bold"><Clock size={14} className="text-primary-400" /> {selectedRecipe.timeMinutes}m</span>
                        <span className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm text-xs font-bold"><Activity size={14} className="text-primary-400" /> {selectedRecipe.difficulty}</span>
                        <span className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm text-xs font-bold"><Flame size={14} className="text-primary-400" /> {selectedRecipe.calories || '450'} KCAL</span>
                    </div>
                </div>
            </div>
            
            <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-4 mb-12">
                    <button onClick={startCooking} className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-primary-900/20 hover:bg-primary-700 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3">
                        <Play fill="currentColor" size={20} /> Start Interactive Studio
                    </button>
                    <button onClick={handleFinishCooking} disabled={updatingInventory} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                        {updatingInventory ? <Loader2 className="animate-spin"/> : <CheckCircle size={18} />} Log as Cooked
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-16">
                    <div>
                        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white font-serif uppercase tracking-tight"><Utensils className="text-primary-600" size={24}/> Ingredients</h3>
                        <ul className="space-y-3">
                            {selectedRecipe.ingredients.map((ing, i) => (
                                <li key={i} className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0"></div>
                                    {formatFractions(ing)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white font-serif uppercase tracking-tight"><History className="text-primary-600" size={24}/> Instructions</h3>
                        <div className="space-y-8">
                            {selectedRecipe.instructions.map((step, i) => (
                                <div key={i} className="flex gap-5 group">
                                    <div className="w-9 h-9 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm border border-primary-200/50 dark:border-primary-800/50">{i+1}</div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium pt-1.5">{formatInstruction(step)}</p>
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