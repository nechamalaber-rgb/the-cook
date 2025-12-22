import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ChefHat, Clock, Flame, AlertTriangle, 
  ChevronRight, Loader2, MessageSquarePlus, 
  Dice5, Heart, Activity, Wand2, Eye, HelpCircle, Lightbulb, CheckCircle2, TrendingUp
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, RecipeGenerationOptions } from '../types';
import { generateRecipeImage } from '../services/geminiService';

const KITCHEN_FACTS = [
  "Adding salt to water makes it boil at a higher temperature, but slightly faster.",
  "Honey is the only food that never spoils—3,000-year-old honey is still edible!",
  "Store tomatoes at room temperature; the fridge kills their flavor enzymes.",
  "A sharp knife is safer than a dull one because it won't slip.",
  "Mushrooms are 90% water. Sauté them without oil first for better texture.",
  "A pinch of sugar in tomato sauce perfectly balances natural acidity.",
  "Avocados ripen faster in a paper bag with a banana.",
  "Your freezer is the best tool for reducing food waste.",
  "Rinsing rice removes excess starch for fluffier grains."
];

interface DashboardViewProps {
  pantryItems: Ingredient[];
  mealHistory: MealLog[];
  preferences: UserPreferences;
  savedRecipes: Recipe[];
  generatedRecipes: Recipe[];
  setGeneratedRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  onLogMeal: (recipe: Recipe) => void;
  setActiveRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;
  onToggleSave: (recipe: Recipe) => void;
  isGenerating: boolean;
  onGenerate: (options: RecipeGenerationOptions) => Promise<void>;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  pantryItems,
  mealHistory,
  preferences,
  savedRecipes,
  generatedRecipes,
  setGeneratedRecipes,
  setActiveRecipe,
  onToggleSave,
  isGenerating,
  onGenerate
}) => {
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');
  const [avoidRepeats, setAvoidRepeats] = useState(true);
  const [genOptions, setGenOptions] = useState<RecipeGenerationOptions>({
    servings: 2,
    mealType: 'Any',
    maxTime: 'Any',
    customRequest: ''
  });
  
  const [imageGenerating, setImageGenerating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setFactIndex(prev => (prev + 1) % KITCHEN_FACTS.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Automatically trigger image generation for new recipes once they arrive
  useEffect(() => {
    if (generatedRecipes.length > 0) {
      generatedRecipes.forEach(r => {
          if (!r.imageUrl) triggerImageGeneration(r);
      });
    }
  }, [generatedRecipes.length]);

  const expiringItems = pantryItems.filter(i => {
    if (!i.expiryDate) return false;
    const days = Math.ceil((new Date(i.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return days >= 0 && days <= 3;
  });

  const handleStartGeneration = async (isSurprise = false) => {
    const recentMeals = avoidRepeats ? mealHistory.slice(-10).map(m => m.recipeTitle) : [];
    const options = isSurprise ? {
        servings: 2,
        mealType: 'Any',
        maxTime: 'Any',
        customRequest: 'Surprise me with a unique dish from my available ingredients.',
        excludeRecents: recentMeals
    } as RecipeGenerationOptions : {
        ...genOptions,
        excludeRecents: recentMeals
    };

    onGenerate(options);
  };

  const triggerImageGeneration = useCallback(async (recipe: Recipe) => {
    if (recipe.imageUrl || imageGenerating[recipe.id]) return;
    setImageGenerating(prev => ({ ...prev, [recipe.id]: true }));
    try {
      const imgData = await generateRecipeImage(recipe.title);
      if (imgData) {
        const fullImg = `data:image/png;base64,${imgData}`;
        setGeneratedRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl: fullImg } : r));
      }
    } finally {
      setImageGenerating(prev => ({ ...prev, [recipe.id]: false }));
    }
  }, [imageGenerating, setGeneratedRecipes]);

  const openRecipe = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    navigate('/recipes');
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 px-1">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif">Savor Studio</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-sm md:text-lg flex items-center gap-2">
             AI menu design based on your stock.
             <button onClick={() => navigate('/about')} className="p-1 hover:text-primary-600 transition-colors">
                <HelpCircle size={18} />
             </button>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-200 dark:border-slate-800 w-full md:w-auto">
            <button 
                onClick={() => setActiveTab('discover')}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'discover' ? 'bg-primary-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Studio
            </button>
            <button 
                onClick={() => setActiveTab('saved')}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'saved' ? 'bg-primary-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Saved Recipes
            </button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-200 dark:border-slate-800 mb-10 relative overflow-hidden transition-all group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-accent-100/30 dark:bg-accent-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-2xl">
                             <Sparkles size={24} />
                        </div>
                        <div>
                             <h2 className="font-black text-2xl text-slate-800 dark:text-slate-100">Set the Menu</h2>
                             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                {expiringItems.length > 0 ? `${expiringItems.length} items to prioritize` : `${pantryItems.length} items available`}
                            </p>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="md:col-span-2">
                           <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Meal Type</label>
                           <div className="flex p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                              {['Any', 'Breakfast', 'Lunch', 'Dinner'].map(type => (
                                  <button 
                                      key={type}
                                      onClick={() => setGenOptions({...genOptions, mealType: type as any})}
                                      className={`flex-1 py-3 px-1 rounded-xl text-[10px] font-black uppercase transition-all ${
                                          genOptions.mealType === type 
                                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' 
                                          : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                  >
                                      {type}
                                  </button>
                              ))}
                           </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:col-span-2 lg:grid-cols-2">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Time Limit</label>
                            <select 
                                value={genOptions.maxTime}
                                onChange={(e) => setGenOptions({...genOptions, maxTime: e.target.value as any})}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-4 py-3 outline-none font-bold appearance-none transition-all hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                            >
                                <option value="Any">No Limit</option>
                                <option value="15">15 mins</option>
                                <option value="30">30 mins</option>
                                <option value="45">45 mins</option>
                                <option value="60">1 hour</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-slate-400">Portions</label>
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 shadow-sm">
                                <button onClick={() => setGenOptions(p => ({...p, servings: Math.max(1, p.servings - 1)}))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 transition-colors">-</button>
                                <span className="font-black text-slate-800 dark:text-slate-200">{genOptions.servings}</span>
                                <button onClick={() => setGenOptions(p => ({...p, servings: p.servings + 1}))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 transition-colors">+</button>
                            </div>
                        </div>
                      </div>
                  </div>

                  <div className="mb-10 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-black uppercase tracking-widest block text-slate-400 flex items-center gap-2">
                            <MessageSquarePlus size={14} className="text-primary-500" /> Flavor Preferences
                        </label>
                        {genOptions.customRequest && genOptions.customRequest.trim().length > 0 && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full animate-fade-in border border-primary-100 dark:border-primary-900/50">
                                <CheckCircle2 size={10} /> Saved
                            </div>
                        )}
                      </div>
                      <textarea
                          value={genOptions.customRequest || ''}
                          onChange={(e) => setGenOptions({...genOptions, customRequest: e.target.value})}
                          placeholder="e.g. 'I want something with a spicy, Asian profile'..."
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-slate-700 dark:text-slate-200 resize-none h-24 placeholder:text-slate-400 text-sm transition-all shadow-sm"
                      />
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-8 gap-6">
                      <div 
                          onClick={() => setAvoidRepeats(!avoidRepeats)}
                          className="flex items-center gap-4 cursor-pointer group w-full md:w-auto justify-center md:justify-start"
                      >
                          <div className={`w-12 h-7 rounded-full relative transition-colors ${avoidRepeats ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${avoidRepeats ? 'left-6' : 'left-1'}`}></div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary-600 transition-colors">Vary Meals</span>
                      </div>
                      
                      <div className="flex gap-4 w-full md:w-auto">
                        <button 
                             onClick={() => handleStartGeneration(true)}
                             disabled={isGenerating}
                             className="px-6 py-4 rounded-2xl bg-accent-500 text-white hover:bg-accent-600 shadow-xl shadow-accent-500/20 flex items-center justify-center transition-all disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
                             title="Surprise Me"
                        >
                            <Dice5 size={24} className={isGenerating ? 'animate-spin' : ''} />
                        </button>
                        <button 
                            onClick={() => handleStartGeneration(false)}
                            disabled={isGenerating}
                            className="flex-1 md:flex-none md:min-w-[280px] py-4 px-8 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl disabled:opacity-80 active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-100"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <ChefHat size={18} />}
                            {isGenerating ? 'Curating...' : 'Generate New Menu'}
                        </button>
                      </div>
                  </div>
              </div>
          </div>

          {isGenerating && (
             <div className="mb-12 text-center animate-fade-in flex flex-col items-center py-10">
                <div className="flex items-center gap-3 mb-5 py-2 px-5 bg-accent-50 dark:bg-accent-900/10 rounded-full border border-accent-100 dark:border-accent-900/20 shadow-sm">
                  <Lightbulb className="text-accent-500" size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-700 dark:text-accent-400">Did you know?</span>
                </div>
                <p className="text-xl md:text-2xl font-serif italic text-slate-700 dark:text-slate-200 max-w-xl leading-relaxed h-20 px-4">
                   "{KITCHEN_FACTS[factIndex]}"
                </p>
                <div className="mt-12 flex gap-2">
                    {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{animationDelay: `${i*150}ms`}}></div>
                    ))}
                </div>
             </div>
          )}

          {!isGenerating && generatedRecipes.length > 0 && (
             <div className="mb-8 px-4 py-3 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3 animate-fade-in">
                 <Heart size={16} className="text-rose-500" fill="currentColor" />
                 <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Pro-tip: Heart a recipe to save it to your collection.</span>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generatedRecipes.length > 0 ? (
                  generatedRecipes.map(recipe => {
                      const isSaved = savedRecipes.some(r => r.id === recipe.id);
                      return (
                      <div 
                          key={recipe.id} 
                          onClick={() => openRecipe(recipe)}
                          className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group overflow-hidden flex flex-col cursor-pointer"
                      >
                          <div className="h-56 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                              {recipe.imageUrl ? (
                                  <img 
                                      src={recipe.imageUrl} 
                                      alt={recipe.title} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                                  />
                              ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 relative">
                                      <div className="p-5 bg-white/50 dark:bg-slate-700/50 rounded-full backdrop-blur-md mb-3">
                                          <ChefHat size={48} className="opacity-20" />
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); triggerImageGeneration(recipe); }}
                                        disabled={imageGenerating[recipe.id]}
                                        className="absolute bottom-6 right-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100 dark:border-slate-700 shadow-sm hover:bg-primary-50 transition-colors"
                                      >
                                        {imageGenerating[recipe.id] ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                                        Generate Image
                                      </button>
                                  </div>
                              )}
                              <div className="absolute top-5 right-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-700">
                                  <Clock size={12} className="text-primary-500" /> {recipe.timeMinutes}m
                              </div>
                              <div className={`absolute top-5 left-5 px-4 py-2 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${
                                  recipe.matchScore > 85 ? 'bg-primary-600' : 'bg-accent-500'
                              }`}>
                                  {recipe.matchScore}% Synergy
                              </div>
                          </div>
                          <div className="p-8 md:p-10 flex-1 flex flex-col">
                              <h3 className="text-2xl md:text-3xl font-black mb-4 leading-tight text-slate-900 dark:text-slate-50 font-serif group-hover:text-primary-600 transition-colors">{recipe.title}</h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 line-clamp-2 font-medium leading-relaxed">{recipe.description}</p>
                              
                              <div className="flex flex-wrap gap-3 mb-8">
                                  {recipe.calories && (
                                      <div className="text-[10px] px-4 py-2 rounded-xl font-black flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                          <Flame size={14} className="text-accent-500" fill="currentColor" /> {recipe.calories} kcal
                                      </div>
                                  )}
                                  <div className="text-[10px] px-4 py-2 rounded-xl font-black flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                      <Activity size={14} className="text-primary-500" /> {recipe.difficulty.toUpperCase()}
                                  </div>
                              </div>
                              
                              <div className="mt-auto flex items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800/50">
                                  <span className="text-[11px] font-black text-slate-400 group-hover:text-primary-600 transition-colors flex items-center gap-2 uppercase tracking-widest">
                                      Enter Studio <ChevronRight size={18} />
                                  </span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }} 
                                    className={`p-2.5 transition-all duration-300 rounded-full ${isSaved ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/10 scale-110' : 'text-slate-300 hover:text-rose-500 hover:scale-110'}`}
                                  >
                                    <Heart size={22} fill={isSaved ? "currentColor" : "none"} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  )})
              ) : (
                  !isGenerating && (
                    <div className="col-span-full py-32 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/20 group">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                            <ChefHat className="opacity-10" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-300 dark:text-slate-700 mb-3 font-serif">Awaiting orders, Chef.</h3>
                        <p className="font-bold text-sm max-w-xs mx-auto text-slate-400/80">Input your preferences above and tap generate to begin the curated experience.</p>
                    </div>
                  )
              )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedRecipes.map(recipe => (
                <div key={recipe.id} onClick={() => openRecipe(recipe)} className="cursor-pointer bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }}
                        className="absolute top-10 right-10 text-rose-500 hover:scale-110 transition-transform p-2 bg-rose-50 dark:bg-rose-900/10 rounded-full"
                    >
                        <Heart size={24} fill="currentColor" />
                    </button>
                    <h3 className="font-black text-2xl mb-3 text-slate-900 dark:text-slate-100 font-serif group-hover:text-primary-600 transition-colors pr-10">{recipe.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 line-clamp-2 leading-relaxed font-medium">{recipe.description}</p>
                    <div className="flex items-center gap-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary-500"/> {recipe.timeMinutes}M</span>
                        <span className="flex items-center gap-1.5"><Activity size={14} className="text-accent-500"/> {recipe.difficulty}</span>
                    </div>
                </div>
            ))}
            {savedRecipes.length === 0 && (
                <div className="col-span-full py-32 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                    <Heart className="mx-auto mb-6 opacity-5" size={80} />
                    <p className="font-bold text-lg">Your saved recipes are waiting for their first entry.</p>
                </div>
            )}
        </div>
      )}

      <div className="mt-24 text-center border-t border-slate-100 dark:border-slate-900 pt-12 px-4">
          <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] flex items-center justify-center gap-4 italic uppercase tracking-[0.3em]">
              <Sparkles size={16} className="text-accent-400" /> 
              Intelligent Culinary Curation by Savor Studio
          </p>
      </div>
    </div>
  );
};

export default DashboardView;