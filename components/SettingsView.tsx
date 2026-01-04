
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
  Plus, ZapOff as BanIcon, ScrollText, Sliders, Hash, Globe2, ChefHat as Chef, Coffee, Thermometer, SlidersHorizontal, Sliders as SlidersIcon
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
const CUISINE_OPTIONS = ['Italian', 'Mexican', 'Japanese', 'Chinese', 'Indian', 'French', 'Mediterranean', 'Thai', 'Korean', 'American'];
const HEALTH_GOALS = ['Lose Weight', 'Maintain', 'Build Muscle'];
const SPICE_LEVELS = ['None', 'Mild', 'Medium', 'Hot', 'Nuclear'];
const BUDGET_OPTIONS = ['Thrifty', 'Moderate', 'Gourmet'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PERSONALITY_OPTIONS = ['Strict', 'Creative'];

const SettingsView: React.FC<SettingsViewProps> = ({ 
  preferences, 
  setPreferences, 
  onSignOut, 
  onGoToLanding 
}) => {
  const [allergyInput, setAllergyInput] = useState('');
  const [profileName, setProfileName] = useState(preferences.userName || '');

  const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveProfile = () => {
    updatePref('userName', profileName);
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

  return (
    <div className="animate-fade-in pb-32 max-w-7xl mx-auto px-4">
      
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-4 pt-4">
        <div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter font-serif">Studio Configuration</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-[0.2em]">Prepzu Intelligence OS v1.2</p>
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

      {/* INTELLIGENCE CONTROLS */}
      <div className="mb-12 bg-slate-900 dark:bg-slate-900 text-white rounded-[4rem] p-10 md:p-16 shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
              <div className="space-y-10">
                  <div className="flex items-center gap-5">
                      <div className="p-4 bg-primary-500 rounded-2xl text-white shadow-xl shadow-primary-500/20"><SlidersIcon size={24}/></div>
                      <div>
                          <h3 className="text-2xl font-black font-serif">Studio Processing</h3>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-1">Resource allocation</p>
                      </div>
                  </div>

                  <div className="space-y-8">
                      <div>
                          <div className="flex justify-between items-center mb-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">Recipes / Cycle</label>
                              <span className="text-2xl font-black font-serif text-white">{preferences.generationsCount || 4}</span>
                          </div>
                          <input 
                            type="range" min="1" max="6" step="1"
                            value={preferences.generationsCount || 4}
                            onChange={(e) => updatePref('generationsCount', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">Default Household Scaling</label>
                              <span className="text-2xl font-black font-serif text-white">{preferences.householdSize}</span>
                          </div>
                          <input 
                            type="range" min="1" max="10" step="1"
                            value={preferences.householdSize}
                            onChange={(e) => updatePref('householdSize', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                      </div>
                  </div>
              </div>

              <div className="space-y-10">
                  <div className="flex items-center gap-5">
                      <div className="p-4 bg-indigo-500 rounded-2xl text-white shadow-xl shadow-indigo-500/20"><Chef size={24}/></div>
                      <div>
                          <h3 className="text-2xl font-black font-serif">Logic Algorithms</h3>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-1">Creative Parameters</p>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 block">Chef Intelligence Mode</label>
                        <div className="grid grid-cols-2 gap-3 bg-white/5 rounded-[1.5rem] p-1.5 border border-white/5 shadow-inner">
                            {PERSONALITY_OPTIONS.map(p => (
                                <button 
                                    key={p} 
                                    onClick={() => updatePref('chefPersonality', p as any)}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${preferences.chefPersonality === p ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 block">Kitchen Proficiency Bias</label>
                        <div className="grid grid-cols-3 gap-3 bg-white/5 rounded-[1.5rem] p-1.5 border border-white/5 shadow-inner">
                            {SKILL_LEVELS.map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => updatePref('skillLevel', s as any)}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${preferences.skillLevel === s ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* CULINARY IDENTITY */}
            <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-10 md:p-16 shadow-sm border border-slate-100 dark:border-slate-800 space-y-16 transition-all hover:shadow-xl">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-500 shadow-sm"><Palette size={28} /></div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">Identity</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Taste Profiles</p>
                    </div>
                </div>

                <div className="space-y-12">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 block">Dietary Exclusions</label>
                        <div className="flex flex-wrap gap-2.5">
                            {DIETARY_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => toggleListItem('dietaryRestrictions', opt)}
                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${preferences.dietaryRestrictions.includes(opt) ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-rose-200'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 block">Target Cuisines</label>
                        <div className="flex flex-wrap gap-2.5">
                            {CUISINE_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => toggleListItem('cuisinePreferences', opt)}
                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${preferences.cuisinePreferences.includes(opt) ? 'bg-primary-500 border-primary-500 text-white shadow-lg' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-primary-200'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-rose-50/50 dark:bg-rose-950/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-4 block">Critical Allergies (Absolute Removal)</label>
                        <div className="flex gap-3 mb-6">
                            <input type="text" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAllergy()} placeholder="e.g. Peanuts..." className="flex-1 bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 outline-none p-5 rounded-2xl text-xs font-bold shadow-inner" />
                            <button onClick={handleAddAllergy} className="bg-rose-600 text-white px-6 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/20"><Plus size={24}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {preferences.allergies.map(item => (
                                <div key={item} className="flex items-center gap-3 bg-white dark:bg-slate-800 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-rose-100 dark:border-rose-900/50 group">
                                    <AlertTriangle size={14} className="text-rose-500" /> {item} 
                                    <button onClick={() => updatePref('allergies', preferences.allergies.filter(i => i !== item))} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded-md transition-colors"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* STUDIO ARCHITECTURE */}
            <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-10 md:p-16 shadow-sm border border-slate-100 dark:border-slate-800 space-y-16 transition-all hover:shadow-xl">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-500 shadow-sm"><Target size={28} /></div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">Sensory</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Logistics & Goals</p>
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">Spice Tolerance</label>
                            <select value={preferences.spiceLevel} onChange={e => updatePref('spiceLevel', e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[1.5rem] font-black text-xs outline-none appearance-none border border-slate-100 dark:border-slate-800 shadow-inner">
                                {SPICE_LEVELS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">Studio Budget</label>
                            <select value={preferences.budget} onChange={e => updatePref('budget', e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[1.5rem] font-black text-xs outline-none appearance-none border border-slate-100 dark:border-slate-800 shadow-inner">
                                {BUDGET_OPTIONS.map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 block">Active Lifestyle Goal</label>
                        <div className="grid grid-cols-3 gap-3">
                            {HEALTH_GOALS.map(goal => (
                                <button key={goal} onClick={() => updatePref('healthGoal', goal as any)}
                                    className={`py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border ${preferences.healthGoal === goal ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-amber-200'}`}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-[3rem] border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg"><ScrollText size={24}/></div>
                            <div>
                                <span className="text-sm font-black uppercase text-slate-900 dark:text-white">Strict Kosher Intelligence</span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Automatic Dietary Filtering</p>
                            </div>
                        </div>
                        <button onClick={() => updatePref('isKosher', !preferences.isKosher)} className={`w-16 h-8 rounded-full transition-all relative ${preferences.isKosher ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${preferences.isKosher ? 'left-9' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            {/* HARDWARE (SPAN BOTH) */}
            <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-10 md:p-16 shadow-sm border border-slate-100 dark:border-slate-800 space-y-16 lg:col-span-2 transition-all hover:shadow-xl">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-500 shadow-sm"><CookingPot size={28} /></div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">Infrastructure</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Available Appliances</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {APPLIANCE_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => toggleListItem('appliances', opt)}
                            className={`p-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-4 border text-center ${preferences.appliances.includes(opt) ? 'bg-indigo-500 border-indigo-500 text-white shadow-xl scale-105' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-200'}`}
                        >
                            <div className={`w-3 h-3 rounded-full transition-all ${preferences.appliances.includes(opt) ? 'bg-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
      </div>

      <div className="mt-16 bg-white dark:bg-slate-900 rounded-[4rem] p-10 md:p-16 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-12 transition-all hover:shadow-xl">
          <div className="flex items-center gap-8">
                <div className="w-28 h-28 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-500 text-4xl font-black shadow-inner border-4 border-white dark:border-slate-900">
                    {preferences.userName ? preferences.userName.charAt(0).toUpperCase() : <User size={48} />}
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Account Intelligence Profile</label>
                    <input 
                        type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} onBlur={handleSaveProfile}
                        className="bg-transparent border-none outline-none font-serif font-black text-4xl text-slate-900 dark:text-white placeholder:text-slate-200 tracking-tighter"
                        placeholder="Chef Name"
                    />
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Session Valid
                    </div>
                </div>
          </div>
          <button onClick={onSignOut} className="px-12 py-6 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-3 border border-slate-100 dark:border-slate-800 group shadow-sm hover:shadow-lg">
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Deactivate Studio
          </button>
      </div>
    </div>
  );
};

export default SettingsView;
