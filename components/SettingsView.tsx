
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
  Plus, ZapOff as BanIcon, ScrollText, Sliders, Hash
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
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const CHEF_PERSONALITIES = ['Strict', 'Creative'];

const STRIPE_LINKS = {
    monthly: "https://buy.stripe.com/test_3cI7sNevgejJ3Tq42UfYY00",
    yearly: "https://buy.stripe.com/test_3cI7sNevgejJ3Tq42UfYY01"
};

const SettingsView: React.FC<SettingsViewProps> = ({ 
  preferences, 
  setPreferences, 
  onSignOut, 
  onGoToLanding 
}) => {
  const [allergyInput, setAllergyInput] = useState('');
  const [blacklistInput, setBlacklistInput] = useState('');
  const [profileName, setProfileName] = useState(preferences.userName || '');

  const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveProfile = () => {
    updatePref('userName', profileName);
  };

  const handlePlanSelection = (type: 'monthly' | 'yearly') => {
      window.open(STRIPE_LINKS[type], '_blank');
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

  return (
    <div className="animate-fade-in pb-32 max-w-7xl mx-auto px-4">
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 pt-4">
        <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tighter font-serif">Studio Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage your intelligence parameters.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => updatePref('darkMode', !preferences.darkMode)} className={`p-3 rounded-xl transition-all shadow-sm border ${preferences.darkMode ? 'bg-slate-800 border-slate-700 text-primary-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                {preferences.darkMode ? <Moon size={20} fill="currentColor" /> : <Sun size={20} />}
            </button>
            <button onClick={onGoToLanding} className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-rose-500 transition-colors">
                <Home size={20} />
            </button>
        </div>
      </div>

      {/* STUDIO LOGISTICS CONFIG - ULTRA COMPACT */}
      <div className="mb-12 bg-primary-950 text-white rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden border border-primary-500/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-primary-500 rounded-lg text-white">
                    <Sliders size={18} />
                  </div>
                  <h3 className="text-lg font-black font-serif">Studio Intelligence Control</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary-400 flex items-center gap-2">
                              <Hash size={12} /> Recipes / Click
                          </label>
                          <span className="text-xl font-black font-serif text-primary-500">{preferences.generationsCount || 3}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="6" 
                        step="1"
                        value={preferences.generationsCount || 3}
                        onChange={(e) => updatePref('generationsCount', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                  </div>

                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary-400 flex items-center gap-2">
                              <Users size={12} /> Default Servings
                          </label>
                          <span className="text-xl font-black font-serif text-primary-500">{preferences.householdSize}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="12" 
                        step="1"
                        value={preferences.householdSize}
                        onChange={(e) => updatePref('householdSize', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                  </div>

                  <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary-400 flex items-center gap-2">
                          <Gauge size={12} /> Default Complexity
                      </label>
                      <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                          {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                            <button 
                              key={lvl}
                              onClick={() => updatePref('skillLevel', lvl as any)}
                              className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${preferences.skillLevel === lvl ? 'bg-primary-500 text-white shadow-md' : 'text-slate-500'}`}
                            >
                              {lvl === 'Intermediate' ? 'Balanced' : lvl === 'Advanced' ? 'Chef' : 'Easy'}
                            </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* PLAN SECTION - CLARITY UPDATE */}
      <div className="mb-16">
          <div className="flex items-center gap-3 mb-6 px-4">
              <div className="p-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg"><Star size={16} fill="currentColor"/></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Studio Plan Comparison</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl px-2">
              <div 
                onClick={() => handlePlanSelection('monthly')}
                className={`relative group rounded-[2.5rem] p-8 border-2 cursor-pointer transition-all duration-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-400`}
              >
                  <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white mb-1">Monthly</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">$9.99</span>
                      <span className="text-slate-400 font-bold text-xs uppercase">Billed Monthly</span>
                  </div>
                  <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest group-hover:bg-primary-500 group-hover:text-white transition-all">
                      Flexible Month-to-Month
                  </button>
              </div>

              <div 
                onClick={() => handlePlanSelection('yearly')}
                className={`relative group rounded-[2.5rem] p-8 border-4 cursor-pointer transition-all duration-500 bg-slate-900 text-white border-primary-500 shadow-xl overflow-hidden`}
              >
                  <div className="absolute top-0 right-0 bg-primary-500 text-white text-[7px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-lg">
                      Save $90 / Year
                  </div>
                  <h3 className="text-xl font-black font-serif text-white mb-1">Yearly Elite</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-black tracking-tighter text-white">$30.00</span>
                      <span className="text-slate-400 font-bold text-xs uppercase">Billed Annually</span>
                  </div>
                  <p className="text-[9px] font-bold text-primary-400 uppercase tracking-widest mb-3">Effective: $2.50 / Month</p>
                  <button className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-500 transition-all flex items-center justify-center gap-2">
                      <Crown size={12} /> Claim Best Value
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-500"><Filter size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif">Culinary Palette</h3>
                </div>
                <div className="space-y-10">
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
                    </div>
                </div>
            </div>

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
              <button onClick={onSignOut} className="px-8 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2">
                  <LogOut size={16} /> Sign Out
              </button>
          </div>
      </div>
    </div>
  );
};

export default SettingsView;
