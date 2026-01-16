
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles as SparklesIcon, 
  Clock as ClockIcon, 
  Flame as FlameIcon, 
  Loader2 as Loader2Icon, 
  Utensils as UtensilsIcon, 
  SlidersHorizontal as SlidersHorizontalIcon, 
  Activity,
  ArrowRight,
  Heart,
  ChefHat,
  Home,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users,
  AlertTriangle,
  X,
  Ban,
  FilterX
} from 'lucide-react';
import { Ingredient, Recipe, UserPreferences, MealLog, RecipeGenerationOptions } from '../types';
import { analyzePantryStatus, generateRecipeImage } from '../services/geminiService';
import { SmartHint } from './StudioDiscovery';

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
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');
  const [pantryInsight, setPantryInsight] = useState<{ tip: string; urgency: 'low' | 'medium' | 'high' } | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const processingImgIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchInsight = async () => {
      if (pantryItems.length < 1) return;
      setIsLoadingInsight(true);
      try {
        const insight = await analyzePantryStatus(pantryItems);
        setPantryInsight(insight);
      } catch (e: any) {
        setPantryInsight({ tip: "Logic integrity synchronized.", urgency: 'low' });
      } finally { setIsLoadingInsight(false); }
    };
    fetchInsight();
  }, [pantryItems.length]);

  useEffect(() => {
    generatedRecipes.forEach(recipe => {
        if (!recipe.imageUrl && !processingImgIds.current.has(recipe.id)) {
            processingImgIds.current.add(recipe.id);
            generateRecipeImage(recipe.title, recipe.ingredients).then(data => {
                if (data) {
                    setGeneratedRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, imageUrl: `data:image/png;base64,${data}` } : r));
                }
                processingImgIds.current.delete(recipe.id);
            }).catch(() => {
                processingImgIds.current.delete(recipe.id);
            });
        }
    });
  }, [generatedRecipes, setGeneratedRecipes]);

  const [genOptions, setGenOptions] = useState<RecipeGenerationOptions>({
    servings: preferences.householdSize || 2,
    mealType: 'Any',
    maxTime: 'Any',
    customRequest: '',
    complexity: preferences.cookingStyle === 'culinary' ? 'Gourmet' : 'Simple',
    excludedIngredients: []
  });

  const toggleStyle = () => {
    const nextStyle = preferences.cookingStyle === 'simple' ? 'culinary' : 'simple';
    setPreferences(prev => ({ ...prev, cookingStyle: nextStyle }));
    setGenOptions(prev => ({ ...prev, complexity: nextStyle === 'culinary' ? 'Gourmet' : 'Simple' }));
  };

  const handleStartGeneration = async () => {
    if (!onRequireAccess("To curate recipes")) return;
    // Explicitly sync current UI state complexity to options before call
    const currentComplexity = preferences.cookingStyle === 'culinary' ? 'Gourmet' : 'Simple';
    onGenerate({ 
        ...genOptions, 
        servings: preferences.householdSize, 
        recipeCount: 4,
        complexity: currentComplexity
    });
  };

  const openFullRecipe = (recipe: Recipe) => { setActiveRecipe(recipe); navigate('/recipes'); };

  const toggleExclusion = (name: string) => {
    setGenOptions(prev => {
      const isExcluded = prev.excludedIngredients?.includes(name);
      const nextExclusions = isExcluded 
        ? prev.excludedIngredients?.filter(i => i !== name) 
        : [...(prev.excludedIngredients || []), name];
      return { ...prev, excludedIngredients: nextExclusions };
    });
  };

  const clearExclusions = () => {
    setGenOptions(prev => ({ ...prev, excludedIngredients: [] }));
  };

  return (
    <div className="animate-fade-in w-full mx-auto pb-24 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 px-1">
          <div className="bg-[#0c1220] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group min-h-[140px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity size={48} /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-3">Orchestration Logic</p>
              <h3 className="text-white text-lg md:text-xl font-black leading-snug italic font-serif tracking-tight">
                {isLoadingInsight ? "Validating Manifest..." : (pantryInsight?.tip || "Manifest stable. Zero hallucinations enabled.")}
              </h3>
          </div>
          <div className="bg-[#0c1220] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Central Registry</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white font-serif">{pantryItems.length}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Active Assets</span>
                    </div>
                </div>
                <button onClick={() => navigate('/pantry')} className="px-6 py-4 bg-white/5 text-primary-400 border border-white/10 rounded-2xl hover:bg-primary-500 hover:text-white transition-all shadow-sm flex items-center gap-3 text-[11px] font-black uppercase tracking-widest">Establish Manifest <ArrowRight size={14} /></button>
              </div>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 px-1">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-serif italic">Studio.</h1>
        <div className="bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-800 w-full sm:w-auto">
            <button onClick={() => setActiveTab('discover')} className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Curation</button>
            <button onClick={() => setActiveTab('saved')} className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Archived</button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <>
          <div className="bg-[#050505] rounded-[3rem] p-8 md:p-12 border border-white/5 mb-12 shadow-2xl">
              <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-white/5 pb-8">
                       <div className="flex items-center gap-4">
                           <div className="p-3 bg-primary-500 rounded-2xl text-white shadow-xl">
                              <SlidersHorizontalIcon size={24} />
                           </div>
                           <h2 className="text-2xl font-black font-serif text-white flex items-center gap-3 tracking-tighter italic">
                               Parameters
                               <SmartHint text="Studio Integrity: Every instruction is cross-referenced with your manifest quantities." />
                           </h2>
                       </div>
                       
                       <button 
                        onClick={toggleStyle}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all active:scale-95 ${preferences.cookingStyle === 'culinary' ? 'bg-indigo-900/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                       >
                         {preferences.cookingStyle === 'culinary' ? <ChefHat size={18}/> : <Home size={18}/>}
                         <span className="text-[11px] font-black uppercase tracking-[0.2em]">{preferences.cookingStyle === 'culinary' ? 'Professional' : 'Standard'}</span>
                       </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
                      <div className="lg:col-span-7 space-y-8">
                           <div>
                               <label className="text-[10px] font-black uppercase tracking-[0.4em] mb-5 block text-slate-500">Tier Selection</label>
                               <div className="flex flex-wrap gap-3">
                                  {['Any', 'Breakfast', 'Lunch', 'Dinner', 'Fitness Fuel'].map(type => (
                                      <button key={type} onClick={() => setGenOptions({...genOptions, mealType: type as any})} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${genOptions.mealType === type ? 'bg-primary-900/20 border-primary-500 text-primary-400 shadow-lg' : 'bg-slate-900 border-white/5 text-slate-600'}`}>{type}</button>
                                  ))}
                               </div>
                           </div>

                           <div className="space-y-4">
                                <div className="flex justify-between items-center mb-5">
                                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block italic">Exclusion Bar</label>
                                  {(genOptions.excludedIngredients?.length || 0) > 0 && (
                                    <button 
                                      onClick={clearExclusions}
                                      className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1.5"
                                    >
                                      <FilterX size={12} /> Clear All
                                    </button>
                                  )}
                                </div>
                                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                                  {pantryItems.length > 0 ? (
                                    pantryItems.map(item => {
                                      const isExcluded = genOptions.excludedIngredients?.includes(item.name);
                                      return (
                                        <button 
                                          key={item.id}
                                          onClick={() => toggleExclusion(item.name)}
                                          className={`shrink-0 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                                            isExcluded 
                                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 line-through opacity-60' 
                                              : 'bg-slate-900 border-white/5 text-slate-300 hover:border-primary-500/50'
                                          }`}
                                        >
                                          {isExcluded ? <Ban size={10} /> : <CheckCircle2 size={10} className="text-emerald-500 opacity-50" />}
                                          {item.name}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <p className="text-[10px] font-bold text-slate-700 italic tracking-widest uppercase py-2">Add items to pantry to see exclusions...</p>
                                  )}
                                </div>
                           </div>

                           <div className="flex flex-wrap gap-6">
                                <div className="flex-1 min-w-[180px]">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] mb-5 block text-slate-500">Timing Ops</label>
                                    <select value={genOptions.maxTime} onChange={(e) => setGenOptions(prev => ({...prev, maxTime: e.target.value}))} className="w-full bg-slate-900 border border-white/5 text-slate-300 text-sm rounded-2xl px-5 py-4 outline-none font-black uppercase tracking-widest appearance-none shadow-inner">
                                        <option value="Any">Unlimited</option>
                                        <option value="15">Fast (15m)</option>
                                        <option value="30">Medium (30m)</option>
                                        <option value="60">Extended (60m)</option>
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] mb-5 block text-slate-500">Scale</label>
                                    <div className="relative">
                                      <input type="number" min="1" value={preferences.householdSize} onChange={(e) => setPreferences(prev => ({ ...prev, householdSize: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 outline-none font-black text-white text-lg text-center shadow-inner" />
                                      <Users size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" />
                                    </div>
                                </div>
                           </div>
                      </div>
                      <div className="lg:col-span-5 flex flex-col">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] block text-slate-500 mb-5 italic">Prompt Overlay</label>
                          <textarea value={genOptions.customRequest || ''} onChange={(e) => setGenOptions({...genOptions, customRequest: e.target.value})} placeholder="e.g. prioritize protein, minimize heat time..." className="w-full bg-slate-900 border border-white/5 rounded-[2rem] p-6 outline-none font-bold text-slate-300 flex-1 min-h-[140px] resize-none text-sm focus:border-primary-500 transition-all shadow-inner" />
                      </div>
                  </div>
                  <button onClick={handleStartGeneration} disabled={isGenerating} className={`w-full py-8 px-8 rounded-[2rem] font-black text-base tracking-[0.5em] uppercase transition-all flex items-center justify-center gap-4 shadow-[0_30px_60px_rgba(0,0,0,0.4)] ${isGenerating ? 'bg-slate-800 text-slate-600' : 'bg-white text-slate-900 hover:scale-[1.01] active:scale-95'}`}>
                      {isGenerating ? <Loader2Icon size={24} className="animate-spin" /> : <SparklesIcon size={24} />}
                      {isGenerating ? 'Synthesizing Manifest...' : `Initialize Logic Cycle`}
                  </button>
              </div>
          </div>

          <div className="flex flex-col gap-6">
              {generatedRecipes.length === 0 && !isGenerating && (
                <div className="py-32 text-center border-4 border-dashed border-white/5 rounded-[4rem] bg-white/5">
                    <UtensilsIcon size={64} className="mx-auto mb-8 text-white/5" />
                    <h3 className="text-3xl font-black font-serif text-white mb-3 italic tracking-tight uppercase">Studio Dormant</h3>
                    <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.4em]">Establish parameters to begin curation.</p>
                </div>
              )}
              {generatedRecipes.map(recipe => {
                const isMissing = recipe.missingIngredients && recipe.missingIngredients.length > 0;
                return (
                    <div key={recipe.id} className="bg-[#0c1220] rounded-[3rem] border border-white/5 shadow-2xl hover:border-primary-500/40 transition-all duration-500 group overflow-hidden flex flex-col md:flex-row relative min-h-[220px] cursor-pointer" onClick={() => openFullRecipe(recipe)}>
                        <div className="w-full md:w-[32%] bg-slate-950 relative overflow-hidden shrink-0">
                            {recipe.imageUrl ? <img src={recipe.imageUrl} className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110 opacity-80 group-hover:opacity-100" alt="" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950"><Loader2Icon size={32} className="animate-spin text-primary-500/10" /></div>}
                            <div className="absolute top-4 left-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-2xl z-10 bg-primary-600/90 backdrop-blur-md italic tracking-widest border border-white/10">MEAL</div>
                        </div>
                        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="flex justify-between items-start gap-6">
                                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-black mb-1 leading-[1.1] text-white font-serif italic tracking-tighter uppercase line-clamp-2">{recipe.title}</h3>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }} className={`p-4 rounded-2xl transition-all shrink-0 shadow-xl ${savedRecipes.some(r => r.id === recipe.id) ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500 bg-white/5 border border-white/10'}`}><Heart size={20} fill={savedRecipes.some(r => r.id === recipe.id) ? "currentColor" : "none"} /></button>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {isMissing ? (
                                        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-rose-500/20 shadow-lg shadow-rose-500/5">
                                          <AlertTriangle size={14} /> Needs Replenishment
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                          <CheckCircle2 size={14} /> Manifest Ready (100%)
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2.5 px-4 py-1.5 bg-primary-500/10 text-primary-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary-500/20">
                                      <Zap size={14} /> Verified Naming
                                    </div>
                                    <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/5 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">
                                      <Users size={14} /> {recipe.servings || preferences.householdSize} People
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] border-t border-white/5 pt-8 mt-8 group-hover:border-primary-500/20 transition-colors">
                                <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-2xl border border-white/5"><ClockIcon size={16} className="text-primary-500"/> {recipe.timeMinutes}M</div>
                                <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-2xl border border-white/5"><FlameIcon size={16} className="text-rose-500"/> {recipe.calories} KCAL</div>
                                <div className="flex-1" />
                                <div className="flex items-center gap-3 text-white group-hover:text-primary-500 transition-colors">
                                    <span className="font-black italic tracking-[0.3em]">DETAILS</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-3 transition-transform duration-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
              })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedRecipes.map(recipe => (
                <div key={recipe.id} className="bg-[#0c1220] p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:shadow-primary-500/5 transition-all flex flex-col group relative overflow-hidden h-[320px]">
                    <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transition-transform group-hover:scale-110"><UtensilsIcon size={160} /></div>
                    <h3 className="font-black text-2xl lg:text-3xl text-white font-serif leading-tight italic tracking-tighter mb-8 uppercase line-clamp-3 relative z-10">{recipe.title}</h3>
                    <div className="mt-auto relative z-10 flex gap-4">
                        <button onClick={() => openFullRecipe(recipe)} className="flex-1 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:bg-primary-500 hover:text-white transition-all active:scale-95">Open Studio</button>
                        <button onClick={() => onToggleSave(recipe)} className="p-5 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Heart size={20} fill="currentColor" /></button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DashboardView;
