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
  Minus,
  Plus,
  Calendar as CalendarIcon,
  X,
  Lock,
  Crown,
  RefreshCw
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
  mealHistory,
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
  
  const [schedulingRecipe, setSchedulingRecipe] = useState<Recipe | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleType, setScheduleType] = useState('Dinner');

  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());

  const used = preferences.freeGenerationsUsed || 0;
  const isLocked = !preferences.isProMember && used >= 3;

  useEffect(() => {
    const fetchInsight = async () => {
      if (pantryItems.length < 1) return;
      setIsLoadingInsight(true);
      try {
        const insight = await analyzePantryStatus(pantryItems);
        setPantryInsight(insight);
      } catch (e: any) {
        setPantryInsight({ tip: "Ready to cook something unique?", urgency: 'low' });
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
    if (isLocked) {
        navigate('/plans');
        return;
    }
    if (!onRequireAccess("to find recipes")) return;
    if (onConsumeGeneration && !onConsumeGeneration()) return; 

    // AGGRESSIVE EXCLUSION: Add all existing recipes to exclusion list to force variety
    const existingTitles = [...savedRecipes, ...generatedRecipes].map(r => r.title);

    onGenerate({ 
        ...genOptions, 
        recipeCount: 4,
        excludeTitles: Array.from(new Set(existingTitles))
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
            excludedIngredients: isExcluded ? current.filter(i => i !== name) : [...current, name]
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 px-1">
          <div className="bg-[#0c1220] rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-white/5 shadow-xl relative overflow-hidden group min-h-[100px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><Activity size={28} /></div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary-500 mb-1">Cooking Tip</p>
              <h3 className="text-white text-sm md:text-lg font-black leading-snug italic font-serif tracking-tight line-clamp-2">
                {isLoadingInsight ? "Checking your pantry..." : (pantryInsight?.tip || "Ready to cook something unique?")}
              </h3>
          </div>
          <div className="bg-[#0c1220] rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-white/5 shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500 mb-0.5">My Food</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl md:text-4xl font-black text-white font-serif">{pantryItems.length}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Items</span>
                    </div>
                </div>
                <button onClick={() => navigate('/pantry')} className="px-4 py-2 bg-white/5 text-primary-400 border border-white/10 rounded-xl hover:bg-primary-500 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">Pantry <ArrowRight size={12} /></button>
              </div>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 px-1">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white font-serif italic leading-none">Recipes.</h1>
        <div className="bg-slate-900 p-1 rounded-xl flex gap-1 shadow-sm border border-slate-800 w-full sm:w-auto">
            <button onClick={() => setActiveTab('discover')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>New Ideas</button>
            <button onClick={() => setActiveTab('saved')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>My Recipes</button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <>
          <div className="bg-[#050505] rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5 mb-6 md:mb-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5 md:mb-6 border-b border-white/5 pb-4 md:pb-6">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-500 rounded-xl text-white shadow-xl">
                              <Search size={18} />
                          </div>
                          <h2 className="text-lg md:text-xl font-black font-serif text-white tracking-tighter italic uppercase">Curation Engine</h2>
                       </div>

                       <div className="flex items-center gap-3 bg-slate-900/50 p-2 pr-4 rounded-2xl border border-white/5 group">
                           <div className="relative w-10 h-10 flex items-center justify-center">
                               <svg className="w-full h-full -rotate-90">
                                   <circle cx="20" cy="20" r="16" className="stroke-slate-800 fill-none" strokeWidth="3" />
                                   <circle 
                                      cx="20" cy="20" r="16" 
                                      className={`fill-none transition-all duration-1000 ${isLocked ? 'stroke-rose-500' : 'stroke-primary-500'}`} 
                                      strokeWidth="3" 
                                      strokeDasharray="100.5" 
                                      strokeDashoffset={100.5 - (Math.min(used, 3) / 3) * 100.5} 
                                      strokeLinecap="round"
                                   />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center">
                                   {preferences.isProMember ? <Crown size={12} className="text-primary-400" /> : (isLocked ? <Lock size={12} className="text-rose-500" /> : <RefreshCw size={12} className="text-primary-500 animate-spin-slow" />)}
                               </div>
                           </div>
                           <div className="flex flex-col">
                               <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Variety Boost</span>
                               <span className="text-[9px] font-black uppercase tracking-widest text-white">Active</span>
                           </div>
                       </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-6 md:mb-8">
                      <div className="lg:col-span-7 space-y-6 md:space-y-8">
                           <div id="studio-request-box" className="space-y-3">
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] block text-primary-400 italic">I want to cook...</label>
                               <div className="relative">
                                  <textarea 
                                    value={genOptions.customRequest || ''} 
                                    onChange={(e) => setGenOptions({...genOptions, customRequest: e.target.value})} 
                                    placeholder="Challenge the chef! e.g. 'Street food style with bold spice'..." 
                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl md:rounded-[2rem] p-5 md:p-6 outline-none font-black text-white h-24 md:h-32 resize-none text-sm md:text-base focus:border-primary-500 transition-all shadow-inner placeholder:text-slate-700" 
                                  />
                               </div>
                           </div>

                           <div className="flex flex-wrap gap-4 md:gap-6">
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-[8px] font-black uppercase tracking-[0.4em] mb-2 md:mb-3 block text-slate-500">Meal</label>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                      {['Any', 'Breakfast', 'Lunch', 'Dinner'].map(type => (
                                          <button key={type} onClick={() => setGenOptions({...genOptions, mealType: type as any})} className={`px-3 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${genOptions.mealType === type ? 'bg-primary-900/20 border-primary-500 text-primary-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}>{type}</button>
                                      ))}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-[8px] font-black uppercase tracking-[0.4em] mb-2 md:mb-3 block text-slate-500">Max Time</label>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                      {['Any', '15m', '30m', '45m'].map(time => (
                                          <button key={time} onClick={() => setGenOptions({...genOptions, maxTime: time})} className={`px-3 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${genOptions.maxTime === time ? 'bg-primary-900/20 border-primary-500 text-primary-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}>{time}</button>
                                      ))}
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <label className="text-[8px] font-black uppercase tracking-[0.4em] mb-2 md:mb-3 block text-slate-500">Servings</label>
                                    <div className="flex items-center gap-3 bg-slate-900 border border-white/5 rounded-xl p-1 w-max">
                                        <button onClick={() => adjustServings(-1)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"><Minus size={12} /></button>
                                        <div className="flex items-center gap-2 px-2">
                                            <Users size={12} className="text-primary-500" />
                                            <span className="font-black text-white text-[10px]">{genOptions.servings}</span>
                                        </div>
                                        <button onClick={() => adjustServings(1)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"><Plus size={12} /></button>
                                    </div>
                                </div>
                           </div>
                      </div>
                      
                      <div className="lg:col-span-5 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8">
                          <label className="text-[8px] font-black uppercase tracking-[0.4em] block text-slate-500 mb-3 italic">Pantry Exclusions</label>
                          {pantryItems.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4">
                                  {pantryItems.slice(0, 10).map(item => {
                                      const isExcluded = genOptions.excludedIngredients?.includes(item.name);
                                      return (
                                          <button
                                              key={item.id}
                                              onClick={() => togglePantryExclusion(item.name)}
                                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                                  isExcluded 
                                                  ? 'bg-rose-500/10 border-rose-500 text-rose-500' 
                                                  : 'bg-slate-900 border-white/5 text-slate-500'
                                              }`}
                                          >
                                              {isExcluded && <Ban size={10} />}
                                              {item.name}
                                          </button>
                                      );
                                  })}
                              </div>
                          ) : (
                              <div className="mb-4 text-[9px] text-slate-700 uppercase font-black tracking-widest">Pantry is empty.</div>
                          )}
                      </div>
                  </div>
                  
                  <button 
                    id="studio-curate-btn" 
                    onClick={handleStartGeneration} 
                    disabled={isGenerating} 
                    className={`w-full py-5 md:py-6 px-6 rounded-2xl md:rounded-[1.8rem] font-black text-xs md:text-sm tracking-[0.3em] md:tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${
                        isGenerating ? 'bg-slate-800 text-slate-600' : 
                        (isLocked ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:scale-[1.01]' : 'bg-white text-slate-900 hover:scale-[1.01] active:scale-95')
                    }`}
                  >
                      {isGenerating ? <Loader2Icon size={18} className="animate-spin" /> : (isLocked ? <Crown size={18} /> : <SparklesIcon size={18} />)}
                      {isGenerating ? `Synthesizing Variations...` : (isLocked ? `Unlock Elite Variety` : `Design Recipes`)}
                  </button>
              </div>
          </div>

          <div className="flex flex-col gap-5 md:gap-8">
              {generatedRecipes.length === 0 && !isGenerating && (
                <div className="py-16 md:py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem] md:rounded-[3rem] bg-white/5">
                    <UtensilsIcon size={40} className="mx-auto mb-5 text-white/5" />
                    <h3 className="text-xl md:text-2xl font-black font-serif text-white mb-2 italic tracking-tight uppercase leading-none">Fresh Ideas Await</h3>
                    <p className="text-slate-500 font-bold text-[8px] uppercase tracking-[0.4em]">Initialize the cycle for a variety check.</p>
                </div>
              )}
              {generatedRecipes.map(recipe => {
                const isMissing = recipe.missingIngredients && recipe.missingIngredients.length > 0;
                const isRendering = generatingImages.has(recipe.id);

                return (
                    <div key={recipe.id} className="bg-[#0c1220] rounded-3xl md:rounded-[2.5rem] border border-white/5 shadow-xl hover:border-primary-500/40 transition-all duration-500 group overflow-hidden flex flex-col md:flex-row cursor-pointer animate-slide-up" onClick={() => openFullRecipe(recipe)}>
                        <div className="w-full md:w-[38%] aspect-[4/3] bg-slate-950 relative overflow-hidden shrink-0">
                            {recipe.imageUrl ? (
                                <img src={recipe.imageUrl} className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110" alt="" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
                                    {isRendering && (
                                        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                                            <Loader2Icon size={32} className="animate-spin text-primary-500 mb-3" />
                                            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Rendering...</h4>
                                        </div>
                                    )}
                                    <button 
                                        onClick={(e) => handleVisualize(e, recipe)}
                                        className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                                    >
                                        <ImageIcon size={20} className="text-primary-500" />
                                        <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-300 tracking-[0.3em]">Visualize</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-5 md:p-8 flex flex-col bg-[#0c1220]">
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl md:text-3xl font-black text-white font-serif italic tracking-tight uppercase leading-none line-clamp-1 pr-4">{recipe.title}</h3>
                                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest italic truncate max-w-[200px] md:max-w-md">{recipe.description}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                      onClick={(e) => openScheduleModal(e, recipe)}
                                      className="p-2 rounded-lg transition-all text-slate-400 hover:text-white bg-white/5 border border-white/10"
                                    >
                                        <CalendarIcon size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }} className={`p-2 rounded-lg transition-all ${savedRecipes.some(r => r.id === recipe.id) ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500 bg-white/5 border border-white/10'}`}>
                                        <Heart size={14} fill={savedRecipes.some(r => r.id === recipe.id) ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                {isMissing ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[7px] font-black uppercase tracking-[0.1em] border border-rose-500/30">
                                      <AlertTriangle size={9} /> NEEDS {recipe.missingIngredients.length} ITEMS
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[7px] font-black uppercase tracking-[0.1em] border border-emerald-500/20">
                                      <CheckCircle2 size={9} /> FULL PANTRY
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-slate-500 rounded-full text-[7px] font-black uppercase tracking-[0.1em] border border-white/10">
                                  <Users size={9} className="text-sky-500" /> {recipe.servings} SERV
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-4 md:pt-6">
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-slate-300 font-black text-[8px] md:text-[9px] uppercase tracking-widest">
                                        <ClockIcon size={10} className="text-primary-500"/> {recipe.timeMinutes}M
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-slate-300 font-black text-[8px] md:text-[9px] uppercase tracking-widest">
                                        <FlameIcon size={10} className="text-rose-500"/> {recipe.calories}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-primary-500 transition-colors font-black text-[8px] md:text-[9px] uppercase tracking-[0.3em] italic">
                                    VIEW
                                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
              })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {savedRecipes.length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/5">
                   <Heart size={32} className="mx-auto mb-4 text-slate-800" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Your Vault is Empty</h4>
                </div>
            ) : savedRecipes.map(recipe => (
                <div key={recipe.id} className="bg-[#0c1220] p-5 md:p-6 rounded-3xl border border-white/5 shadow-xl transition-all flex flex-col group relative overflow-hidden min-h-[200px]">
                    <h3 className="font-black text-base md:text-xl text-white font-serif leading-tight italic tracking-tighter mb-4 uppercase line-clamp-2">{recipe.title}</h3>
                    
                    <div className="space-y-4 mb-4 flex-1">
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg text-slate-400 font-black text-[8px] uppercase tracking-widest">
                                <ClockIcon size={10} className="text-primary-500"/> {recipe.timeMinutes}m
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg text-slate-400 font-black text-[8px] uppercase tracking-widest">
                                <FlameIcon size={10} className="text-rose-500"/> {recipe.calories}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex gap-2">
                        <button onClick={() => openFullRecipe(recipe)} className="flex-1 py-2.5 bg-white text-slate-900 rounded-lg font-black text-[8px] uppercase tracking-[0.2em] hover:bg-primary-500 hover:text-white transition-all">Open</button>
                        <button onClick={(e) => openScheduleModal(e, recipe)} className="p-2.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-primary-600 hover:text-white transition-all"><CalendarIcon size={14}/></button>
                        <button onClick={() => onToggleSave(recipe)} className="p-2.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Heart size={14} fill="currentColor" /></button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {schedulingRecipe && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-[#0c1220] w-full max-w-sm rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black font-serif text-white">Schedule Meal</h3>
                      <button onClick={() => setSchedulingRecipe(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="space-y-4 mb-8">
                      <p className="text-xs md:text-sm font-bold text-primary-400 italic">"{schedulingRecipe.title}"</p>
                      <div>
                          <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Date</label>
                          <input 
                              type="date" 
                              value={scheduleDate} 
                              onChange={e => setScheduleDate(e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-xs md:text-sm font-bold outline-none focus:border-primary-500"
                          />
                      </div>
                      <div>
                          <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Meal Type</label>
                          <select 
                              value={scheduleType} 
                              onChange={e => setScheduleType(e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-xs md:text-sm font-bold outline-none focus:border-primary-500"
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