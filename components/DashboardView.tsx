
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles as SparklesIcon, 
  Clock as ClockIcon, 
  Flame as FlameIcon, 
  Loader2 as Loader2Icon, 
  Utensils as UtensilsIcon, 
  Activity,
  ArrowRight,
  Heart,
  Users,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Search,
  Ban,
  Cpu,
  Database,
  Zap,
  Minus,
  Plus,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, RecipeGenerationOptions } from '../types';
import { analyzePantryStatus, generateRecipeImage } from '../services/geminiService';

interface DashboardViewProps {
  pantryItems: Ingredient[];
  mealHistory: MealLog[];
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  savedRecipes: Recipe[];
  generatedRecipes: Recipe[];
  setGeneratedRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  onLogMeal: (recipe: Recipe) => void;
  onScheduleMeal: (recipe: Recipe, date: string, mealType: string) => void;
  setActiveRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;
  onToggleSave: (recipe: Recipe) => void;
  isGenerating: boolean;
  onGenerate: (options: RecipeGenerationOptions) => Promise<void>;
  onCancelGeneration: () => void;
  onRequireAccess: (action: string) => boolean;
  onAddRecipe?: (recipe: Recipe) => void;
  onAddToShoppingList?: (items: string[]) => void;
  onConsumeGeneration?: () => boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  pantryItems,
  preferences,
  setPreferences,
  savedRecipes,
  generatedRecipes,
  setGeneratedRecipes,
  setActiveRecipe,
  onToggleSave,
  isGenerating,
  onGenerate,
  onRequireAccess,
  onConsumeGeneration,
  onScheduleMeal
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');
  const [pantryInsight, setPantryInsight] = useState<{ tip: string; urgency: 'low' | 'medium' | 'high' } | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
  // Scheduling State
  const [schedulingRecipe, setSchedulingRecipe] = useState<Recipe | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleType, setScheduleType] = useState('Dinner');

  // Track specific rendering recipes for technical telemetry overlay
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchInsight = async () => {
      if (pantryItems.length < 1) return;
      setIsLoadingInsight(true);
      try {
        const insight = await analyzePantryStatus(pantryItems);
        setPantryInsight(insight);
      } catch (e: any) {
        setPantryInsight({ tip: "Ready to cook something simple?", urgency: 'low' });
      } finally { setIsLoadingInsight(false); }
    };
    fetchInsight();
  }, [pantryItems.length]);

  const [genOptions, setGenOptions] = useState<RecipeGenerationOptions>({
    servings: preferences.householdSize || 2,
    mealType: 'Any',
    maxTime: 'Any',
    customRequest: '',
    complexity: 'Simple',
    excludedIngredients: []
  });

  const adjustServings = (delta: number) => {
    setGenOptions(prev => ({
        ...prev,
        servings: Math.max(1, Math.min(10, prev.servings + delta))
    }));
  };

  const handleStartGeneration = async () => {
    if (!onRequireAccess("to find recipes")) return;
    if (onConsumeGeneration && !onConsumeGeneration()) return; 

    onGenerate({ 
        ...genOptions, 
        recipeCount: 4,
        complexity: 'Simple'
    });
  };

  const handleVisualize = async (e: React.MouseEvent, recipe: Recipe) => {
      e.stopPropagation();
      if (generatingImages.has(recipe.id)) return;
      
      setGeneratingImages(prev => new Set(prev).add(recipe.id));
      try {
          const imgData = await generateRecipeImage(recipe.title, recipe.ingredients, recipe.servings);
          if (imgData) {
              setGeneratedRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl: `data:image/png;base64,${imgData}` } : r));
          }
      } catch (error) {
          console.error("Failed to visualize", error);
      } finally {
          setGeneratingImages(prev => {
              const next = new Set(prev);
              next.delete(recipe.id);
              return next;
          });
      }
  };

  const openFullRecipe = (recipe: Recipe) => { setActiveRecipe(recipe); navigate('/recipes'); };

  const togglePantryExclusion = (name: string) => {
    setGenOptions(prev => {
        const current = prev.excludedIngredients || [];
        const isExcluded = current.includes(name);
        return {
            ...prev,
            excludedIngredients: isExcluded 
                ? current.filter(i => i !== name) 
                : [...current, name]
        };
    });
  };

  const openScheduleModal = (e: React.MouseEvent, recipe: Recipe) => {
      e.stopPropagation();
      setSchedulingRecipe(recipe);
  };

  const handleConfirmSchedule = () => {
      if (schedulingRecipe) {
          onScheduleMeal(schedulingRecipe, scheduleDate, scheduleType);
          setSchedulingRecipe(null);
      }
  };

  return (
    <div className="animate-fade-in w-full mx-auto pb-24 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 px-1">
          <div className="bg-[#0c1220] rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group min-h-[120px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity size={36} /></div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary-500 mb-2">Cooking Tip</p>
              <h3 className="text-white text-base md:text-lg font-black leading-snug italic font-serif tracking-tight">
                {isLoadingInsight ? "Checking your pantry..." : (pantryInsight?.tip || "Ready to cook something simple?")}
              </h3>
          </div>
          <div className="bg-[#0c1220] rounded-[2rem] p-6 border border-white/5 shadow-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1">My Food</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white font-serif">{pantryItems.length}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Items</span>
                    </div>
                </div>
                <button onClick={() => navigate('/pantry')} className="px-5 py-3 bg-white/5 text-primary-400 border border-white/10 rounded-xl hover:bg-primary-500 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">See Pantry <ArrowRight size={12} /></button>
              </div>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-1">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white font-serif italic leading-none">Recipes.</h1>
        <div className="bg-slate-900 p-1 rounded-xl flex gap-1 shadow-sm border border-slate-800 w-full sm:w-auto">
            <button onClick={() => setActiveTab('discover')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>New Ideas</button>
            <button onClick={() => setActiveTab('saved')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>My Recipes</button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <>
          <div className="bg-[#050505] rounded-[2.5rem] p-6 md:p-8 border border-white/5 mb-8 shadow-2xl">
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
                       <div className="p-2.5 bg-primary-500 rounded-xl text-white shadow-xl">
                          <Search size={20} />
                       </div>
                       <h2 className="text-xl font-black font-serif text-white tracking-tighter italic uppercase">What's the plan?</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                      <div className="lg:col-span-7 space-y-8">
                           <div id="studio-request-box" className="space-y-4">
                               <label className="text-[10px] font-black uppercase tracking-[0.4em] block text-primary-400 italic">I want to cook...</label>
                               <div className="relative">
                                  <textarea 
                                    value={genOptions.customRequest || ''} 
                                    onChange={(e) => setGenOptions({...genOptions, customRequest: e.target.value})} 
                                    placeholder="e.g. 'Pasta with white sauce', 'Spicy chicken', or 'Chocolate chip cookies (don't use my ingredients)'..." 
                                    className="w-full bg-slate-900 border border-white/10 rounded-[2rem] p-6 outline-none font-black text-white h-32 resize-none text-base focus:border-primary-500 transition-all shadow-inner placeholder:text-slate-700" 
                                  />
                                  <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[8px] font-black uppercase text-slate-600 tracking-widest">
                                    <SparklesIcon size={12} /> Simple AI
                                  </div>
                               </div>
                           </div>

                           <div className="flex flex-wrap gap-6">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] mb-3 block text-slate-500">Meal</label>
                                    <div className="flex flex-wrap gap-2">
                                      {['Any', 'Breakfast', 'Lunch', 'Dinner'].map(type => (
                                          <button key={type} onClick={() => setGenOptions({...genOptions, mealType: type as any})} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${genOptions.mealType === type ? 'bg-primary-900/20 border-primary-500 text-primary-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}>{type}</button>
                                      ))}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] mb-3 block text-slate-500">Time Limit</label>
                                    <div className="flex flex-wrap gap-2">
                                      {['Any', '15m', '30m', '45m', '60m+'].map(time => (
                                          <button key={time} onClick={() => setGenOptions({...genOptions, maxTime: time})} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${genOptions.maxTime === time ? 'bg-primary-900/20 border-primary-500 text-primary-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}>{time}</button>
                                      ))}
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] mb-3 block text-slate-500">Servings</label>
                                    <div className="flex items-center gap-3 bg-slate-900 border border-white/5 rounded-xl p-1.5 w-max">
                                        <button onClick={() => adjustServings(-1)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"><Minus size={14} /></button>
                                        <div className="flex items-center gap-2 px-3">
                                            <Users size={14} className="text-primary-500" />
                                            <span className="font-black text-white text-xs">{genOptions.servings}</span>
                                        </div>
                                        <button onClick={() => adjustServings(1)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"><Plus size={14} /></button>
                                    </div>
                                </div>
                           </div>
                      </div>
                      
                      <div className="lg:col-span-5 flex flex-col h-full">
                          <label className="text-[9px] font-black uppercase tracking-[0.4em] block text-slate-500 mb-4 italic">Don't use these</label>
                          {pantryItems.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mb-4">
                                  {pantryItems.map(item => {
                                      const isExcluded = genOptions.excludedIngredients?.includes(item.name);
                                      return (
                                          <button
                                              key={item.id}
                                              onClick={() => togglePantryExclusion(item.name)}
                                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                  isExcluded 
                                                  ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-lg' 
                                                  : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white hover:border-white/20'
                                              }`}
                                          >
                                              {isExcluded ? <Ban size={10} /> : <div className="w-2 h-2 rounded-full bg-slate-800" />}
                                              {item.name}
                                          </button>
                                      );
                                  })}
                              </div>
                          ) : (
                              <div className="mb-4 text-[10px] text-slate-700 uppercase font-black tracking-widest">No food in pantry.</div>
                          )}
                          
                          <div className="mt-auto p-5 rounded-3xl opacity-50 italic">
                             <p className="text-[10px] text-slate-600 font-bold leading-relaxed">Looking at what you already have.</p>
                          </div>
                      </div>
                  </div>
                  <button id="studio-curate-btn" onClick={handleStartGeneration} disabled={isGenerating} className={`w-full py-6 px-6 rounded-[1.8rem] font-black text-sm tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-3 shadow-lg ${isGenerating ? 'bg-slate-800 text-slate-600' : 'bg-white text-slate-900 hover:scale-[1.01] active:scale-95'}`}>
                      {isGenerating ? <Loader2Icon size={20} className="animate-spin" /> : <SparklesIcon size={20} />}
                      {isGenerating ? `Curation Cycle: ${generatedRecipes.length}/4` : `Find Recipes`}
                  </button>
              </div>
          </div>

          <div className="flex flex-col gap-8">
              {generatedRecipes.length === 0 && !isGenerating && (
                <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                    <UtensilsIcon size={48} className="mx-auto mb-6 text-white/5" />
                    <h3 className="text-2xl font-black font-serif text-white mb-2 italic tracking-tight uppercase leading-none">Ready to cook</h3>
                    <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.4em]">Ask for something above to see recipe ideas.</p>
                </div>
              )}
              {generatedRecipes.map(recipe => {
                const isMissing = recipe.missingIngredients && recipe.missingIngredients.length > 0;
                const isRendering = generatingImages.has(recipe.id);

                return (
                    <div key={recipe.id} className="bg-[#0c1220] rounded-[2.5rem] border border-white/5 shadow-xl hover:border-primary-500/40 transition-all duration-500 group overflow-hidden flex flex-col md:flex-row cursor-pointer animate-slide-up" onClick={() => openFullRecipe(recipe)}>
                        <div className="w-full md:w-[32%] aspect-video md:aspect-auto bg-slate-950 relative overflow-hidden shrink-0">
                            {recipe.imageUrl ? (
                                <img src={recipe.imageUrl} className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110" alt="" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
                                    {isRendering && (
                                        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                                            <div className="relative mb-6">
                                                <Loader2Icon size={40} className="animate-spin text-primary-500" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Cpu size={16} className="text-primary-400 opacity-50" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Neural Rendering</h4>
                                            </div>
                                        </div>
                                    )}
                                    <button 
                                        onClick={(e) => handleVisualize(e, recipe)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                                    >
                                        <ImageIcon size={22} className="text-primary-500" />
                                        <span className="text-[8px] font-black uppercase text-slate-300 tracking-[0.3em]">See Dish</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-6 md:p-8 flex flex-col bg-[#0c1220]">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-2xl md:text-3xl font-black text-white font-serif italic tracking-tight uppercase leading-none line-clamp-1">{recipe.title}</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic truncate">{recipe.description}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                      onClick={(e) => openScheduleModal(e, recipe)}
                                      className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-white bg-white/5 border border-white/10 hover:bg-primary-600"
                                      title="Add to Calendar"
                                    >
                                        <CalendarIcon size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }} className={`p-2.5 rounded-xl transition-all ${savedRecipes.some(r => r.id === recipe.id) ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500 bg-white/5 border border-white/10'}`}>
                                        <Heart size={16} fill={savedRecipes.some(r => r.id === recipe.id) ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-8">
                                {isMissing ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-full text-[7px] font-black uppercase tracking-[0.1em] border border-rose-500/30">
                                      <AlertTriangle size={10} /> MISSING {recipe.missingIngredients.length} ITEMS
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[7px] font-black uppercase tracking-[0.1em] border border-emerald-500/20">
                                      <CheckCircle2 size={10} /> COMPLETE PANTRY
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-500 rounded-full text-[7px] font-black uppercase tracking-[0.1em] border border-white/10">
                                  <Users size={10} className="text-sky-500" /> {recipe.servings} PERSONS
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-6">
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-slate-300 font-black text-[9px] uppercase tracking-widest">
                                        <ClockIcon size={12} className="text-primary-500"/> {recipe.timeMinutes}M
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-slate-300 font-black text-[9px] uppercase tracking-widest">
                                        <FlameIcon size={12} className="text-rose-500"/> {recipe.calories} KCAL
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-primary-500 transition-colors font-black text-[9px] uppercase tracking-[0.4em] italic">
                                    OPEN
                                    <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
              })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map(recipe => (
                <div key={recipe.id} className="bg-[#0c1220] p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all flex flex-col group relative overflow-hidden min-h-[280px]">
                    <h3 className="font-black text-lg lg:text-xl text-white font-serif leading-tight italic tracking-tighter mb-4 uppercase line-clamp-2 relative z-10">{recipe.title}</h3>
                    
                    <div className="relative z-10 space-y-4 mb-4 flex-1">
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg text-slate-400 font-black text-[8px] uppercase tracking-widest">
                                <ClockIcon size={10} className="text-primary-500"/> {recipe.timeMinutes}m
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg text-slate-400 font-black text-[8px] uppercase tracking-widest">
                                <FlameIcon size={10} className="text-rose-500"/> {recipe.calories}
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg text-slate-400 font-black text-[8px] uppercase tracking-widest">
                                <Users size={10} className="text-sky-500"/> {recipe.servings}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto relative z-10 flex gap-2">
                        <button onClick={() => openFullRecipe(recipe)} className="flex-1 py-3 bg-white text-slate-900 rounded-lg font-black text-[8px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-primary-500 hover:text-white transition-all">Open Recipe</button>
                        <button onClick={(e) => openScheduleModal(e, recipe)} className="p-3 bg-slate-800 text-slate-400 rounded-lg hover:bg-primary-600 hover:text-white transition-all"><CalendarIcon size={14}/></button>
                        <button onClick={() => onToggleSave(recipe)} className="p-3 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Heart size={14} fill="currentColor" /></button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {schedulingRecipe && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black font-serif text-white">Schedule Meal</h3>
                      <button onClick={() => setSchedulingRecipe(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="space-y-4 mb-8">
                      <p className="text-sm font-bold text-primary-400 italic">"{schedulingRecipe.title}"</p>
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
    </div>
  );
};

export default DashboardView;
