
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ChefHat, Clock, Flame, 
  Loader2, Dice5, Activity, Eye, ShieldCheck, Users, Calendar, Utensils, Timer, Plus, X, Settings, Beef, Lightbulb, Dumbbell, Star, Film, Play, SlidersHorizontal, ChevronRight
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, RecipeGenerationOptions } from '../types';
import { generateRecipeImage, analyzePantryStatus } from '../services/geminiService';
import { SmartHint } from './StudioDiscovery';
import { StudioReel } from './StudioReel';

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
  onScheduleMeal,
  isGenerating,
  onGenerate,
  onRequireAccess
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');
  const [pantryInsight, setPantryInsight] = useState<{ tip: string; urgency: 'low' | 'medium' | 'high' } | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  
  const [recipeToPlan, setRecipeToPlan] = useState<Recipe | null>(null);
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [planMealType, setPlanMealType] = useState<any>('Dinner');
  
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const confirmPlan = () => {
    if (recipeToPlan) {
      onScheduleMeal(recipeToPlan, planDate, planMealType);
      setPlanModalOpen(false);
      setRecipeToPlan(null);
    }
  };

  useEffect(() => {
    const fetchInsight = async () => {
      if (pantryItems.length < 2) return;
      setIsLoadingInsight(true);
      try {
        const insight = await analyzePantryStatus(pantryItems);
        setPantryInsight(insight);
      } catch (e) {
        console.error("Failed to get pantry insight", e);
      } finally {
        setIsLoadingInsight(false);
      }
    };
    fetchInsight();
  }, [pantryItems.length]);

  const [genOptions, setGenOptions] = useState<RecipeGenerationOptions>({
    servings: preferences.householdSize || 2,
    mealType: (preferences as any).selectedGoal === 'fitness' ? 'Fitness Fuel' : 'Any',
    maxTime: 'Any',
    customRequest: '',
    complexity: preferences.skillLevel === 'Advanced' ? 'Gourmet' : 'Simple'
  });

  const [imageGenerating, setImageGenerating] = useState<Record<string, boolean>>({});

  const triggerImageGeneration = useCallback(async (recipe: Recipe) => {
    if (recipe.imageUrl || imageGenerating[recipe.id]) return;
    setImageGenerating(prev => ({ ...prev, [recipe.id]: true }));
    try {
      const imgData = await generateRecipeImage(recipe);
      if (imgData) {
        const fullImg = `data:image/png;base64,${imgData}`;
        setGeneratedRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl: fullImg } : r));
      }
    } catch (e) {
      console.error("Image gen failed", recipe.title);
    } finally {
      setImageGenerating(prev => ({ ...prev, [recipe.id]: false }));
    }
  }, [imageGenerating, setGeneratedRecipes]);

  useEffect(() => {
    if (generatedRecipes.length > 0 && !isGenerating) {
      generatedRecipes.forEach(r => {
          if (!r.imageUrl && !imageGenerating[r.id]) {
            triggerImageGeneration(r);
          }
      });
    }
  }, [generatedRecipes, isGenerating, triggerImageGeneration, imageGenerating]);

  const handleStartGeneration = async (isSurprise = false) => {
    if (!onRequireAccess("To curate menus")) return;

    const finalOptions: RecipeGenerationOptions = isSurprise ? {
        servings: preferences.householdSize,
        mealType: 'Any',
        maxTime: 'Any',
        customRequest: 'Surprise me with a unique fitness dish.',
        recipeCount: 1,
        complexity: genOptions.complexity 
    } : {
        ...genOptions,
        servings: preferences.householdSize,
        recipeCount: preferences.generationsCount || 3,
    };

    onGenerate(finalOptions);
  };

  const handleTimeChange = (val: string) => {
    setGenOptions(prev => ({ ...prev, maxTime: val }));
  };

  const updateHouseholdSize = (val: string) => {
    const size = Math.max(1, parseInt(val) || 1);
    setPreferences(prev => ({ ...prev, householdSize: size }));
    setGenOptions(prev => ({ ...prev, servings: size }));
  };

  const openFullRecipe = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    navigate('/recipes');
  };

  return (
    <div className="animate-fade-in w-full mx-auto pb-24">
      
      <StudioReel 
        isOpen={isReelOpen} 
        onClose={() => setIsReelOpen(false)} 
        pantryItems={pantryItems} 
        preferences={preferences} 
      />

      {pantryItems.length > 0 && (
        <div className="mb-10 px-1 animate-slide-down">
          <div className="bg-slate-900 dark:bg-slate-900 rounded-[2rem] p-6 border border-white/10 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-50"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${pantryInsight?.urgency === 'high' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-primary-500 shadow-primary-500/20'} shadow-lg transition-colors`}>
                  {isLoadingInsight ? <Loader2 size={24} className="animate-spin text-white" /> : <Lightbulb size={24} className="text-white" />}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 mb-1">Intelligence Insight</h4>
                  <p className="text-white text-lg font-bold font-serif leading-tight">
                    {isLoadingInsight ? "Analyzing pantry patterns..." : (pantryInsight?.tip || "Discovery ready.")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                  {((preferences as any).selectedGoal === 'fitness' || preferences.healthGoal === 'Build Muscle') && (
                      <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2">
                          <Activity size={14} className="text-emerald-400" />
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Fitness Optimization Active</span>
                      </div>
                  )}
                  <SmartHint text="Insights refresh based on your current pantry volume." />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 px-1">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif">Kitchen Studio</h1>
          <button 
            onClick={() => navigate('/settings')}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-primary-600 transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <Settings size={24} />
          </button>
          <button 
            onClick={() => setIsReelOpen(true)}
            className="p-3 bg-primary-500 rounded-2xl text-white hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            <Film size={20} />
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-200 dark:border-slate-800">
            <button onClick={() => setActiveTab('discover')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'discover' ? 'bg-primary-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Discover</button>
            <button onClick={() => setActiveTab('saved')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'saved' ? 'bg-primary-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Archives</button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-200 dark:border-slate-800 mb-10 relative overflow-hidden group">
              {isGenerating && (
                <div className="absolute top-0 left-0 right-0 h-1.5 z-20">
                  <div className="h-full bg-primary-500 animate-[loading_2s_ease-in-out_infinite] origin-left"></div>
                </div>
              )}
              
              <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                       <div className="flex items-center gap-3">
                           <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white flex items-center gap-3">
                               <SlidersHorizontal size={24} className="text-primary-500" />
                               Parameters
                               <SmartHint text="Adjust parameters to filter how the Studio curates recipes." />
                           </h2>
                       </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-8">
                      <div className="space-y-6">
                           <div>
                               <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Meal Tier</label>
                               <div className="flex flex-wrap gap-2">
                                  {['Any', 'Breakfast', 'Lunch', 'Dinner', 'Fitness Fuel'].map(type => (
                                      <button 
                                          key={type}
                                          onClick={() => setGenOptions({...genOptions, mealType: type as any})}
                                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                              genOptions.mealType === type 
                                              ? (type === 'Fitness Fuel' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400')
                                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                          }`}
                                      >
                                          {type}
                                      </button>
                                  ))}
                               </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Max Prep (Mins)</label>
                                    <input 
                                        type="number" value={genOptions.maxTime === 'Any' ? '' : genOptions.maxTime} 
                                        onChange={(e) => handleTimeChange(e.target.value)}
                                        placeholder="Flexible" 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-4 py-3.5 outline-none font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Servings</label>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden px-2">
                                        <input 
                                          type="number" min="1"
                                          value={preferences.householdSize}
                                          onChange={(e) => updateHouseholdSize(e.target.value)}
                                          className="w-full bg-transparent p-3 outline-none font-bold text-slate-900 dark:text-white text-lg text-center"
                                        />
                                    </div>
                                </div>
                           </div>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest block text-slate-400 mb-3">Custom Goal</label>
                              <textarea
                                  value={genOptions.customRequest || ''}
                                  onChange={(e) => setGenOptions({...genOptions, customRequest: e.target.value})}
                                  placeholder="e.g. 'Build Muscle', 'High Protein'..."
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none font-medium text-slate-700 dark:text-slate-200 h-24 resize-none text-sm"
                              />
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
                      <button 
                        onClick={() => handleStartGeneration(true)} 
                        disabled={isGenerating} 
                        className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border border-indigo-200 dark:border-indigo-800"
                      >
                          {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Dice5 size={24}/>}
                      </button>
                      <button 
                        onClick={() => handleStartGeneration(false)} 
                        disabled={isGenerating} 
                        className={`flex-1 w-full py-5 px-10 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${isGenerating ? 'bg-slate-800 text-slate-400' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
                      >
                          {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                          {isGenerating ? 'Curation in Progress...' : `Generate ${preferences.generationsCount || 3} Selection`}
                      </button>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generatedRecipes.length === 0 && !isGenerating && (
                <div className="md:col-span-2 lg:col-span-3 py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white dark:bg-slate-900/50">
                    <Utensils size={48} className="mx-auto mb-6 text-slate-200 dark:text-slate-800" />
                    <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white mb-2">No Curations Yet</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Select parameters to begin</p>
                </div>
              )}
              {generatedRecipes.map(recipe => (
                  <div key={recipe.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
                      <div className="h-56 bg-slate-100 dark:bg-slate-800 relative cursor-pointer" onClick={() => openFullRecipe(recipe)}>
                          {recipe.imageUrl ? <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Loader2 className="animate-spin text-primary-500" size={32}/></div>}
                          <div className={`absolute top-5 left-5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${recipe.matchScore > 85 ? 'bg-primary-600' : 'bg-orange-500'}`}>{recipe.matchScore}% Logic Match</div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                          <h3 className="text-2xl font-black mb-4 leading-tight text-slate-900 dark:text-slate-50 font-serif line-clamp-2">{recipe.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[10px] font-black uppercase mb-6 tracking-widest">
                              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md"><Clock size={12}/> {recipe.timeMinutes}m</span>
                              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md"><Flame size={12} className="text-rose-500"/> {recipe.calories} kcal</span>
                          </div>
                          <div className="flex gap-2 mt-auto">
                            <button onClick={() => openFullRecipe(recipe)} className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                                <Eye size={16}/> Inspect
                            </button>
                            <button onClick={() => { setRecipeToPlan(recipe); setPlanModalOpen(true); }} className="py-4 px-5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl border border-primary-200/50 hover:bg-primary-100 transition-all">
                                <Calendar size={20} />
                            </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div onClick={() => setIsCreatorOpen(true)} className="bg-primary-50 dark:bg-primary-900/10 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-500 transition-all min-h-[300px]">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-500 mb-6 shadow-xl group-hover:scale-110 transition-transform"><Plus size={32} /></div>
                <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white mb-2">Create New Entry</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manual Studio Addition</p>
            </div>
            {savedRecipes.map(recipe => (
                <div key={recipe.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col">
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white font-serif mb-4">{recipe.title}</h3>
                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => openFullRecipe(recipe)} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                            <Eye size={16}/> Archive Open
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {planModalOpen && recipeToPlan && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <h3 className="text-2xl font-black font-serif mb-6 text-slate-900 dark:text-white">Plan Discovery</h3>
                  <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Entry Title</p>
                          <p className="font-bold text-slate-900 dark:text-white truncate">{recipeToPlan.title}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                          <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold" />
                          <select value={planMealType} onChange={e => setPlanMealType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold">
                              <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Fitness Fuel</option>
                          </select>
                      </div>
                      <button onClick={confirmPlan} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Establish Plan</button>
                      <button onClick={() => setPlanModalOpen(false)} className="w-full py-2 text-xs font-black uppercase text-slate-400 tracking-widest hover:text-rose-500">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardView;
