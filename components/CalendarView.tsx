
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MealLog, Recipe, UserPreferences, Ingredient } from '../types';
import { 
  ChevronLeft, ChevronRight, Clock, Flame, Utensils, 
  Coffee, Sun, Moon, Sunset, CheckCircle, 
  Trash2, X, TrendingUp, Plus,
  Wand2, PieChart, Loader2, Sparkles, ScrollText, Calendar, ShoppingCart, ArrowRight, Beef, Milk, Scale, User, Wallet, Timer
} from 'lucide-react';
// Corrected import: replaced generateSmartRecipes with generateSingleSmartRecipe
import { generateWeeklyPlan, estimateMealCalories, generateKosherWeeklyPlan, generateSingleSmartRecipe } from '../services/geminiService';

interface CalendarViewProps {
  mealHistory: MealLog[];
  savedRecipes?: Recipe[]; 
  onScheduleMeal?: (recipe: Recipe, date: string, mealType: string) => void;
  onUpdateMealStatus?: (logId: string, status: 'completed' | 'planned') => void;
  onDeleteMealLog?: (logId: string) => void;
  preferences?: UserPreferences;
  pantryItems?: Ingredient[];
  setMealHistory?: React.Dispatch<React.SetStateAction<MealLog[]>>;
  onAddToShoppingList?: (items: string[]) => void;
  setActiveRecipe?: React.Dispatch<React.SetStateAction<Recipe | null>>;
  onRequireAccess?: (action: string) => boolean;
  onConsumeGeneration?: () => boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  mealHistory, 
  savedRecipes = [], 
  onScheduleMeal,
  onUpdateMealStatus,
  onDeleteMealLog,
  preferences,
  pantryItems = [],
  setMealHistory,
  onAddToShoppingList,
  setActiveRecipe,
  onRequireAccess,
  onConsumeGeneration
}) => {
  const navigate = useNavigate();
  const isKosher = preferences?.isKosher || false;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);
  const [isCalculatingCalories, setIsCalculatingCalories] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [openingRecipeId, setOpeningRecipeId] = useState<string | null>(null);
  
  // Plan State
  const [isPlanConfigOpen, setIsPlanConfigOpen] = useState(false);
  const [planConfig, setPlanConfig] = useState<{ 
      servings: number; 
      focus: string;
      budget: 'Thrifty' | 'Moderate' | 'Gourmet';
      maxTime: number;
  }>({
      servings: preferences?.householdSize || 4,
      focus: 'Mixed',
      budget: 'Moderate',
      maxTime: 60
  });
  
  const [isPlanPreviewModalOpen, setIsPlanPreviewModalOpen] = useState(false);
  const [planResult, setPlanResult] = useState<{plan: any[], shoppingList: string[]} | null>(null);
  
  const [customMealName, setCustomMealName] = useState('');
  const [customMealCalories, setCustomMealCalories] = useState<string>('');
  const [customMealDate, setCustomMealDate] = useState(new Date().toISOString().split('T')[0]);
  const [customMealType, setCustomMealType] = useState('Dinner');

  const dateStr = selectedDate.toISOString().split('T')[0];

  const dailyMeals = useMemo(() => {
    return mealHistory.filter(m => m.date === dateStr);
  }, [mealHistory, dateStr]);

  const consumedMeals = useMemo(() => {
    return dailyMeals.filter(m => m.status === 'completed');
  }, [dailyMeals]);

  const dailyCalories = useMemo(() => {
    return consumedMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  }, [consumedMeals]);

  const weeklyTrends = useMemo(() => {
    const trends = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayCals = mealHistory
            .filter(m => m.date === dStr && m.status === 'completed')
            .reduce((acc, m) => acc + (m.calories || 0), 0);
        trends.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: dayCals, date: d });
    }
    return trends;
  }, [mealHistory]);

  const maxWeeklyCal = Math.max(...weeklyTrends.map(t => t.value), 2000);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handleMealClick = async (meal: MealLog) => {
      if (!setActiveRecipe) return;
      if (openingRecipeId) return; 

      setOpeningRecipeId(meal.id);

      const existing = savedRecipes.find(r => r.id === meal.recipeId || r.title === meal.recipeTitle);
      
      if (existing) {
          setActiveRecipe(existing);
          setOpeningRecipeId(null);
          navigate('/recipes');
          return;
      }

      try {
          // Corrected call: use generateSingleSmartRecipe and handle single return object
          const recipe = await generateSingleSmartRecipe(pantryItems, preferences || {} as UserPreferences, {
              customRequest: `Generate a detailed recipe for: ${meal.recipeTitle}. Must be around ${meal.calories || 450} calories.`,
              recipeCount: 1,
              mealType: meal.mealType as any,
              maxTime: '45',
              servings: preferences?.householdSize || 2
          }, 0);

          if (recipe && recipe.title) {
              const fullRecipe = { 
                  ...recipe, 
                  id: meal.recipeId.startsWith('auto-') || meal.recipeId.startsWith('kosher-') ? meal.recipeId : recipe.id,
                  title: meal.recipeTitle 
              }; 
              setActiveRecipe(fullRecipe);
              navigate('/recipes');
          } else {
              alert("Could not retrieve details for this meal.");
          }
      } catch (e) {
          console.error("Failed to open recipe details", e);
          alert("Unable to generate recipe details at this time.");
      } finally {
          setOpeningRecipeId(null);
      }
  };

  const handleAutoPlan = async () => {
      if (onRequireAccess && !onRequireAccess('To use auto-planning')) return;
      if (onConsumeGeneration && !onConsumeGeneration()) return; // Check limit

      if (!pantryItems.length) return alert("Add items to your inventory first!");
      setIsAutoPlanning(true);
      try {
          const plan = await generateWeeklyPlan(pantryItems, preferences!, dateStr);
          if (plan.length > 0 && setMealHistory) {
              const newLogs: MealLog[] = plan.map((p, idx) => ({
                  id: `auto-${Date.now()}-${idx}`,
                  date: p.date!,
                  mealType: p.mealType as any,
                  recipeTitle: p.recipeTitle!,
                  recipeId: `auto-recipe-${idx}`,
                  calories: p.calories || 450,
                  status: 'planned',
                  time: '19:00'
              }));
              setMealHistory(prev => [...prev.filter(m => m.status !== 'planned'), ...newLogs]);
          }
      } catch (e) { console.error(e); }
      finally { setIsAutoPlanning(false); }
  };

  const handleInitiatePlan = () => {
      const msg = isKosher ? 'To generate premium kosher plans' : 'To generate premium weekly plans';
      if (onRequireAccess && !onRequireAccess(msg)) return;
      setIsPlanConfigOpen(true);
  };

  const handleRunGeneration = async () => {
      setIsPlanConfigOpen(false);
      if (onConsumeGeneration && !onConsumeGeneration()) return; // Check limit

      setIsAutoPlanning(true);
      setPlanResult(null);
      try {
          const result = await generateKosherWeeklyPlan(pantryItems, preferences!, dateStr, planConfig);
          setPlanResult(result);
          setIsPlanPreviewModalOpen(true);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAutoPlanning(false);
      }
  };

  const confirmPlan = () => {
      if (!planResult || !setMealHistory) return;
      
      const newLogs: MealLog[] = planResult.plan.map((p, idx) => ({
          id: `plan-${Date.now()}-${idx}`,
          date: p.date,
          mealType: 'Dinner',
          recipeTitle: p.recipeTitle,
          recipeId: `plan-recipe-${idx}`,
          calories: p.calories,
          status: 'planned',
          time: '19:00'
      }));
      setMealHistory(prev => [...prev, ...newLogs]);

      if (onAddToShoppingList) {
          let itemsToAdd = planResult.shoppingList || [];
          if (itemsToAdd.length === 0) {
              const allIngredients = planResult.plan.flatMap(p => p.ingredients || []);
              itemsToAdd = Array.from(new Set(allIngredients));
          }
          if (itemsToAdd.length > 0) {
              onAddToShoppingList(itemsToAdd);
          }
      }

      setIsPlanPreviewModalOpen(false);
      setPlanResult(null);
  };

  const handleCalculateCalories = async () => {
    if (!customMealName.trim()) return;
    setIsCalculatingCalories(true);
    try {
        const cals = await estimateMealCalories(customMealName);
        if (cals > 0) {
            setCustomMealCalories(cals.toString());
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsCalculatingCalories(false);
    }
  };

  const getMealIcon = (type: string) => {
      switch (type) {
          case 'Breakfast': return <Coffee size={18} />;
          case 'Lunch': return <Sun size={18} />;
          case 'Dinner': return <Moon size={18} />;
          default: return <Sunset size={18} />;
      }
  };

  return (
    <div className="animate-fade-in flex flex-col h-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white font-serif tracking-tighter leading-none mb-3">
             Culinary Calendar
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
               {mealHistory.filter(m => m.date === new Date().toISOString().split('T')[0] && m.status === 'completed').length} Tasks Finalized Today
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button 
                onClick={handleInitiatePlan}
                disabled={isAutoPlanning}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all text-[10px] uppercase tracking-widest"
            >
                {isAutoPlanning ? <Loader2 size={16} className="animate-spin" /> : <ScrollText size={16} />}
                Generate {isKosher ? 'Kosher ' : ''}Week
            </button>
            <button 
                onClick={() => setIsAddMealModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest"
            >
                <Plus size={18} /> Add Entry
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-10">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary-500" /> Weekly Rhythm
              </h2>
              <div className="text-[10px] font-black uppercase text-slate-400">Past 7 Days</div>
          </div>
          <div className="flex items-end justify-between h-40 gap-4">
              {weeklyTrends.map((trend, i) => (
                  <div 
                    key={i} 
                    className="flex-1 flex flex-col items-center group cursor-pointer"
                    onClick={() => setSelectedDate(trend.date)}
                  >
                      <div className="w-full relative flex flex-col justify-end h-full">
                          <div 
                            className={`w-full rounded-xl transition-all duration-700 ${trend.date.toDateString() === selectedDate.toDateString() ? 'bg-primary-500 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/40'}`}
                            style={{ height: `${(trend.value / maxWeeklyCal) * 100}%`, minHeight: '8px' }}
                          >
                              {trend.value > 0 && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg pointer-events-none">
                                      {trend.value}
                                  </div>
                              )}
                          </div>
                      </div>
                      <span className={`text-[9px] font-black mt-4 uppercase tracking-tighter ${trend.date.toDateString() === selectedDate.toDateString() ? 'text-primary-600' : 'text-slate-400'}`}>
                          {trend.label}
                      </span>
                  </div>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 text-slate-400"><ChevronLeft size={20}/></button>
                      <h3 className="font-black font-serif text-slate-900 dark:text-white uppercase tracking-tight text-lg">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
                      </h3>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 text-slate-400"><ChevronRight size={20}/></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                      {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[8px] font-black text-slate-300 uppercase py-2">{d}</div>)}
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
                          const isSelected = d.toDateString() === selectedDate.toDateString();
                          const dateStr = d.toISOString().split('T')[0];
                          
                          const hasCompleted = mealHistory.some(m => m.date === dateStr && m.status === 'completed');
                          const hasPlanned = mealHistory.some(m => m.date === dateStr && m.status === 'planned');
                          
                          let indicatorColor = '';
                          if (hasCompleted) indicatorColor = 'bg-emerald-500';
                          else if (hasPlanned) indicatorColor = 'bg-primary-500';
                          
                          return (
                              <button 
                                key={dayNum}
                                onClick={() => setSelectedDate(d)}
                                className={`aspect-square rounded-2xl text-xs font-black flex flex-col items-center justify-center relative transition-all ${isSelected ? 'bg-primary-600 text-white shadow-xl scale-110 z-10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                              >
                                  {dayNum}
                                  {indicatorColor && !isSelected && <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${indicatorColor}`} />}
                              </button>
                          );
                      })}
                  </div>
              </div>

              <div className="bg-slate-900 text-white rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Daily Snapshot</h3>
                      <div className="space-y-8">
                          <div>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-sm font-bold opacity-60">Completed Intake</span>
                                  <span className="text-3xl font-black font-serif text-primary-400">{dailyCalories} <span className="text-xs uppercase font-sans">kcal</span></span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary-500 transition-all duration-1000" style={{ width: `${Math.min((dailyCalories/2000)*100, 100)}%` }} />
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Total Items</span>
                                  <span className="text-xl font-black">{dailyMeals.length}</span>
                              </div>
                              <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Completion</span>
                                  <span className="text-xl font-black">{dailyMeals.length > 0 ? Math.round((consumedMeals.length / dailyMeals.length) * 100) : 0}%</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8">
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 md:p-12 shadow-sm min-h-[600px] flex flex-col">
                  <div className="flex justify-between items-center mb-12">
                      <div>
                          <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              {new Date(dateStr) > new Date() ? 'Projected Schedule' : 'Daily Log'}
                          </p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setIsAddMealModalOpen(true)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 rounded-2xl transition-all shadow-sm"><Plus size={20}/></button>
                      </div>
                  </div>

                  <div className="flex-1 space-y-6">
                      {dailyMeals.length > 0 ? dailyMeals.map((meal, idx) => (
                          <div key={meal.id} className="relative group">
                              {idx !== dailyMeals.length - 1 && <div className="absolute left-7 top-14 bottom-[-24px] w-px bg-slate-100 dark:bg-slate-800" />}
                              
                              <div 
                                onClick={() => handleMealClick(meal)}
                                className={`flex items-start gap-6 p-6 rounded-[2.5rem] border transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 relative overflow-hidden ${meal.status === 'completed' ? 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-slate-200 dark:border-slate-700'}`}
                              >
                                  {openingRecipeId === meal.id && (
                                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                          <Loader2 size={24} className="animate-spin text-primary-500 mb-2"/>
                                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Retrieving Details...</span>
                                      </div>
                                  )}
                                  <div className={`p-4 rounded-2xl shrink-0 shadow-sm transition-colors group-hover:bg-primary-500 group-hover:text-white ${meal.status === 'completed' ? 'bg-primary-950 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}>
                                      {getMealIcon(meal.mealType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                          <div>
                                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">{meal.mealType} • {meal.time}</span>
                                              <h4 className="text-xl font-black font-serif text-slate-900 dark:text-white truncate pr-4 flex items-center gap-2">
                                                {meal.recipeTitle}
                                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500"/>
                                              </h4>
                                          </div>
                                          <div className="flex items-center gap-1">
                                              {meal.status === 'planned' ? (
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); onUpdateMealStatus && onUpdateMealStatus(meal.id, 'completed'); }} 
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 z-20 relative"
                                                  >
                                                      <CheckCircle size={14}/> Finalize
                                                  </button>
                                              ) : (
                                                  <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                                                      Consumed
                                                  </div>
                                              )}
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteMealLog && onDeleteMealLog(meal.id); }} 
                                                className="p-2 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 z-20 relative"
                                              >
                                                  <Trash2 size={16}/>
                                              </button>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                              <Flame size={14} className="text-accent-500"/> {meal.calories || '450'} kcal
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                              <Clock size={14} className="text-primary-500"/> {meal.status === 'completed' ? 'Logged' : 'Scheduled'}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )) : (
                          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-800/20 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                              <div className="p-6 bg-white dark:bg-slate-900 rounded-full shadow-xl mb-6 text-slate-200 dark:text-slate-800">
                                  <Utensils size={48} />
                              </div>
                              <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white mb-2">Studio Silence</h3>
                              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center max-w-[240px]">No meals recorded or planned for this date.</p>
                              <button onClick={() => setIsAddMealModalOpen(true)} className="mt-8 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                                  Create Entry
                              </button>
                          </div>
                      )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg"><PieChart size={18}/></div>
                          <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Daily Volume</span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{dailyCalories} Total kcal</span>
                          </div>
                      </div>
                      <button onClick={handleAutoPlan} disabled={isAutoPlanning} className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform disabled:opacity-50">
                          {isAutoPlanning ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                          Auto-Curate Cycle <ChevronRight size={14}/>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* PLAN CONFIG MODAL */}
      {isPlanConfigOpen && (
          <div className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                          <ScrollText size={32} />
                      </div>
                      <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white">{isKosher ? 'Kosher ' : ''}Planner</h2>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Customize your week</p>
                  </div>

                  <div className="space-y-8">
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block flex items-center gap-2">
                              <User size={14} /> Household Scale
                          </label>
                          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                              <span className="text-2xl font-black text-indigo-500 w-8 text-center">{planConfig.servings}</span>
                              <input 
                                type="range" min="1" max="10" step="1"
                                value={planConfig.servings}
                                onChange={(e) => setPlanConfig({...planConfig, servings: parseInt(e.target.value)})}
                                className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">People</span>
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block flex items-center gap-2">
                              <Scale size={14} /> Menu Focus
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                              {(isKosher ? ['Meat', 'Dairy', 'Mixed', 'Pareve'] : ['Mixed', 'Protein-Rich', 'Vegetarian', 'Quick']).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => setPlanConfig({...planConfig, focus: type as any})}
                                    className={`py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${planConfig.focus === type ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-300'}`}
                                  >
                                      {type}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block flex items-center gap-2">
                                  <Wallet size={14} /> Weekly Budget
                              </label>
                              <div className="flex flex-col gap-2">
                                  {['Thrifty', 'Moderate', 'Gourmet'].map(b => (
                                      <button 
                                        key={b}
                                        onClick={() => setPlanConfig({...planConfig, budget: b as any})}
                                        className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all border ${planConfig.budget === b ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-300'}`}
                                      >
                                          {b}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block flex items-center gap-2">
                                  <Timer size={14} /> Max Prep Time
                              </label>
                              <div className="flex flex-col gap-2">
                                  {[30, 45, 60, 90].map(t => (
                                      <button 
                                        key={t}
                                        onClick={() => setPlanConfig({...planConfig, maxTime: t})}
                                        className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all border ${planConfig.maxTime === t ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-300'}`}
                                      >
                                          {t} Mins
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                      <button onClick={() => setIsPlanConfigOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">Cancel</button>
                      <button onClick={handleRunGeneration} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Generate Plan</button>
                  </div>
              </div>
          </div>
      )}

      {/* PLAN PREVIEW MODAL */}
      {isPlanPreviewModalOpen && planResult && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center mb-8 shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                              <ScrollText size={24} />
                          </div>
                          <div>
                              <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white">{isKosher ? 'Kosher ' : ''}Dinner Plan</h2>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">7 Days • {isKosher ? 'Meat/Dairy Separated' : 'Curated for You'}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsPlanPreviewModalOpen(false)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition-all"><X size={24}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8 pr-2">
                      <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Calendar size={14} /> The Menu</h3>
                          {planResult.plan.map((day, i) => (
                              <div key={i} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col gap-3 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                                  <div className="flex justify-between items-start">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">{day.dayName} • {day.date}</span>
                                      <span className="text-[10px] font-bold text-slate-400">{day.calories} kcal</span>
                                  </div>
                                  <h4 className="font-serif font-black text-xl text-slate-900 dark:text-white leading-tight">{day.recipeTitle}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{day.description}</p>
                                  
                                  {day.ingredients && day.ingredients.length > 0 && (
                                      <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Required for this meal:</p>
                                          <div className="flex flex-wrap gap-2">
                                              {day.ingredients.map((ing: string, idx: number) => (
                                                  <span key={idx} className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                                                      {ing}
                                                  </span>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>

                      <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><ShoppingCart size={14} /> Consolidated Shopping List</h3>
                          <div className="p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 sticky top-0">
                              <div className="mb-6 flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                                  <Sparkles size={20} />
                                  <span className="font-black text-sm uppercase tracking-widest">Optimized for Shopping</span>
                              </div>
                              <ul className="space-y-3">
                                  {(planResult.shoppingList && planResult.shoppingList.length > 0) ? (
                                      planResult.shoppingList.map((item, i) => (
                                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 py-1 border-b border-indigo-100/50 dark:border-indigo-800/30 last:border-0">
                                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                              {item}
                                          </li>
                                      ))
                                  ) : (
                                     <li className="text-xs text-slate-400 font-bold italic">No extra items needed</li>
                                  )}
                              </ul>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4 shrink-0">
                      <button onClick={() => setIsPlanPreviewModalOpen(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-rose-500 transition-colors">Discard Plan</button>
                      <button onClick={confirmPlan} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
                          Confirm Plan & Add All Items to Cart <ShoppingCart size={18} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* NEW ENTRY MODAL */}
      {isAddMealModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white">New Entry</h2>
                    <button onClick={() => setIsAddMealModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={32}/></button>
                  </div>

                  <div className="space-y-8">
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Meal Signature (Quantities Invited)</label>
                          <div className="relative">
                            <input 
                                type="text" 
                                value={customMealName} 
                                onChange={e => setCustomMealName(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white focus:border-primary-500 text-lg pr-14" 
                                placeholder="e.g. 3 large eggs, half avocado" 
                            />
                            <button 
                                onClick={handleCalculateCalories}
                                disabled={isCalculatingCalories || !customMealName.trim()}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all disabled:opacity-30"
                                title="AI Calorie Estimation"
                            >
                                {isCalculatingCalories ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                            </button>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Date</label>
                              <input 
                                  type="date" 
                                  value={customMealDate} 
                                  onChange={e => setCustomMealDate(e.target.value)} 
                                  className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Calories</label>
                              <div className="relative">
                                <input 
                                    type="number" 
                                    value={customMealCalories} 
                                    onChange={e => setCustomMealCalories(e.target.value)} 
                                    className={`w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none border font-bold dark:text-white transition-all ${isCalculatingCalories ? 'border-primary-500 animate-pulse' : 'border-slate-200 dark:border-slate-700'}`}
                                    placeholder="e.g. 450"
                                />
                                {customMealCalories && !isCalculatingCalories && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-500 uppercase tracking-widest pointer-events-none">
                                        Estimated
                                    </div>
                                )}
                              </div>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Meal Tier</label>
                          <select 
                              value={customMealType} 
                              onChange={e => setCustomMealType(e.target.value)} 
                              className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 font-bold dark:text-white appearance-none"
                          >
                              <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
                          </select>
                      </div>
                      <div className="flex gap-4 pt-6">
                          <button onClick={() => setIsAddMealModalOpen(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest rounded-[2rem]">Cancel</button>
                          <button 
                            onClick={() => {
                                if (!customMealName) return;
                                const tempRecipe: Recipe = { id: `custom-${Date.now()}`, title: customMealName, description: 'Custom meal', ingredients: [], instructions: [], timeMinutes: 30, difficulty: 'Medium', missingIngredients: [], matchScore: 100, calories: parseInt(customMealCalories) || 450 };
                                if (onScheduleMeal) onScheduleMeal(tempRecipe, customMealDate, customMealType);
                                setIsAddMealModalOpen(false);
                            }} 
                            className="flex-[2] py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
                          >
                            Establish Entry
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;
