
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Flame, ArrowLeft, Play, Heart, Loader2, Utensils, History, X, Star, 
  MessageSquare, ShieldCheck, Dumbbell, Zap, Activity, Quote,
  Beaker, ChevronLeft, ChefHat, Info, Target, Thermometer, Timer, CheckSquare,
  Cpu, Layers, ZapOff, Fingerprint, SearchCheck, ExternalLink, Globe, AlertOctagon, Lightbulb, Users, AlertTriangle, ShoppingCart, Calendar as CalendarIcon,
  Image as ImageIcon, DollarSign
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, Category, Review } from '../types';
import { generateRecipeImage } from '../services/geminiService';

const formatFractions = (text: string) => {
  return text
    .replace(/1\/2/g, '½')
    .replace(/1\/4/g, '¼')
    .replace(/3\/4/g, '¾')
    .replace(/1\/3/g, '⅓')
    .replace(/2\/3/g, '⅔');
};

const formatInstruction = (step: string) => {
    if (!step) return null;
    const cleaned = step.trim();
    const [mainText, tipText] = cleaned.split(/Tip:|TIP:|Chef's Tip:/i);
    
    return (
        <div className="space-y-2">
            <div>
                <span className="text-slate-300 leading-relaxed font-medium text-lg italic">{formatFractions(mainText)}</span>
            </div>
            {tipText && (
                <div className="flex items-start gap-2 bg-primary-900/10 p-2 rounded-xl border border-primary-500/20 mt-2">
                    <Lightbulb size={12} className="text-primary-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-primary-300 uppercase tracking-tight leading-normal">
                        PRO TIP: {tipText.trim()}
                    </p>
                </div>
            )}
        </div>
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
  onUpdateRecipe?: (id: string, data: Partial<Recipe>) => void;
}

const RecipeView: React.FC<RecipeViewProps> = ({ 
  pantryItems,
  setPantryItems, 
  preferences, 
  savedRecipes,
  onToggleSave,
  onLogMeal,
  onAddToShoppingList,
  selectedRecipe,
  setSelectedRecipe,
  cookingMode,
  setCookingMode,
  currentStep,
  setCurrentStep,
  onUpdateRecipe,
  onScheduleMeal
}) => {
  const navigate = useNavigate();
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleVisualize = async () => {
      if (!selectedRecipe || isGeneratingImage) return;
      setIsGeneratingImage(true);
      try {
          const imgData = await generateRecipeImage(selectedRecipe.title, selectedRecipe.ingredients, selectedRecipe.servings);
          if (imgData && onUpdateRecipe) {
              const fullData = `data:image/png;base64,${imgData}`;
              onUpdateRecipe(selectedRecipe.id, { imageUrl: fullData });
              setSelectedRecipe(prev => prev ? { ...prev, imageUrl: fullData } : null);
          }
      } catch (err) { console.error(err); } finally { setIsGeneratingImage(false); }
  };

  const handleFinishCooking = () => {
    if (!selectedRecipe) return;
    setUpdatingInventory(true);
    onLogMeal(selectedRecipe);
    const recipeIngredients = selectedRecipe.ingredients || [];
    const updatedPantry = pantryItems.filter(pItem => !recipeIngredients.some(rIng => rIng.toLowerCase().includes(pItem.name.toLowerCase())));
    setTimeout(() => {
        setPantryItems(updatedPantry);
        setUpdatingInventory(false);
        setCookingMode(false);
    }, 1500);
  };

  if (!selectedRecipe) return null;

  const instructions = selectedRecipe.instructions || [];
  const ingredients = selectedRecipe.ingredients || [];
  const missingItems = selectedRecipe.missingIngredients || [];

  return (
    <div className="animate-fade-in pb-32 min-h-screen bg-[#090e1a] flex justify-center pt-8 px-4">
      {cookingMode ? (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-fade-in text-white">
            <div className="px-4 py-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/5">
                <button onClick={() => setCookingMode(false)} className="flex items-center gap-1.5 p-2 text-slate-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest">
                    <ChevronLeft size={16} /> Close
                </button>
                <div className="text-center px-4">
                    <h2 className="text-[7px] font-black text-primary-500 uppercase tracking-[0.4em] mb-0.5">STEP {currentStep + 1} OF {instructions.length}</h2>
                    <h1 className="text-[10px] font-black text-white font-serif italic uppercase tracking-tight">{selectedRecipe.title}</h1>
                </div>
                <div className="w-12" />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-12 text-center overflow-y-auto max-w-4xl mx-auto w-full">
                <div className="w-full bg-slate-900/40 rounded-[2.5rem] p-8 md:p-20 border border-white/5 relative shadow-2xl">
                    <div className="space-y-8 md:space-y-12 relative z-10">
                        <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-2xl font-black text-primary-500 mx-auto border-2 border-primary-500/20 shadow-2xl italic">0{currentStep + 1}</div>
                        <div className="px-2 md:px-4">
                          {instructions[currentStep] ? formatInstruction(instructions[currentStep]) : "Manifest Complete"}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-10 pb-12 bg-slate-900/80 backdrop-blur-3xl border-t border-white/5">
                <div className="flex flex-col items-center gap-4 md:gap-6 max-w-2xl mx-auto">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all duration-700" style={{ width: `${((currentStep + 1) / Math.max(1, instructions.length)) * 100}%` }} />
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-black text-[9px] uppercase tracking-widest disabled:opacity-20 transition-all">Back</button>
                        {currentStep < instructions.length - 1 ? (
                            <button onClick={() => setCurrentStep(currentStep + 1)} className="flex-[2] py-4 rounded-2xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-primary-500 transition-all">Next Step</button>
                        ) : (
                            <button onClick={handleFinishCooking} className="flex-[2] py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all">Done Cooking</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="max-w-[1000px] w-full bg-[#0c1220] rounded-[2.5rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-up">
            {/* CARD IMAGE HEADER */}
            <div className="relative w-full aspect-[16/10] md:aspect-[16/8] bg-slate-900 overflow-hidden border-b border-white/5">
                {selectedRecipe.imageUrl ? (
                    <img 
                      src={selectedRecipe.imageUrl} 
                      className="w-full h-full object-cover object-center" 
                      alt={selectedRecipe.title} 
                    />
                ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                      {isGeneratingImage ? (
                          <>
                            <Loader2 size={40} className="animate-spin text-primary-500/20 mb-4" />
                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em]">Rendering Visuals...</span>
                          </>
                      ) : (
                          <button onClick={handleVisualize} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3">
                              <ImageIcon size={16} className="text-primary-500" /> Visualize Dish
                          </button>
                      )}
                   </div>
                )}
                
                {/* Close Button Overlay */}
                <button 
                  onClick={() => navigate('/studio')} 
                  className="absolute top-6 right-6 z-20 p-2 bg-black/60 hover:bg-black backdrop-blur-xl rounded-full text-white transition-all shadow-xl"
                >
                  <X size={24} />
                </button>
            </div>

            {/* CONTENT AREA - MATCHING SCREENSHOT LAYOUT */}
            <div className="p-8 md:p-12 lg:p-16 space-y-12">
                
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex-1 space-y-6">
                        <h1 className="text-4xl md:text-6xl font-black font-serif text-white tracking-tighter leading-[0.95] italic uppercase drop-shadow-sm">
                            {selectedRecipe.title}
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed italic max-w-2xl">
                            "{selectedRecipe.description}"
                        </p>
                    </div>
                    <div className="shrink-0 pt-2 flex flex-col gap-4 w-full md:w-auto">
                        <button 
                          id="primary-cook-btn"
                          onClick={() => setCookingMode(true)} 
                          className="w-full px-12 py-5 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-primary-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 ring-4 ring-primary-500/10"
                        >
                            <Play fill="currentColor" size={18} /> START COOKING
                        </button>
                        <button 
                          onClick={() => onToggleSave(selectedRecipe)} 
                          className="w-full px-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all"
                        >
                            <Heart size={18} className={savedRecipes.some(r => r.id === selectedRecipe.id) ? "fill-current" : ""} /> SAVE RECIPE
                        </button>
                    </div>
                </div>

                {/* REQUIRED SUPPLIES GRID (MATCHES SCREENSHOT) */}
                {missingItems.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 italic">Required Supplies</h3>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Sync needed</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {missingItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <span className="text-sm font-black text-white italic uppercase tracking-tight leading-none">{item}</span>
                                    <span className="text-[11px] font-black text-slate-500 group-hover:text-primary-400 transition-colors">${(Math.random() * 4 + 2).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2">
                           <button onClick={() => onAddToShoppingList(missingItems)} className="w-full py-5 bg-primary-600/10 border border-primary-500/20 rounded-2xl text-primary-400 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3">
                                <ShoppingCart size={16} /> Sync Missing to Cart
                           </button>
                        </div>
                    </section>
                )}

                {/* INGREDIENTS LIST (MATCHES SCREENSHOT) */}
                <section className="space-y-8 pt-6 border-t border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 flex items-center gap-3 italic">
                        <Utensils size={14} /> Ingredients
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        {ingredients.map((ing, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-sm md:text-base font-bold text-slate-300 italic tracking-tight">{formatFractions(ing)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* EXECUTION STEPS */}
                <section className="space-y-10 pt-10 border-t border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">Execution Protocol</h3>
                    <div className="space-y-12">
                        {instructions.map((step, i) => (
                            <div key={i} className="flex gap-8 group">
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 text-slate-700 group-hover:text-primary-500 font-black text-2xl flex items-center justify-center transition-all shrink-0 italic">0{i+1}</div>
                                <div className="flex-1 pt-1">
                                    {formatInstruction(step)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* NUTRITION & LOGISTICS */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-white/5 pb-8">
                     <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1 italic">Active Time</p>
                         <p className="text-xl font-black text-white italic">{selectedRecipe.timeMinutes} MIN</p>
                     </div>
                     <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1 italic">Energy Flow</p>
                         <p className="text-xl font-black text-white italic">{selectedRecipe.calories} KCAL</p>
                     </div>
                     <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1 italic">Portion Scale</p>
                         <p className="text-xl font-black text-white italic">{selectedRecipe.servings} SERVINGS</p>
                     </div>
                     <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1 italic">Complexity</p>
                         <p className="text-xl font-black text-white italic uppercase">{selectedRecipe.difficulty}</p>
                     </div>
                </section>
            </div>
        </div>
      )}
    </div>
  );
};

export default RecipeView;
