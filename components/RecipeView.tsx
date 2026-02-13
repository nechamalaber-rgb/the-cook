
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Flame, ArrowLeft, Play, Heart, Loader2, Utensils, History, X, Star, 
  MessageSquare, ShieldCheck, Dumbbell, Zap, Activity, Quote,
  Beaker, ChevronLeft, ChefHat, Info, Target, Thermometer, Timer, CheckSquare,
  Cpu, Layers, ZapOff, Fingerprint, SearchCheck, ExternalLink, Globe, AlertOctagon, Lightbulb, Users, AlertTriangle, ShoppingCart, Calendar as CalendarIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, Category, Review } from '../types';
import { generateRecipeImage } from '../services/geminiService';

const formatFractions = (text: string) => {
  return text
    .replace(/1\/2/g, '½')
    .replace(/1\/4/g, '¼')
    .replace(/3\/4/g, '¾')
    .replace(/1\/3/g, '⅓')
    .replace(/2\/3/g, '⅔')
    .replace(/(\d+)°F/g, '$1°F')
    .replace(/(\d+)°C/g, '$1°C');
};

const formatInstruction = (step: string) => {
    if (!step) return null;
    const cleaned = step.trim();
    const [mainText, tipText] = cleaned.split(/Tip:|TIP:|Chef's Tip:/i);
    
    return (
        <div className="space-y-2 md:space-y-3">
            <div>
                <span className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium text-lg md:text-xl">{formatFractions(mainText)}</span>
            </div>
            {tipText && (
                <div className="flex items-start gap-2 bg-primary-50 dark:bg-primary-900/10 p-2 md:p-3 rounded-xl border border-primary-100 dark:border-primary-500/20">
                    <Lightbulb size={12} className="text-primary-500 shrink-0 mt-0.5 md:w-3.5 md:h-3.5" />
                    <p className="text-[9px] md:text-[10px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-tight leading-normal">
                        TIP: {tipText.trim()}
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleType, setScheduleType] = useState('Dinner');

  const handleVisualize = async () => {
      if (!selectedRecipe || isGeneratingImage) return;
      setIsGeneratingImage(true);
      try {
          // Pass the servings count to the image generation service
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
        setIsReviewModalOpen(true); 
    }, 1500);
  };

  const handleConfirmSchedule = () => {
      if (!selectedRecipe) return;
      onScheduleMeal(selectedRecipe, scheduleDate, scheduleType);
      setIsScheduleModalOpen(false);
  };

  if (!selectedRecipe) return null;

  const instructions = selectedRecipe.instructions || [];
  const ingredients = selectedRecipe.ingredients || [];
  const tips = selectedRecipe.tips || [];
  const missingItems = selectedRecipe.missingIngredients || [];

  return (
    <div className="animate-fade-in pb-32 min-h-screen">
      {cookingMode ? (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-fade-in text-white font-sans">
            <div className="px-4 py-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/5 shrink-0">
                <button onClick={() => setCookingMode(false)} className="flex items-center gap-1.5 p-2 text-slate-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest">
                    <ChevronLeft size={16} /> Close
                </button>
                <div className="text-center px-4">
                    <h2 className="text-[7px] font-black text-primary-500 uppercase tracking-[0.4em] mb-0.5">STEP {currentStep + 1} OF {instructions.length}</h2>
                    <h1 className="text-[10px] font-black text-white font-serif italic truncate max-w-[150px] sm:max-w-xl uppercase tracking-tight">{selectedRecipe.title}</h1>
                </div>
                <div className="w-12 md:w-20" />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-12 text-center overflow-y-auto max-w-5xl mx-auto w-full">
                <div className="w-full bg-slate-900/40 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-20 border border-white/5 relative shadow-2xl">
                  {updatingInventory ? (
                      <div className="animate-pulse flex flex-col items-center py-12">
                          <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-6" />
                          <h2 className="text-2xl font-black font-serif italic tracking-tighter uppercase text-white">Updating Inventory...</h2>
                      </div>
                  ) : (
                      <div className="space-y-6 md:space-y-12 relative z-10">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-950 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-primary-500 mx-auto border-2 border-primary-500/20 shadow-2xl italic">0{currentStep + 1}</div>
                          <div className="px-2 md:px-4">
                            {instructions[currentStep] ? formatInstruction(instructions[currentStep]) : "Done!"}
                          </div>
                      </div>
                  )}
                </div>
            </div>

            {!updatingInventory && (
                <div className="p-6 md:p-10 pb-12 bg-slate-900/80 backdrop-blur-3xl border-t border-white/5 shrink-0">
                    <div className="flex flex-col items-center gap-4 md:gap-6 max-w-3xl mx-auto">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 transition-all duration-700 shadow-[0_0_10px_rgba(176,141,106,0.5)]" style={{ width: `${((currentStep + 1) / Math.max(1, instructions.length)) * 100}%` }} />
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex-1 py-4 md:py-6 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all">Back</button>
                            {currentStep < instructions.length - 1 ? (
                                <button onClick={() => setCurrentStep(currentStep + 1)} className="flex-[2] py-4 md:py-6 rounded-2xl bg-primary-600 text-white font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-primary-500 active:scale-95 transition-all">Next Step</button>
                            ) : (
                                <button onClick={handleFinishCooking} className="flex-[2] py-4 md:py-6 rounded-2xl bg-emerald-600 text-white font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all">Done Cooking</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      ) : (
        <div className="space-y-12">
            <div className="rounded-[3.5rem] shadow-2xl overflow-hidden bg-slate-900 relative h-[400px] md:h-[550px] flex items-end border-[4px] border-slate-950 group">
                {selectedRecipe.imageUrl ? (
                    <img src={selectedRecipe.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110" alt="" />
                ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                      {isGeneratingImage ? (
                          <>
                            <Loader2 size={48} className="animate-spin text-primary-500/20 mb-4" />
                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em]">Rendering details...</span>
                          </>
                      ) : (
                          <div className="flex flex-col items-center gap-6">
                              <Utensils size={64} className="text-slate-800" />
                              <button onClick={handleVisualize} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3">
                                  <ImageIcon size={16} className="text-primary-500" /> Show Photo
                              </button>
                          </div>
                      )}
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                
                <button onClick={() => navigate('/studio')} className="absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center gap-3 px-5 py-2.5 bg-slate-950/80 hover:bg-slate-950 backdrop-blur-3xl border border-white/10 rounded-2xl text-white font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-2xl">
                  <ArrowLeft size={16} /> Back
                </button>

                <div className="relative z-10 w-full p-6 md:p-16">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl md:text-7xl lg:text-8xl font-black font-serif text-white tracking-tight mb-6 md:mb-8 leading-[0.95] italic drop-shadow-2xl uppercase">
                            {selectedRecipe.title}
                        </h1>
                        <div className="flex flex-wrap gap-3 md:gap-4 mb-8 md:mb-10">
                            <div className="flex items-center gap-2 md:gap-3 bg-white/10 border border-white/10 px-4 md:px-6 py-2 md:py-3 rounded-2xl backdrop-blur-3xl text-[10px] md:text-xs font-black uppercase text-white">
                                <Clock size={16} className="text-primary-400" /> {selectedRecipe.timeMinutes} MIN
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 bg-white/10 border border-white/10 px-4 md:px-6 py-2 md:py-3 rounded-2xl backdrop-blur-3xl text-[10px] md:text-xs font-black uppercase text-white">
                                <Flame size={16} className="text-rose-400" /> {selectedRecipe.calories} KCAL
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 bg-white/10 border border-white/10 px-4 md:px-6 py-2 md:py-3 rounded-2xl backdrop-blur-3xl text-[10px] md:text-xs font-black uppercase text-white">
                                <Users size={16} className="text-sky-400" /> {selectedRecipe.servings} PPL
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                            <button onClick={() => setCookingMode(true)} className="flex-1 max-w-[280px] py-4 md:py-5 bg-primary-600 text-white rounded-[1.5rem] md:rounded-[1.8rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 hover:bg-primary-500 transition-all active:scale-95">
                                <Play fill="currentColor" size={16} /> COOK DISH
                            </button>
                            <button onClick={() => setIsScheduleModalOpen(true)} className="px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/10 rounded-[1.5rem] md:rounded-[1.8rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all flex items-center gap-2">
                                <CalendarIcon size={16} /> SCHEDULE
                            </button>
                            <button onClick={() => onToggleSave(selectedRecipe)} className={`px-6 md:px-8 py-4 md:py-5 rounded-[1.5rem] md:rounded-[1.8rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] border-2 transition-all ${savedRecipes.some(r => r.id === selectedRecipe.id) ? 'bg-white text-rose-600 border-white shadow-xl' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                                {savedRecipes.some(r => r.id === selectedRecipe.id) ? 'SAVED' : 'SAVE RECIPE'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCHEDULE MODAL */}
            {isScheduleModalOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                  <div className="bg-[#0c1220] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-slide-up">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-black font-serif text-white">Schedule Meal</h3>
                          <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                      </div>
                      <div className="space-y-4 mb-8">
                          <p className="text-sm font-bold text-primary-400 italic">"{selectedRecipe.title}"</p>
                          <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Date</label>
                              <input 
                                  type="date" 
                                  value={scheduleDate} 
                                  onChange={e => setScheduleDate(e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm font-bold outline-none focus:border-primary-500"
                              />
                          </div>
                          <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Meal Type</label>
                              <select 
                                  value={scheduleType} 
                                  onChange={e => setScheduleType(e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm font-bold outline-none focus:border-primary-500"
                              >
                                  <option>Breakfast</option>
                                  <option>Lunch</option>
                                  <option>Dinner</option>
                                  <option>Snack</option>
                              </select>
                          </div>
                      </div>
                      <button 
                          onClick={handleConfirmSchedule}
                          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                      >
                          Add to Calendar
                      </button>
                  </div>
              </div>
            )}

            {missingItems.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 mt-8 animate-slide-up">
                    <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                                <AlertTriangle size={24} className="md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h4 className="text-lg md:text-xl font-black font-serif italic text-white uppercase tracking-tight leading-none mb-2">Inventory Alert</h4>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    Needs: <span className="text-white italic">{missingItems.join(', ')}</span>.
                                </p>
                            </div>
                        </div>
                        <button onClick={() => onAddToShoppingList(missingItems)} className="w-full md:w-auto px-8 py-4 md:py-5 bg-white text-rose-600 rounded-[1.5rem] md:rounded-[1.8rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 shrink-0">
                            <ShoppingCart size={16} /> Update Cart
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto px-4">
                <div className="lg:col-span-8 space-y-16">
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                             <h3 className="text-3xl font-black font-serif text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Ingredients.</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="p-5 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center gap-4 group transition-all">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform shrink-0">
                                        <Target size={16} className="md:w-[18px] md:h-[18px]" />
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white italic tracking-tight leading-snug">{formatFractions(ing)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-12 pb-20">
                        <div className="flex items-center gap-4">
                            <h3 className="text-3xl font-black font-serif text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Instructions.</h3>
                        </div>
                        <div className="space-y-8 md:space-y-10">
                            {instructions.map((step, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-8 group">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-900 group-hover:text-white font-black text-lg md:text-xl flex items-center justify-center transition-all shrink-0 border-2 border-transparent group-hover:border-primary-500/50 italic">0{i+1}</div>
                                    <div className="flex-1 space-y-4 pt-0 md:pt-1">
                                        <div className="text-base md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 font-bold tracking-tight italic">{formatInstruction(step)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 text-white sticky top-32 border border-white/5 shadow-2xl">
                        <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-primary-400 mb-6 md:mb-8 border-b border-white/5 pb-4">Meal Logic</h4>
                        <div className="space-y-6 md:space-y-8">
                            <div>
                                <h5 className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Complexity</h5>
                                <p className="text-xl md:text-2xl font-black font-serif italic uppercase text-white">{selectedRecipe.difficulty}</p>
                            </div>
                            
                            {tips.length > 0 && (
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <h5 className="text-[8px] md:text-[9px] font-black uppercase text-primary-400 flex items-center gap-3 tracking-[0.3em]">
                                        <Lightbulb size={12} /> Pro Insights
                                    </h5>
                                    <div className="space-y-3">
                                        {tips.map((tip, idx) => (
                                            <div key={idx} className="p-4 bg-primary-900/10 rounded-2xl border border-primary-500/20">
                                                <p className="text-[9px] md:text-[10px] font-bold text-primary-300 leading-relaxed italic">"{tip}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-5 bg-white/5 rounded-[1.5rem] md:rounded-[1.8rem] border border-white/5 mt-6">
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">"{selectedRecipe.description}"</p>
                            </div>
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
