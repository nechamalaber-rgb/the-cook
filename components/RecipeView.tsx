
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Flame, ArrowLeft, Play, Heart, Loader2, Utensils, History, X, Star, 
  MessageSquare, ShieldCheck, Dumbbell, Zap, Activity, Quote,
  Beaker, ChevronLeft, ChefHat, Info, Target, Thermometer, Timer, CheckSquare,
  Cpu, Layers, ZapOff, Fingerprint, SearchCheck, ExternalLink, Globe, AlertOctagon, Lightbulb, Users, AlertTriangle, ShoppingCart
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, Category, Review } from '../types';

const categorizeIngredient = (name: string): Category => {
    const lower = name.toLowerCase();
    if (lower.match(/steak|beef|chicken|pork|meat|fish|salmon|tuna|lamb|turkey|shrimp|bacon|sausage|egg/)) return Category.MEAT;
    if (lower.match(/milk|cheese|yogurt|butter|cream|dairy/)) return Category.DAIRY;
    if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper/)) return Category.PRODUCE;
    return Category.PANTRY; 
};

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
    
    // Split tip from step if "Tip:" exists
    const [mainText, tipText] = cleaned.split(/Tip:|TIP:|Chef's Tip:/i);

    const firstSpaceIndex = mainText.indexOf(' ');
    
    let verb = '';
    let rest = mainText;

    if (firstSpaceIndex !== -1) {
        verb = mainText.substring(0, firstSpaceIndex);
        rest = mainText.substring(firstSpaceIndex);
    } else {
        verb = mainText;
        rest = '';
    }
    
    const highlightedRest = formatFractions(rest).split(/(\d+\s*(?:minutes|mins|degrees|hours|seconds))/gi).map((part, i) => {
        if (part.match(/\d+\s*(?:minutes|mins|degrees|hours|seconds)/i)) {
            return <span key={i} className="text-primary-600 dark:text-primary-300 font-black decoration-primary-500/20 underline underline-offset-4">{part}</span>;
        }
        return part;
    });

    return (
        <div className="space-y-3">
            <div>
                <strong className="font-black text-primary-500 dark:text-primary-400 uppercase tracking-widest mr-2 inline-block border-b-2 border-primary-500/30">{verb}</strong>
                <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{highlightedRest}</span>
            </div>
            {tipText && (
                <div className="flex items-start gap-2 bg-primary-50 dark:bg-primary-900/10 p-3 rounded-xl border border-primary-100 dark:border-primary-500/20">
                    <Lightbulb size={14} className="text-primary-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-tight leading-normal">
                        <span className="font-black mr-1">CHEF'S TIP:</span> {tipText.trim()}
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
  generatedRecipes,
  setGeneratedRecipes,
  onUpdateRecipe
}) => {
  const navigate = useNavigate();
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');

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

  const submitUserReview = () => {
    if (!selectedRecipe) return;
    const newReview = { id: Date.now().toString(), userName: preferences.userName || 'Member', rating: userRating, comment: userComment || 'Meal complete.', timestamp: new Date().toISOString() };
    const updatedReviews = [newReview, ...(selectedRecipe.reviews || [])];
    if (onUpdateRecipe) onUpdateRecipe(selectedRecipe.id, { reviews: updatedReviews });
    setIsReviewModalOpen(false);
  };

  if (!selectedRecipe) return null;

  if (!selectedRecipe.title || selectedRecipe.ingredients.length === 0) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10 animate-fade-in">
              <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-10 shadow-xl">
                  <AlertOctagon size={56} />
              </div>
              <h2 className="text-5xl font-black font-serif italic text-white mb-6 tracking-tighter">Manifest Error.</h2>
              <p className="text-slate-400 max-w-md text-lg font-medium leading-relaxed mb-12">The logic cycle for this recipe failed to yield a complete architecture. Please return to the studio for a fresh curation.</p>
              <button onClick={() => navigate('/studio')} className="px-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <ArrowLeft size={20} /> Back to Studio
              </button>
          </div>
      );
  }

  const instructions = selectedRecipe.instructions || [];
  const ingredients = selectedRecipe.ingredients || [];
  const tips = selectedRecipe.tips || [];
  const groundingLinks = selectedRecipe.groundingLinks || [];
  const missingItems = selectedRecipe.missingIngredients || [];

  return (
    <div className="animate-fade-in pb-32 min-h-screen">
      {cookingMode ? (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-fade-in text-white font-sans">
            <div className="px-8 py-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/5 shrink-0">
                <button onClick={() => setCookingMode(false)} className="flex items-center gap-2 p-3 text-slate-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em]">
                    <ChevronLeft size={18} /> Exit Instructor
                </button>
                <div className="text-center px-4">
                    <h2 className="text-[8px] font-black text-primary-500 uppercase tracking-[0.5em] mb-1">STEP {currentStep + 1} OF {instructions.length}</h2>
                    <h1 className="text-sm font-black text-white font-serif italic truncate max-w-[200px] sm:max-w-xl uppercase tracking-tight">{selectedRecipe.title}</h1>
                </div>
                <div className="w-20 h-10" />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 text-center overflow-y-auto max-w-5xl mx-auto w-full">
                <div className="w-full bg-slate-900/40 rounded-[3.5rem] p-10 md:p-20 border border-white/5 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Cpu size={160} /></div>
                  
                  {updatingInventory ? (
                      <div className="animate-pulse flex flex-col items-center py-12">
                          <div className="w-20 h-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-8" />
                          <h2 className="text-3xl font-black font-serif italic tracking-tighter uppercase text-white">Syncing Manifest...</h2>
                      </div>
                  ) : (
                      <div className="space-y-12 relative z-10">
                          <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-2xl font-black text-primary-500 mx-auto border-2 border-primary-500/20 shadow-2xl italic">0{currentStep + 1}</div>
                          <div className="text-2xl md:text-5xl font-black leading-tight font-serif italic tracking-tight text-white px-4">
                            {instructions[currentStep] ? formatInstruction(instructions[currentStep]) : "End of Instructions"}
                          </div>
                          <div className="flex justify-center gap-10 pt-6">
                               <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]"><Thermometer size={16} className="text-rose-500" /> Heat Logic</div>
                               <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]"><Timer size={16} className="text-primary-500" /> Precision Timing</div>
                          </div>
                      </div>
                  )}
                </div>
            </div>

            {!updatingInventory && (
                <div className="p-10 pb-16 bg-slate-900/80 backdrop-blur-3xl border-t border-white/5 shrink-0">
                    <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 transition-all duration-700 shadow-[0_0_15px_rgba(176,141,106,0.5)]" style={{ width: `${((currentStep + 1) / Math.max(1, instructions.length)) * 100}%` }} />
                        </div>
                        <div className="flex gap-4 w-full">
                            <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex-1 py-6 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all">Previous</button>
                            {currentStep < instructions.length - 1 ? (
                                <button onClick={() => setCurrentStep(currentStep + 1)} className="flex-[2] py-6 rounded-2xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-primary-500 active:scale-95 transition-all">Next Step</button>
                            ) : (
                                <button onClick={handleFinishCooking} className="flex-[2] py-6 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all">Finish Meal</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      ) : (
        <div className="space-y-12">
            <div className="rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden bg-slate-900 relative h-[450px] md:h-[550px] flex items-end border-[4px] border-slate-950 group">
                {selectedRecipe.imageUrl ? (
                    <img src={selectedRecipe.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110" alt="" />
                ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                      <Loader2 size={48} className="animate-spin text-primary-500/20 mb-4" />
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em]">Rendering Asset...</span>
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                
                <button onClick={() => navigate('/studio')} className="absolute top-8 left-8 z-20 flex items-center gap-3 px-6 py-3 bg-slate-950/80 hover:bg-slate-950 backdrop-blur-3xl border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl">
                  <ArrowLeft size={18} /> Back
                </button>

                <div className="relative z-10 w-full p-8 md:p-16">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-2xl">
                            <Zap size={14} /> Guided Experience
                        </div>
                        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black font-serif text-white tracking-tight mb-8 leading-[0.9] italic drop-shadow-2xl uppercase">
                            {selectedRecipe.title}
                        </h1>
                        <div className="flex flex-wrap gap-4 mb-10">
                            <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-3xl text-xs font-black uppercase text-white">
                                <Clock size={18} className="text-primary-400" /> {selectedRecipe.timeMinutes} MIN
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-3xl text-xs font-black uppercase text-white">
                                <Flame size={18} className="text-rose-400" /> {selectedRecipe.calories || '450'} KCAL
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-3xl text-xs font-black uppercase text-white">
                                <Users size={18} className="text-sky-400" /> {selectedRecipe.servings || preferences.householdSize} PEOPLE
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => setCookingMode(true)} className="flex-1 max-w-[280px] py-5 bg-primary-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 hover:bg-primary-500 transition-all active:scale-95">
                                <Play fill="currentColor" size={16} /> OPEN INSTRUCTOR
                            </button>
                            <button onClick={() => onToggleSave(selectedRecipe)} className={`px-8 py-5 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.3em] border-2 transition-all ${savedRecipes.some(r => r.id === selectedRecipe.id) ? 'bg-white text-rose-600 border-white shadow-xl' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                                {savedRecipes.some(r => r.id === selectedRecipe.id) ? 'SAVED TO STUDIO' : 'SAVE FOR LATER'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {missingItems.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 mt-8 animate-slide-up">
                    <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black font-serif italic text-white uppercase tracking-tight leading-none mb-2">Replenishment Protocol</h4>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                                    Current manifest quantities are <span className="text-rose-500">insufficient</span> for {selectedRecipe.servings} people. 
                                    Need more: <span className="text-white italic">{missingItems.join(', ')}</span>.
                                </p>
                            </div>
                        </div>
                        <button 
                          onClick={() => onAddToShoppingList(missingItems)}
                          className="px-8 py-5 bg-white text-rose-600 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 shrink-0"
                        >
                            <ShoppingCart size={18} /> Add to Cart
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto px-4">
                <div className="lg:col-span-8 space-y-16">
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                             <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl"><Beaker size={24} /></div>
                             <h3 className="text-3xl font-black font-serif text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">The Manifest.</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4 group hover:border-primary-500/30 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                                        <Target size={18} />
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white italic tracking-tight leading-snug">{formatFractions(ing)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-12 pb-20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-950 text-white rounded-2xl shadow-xl"><History size={24} /></div>
                            <h3 className="text-3xl font-black font-serif text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Execution.</h3>
                        </div>
                        <div className="space-y-10">
                            {instructions.map((step, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-8 group">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-900 group-hover:text-white font-black text-xl flex items-center justify-center transition-all shrink-0 border-2 border-transparent group-hover:border-primary-500/50 italic">0{i+1}</div>
                                    <div className="flex-1 space-y-4 pt-1">
                                        <div className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 font-bold tracking-tight italic">{formatInstruction(step)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-8 text-white sticky top-32 border border-white/5 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)]">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-400 mb-8 border-b border-white/5 pb-4">Architectural Specs</h4>
                        <div className="space-y-8">
                            <div>
                                <h5 className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Technical Difficulty</h5>
                                <p className="text-2xl font-black font-serif italic uppercase text-white">{selectedRecipe.difficulty}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <h5 className="text-[8px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">Protein</h5>
                                    <p className="text-sm font-black text-emerald-400">{selectedRecipe.protein || '24g'}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <h5 className="text-[8px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">Carbohydrates</h5>
                                    <p className="text-sm font-black text-sky-400">{selectedRecipe.carbs || '40g'}</p>
                                </div>
                            </div>
                            
                            {tips.length > 0 && (
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <h5 className="text-[9px] font-black uppercase text-primary-400 flex items-center gap-3 tracking-[0.3em]">
                                        <Lightbulb size={14} /> Chef's Wisdom
                                    </h5>
                                    <div className="space-y-3">
                                        {tips.map((tip, idx) => (
                                            <div key={idx} className="p-4 bg-primary-900/10 rounded-2xl border border-primary-500/20">
                                                <p className="text-[10px] font-bold text-primary-300 leading-relaxed italic">"{tip}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {groundingLinks.length > 0 && (
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <h5 className="text-[9px] font-black uppercase text-primary-400 flex items-center gap-3 tracking-[0.3em]">
                                        <Globe size={14} /> Knowledge Sources
                                    </h5>
                                    <div className="space-y-2.5">
                                        {groundingLinks.map((link, idx) => (
                                            <a 
                                                key={idx} 
                                                href={link} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary-500/30 transition-all group"
                                            >
                                                <span className="text-[10px] font-black text-slate-300 truncate pr-4 uppercase tracking-widest">Source 0{idx + 1}</span>
                                                <ExternalLink size={14} className="text-slate-500 group-hover:text-primary-500 transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-5 bg-white/5 rounded-[1.8rem] border border-white/5 mt-6">
                                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"{selectedRecipe.description}"</p>
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
