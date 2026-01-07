
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, ArrowLeft, Play, Heart, Loader2, Utensils, History, X, Star, MessageSquare, ShieldCheck, Dumbbell, Zap, Activity, Quote, Volume2, VolumeX } from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, Category, Review } from '../types';
import { speakText } from '../services/geminiService';

const categorizeIngredient = (name: string): Category => {
    const lower = name.toLowerCase();
    if (lower.match(/steak|beef|chicken|pork|meat|fish|salmon|tuna|lamb|turkey|shrimp|bacon|sausage/)) return Category.MEAT;
    if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy/)) return Category.DAIRY;
    if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper/)) return Category.PRODUCE;
    return Category.PANTRY; 
};

const formatFractions = (text: string) => {
  return text.replace(/1\/2/g, '½').replace(/1\/4/g, '¼').replace(/3\/4/g, '¾').replace(/1\/3/g, '⅓').replace(/2\/3/g, '⅔');
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
  onUpdateRecipe?: (id: string, data: Partial<Recipe>) => void;
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
  generatedRecipes,
  setGeneratedRecipes,
  onUpdateRecipe
}) => {
  const navigate = useNavigate();
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Handle Voice in Cooking Mode
  useEffect(() => {
    if (cookingMode && isVoiceEnabled && selectedRecipe && !updatingInventory) {
      speakText(`Step ${currentStep + 1}: ${selectedRecipe.instructions[currentStep]}`);
    }
  }, [currentStep, cookingMode, isVoiceEnabled, selectedRecipe, updatingInventory]);

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
    const updatedPantry = pantryItems.filter(pItem => !selectedRecipe.ingredients.some(rIng => rIng.toLowerCase().includes(pItem.name.toLowerCase())));
    setTimeout(() => {
        setPantryItems(updatedPantry);
        setUpdatingInventory(false);
        setCookingMode(false);
        setIsReviewModalOpen(true); 
    }, 1000);
  };

  const handleBack = () => {
    setSelectedRecipe(null);
    navigate('/studio');
  };

  const submitUserReview = () => {
    if (!selectedRecipe) return;
    const newReview: Review = {
        id: Date.now().toString(),
        userName: preferences.userName || 'Member',
        rating: userRating,
        comment: userComment || 'Dish completed.',
        timestamp: new Date().toISOString()
    };
    const updatedReviews = [newReview, ...(selectedRecipe.reviews || [])];
    
    if (onUpdateRecipe) {
      onUpdateRecipe(selectedRecipe.id, { reviews: updatedReviews });
    } else {
      const updated = { ...selectedRecipe, reviews: updatedReviews };
      setSelectedRecipe(updated);
      setGeneratedRecipes(prev => prev.map(r => r.id === selectedRecipe.id ? updated : r));
    }
    
    setIsReviewModalOpen(false);
    setUserComment('');
  };

  if (!selectedRecipe) return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-serif mb-4">No Recipe Selection</h2>
        <button onClick={() => navigate('/studio')} className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Return to Studio</button>
    </div>
  );

  return (
    <div className="animate-fade-in pb-24 min-h-screen">
      {cookingMode ? (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in text-white">
            <div className="px-8 py-8 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
                <div>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Step {currentStep + 1} of {selectedRecipe.instructions.length}</h2>
                    <h1 className="text-xl font-black text-white font-serif truncate">{selectedRecipe.title}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                      className={`p-4 rounded-full transition-all ${isVoiceEnabled ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {isVoiceEnabled ? <Volume2 size={24}/> : <VolumeX size={24}/>}
                    </button>
                    <button onClick={() => setCookingMode(false)} className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700"><X size={24} /></button>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 text-center overflow-y-auto">
                {updatingInventory ? (
                    <div className="text-center animate-fade-in">
                        <Loader2 size={64} className="animate-spin text-primary-500 mx-auto mb-8" />
                        <h2 className="text-4xl font-black mb-2 font-serif text-white uppercase">Syncing Inventory</h2>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Updating pantry quantities...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-3xl font-black text-primary-500 mb-10 border border-slate-800 shadow-2xl">{currentStep + 1}</div>
                        <p className="text-3xl md:text-5xl font-black leading-tight mb-8 font-serif px-4 max-w-4xl">{formatInstruction(selectedRecipe.instructions[currentStep])}</p>
                    </>
                )}
            </div>
            {!updatingInventory && (
                <div className="p-8 pb-12 bg-slate-900/50 backdrop-blur-md border-t border-slate-800">
                    <div className="flex gap-4 max-w-2xl mx-auto">
                        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex-1 py-6 rounded-3xl bg-slate-800 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50">Back</button>
                        {currentStep < selectedRecipe.instructions.length - 1 ? (
                            <button onClick={() => setCurrentStep(currentStep + 1)} className="flex-[2] py-6 rounded-3xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest">Next Step</button>
                        ) : (
                            <button onClick={handleFinishCooking} className="flex-[2] py-6 rounded-3xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest">Finish & Log</button>
                        )}
                    </div>
                </div>
            )}
        </div>
      ) : (
        <div className="space-y-12">
            <div className="rounded-[3rem] shadow-2xl overflow-hidden bg-slate-900 relative h-[600px] md:h-[700px] flex items-end">
                {selectedRecipe.imageUrl && <img src={selectedRecipe.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                
                {/* Back Button Overlay */}
                <button 
                  onClick={handleBack}
                  className="absolute top-8 left-8 z-20 flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Studio
                </button>

                <div className="relative z-10 w-full p-8 md:p-16">
                    <div className="max-w-4xl">
                        {selectedRecipe.isFitnessMatch && (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl">
                                <Dumbbell size={14} /> Studio Selection
                            </div>
                        )}
                        <h1 className="text-5xl md:text-8xl font-black font-serif text-white tracking-tighter mb-8 leading-[0.9]">{selectedRecipe.title}</h1>
                        <div className="flex flex-wrap gap-4 mb-10">
                            <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md text-xs font-black uppercase text-white"><Clock size={16} /> {selectedRecipe.timeMinutes} MINS</div>
                            <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md text-xs font-black uppercase text-white"><Flame size={16} /> {selectedRecipe.calories || '450'} KCAL PER SERVING</div>
                            <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md text-xs font-black uppercase text-white"><Utensils size={16} /> {selectedRecipe.servings || preferences.householdSize} SERVINGS</div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setCookingMode(true)} className="flex-1 max-w-xs py-6 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-primary-500 transition-all"><Play fill="currentColor" size={20} /> Enter Cook Mode</button>
                            <button onClick={() => onToggleSave(selectedRecipe)} className={`px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest border transition-all ${savedRecipes.some(r => r.id === selectedRecipe.id) ? 'bg-white text-rose-500 border-white shadow-xl' : 'bg-white/10 text-white border-white/10'}`}>
                                {savedRecipes.some(r => r.id === selectedRecipe.id) ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto px-4">
                <div className="lg:col-span-2 space-y-16">
                    {/* Performance Metrics Section */}
                    <section className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-3">
                            <Activity size={20} className="text-primary-500" /> Nutritional Profile (Per Serving)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protein</span>
                                <span className="text-4xl font-black text-slate-900 dark:text-white font-serif">{selectedRecipe.protein || '-'}</span>
                                <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Precision Scale</p>
                            </div>
                            <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carbs</span>
                                <span className="text-4xl font-black text-slate-900 dark:text-white font-serif">{selectedRecipe.carbs || '-'}</span>
                                <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Precision Scale</p>
                            </div>
                            <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Healthy Fat</span>
                                <span className="text-4xl font-black text-slate-900 dark:text-white font-serif">{selectedRecipe.fat || '-'}</span>
                                <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Precision Scale</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-3xl font-black mb-10 font-serif flex items-center gap-3 text-slate-900 dark:text-white"><Utensils size={28} className="text-primary-500" />Required Items (Scaled)</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            {Object.entries(categorizedIngredients).map(([cat, ings]) => (
                                <div key={cat} className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2 border-l-2 border-primary-500">{cat}</h4>
                                    <ul className="space-y-2">
                                        {(ings as string[]).map((ing, i) => (
                                            <li key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-4 group hover:border-primary-200 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary-500"></div>
                                                {formatFractions(ing)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-3xl font-black mb-10 font-serif flex items-center gap-3 text-slate-900 dark:text-white"><History size={28} className="text-primary-500" />Studio Logic</h3>
                        <div className="space-y-10">
                            {selectedRecipe.instructions.map((step, i) => (
                                <div key={i} className="flex gap-8 group">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-600 group-hover:text-white font-black text-lg flex items-center justify-center shrink-0 transition-all">{i+1}</div>
                                    <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400 font-medium pt-1">{formatInstruction(step)}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-12 lg:sticky lg:top-32 h-fit">
                    <section className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><MessageSquare size={16} className="text-primary-500" /> Feedback</h3>
                            <button onClick={() => setIsReviewModalOpen(true)} className="text-[9px] font-black uppercase text-primary-600 bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-500/20 hover:bg-primary-500 hover:text-white transition-all">Add Review</button>
                        </div>
                        
                        <div className="space-y-8">
                            {(selectedRecipe.reviews || []).map((review) => (
                                <div key={review.id} className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-black text-[10px]">{review.userName.charAt(0)}</div>
                                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{review.userName}</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {Array.from({length: 5}).map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-400" : "text-slate-300"} />)}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">"{review.comment}"</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                        <h4 className="text-xl font-black font-serif mb-2 relative z-10">Integrity Protocol</h4>
                        <p className="text-xs text-white/70 font-medium leading-relaxed italic relative z-10">"Calculated per individual serving. Total time includes preparation and execution logic."</p>
                        <div className="mt-6 flex items-center gap-3 relative z-10">
                             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"><ShieldCheck size={20} className="text-primary-500" /></div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Precision Verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {isReviewModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-center mb-10">
                      <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl"><MessageSquare size={28} /></div>
                      <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white">Studio Feedback</h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Evaluate your technical results</p>
                  </div>

                  <div className="space-y-8">
                      <div className="flex justify-center gap-2">
                          {[1,2,3,4,5].map(star => (
                              <button key={star} onClick={() => setUserRating(star)} className="p-1 transition-transform hover:scale-110 active:scale-95">
                                  <Star size={40} fill={star <= userRating ? "currentColor" : "none"} className={star <= userRating ? "text-amber-400" : "text-slate-200 dark:text-slate-800"} />
                              </button>
                          ))}
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Final Evaluation</label>
                          <textarea 
                            value={userComment}
                            onChange={e => setUserComment(e.target.value)}
                            placeholder="Describe flavor profiles and technical execution..."
                            className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-[1.5rem] outline-none border border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-200 h-32 resize-none shadow-inner"
                          />
                      </div>

                      <div className="flex gap-4">
                          <button onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Discard</button>
                          <button onClick={submitUserReview} className="flex-[2] py-5 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Submit Feedback</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RecipeView;
