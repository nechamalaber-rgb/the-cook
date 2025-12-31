
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPreferences, MealLog, Pantry } from '../types';
import { 
  ShieldCheck, AlertTriangle, Zap, Check, X, 
  Moon, Sun, LogOut, Diamond, Crown, Utensils, 
  Brain, History, Trash, CheckCircle2, Globe, Users, 
  Clock, Bell, Trash2, Mail, Phone, Palette, 
  Flame, Scale, Dumbbell, Target, ChefHat, 
  Box, Eye, ZapOff, Sparkles, LayoutGrid, Home, Beef, Gauge, Info, Activity, Ruler, User, Star, ArrowRight, Percent, LifeBuoy, Filter, CookingPot, ChefHatIcon, Coins,
  Plus, ZapOff as BanIcon, ScrollText
} from 'lucide-react';

interface SettingsViewProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  mealHistory: MealLog[];
  pantries: Pantry[];
  setPantries: React.Dispatch<React.SetStateAction<Pantry[]>>;
  onSignOut: () => void;
  onGoToLanding: () => void;
}

const APPLIANCE_OPTIONS = ['Oven', 'Stove', 'Air Fryer', 'Instant Pot', 'Slow Cooker', 'Sous Vide', 'Microwave', 'Grill', 'Blender', 'Rice Cooker', 'Toaster'];
const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Low Carb', 'Whole30', 'Pescetarian'];
const CUISINE_OPTIONS = ['Italian', 'Mexican', 'Japanese', 'Chinese', 'French', 'Indian', 'Mediterranean', 'Thai', 'American'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const CHEF_PERSONALITIES = ['Strict', 'Creative'];
const SPICE_LEVELS = ['None', 'Mild', 'Medium', 'Hot', 'Nuclear'];
const BUDGET_OPTIONS = ['Thrifty', 'Moderate', 'Gourmet'];
const HEALTH_GOALS = ['Lose Weight', 'Maintain', 'Build Muscle'];

const STRIPE_LINKS = {
    pro: "https://buy.stripe.com/test_3cI7sNevgejJ3Tq42UfYY00"
};

const SettingsView: React.FC<SettingsViewProps> = ({ 
  preferences, 
  setPreferences, 
  onSignOut, 
  onGoToLanding 
}) => {
  const navigate = useNavigate();
  const [allergyInput, setAllergyInput] = useState('');
  const [blacklistInput, setBlacklistInput] = useState('');
  const [profileName, setProfileName] = useState(preferences.userName || '');

  const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveProfile = () => {
    updatePref('userName', profileName);
  };

  const handlePlanSelection = () => {
      window.open(STRIPE_LINKS.pro, '_blank');
  };

  const handleContactSupport = () => {
      window.location.href = "mailto:slaber1000@gmail.com?subject=GatherHome Support Request";
  };

  const handleCancelSubscription = () => {
    if (window.confirm("Cancel your Studio Pro membership? You will lose access to smart curations and shopping logistics.")) {
        setPreferences(prev => ({
            ...prev,
            subscriptionTier: 'none',
            isProMember: false,
            trialStartedAt: undefined,
            trialUsed: true 
        }));
    }
  };

  const toggleListItem = <K extends keyof UserPreferences>(key: K, item: string) => {
      const current = (preferences[key] as string[]) || [];
      const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
      updatePref(key, next as any);
  };

  const handleAddAllergy = () => {
    if(!allergyInput.trim()) return;
    const current = preferences.allergies || [];
    if(!current.includes(allergyInput.trim())) {
        updatePref('allergies', [...current, allergyInput.trim()]);
    }
    setAllergyInput('');
  };

  const handleAddBlacklist = () => {
    if(!blacklistInput.trim()) return;
    const current = preferences.blacklist || [];
    if(!current.includes(blacklistInput.trim())) {
        updatePref('blacklist', [...current, blacklistInput.trim()]);
    }
    setBlacklistInput('');
  };

  const updateNutritionalGoal = (field: 'maxCaloriesPerMeal' | 'minProteinPerMeal', value: string) => {
      setPreferences(prev => ({
          ...prev,
          nutritionalGoals: {
              ...prev.nutritionalGoals,
              [field]: value
          }
      }));
  };

  const isTrial = !!preferences.trialStartedAt;
  
  const trialStart = preferences.trialStartedAt ? new Date(preferences.trialStartedAt).getTime() : 0;
  const trialDuration = 3 * 24 * 60 * 60 * 1000; 
  const trialEnd = trialStart + trialDuration;
  const now = new Date().getTime();
  const timeLeft = Math.max(0, trialEnd - now);
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.max(0, ((now - trialStart) / trialDuration) * 100));

  return (
    <div className="animate-fade-in pb-32 max-w-7xl mx-auto px-4">
      
      {/* HEADER */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
        <div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter font-serif">Studio Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Configure your intelligent environment.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => updatePref('darkMode', !preferences.darkMode)} className={`p-4 rounded-2xl transition-all shadow-sm border ${preferences.darkMode ? 'bg-slate-800 border-slate-700 text-primary-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                {preferences.darkMode ? <Moon size={24} fill="currentColor" /> : <Sun size={24} />}
            </button>
            <button onClick={onGoToLanding} className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-rose-500 transition-colors">
                <Home size={24} />
            </button>
        </div>
      </div>

      {/* PLAN SECTION */}
      <div className="mb-20">
          <div className="flex items-center gap-4 mb-8 px-4">
              <div className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg"><Star size={20} fill="currentColor"/></div>
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Studio Plan</h2>
          </div>
          
          <div className="max-w-2xl px-2">
              <div 
                onClick={handlePlanSelection}
                className={`relative group rounded-[3rem] p-10 border-2 cursor-pointer transition-all duration-500 overflow-hidden ${preferences.subscriptionTier === 'pro' ? 'border-primary-500 bg-slate-900 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-700'}`}
              >
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-bl-2xl">
                      Full Access: $9.99
                  </div>
                  
                  <div className="relative z-10 pt-4">
                      <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                          <Crown size={32} />
                      </div>
                      <h3 className={`text-3xl font-black font-serif mb-2 ${preferences.subscriptionTier === 'pro' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Studio Pro</h3>
                      <p className={`text-sm font-medium mb-8 ${preferences.subscriptionTier === 'pro' ? 'text-slate-400' : 'text-slate-500'}`}>Complete culinary operating system.</p>
                      <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${preferences.subscriptionTier === 'pro' ? 'bg-primary-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02]'}`}>
                          {preferences.subscriptionTier === 'pro' ? 'Current Plan' : 'Select Pro'} <ArrowRight size={16} />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* SETTINGS MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* CULINARY PROFILE */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-500"><Filter size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif">Culinary Palette</h3>
                </div>

                <div className="space-y-10">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Dietary Laws</label>
                        <button 
                            onClick={() => updatePref('isKosher', !preferences.isKosher)}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${preferences.isKosher ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl ${preferences.isKosher ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                    <ScrollText size={20} />
                                </div>
                                <div className="text-left">
                                    <div className={`text-xs font-black uppercase tracking-widest ${preferences.isKosher ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Kosher Kitchen</div>
                                    <div className={`text-[10px] font-bold mt-0.5 ${preferences.isKosher ? 'text-indigo-100' : 'text-slate-400'}`}>Strict meat/dairy separation, no forbidden items</div>
                                </div>
                            </div>
                            {preferences.isKosher && <div className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> Active</div>}
                        </button>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Dietary Preferences</label>
                        <div className="flex flex-wrap gap-2">
                            {DIETARY_OPTIONS.map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => toggleListItem('dietaryRestrictions', opt)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${preferences.dietaryRestrictions.includes(opt) ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Forbidden Ingredients (Dislikes)</label>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={blacklistInput} 
                                onChange={e => setBlacklistInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddBlacklist()}
                                placeholder="e.g. Mushrooms, Olives..." 
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none outline-none p-4 rounded-xl text-xs font-bold"
                            />
                            <button onClick={handleAddBlacklist} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 rounded-xl"><Plus size={18}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {preferences.blacklist.map(item => (
                                <div key={item} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    <BanIcon size={12} className="text-rose-500" /> {item} 
                                    <button onClick={() => updatePref('blacklist', preferences.blacklist.filter(i => i !== item))} className="ml-1 hover:text-rose-500 transition-colors"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest">The AI will never suggest recipes containing these items.</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Allergies (Medical)</label>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={allergyInput} 
                                onChange={e => setAllergyInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddAllergy()}
                                placeholder="Add allergy..." 
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none outline-none p-4 rounded-xl text-xs font-bold"
                            />
                            <button onClick={handleAddAllergy} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 rounded-xl"><Plus size={18}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {preferences.allergies.map(all => (
                                <div key={all} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/50">
                                    {all} <button onClick={() => updatePref('allergies', preferences.allergies.filter(a => a !== all))}><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* KITCHEN CONFIG */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-500"><CookingPot size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif">Kitchen Hardware</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Available Appliances</label>
                        <div className="flex flex-wrap gap-2">
                            {APPLIANCE_OPTIONS.map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => toggleListItem('appliances', opt)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${preferences.appliances.includes(opt) ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Chef Skill Level</label>
                            <select 
                                value={preferences.skillLevel}
                                onChange={e => updatePref('skillLevel', e.target.value as any)}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-bold outline-none appearance-none"
                            >
                                {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Personality</label>
                            <select 
                                value={preferences.chefPersonality}
                                onChange={e => updatePref('chefPersonality', e.target.value as any)}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-bold outline-none appearance-none"
                            >
                                {CHEF_PERSONALITIES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* PALATE & LOGIC */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-500"><Flame size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif">Palate & Logic</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Spice Tolerance</label>
                        <select 
                            value={preferences.spiceLevel}
                            onChange={e => updatePref('spiceLevel', e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-bold outline-none appearance-none"
                        >
                            {SPICE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Inventory Strictness</label>
                        <select 
                            value={preferences.strictness}
                            onChange={e => updatePref('strictness', e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-bold outline-none appearance-none"
                        >
                            <option value="Creative">Flexible (Assumes Staples)</option>
                            <option value="Strict">Strict (Pantry Only)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Recipes per Generation</label>
                        <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            {[2, 3, 4, 5].map(num => (
                                <button 
                                    key={num}
                                    onClick={() => updatePref('generationsCount', num)}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${preferences.generationsCount === num ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {num} Options
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* HEALTH & GOALS */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-500"><Target size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif">Health & Goals</h3>
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Primary Objective</label>
                        <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            {HEALTH_GOALS.map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => updatePref('healthGoal', opt as any)}
                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${preferences.healthGoal === opt ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
                                <Flame size={14} className="text-orange-500" /> Max Calories
                             </label>
                             <input 
                                type="number" 
                                value={preferences.nutritionalGoals?.maxCaloriesPerMeal || ''} 
                                onChange={(e) => updateNutritionalGoal('maxCaloriesPerMeal', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs font-bold outline-none focus:border-primary-500"
                                placeholder="e.g. 600"
                             />
                        </div>
                        <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
                                <Dumbbell size={14} className="text-blue-500" /> Min Protein (g)
                             </label>
                             <input 
                                type="number" 
                                value={preferences.nutritionalGoals?.minProteinPerMeal || ''} 
                                onChange={(e) => updateNutritionalGoal('minProteinPerMeal', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs font-bold outline-none focus:border-primary-500"
                                placeholder="e.g. 30"
                             />
                        </div>
                    </div>
                </div>
            </div>
      </div>

      <div className="mt-12 bg-slate-100 dark:bg-slate-800/50 rounded-[3rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 text-2xl font-black shadow-sm">
                    {preferences.userName ? preferences.userName.charAt(0).toUpperCase() : <User size={24} />}
                </div>
                <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Account Name</label>
                    <input 
                        type="text" 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)}
                        onBlur={handleSaveProfile}
                        className="bg-transparent border-none outline-none font-serif font-black text-2xl text-slate-900 dark:text-white placeholder:text-slate-300 w-full"
                        placeholder="Your Name"
                    />
                </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
              <button onClick={handleContactSupport} className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-md flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                  <LifeBuoy size={16} className="text-indigo-500" /> Concierge Support
              </button>
              <button onClick={onSignOut} className="px-8 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2">
                  <LogOut size={16} /> Sign Out
              </button>
          </div>
      </div>
    </div>
  );
};

export default SettingsView;
