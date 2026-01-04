import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ChefHat, Clock, Flame, 
  Loader2, MessageSquarePlus, 
  Dice5, Heart, Activity, Eye, ShieldCheck, Users, BookOpen, Calendar, Utensils, Timer, Plus, X, ListPlus, Save, Trash2, ArrowRight, PenLine, Ban, Package, ChevronRight, Check, Coffee, ScrollText, SlidersHorizontal, Settings, Beef, Lightbulb, HelpCircle
} from 'lucide-react';
import { Logo } from './Logo';
import { Ingredient, Recipe, UserPreferences, MealLog, RecipeGenerationOptions, Category } from '../types';
import { generateRecipeImage } from '../services/geminiService';

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
  onCancelGeneration,
  onRequireAccess
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');
  
  // Modal states
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isExclusionPickerOpen, setIsExclusionPickerOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    timeMinutes: 30,
    difficulty: 'Medium',
    ingredients: [],
    instructions: [],
    protein: '0g'
  });
  const [tempIngredient, setTempIngredient] = useState('');
  const [tempInstruction, setTempInstruction] = useState('');

  const [recipeToPlan, setRecipeToPlan] = useState<Recipe | null>(null);
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [planMealType, setPlanMealType] = useState('Dinner');
  
  const [genOptions, setGenOptions] = useState<RecipeGenerationOptions>({
    servings: preferences.householdSize || 2,
    mealType: 'Any',
    maxTime: 'Any',
    customRequest: '',
    complexity: preferences.skillLevel === 'Advanced' ? 'Gourmet' : 'Simple'
  });

  const [temporaryExclusions, setTemporaryExclusions] = useState<string[]>([]);
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
      console.error("Image gen failed for", recipe.title, e);
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
        customRequest: 'Surprise me with a unique, highly realistic home-cooked dish from my available ingredients.',
        recipeCount: 1,
        complexity: genOptions.complexity 
    } : {
        ...genOptions,
        servings: preferences.householdSize,
        recipeCount: preferences.generationsCount || 3,
        excludedIngredients: temporaryExclusions
    };

    onGenerate(finalOptions);
  };

  const toggleExclusion = (name: string) => {
    if (temporaryExclusions.includes(name)) {
        setTemporaryExclusions(prev => prev.filter(item => item !== name));
    } else {
        setTemporaryExclusions(prev => [...prev, name]);
    }
  };

  const handleTimeChange = (val: string) => {
    setGenOptions(prev => ({ ...prev, maxTime: val }));
  };

  const handleSaveManualRecipe = () => {
    if (!newRecipe.title || (newRecipe.ingredients?.length || 0) === 0) {
        alert("Please provide at least a title and one ingredient.");
        return;
    }
    const finalRecipe: Recipe = {
        ...newRecipe as Recipe,
        id: `manual-${Date.now()}`,
        isUserCreated: true,
        matchScore: 100,
        missingIngredients: [],
        protein: newRecipe.protein || '0g'
    };
    onToggleSave(finalRecipe);
    setIsCreatorOpen(false);
    setNewRecipe({ title: '', description: '', timeMinutes: 30, difficulty: 'Medium', ingredients: [], instructions: [], protein: '0g' });
    setActiveTab('saved');
  };

  const confirmPlan = () => {
    if (!recipeToPlan) return;
    onScheduleMeal(recipeToPlan, planDate, planMealType);
    setPlanModalOpen(false);
    setRecipeToPlan(null);
  };

  const addIngredient = () => {
      if (!tempIngredient.trim()) return;
      setNewRecipe(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), tempIngredient.trim()] }));
      setTempIngredient('');
  };

  const addInstruction = () => {
      if (!tempInstruction.trim()) return;
      setNewRecipe(prev => ({ ...prev, instructions: [...(prev.instructions || []), tempInstruction.trim()] }));
      setTempInstruction('');
  };

  const updateHouseholdSize = (val: number) => {
    const size = Math.max(1, val);
    setPreferences(prev => ({ ...prev, householdSize: size }));
    setGenOptions(prev => ({ ...prev, servings: size }));
  };

  const openFullRecipe = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    navigate('/recipes');
  };

  const pantryByCategory = pantryItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
  }, {} as Record<string, Ingredient[]>);

  return (
    <div className="animate-fade-in w-full mx-auto pb-24">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 px-1">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif">Kitchen Studio</h1>
          <button 
            onClick={() => navigate('/settings')}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-primary-600 transition-all border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 active:scale-95"
            title="Studio Settings"
          >
            <Settings size={24} />
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-200 dark:border-slate-800">
            <button onClick={() => setActiveTab('discover')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'discover' ? 'bg-primary-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Discover</button>
            <button onClick={() => setActiveTab('saved')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'saved' ? 'bg-primary-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Saved</button>
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
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary-100/30 dark:bg-primary-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
              
              <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                       <div className="flex items-center gap-3">
                           <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white flex items-center gap-3">
                               <SlidersHorizontal size={24} className="text-primary-500" />
                               Studio Parameters
                           </h2>
                           <button 
                             onClick={() => navigate('/about')}
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 transition-all border border-transparent hover:border-primary-500/20"
                           >
                             <HelpCircle size={14} /> How it works?
                           </button>
                       </div>
                       
                       <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 self-start md:self-auto">
                           <button 
                                onClick={() => setGenOptions({...genOptions, complexity: 'Simple'})}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                                    genOptions.complexity === 'Simple'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <Coffee size={12} /> Home Cook
                            </button>
                            <button 
                                onClick={() => setGenOptions({...genOptions, complexity: 'Gourmet'})}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                                    genOptions.complexity === 'Gourmet'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <ChefHat size={12} /> Exec Chef
                            </button>
                       </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-8">
                      <div className="space-y-6">
                           <div>
                               <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Meal Focus</label>
                               <div className="flex flex-wrap gap-2">
                                  {['Any', 'Breakfast', 'Lunch', 'Dinner'].map(type => (
                                      <button 
                                          key={type}
                                          onClick={() => setGenOptions({...genOptions, mealType: type as any})}
                                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                              genOptions.mealType === type 
                                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' 
                                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                          }`}
                                      >
                                          {type}
                                      </button>
                                  ))}
                               </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Max Time (Minutes)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={genOptions.maxTime === 'Any' ? '' : genOptions.maxTime} 
                                            onChange={(e) => handleTimeChange(e.target.value)}
                                            placeholder="Flexible" 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-4 py-3.5 outline-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Servings: {preferences.householdSize}</label>
                                    <input 
                                      type="range" 
                                      min="1"
                                      max="10"
                                      value={preferences.householdSize}
                                      onChange={(e) => updateHouseholdSize(parseInt(e.target.value) || 1)}
                                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500 mt-2"
                                    />
                                </div>
                           </div>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest block text-slate-400 mb-3">Vision / Specific Request</label>
                              <textarea
                                  value={genOptions.customRequest || ''}
                                  onChange={(e) => setGenOptions({...genOptions, customRequest: e.target.value})}
                                  placeholder="e.g. 'Use up the spinach', 'Something spicy'..."
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none font-medium text-slate-700 dark:text-slate-200 h-24 resize-none shadow-sm text-sm"
                              />
                          </div>

                          <div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-2">
                                        <Ban size={14} className="text-rose-500" /> 
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Session Exclusions</span>
                                    </div>
                                    <button onClick={() => setIsExclusionPickerOpen(true)} className="text-[10px] font-black uppercase text-primary-600 hover:underline">
                                        Modify ({temporaryExclusions.length})
                                    </button>
                                </div>
                           </div>
                      </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
                      <button 
                        onClick={() => handleStartGeneration(true)} 
                        disabled={isGenerating} 
                        className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all border border-indigo-200 dark:border-indigo-800 disabled:opacity-50"
                      >
                          {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Dice5 size={24}/>}
                      </button>
                      <button 
                        onClick={() => handleStartGeneration(false)} 
                        disabled={isGenerating} 
                        className={`flex-1 w-full py-5 px-10 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 active:scale-95 ${isGenerating ? 'bg-slate-800 text-slate-400' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'}`}
                      >
                          {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                          {isGenerating ? 'Curating Studio Menu...' : `Generate ${preferences.generationsCount || 3} Studio Recipes`}
                      </button>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generatedRecipes.length === 0 && !isGenerating && (
                <div className="md:col-span-2 lg:col-span-3 py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white dark:bg-slate-900/50">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700">
                        <Utensils size={32} />
                    </div>
                    <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white mb-2">Studio Empty</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Adjust parameters above and generate your first menu</p>
                </div>
              )}
              {generatedRecipes.map(recipe => (
                  <div key={recipe.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
                      <div className="h-56 bg-slate-100 dark:bg-slate-800 relative cursor-pointer" onClick={() => openFullRecipe(recipe)}>
                          {recipe.imageUrl ? (
                              <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                                  <Loader2 className="animate-spin text-primary-500" size={32}/>
                              </div>
                          )}
                          <div className={`absolute top-5 left-5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${recipe.matchScore > 85 ? 'bg-primary-600' : 'bg-orange-500'}`}>
                              {recipe.matchScore}% Match
                          </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                          <h3 className="text-2xl font-black mb-4 leading-tight text-slate-900 dark:text-slate-50 font-serif">{recipe.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs font-black uppercase mb-6 tracking-widest">
                              <span className="flex items-center gap-1"><Clock size={14}/> {recipe.timeMinutes}m</span>
                              <span className="flex items-center gap-1"><Flame size={14} className="text-rose-500"/> {recipe.calories} kcal</span>
                              <span className="flex items-center gap-1"><Beef size={14} className="text-amber-600"/> {recipe.protein}</span>
                          </div>
                          <button onClick={() => openFullRecipe(recipe)} className="mt-auto py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-600 hover:text-white transition-all">
                              <Eye size={16}/> View Entry
                          </button>
                      </div>
                  </div>
              ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
                onClick={() => setIsCreatorOpen(true)}
                className="bg-primary-50 dark:bg-primary-900/10 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-500 transition-all min-h-[300px]"
            >
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-500 mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    <Plus size={32} />
                </div>
                <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white mb-2">Create New Recipe</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manual Studio Digitization</p>
            </div>

            {savedRecipes.map(recipe => (
                <div key={recipe.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white font-serif mb-4">{recipe.title}</h3>
                    <p className="text-sm text-slate-500 mb-8 line-clamp-2 leading-relaxed">{recipe.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[10px] font-black uppercase mb-6 tracking-widest">
                        <span className="flex items-center gap-1"><Flame size={12}/> {recipe.calories} kcal</span>
                        <span className="flex items-center gap-1"><Beef size={12}/> {recipe.protein}</span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => openFullRecipe(recipe)} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                            <Eye size={16}/> Open Archives
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* EXCLUSION PICKER MODAL */}
      {isExclusionPickerOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-lg p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/5 animate-slide-up flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-10">
                      <div>
                        <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white flex items-center gap-3">
                           <Ban className="text-rose-500" /> Pantry Exclusions
                        </h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Select items the AI should ignore for this menu</p>
                      </div>
                      <button onClick={() => setIsExclusionPickerOpen(false)} className="p-3 text-slate-400 hover:text-rose-500 transition-colors"><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-10">
                      {Object.entries(pantryByCategory).map(([category, items]) => (
                          <div key={category} className="space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 pl-2 border-l-2 border-primary-500">{category}</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                  {(items as Ingredient[]).map(item => {
                                      const isExcluded = temporaryExclusions.includes(item.name);
                                      return (
                                          <button
                                              key={item.id}
                                              onClick={() => toggleExclusion(item.name)}
                                              className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between aspect-square group relative ${
                                                  isExcluded 
                                                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 shadow-inner' 
                                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary-400'
                                              }`}
                                          >
                                              <div className="flex justify-between items-start">
                                                  <Package size={16} className={isExcluded ? 'text-rose-500' : 'text-slate-400'} />
                                                  {isExcluded && <Check size={14} className="text-rose-500" strokeWidth={4} />}
                                              </div>
                                              <h4 className={`text-sm font-black transition-all ${isExcluded ? 'text-rose-700 dark:text-rose-300 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                                  {item.name}
                                              </h4>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="mt-10 flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
                      <button onClick={() => setTemporaryExclusions([])} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest">Clear All</button>
                      <button onClick={() => setIsExclusionPickerOpen(false)} className="flex-[2] py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">
                         Confirm Exclusions <ChevronRight size={18} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MANUAL CREATOR MODAL */}
      {isCreatorOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 md:p-14 shadow-2xl border border-white/5 animate-slide-up flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-10">
                      <div>
                        <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white">New Archive Entry</h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Manual Studio Digitization</p>
                      </div>
                      <button onClick={() => setIsCreatorOpen(false)} className="p-3 text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                              <div>
                                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Recipe Title</label>
                                  <input 
                                    type="text" 
                                    value={newRecipe.title} 
                                    onChange={e => setNewRecipe({...newRecipe, title: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold" 
                                    placeholder="Recipe Name"
                                  />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Difficulty</label>
                                      <select 
                                        value={newRecipe.difficulty} 
                                        onChange={e => setNewRecipe({...newRecipe, difficulty: e.target.value as any})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold"
                                      >
                                          <option>Easy</option><option>Medium</option><option>Hard</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Protein (e.g. 24g)</label>
                                      <input 
                                        type="text" 
                                        value={newRecipe.protein} 
                                        onChange={e => setNewRecipe({...newRecipe, protein: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold" 
                                        placeholder="20g"
                                      />
                                  </div>
                              </div>
                          </div>
                          <div className="space-y-6">
                               <div>
                                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Brief Description</label>
                                  <textarea 
                                    value={newRecipe.description} 
                                    onChange={e => setNewRecipe({...newRecipe, description: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-medium h-24 resize-none" 
                                    placeholder="Story or notes..."
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block flex items-center gap-2"><Utensils size={14}/> Ingredients Palette</label>
                          <div className="flex gap-2 mb-4">
                              <input 
                                type="text" 
                                value={tempIngredient} 
                                onChange={e => setTempIngredient(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addIngredient()}
                                className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold text-sm" 
                                placeholder="Add ingredient..." 
                              />
                              <button onClick={addIngredient} className="p-4 bg-primary-600 text-white rounded-xl"><Plus size={20}/></button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {(newRecipe.ingredients || []).map((ing, i) => (
                                  <div key={i} className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                      {ing} <button onClick={() => setNewRecipe({...newRecipe, ingredients: (newRecipe.ingredients || []).filter((_, idx) => idx !== i)})}><X size={12}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block flex items-center gap-2"><ListPlus size={14}/> Studio Logic (Steps)</label>
                          <div className="flex gap-2 mb-4">
                              <input 
                                type="text" 
                                value={tempInstruction} 
                                onChange={e => setTempInstruction(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addInstruction()}
                                className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold text-sm" 
                                placeholder="Add step..." 
                              />
                              <button onClick={addInstruction} className="p-4 bg-indigo-600 text-white rounded-xl"><Plus size={20}/></button>
                          </div>
                          <div className="space-y-2">
                              {(newRecipe.instructions || []).map((inst, i) => (
                                  <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-xl text-xs font-medium border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                                      <span className="font-black text-primary-500">{i+1}</span>
                                      <span className="flex-1">{inst}</span>
                                      <button onClick={() => setNewRecipe({...newRecipe, instructions: (newRecipe.instructions || []).filter((_, idx) => idx !== i)})}><Trash2 size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="mt-10 flex gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setIsCreatorOpen(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest">Discard</button>
                      <button onClick={handleSaveManualRecipe} className="flex-[2] py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">
                          <Save size={18}/> Commit to Archive
                      </button>
                  </div>
              </div>
          </div>
      )}

      {planModalOpen && recipeToPlan && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <h3 className="text-2xl font-black font-serif mb-6 text-slate-900 dark:text-white">Plan Meal</h3>
                  <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Entry</p>
                          <p className="font-bold text-slate-900 dark:text-white truncate">{recipeToPlan.title}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                          <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold" />
                          <select value={planMealType} onChange={e => setPlanMealType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-bold">
                              <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
                          </select>
                      </div>
                      <button onClick={confirmPlan} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirm Plan</button>
                      <button onClick={() => setPlanModalOpen(false)} className="w-full py-2 text-xs font-black uppercase text-slate-400 tracking-widest">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardView;