import React, { useState, useRef } from 'react';
import { MealLog, Recipe, UserPreferences } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Clock, Flame, History, Utensils, PieChart, Info, Coffee, Sun, Moon, Sunset, GripVertical, CheckCircle, Trash2, ArrowRight, X, Target, TrendingUp, Plus, ChevronDown, ChevronUp, AlignLeft, ShoppingCart, BookOpen, ScanLine, Loader2 } from 'lucide-react';
import { parseRecipeFromImage } from '../services/geminiService';

interface CalendarViewProps {
  mealHistory: MealLog[];
  savedRecipes?: Recipe[]; 
  onScheduleMeal?: (recipe: Recipe, date: string, mealType: string) => void;
  onUpdateMealStatus?: (logId: string, status: 'completed') => void;
  onDeleteMealLog?: (logId: string) => void;
  preferences?: UserPreferences;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  mealHistory, 
  savedRecipes = [], 
  onScheduleMeal,
  onUpdateMealStatus,
  onDeleteMealLog,
  preferences
}) => {
  const [viewMode, setViewMode] = useState<'history' | 'planner'>('planner');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  
  // Custom Meal Addition State
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [customMealDate, setCustomMealDate] = useState('');
  const [customMealType, setCustomMealType] = useState('Dinner');
  const [customMealName, setCustomMealName] = useState('');
  const [customMealDesc, setCustomMealDesc] = useState('');
  const [customMealTime, setCustomMealTime] = useState('30');
  const [customMealCalories, setCustomMealCalories] = useState('');
  const [customMealIngredients, setCustomMealIngredients] = useState('');
  const [customMealInstructions, setCustomMealInstructions] = useState('');
  
  // Recipe Scanning
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CALENDAR LOGIC (HISTORY) ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // --- WEEKLY PLANNER LOGIC ---
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // --- DATA FILTERING ---
  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealHistory
      .filter(m => m.date === dateStr) 
      .sort((a, b) => {
           const order = { 'Breakfast': 1, 'Lunch': 2, 'Dinner': 3, 'Snack': 4, 'Dessert': 5 };
           return (order[a.mealType as keyof typeof order] || 99) - (order[b.mealType as keyof typeof order] || 99);
      });
  };

  const getPlannedMealsForSlot = (date: Date, type: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealHistory.filter(m => m.date === dateStr && m.mealType === type && m.status === 'planned');
  };

  const openDayDetails = (date: Date) => {
      setSelectedDate(date);
      setIsDayModalOpen(true);
      setExpandedMealId(null);
  };

  const openAddMealModal = (dateStr?: string, mealType?: string) => {
      setCustomMealDate(dateStr || new Date().toISOString().split('T')[0]);
      setCustomMealType(mealType || 'Dinner');
      setCustomMealName('');
      setCustomMealDesc('');
      setCustomMealTime('30');
      setCustomMealCalories('');
      setCustomMealIngredients('');
      setCustomMealInstructions('');
      setIsAddMealModalOpen(true);
  };

  const handleAddCustomMeal = () => {
      if (!customMealName || !customMealDate) return;
      
      const tempRecipe: Recipe = {
          id: `custom-${Date.now()}`,
          title: customMealName,
          description: customMealDesc || 'Custom meal added via Planner',
          ingredients: customMealIngredients.split('\n').filter(s => s.trim()),
          instructions: customMealInstructions.split('\n').filter(s => s.trim()),
          timeMinutes: parseInt(customMealTime) || 30,
          difficulty: 'Medium',
          missingIngredients: [],
          matchScore: 100,
          calories: customMealCalories ? parseInt(customMealCalories) : undefined
      };

      if (onScheduleMeal) {
          onScheduleMeal(tempRecipe, customMealDate, customMealType);
      }
      setIsAddMealModalOpen(false);
  };
  
  const handleRecipeScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsScanning(true);
      try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((r) => {
              reader.onload = () => r((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
          });
          const recipe = await parseRecipeFromImage(base64);
          if (recipe && recipe.title) {
              const fullRecipe: Recipe = {
                  id: `scanned-planner-${Date.now()}`,
                  title: recipe.title || "Scanned Recipe",
                  description: recipe.description || "Scanned from image.",
                  ingredients: recipe.ingredients || [],
                  instructions: recipe.instructions || [],
                  timeMinutes: recipe.timeMinutes || 30,
                  difficulty: 'Medium',
                  missingIngredients: [],
                  matchScore: 100
              };
              
              // Schedule it immediately for the current view or today
              const targetDate = viewMode === 'planner' ? currentWeekStart.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
              
              if (onScheduleMeal) {
                  onScheduleMeal(fullRecipe, targetDate, 'Dinner');
                  alert(`Scanned "${fullRecipe.title}" and added to Dinner on ${targetDate}. You can drag it in the planner.`);
              }
          }
      } catch (err) {
          alert("Could not scan recipe.");
      } finally {
          setIsScanning(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const selectedMeals = getMealsForDate(selectedDate);
  const totalCalories = selectedMeals.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  
  const dailyCalorieGoal = preferences?.nutritionalGoals?.maxCaloriesPerMeal 
      ? parseInt(preferences.nutritionalGoals.maxCaloriesPerMeal) * 3 
      : 2000;

  const getMealIcon = (type: string) => {
      switch (type) {
          case 'Breakfast': return <Coffee size={18} />;
          case 'Lunch': return <Sun size={18} />;
          case 'Dinner': return <Moon size={18} />;
          default: return <Sunset size={18} />;
      }
  };

  return (
    <div className="animate-fade-in h-full relative">
      {/* --- ADD MEAL MODAL (EXPANDED) --- */}
      {isAddMealModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl max-w-lg w-full border-t sm:border border-slate-100 dark:border-slate-800 p-8 overflow-y-auto max-h-[90vh] animate-slide-up">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Create Full Meal</h3>
                      <button onClick={() => setIsAddMealModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={24} className="text-slate-500" /></button>
                  </div>
                  
                  <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Meal Name</label>
                              <input 
                                type="text" 
                                value={customMealName}
                                onChange={(e) => setCustomMealName(e.target.value)}
                                placeholder="e.g. Mom's Lasagna"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-bold"
                                autoFocus
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Date</label>
                              <input 
                                type="date" 
                                value={customMealDate}
                                onChange={(e) => setCustomMealDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-medium"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Type</label>
                              <select 
                                 value={customMealType}
                                 onChange={(e) => setCustomMealType(e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-medium"
                              >
                                  <option>Breakfast</option>
                                  <option>Lunch</option>
                                  <option>Dinner</option>
                                  <option>Snack</option>
                              </select>
                          </div>
                      </div>

                      {/* Details */}
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Description</label>
                          <input 
                            type="text" 
                            value={customMealDesc}
                            onChange={(e) => setCustomMealDesc(e.target.value)}
                            placeholder="Short description..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-medium"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Time (mins)</label>
                              <input 
                                type="number" 
                                value={customMealTime}
                                onChange={(e) => setCustomMealTime(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-bold"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Calories</label>
                              <input 
                                type="number" 
                                value={customMealCalories}
                                onChange={(e) => setCustomMealCalories(e.target.value)}
                                placeholder="Optional"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-medium"
                              />
                          </div>
                      </div>

                      {/* Full Details */}
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                                  <ShoppingCart size={14}/> Ingredients (One per line)
                              </label>
                              <textarea 
                                value={customMealIngredients}
                                onChange={(e) => setCustomMealIngredients(e.target.value)}
                                placeholder="1 lb Chicken&#10;2 cups Rice..."
                                className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-medium resize-none"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                                  <AlignLeft size={14}/> Instructions (One per line)
                              </label>
                              <textarea 
                                value={customMealInstructions}
                                onChange={(e) => setCustomMealInstructions(e.target.value)}
                                placeholder="Boil water...&#10;Cook pasta..."
                                className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none dark:text-white font-medium resize-none"
                              />
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={handleAddCustomMeal}
                        className="w-full py-4 bg-primary-600 text-white font-black rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 text-lg"
                      >
                          Save Meal to Calendar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- DAY DETAIL MODAL (BOTTOM SHEET ON MOBILE) --- */}
      {isDayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end md:pr-4 sm:justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="w-full sm:w-[500px] h-[90vh] sm:h-[95vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up border-t sm:border-l border-slate-200 dark:border-slate-800">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                      <div>
                          <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white">
                              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                          </h2>
                          <p className="text-slate-500 dark:text-slate-400 font-bold">
                              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                      </div>
                      <button onClick={() => setIsDayModalOpen(false)} className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Your Numbers / Stats Dashboard */}
                  <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl border border-primary-100 dark:border-primary-800">
                          <div className="flex items-center gap-2 mb-2 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
                              <Target size={14} /> Daily Calories
                          </div>
                          <div className="flex items-end gap-1">
                              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalCalories}</span>
                              <span className="text-xs font-medium text-slate-500 mb-1">/ {dailyCalorieGoal}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                              <div 
                                  className="h-full bg-primary-500" 
                                  style={{ width: `${Math.min((totalCalories / dailyCalorieGoal) * 100, 100)}%` }}
                              ></div>
                          </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                              <Utensils size={14} /> Meals Tracked
                          </div>
                          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{selectedMeals.length}</span>
                      </div>
                  </div>

                  {/* Detailed Meal List */}
                  <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Log</h3>
                      
                      {selectedMeals.length > 0 ? (
                          selectedMeals.map((meal) => {
                              const recipe = savedRecipes.find(r => r.id === meal.recipeId);
                              const hasDetails = recipe && (recipe.ingredients?.length > 0 || recipe.instructions?.length > 0);
                              
                              return (
                              <div key={meal.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex flex-col gap-2 group transition-all">
                                  <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                          <div className={`p-2 rounded-xl ${
                                              meal.mealType === 'Breakfast' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                              meal.mealType === 'Lunch' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                              'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                                          }`}>
                                              {getMealIcon(meal.mealType)}
                                          </div>
                                          <div>
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{meal.mealType}</span>
                                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                  meal.status === 'planned' 
                                                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' 
                                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                              }`}>
                                                  {meal.status === 'planned' ? 'Planned' : 'Eaten'}
                                              </span>
                                          </div>
                                      </div>
                                      <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                           {meal.status === 'planned' && (
                                                <button 
                                                    onClick={() => onUpdateMealStatus && onUpdateMealStatus(meal.id, 'completed')}
                                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40"
                                                    title="Mark as Eaten"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                           )}
                                           <button 
                                                onClick={() => onDeleteMealLog && onDeleteMealLog(meal.id)}
                                                className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40"
                                                title="Remove Log"
                                           >
                                                <Trash2 size={16} />
                                           </button>
                                      </div>
                                  </div>
                                  
                                  <div>
                                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight">{meal.recipeTitle}</h4>
                                      <div className="flex justify-between items-center mt-2">
                                          <div className="flex gap-2">
                                              {meal.calories && (
                                                  <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-md">
                                                      <Flame size={12} className="text-accent-500" fill="currentColor" /> {meal.calories} kcal
                                                  </div>
                                              )}
                                          </div>
                                          
                                          {/* Expand Toggle */}
                                          {hasDetails && (
                                              <button 
                                                onClick={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}
                                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                              >
                                                  {expandedMealId === meal.id ? 'Hide Details' : 'View Details'}
                                                  {expandedMealId === meal.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                              </button>
                                          )}
                                      </div>
                                  </div>

                                  {/* Expanded Recipe View */}
                                  {expandedMealId === meal.id && recipe && (
                                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                                          <div className="grid grid-cols-1 gap-4">
                                              {recipe.ingredients && recipe.ingredients.length > 0 && (
                                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                                      <h5 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><ShoppingCart size={12}/> Ingredients</h5>
                                                      <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                                                          {recipe.ingredients.map((ing, idx) => (
                                                              <li key={idx} className="flex items-start gap-2">
                                                                  <span className="w-1 h-1 rounded-full bg-primary-400 mt-1.5 shrink-0"></span>
                                                                  {ing}
                                                              </li>
                                                          ))}
                                                      </ul>
                                                  </div>
                                              )}
                                              {recipe.instructions && recipe.instructions.length > 0 && (
                                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                                      <h5 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><BookOpen size={12}/> Method</h5>
                                                      <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 pl-1">
                                                          {recipe.instructions.map((step, idx) => (
                                                              <li key={idx} className="flex items-start gap-2">
                                                                  <span className="font-bold text-slate-400 shrink-0">{idx + 1}.</span>
                                                                  {step}
                                                              </li>
                                                          ))}
                                                      </ol>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )})
                      ) : (
                          <div className="text-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                              <Utensils className="mx-auto mb-2 opacity-50" />
                              <p>No meals recorded for this day.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-1">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-serif">
              {viewMode === 'planner' ? 'Meal Planner' : 'History'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm md:text-base">
              {viewMode === 'planner' ? 'Your weekly meal schedule.' : 'Track your culinary journey.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
             <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center gap-2"
             >
                 {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                 <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Recipe'}</span>
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleRecipeScan} />

             <button 
                onClick={() => openAddMealModal()}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-900/10 hover:bg-primary-700 transition-all flex items-center gap-2"
             >
                 <Plus size={16} /> 
                 <span className="hidden sm:inline">Add Your Own Meal</span>
                 <span className="sm:hidden">Add Meal</span>
             </button>
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                 <button 
                    onClick={() => setViewMode('planner')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'planner' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                 >
                     Planner
                 </button>
                 <button 
                    onClick={() => setViewMode('history')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                 >
                     History
                 </button>
             </div>
        </div>
      </div>

      {viewMode === 'history' ? (
          // --- HISTORY VIEW ---
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
                <div className="flex items-center justify-between mb-6 px-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-300"><ChevronLeft size={20} /></button>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-300"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-3">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const thisDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        // Show ONLY completed meals in history view calendar dots to distinguish "History"
                        const meals = getMealsForDate(thisDate).filter(m => m.status !== 'planned');
                        const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                        
                        return (
                            <button 
                                key={day} 
                                onClick={() => openDayDetails(thisDate)}
                                className={`aspect-square rounded-xl md:rounded-2xl border p-1 md:p-2 flex flex-col items-start gap-1 relative group overflow-hidden transition-all text-left
                                    ${isToday 
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                <span className={`text-xs md:text-sm font-bold z-10 ${isToday ? 'text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>{day}</span>
                                
                                <div className="flex gap-0.5 md:gap-1 flex-wrap content-start w-full mt-auto">
                                    {meals.map((meal) => (
                                        <div 
                                          key={meal.id} 
                                          className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full 
                                          ${meal.mealType === 'Breakfast' ? 'bg-amber-400' : 
                                            meal.mealType === 'Lunch' ? 'bg-emerald-400' : 
                                            'bg-rose-400'}`}
                                        />
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
          </div>
      ) : (
          // --- PLANNER VIEW (Modified: SIDEYWAYS FIX) ---
          <div className="flex flex-col h-full">
              {/* Calendar Grid - Takes Full Width */}
              <div className="flex-1 overflow-x-auto bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-250px)] lg:h-[800px]">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 sticky left-0 right-0 top-0 bg-white dark:bg-slate-900 z-10">
                      <button onClick={prevWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"><ChevronLeft size={20} /></button>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                          Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <button onClick={nextWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"><ChevronRight size={20} /></button>
                  </div>

                  {/* Grid Content */}
                  <div className="flex-1 overflow-auto min-w-[800px] md:min-w-full">
                      <div className="grid grid-cols-8 h-full min-h-[600px]">
                          {/* Row Labels (Times) - FIXED: Removed rotation */}
                          <div className="col-span-1 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 sticky left-0 z-10">
                                <div className="h-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"></div> {/* Empty corner */}
                                {['Breakfast', 'Lunch', 'Dinner'].map(type => (
                                    <div key={type} className="h-1/3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-slate-400 text-[10px] md:text-xs uppercase tracking-widest text-center px-1">
                                        {type}
                                    </div>
                                ))}
                          </div>

                          {/* Days Columns */}
                          {weekDays.map((day, dayIndex) => {
                               const isToday = new Date().toDateString() === day.toDateString();
                               const dateStr = day.toISOString().split('T')[0];
                               return (
                                  <div key={day.toISOString()} className="col-span-1 border-r border-slate-100 dark:border-slate-800 flex flex-col min-w-[100px] md:min-w-[120px]">
                                      {/* Date Header - CLICKABLE */}
                                      <button 
                                        onClick={() => openDayDetails(day)}
                                        className={`h-12 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center w-full transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                        title="View Daily Details"
                                      >
                                          <span className="text-[10px] font-bold text-slate-400 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                          <span className={`text-sm font-bold ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-800 dark:text-slate-200'}`}>{day.getDate()}</span>
                                      </button>

                                      {/* Meal Slots */}
                                      {['Breakfast', 'Lunch', 'Dinner'].map((type) => {
                                          const plannedMeals = getPlannedMealsForSlot(day, type);
                                          return (
                                              <div 
                                                key={`${day.toISOString()}-${type}`}
                                                className={`flex-1 border-b border-slate-100 dark:border-slate-800 p-1 md:p-2 transition-colors relative group cursor-pointer
                                                    ${plannedMeals.length > 0 ? 'bg-white dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                                `}
                                                onClick={() => openAddMealModal(dateStr, type)}
                                              >
                                                  {plannedMeals.length === 0 && (
                                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-400">
                                                              <Plus size={16} />
                                                          </div>
                                                      </div>
                                                  )}

                                                  {plannedMeals.map(meal => (
                                                      <div key={meal.id} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 border border-l-4 border-slate-200 dark:border-slate-700 border-l-primary-500 rounded-lg p-1.5 md:p-2 shadow-sm text-left mb-2 group/card relative hover:shadow-md transition-shadow">
                                                          <h5 className="font-bold text-[10px] md:text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">{meal.recipeTitle}</h5>
                                                          <div className="flex justify-between items-center mt-2">
                                                              <span className="text-[9px] md:text-[10px] text-slate-400">{meal.calories ? `${meal.calories} kcal` : ''}</span>
                                                              <div className="flex gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                  <button 
                                                                    onClick={(e) => { e.stopPropagation(); onDeleteMealLog && onDeleteMealLog(meal.id); }}
                                                                    className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 rounded" title="Remove"
                                                                  >
                                                                      <Trash2 size={12} />
                                                                  </button>
                                                                  <button 
                                                                    onClick={(e) => { e.stopPropagation(); onUpdateMealStatus && onUpdateMealStatus(meal.id, 'completed'); }}
                                                                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600 rounded" title="Mark Cooked"
                                                                  >
                                                                      <CheckCircle size={12} />
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })}
                                  </div>
                               );
                          })}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;