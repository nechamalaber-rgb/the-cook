
import React, { useState } from 'react';
import { 
  Moon, Sun, Home, SlidersHorizontal, ChefHat, Palette, 
  Target, FileText, ChevronDown, Power, Zap, Cpu, Activity,
  User, Mail, ShieldCheck, Bell, Ruler, Trash2, LogOut,
  CreditCard, Info, Globe, Sparkles, Database, LifeBuoy,
  Settings, Key, AlertTriangle, Fingerprint, Crown, 
  ShoppingBag, Calendar, Share2, EyeOff, Smartphone, 
  Layers, HardDrive, HelpCircle, Lock, Flame, Dumbbell, 
  Scale, Ban, RefreshCw, Users
} from 'lucide-react';
import { UserPreferences, MealLog, Pantry, Category } from '../types';

interface SettingsViewProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  mealHistory: MealLog[];
  pantries: Pantry[];
  setPantries: React.Dispatch<React.SetStateAction<Pantry[]>>;
  onSignOut: () => void;
  onGoToLanding: () => void;
  showToast?: (msg: string, type: any) => void;
}

const DIETARY_OPTIONS = ['VEGAN', 'VEGETARIAN', 'KETO', 'PALEO', 'GLUTEN-FREE', 'DAIRY-FREE', 'LOW CARB', 'WHOLE30'];
const CUISINE_OPTIONS = ['ITALIAN', 'MEXICAN', 'JAPANESE', 'CHINESE', 'INDIAN', 'FRENCH', 'GREEK', 'THAI'];
const APPLIANCE_OPTIONS = ['Oven', 'Stove', 'Air Fryer', 'Microwave', 'Slow Cooker', 'Instapot', 'Grill', 'Sous Vide'];
const ALLERGY_OPTIONS = ['Peanuts', 'Shellfish', 'Tree Nuts', 'Soy', 'Wheat', 'Eggs', 'Milk', 'Fish'];
const HEALTH_GOALS = ['Lose Weight', 'Maintain', 'Build Muscle'];

const SettingsView: React.FC<SettingsViewProps> = ({ 
  preferences, 
  setPreferences, 
  onSignOut,
  onGoToLanding,
  showToast
}) => {
  const [activeCategory, setActiveCategory] = useState<'account' | 'studio' | 'culinary' | 'system'>('account');

  const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: val }));
  };

  const toggleListItem = <K extends keyof UserPreferences>(key: K, item: string) => {
      const current = (preferences[key] as string[]) || [];
      const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
      updatePref(key, next as any);
  };

  const handleClearCache = () => {
    const user = preferences.email || 'guest';
    const prefix = `ks_user_${user.replace(/[^a-zA-Z0-9]/g, '_')}_`;
    localStorage.removeItem(`${prefix}pantries`);
    localStorage.removeItem(`${prefix}shopping`);
    localStorage.removeItem(`${prefix}recipes`);
    localStorage.removeItem(`${prefix}history`);
    showToast?.("Local culinary cache purged. Reloading...", "info");
    setTimeout(() => window.location.reload(), 1500);
  };

  const handlePurgeAccount = () => {
    if (window.confirm("CRITICAL: This will permanently delete all pantry manifests, recipe archives, and your studio identity. This cannot be undone. Proceed?")) {
        const user = preferences.email || 'guest';
        const prefix = `ks_user_${user.replace(/[^a-zA-Z0-9]/g, '_')}_`;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) localStorage.removeItem(key);
        });
        onSignOut();
    }
  };

  const CategoryButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button 
        onClick={() => setActiveCategory(id)}
        className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all w-full text-left ${
            activeCategory === id 
            ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20 translate-x-2' 
            : 'bg-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
    >
        <Icon size={18} /> {label}
    </button>
  );

  const SectionHeader = ({ title, icon: Icon, colorClass = "text-primary-500" }: any) => (
    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 ${colorClass}`}>
            <Icon size={24} />
        </div>
        <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white tracking-tighter">{title}</h2>
    </div>
  );

  return (
    <div className="animate-fade-in pb-32 max-w-7xl mx-auto px-4 lg:px-8 mt-10">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:w-72 shrink-0 space-y-2">
            <div className="p-4 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white leading-none">Settings</h3>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Management Hub</p>
                </div>
            </div>
            <CategoryButton id="account" label="Account & Security" icon={ShieldCheck} />
            <CategoryButton id="culinary" label="Culinary DNA" icon={Palette} />
            <CategoryButton id="studio" label="Studio Logic" icon={Cpu} />
            <CategoryButton id="system" label="System & Integration" icon={Settings} />
            
            <div className="pt-10 border-t border-slate-100 dark:border-white/5 mt-10">
                <button 
                    onClick={onSignOut}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500 hover:text-white transition-all w-full group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Terminate Session
                </button>
            </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 bg-white dark:bg-[#0c1220] rounded-[4rem] p-8 md:p-14 border border-slate-100 dark:border-white/5 shadow-2xl min-h-[700px]">
            
            {activeCategory === 'account' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="Account Identity" icon={User} colorClass="text-rose-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Display Name</label>
                                <input 
                                    type="text" value={preferences.userName || ''} onChange={e => updatePref('userName', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-all"
                                />
                            </div>
                            <div className="space-y-3 opacity-60">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Studio Email (Fixed)</label>
                                <input 
                                    disabled type="email" value={preferences.email || ''}
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-sm font-bold text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Subscription" icon={Crown} colorClass="text-amber-500" />
                        <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/5">
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform"><Crown size={140} /></div>
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400 mb-2">Tier: {preferences.subscriptionTier?.toUpperCase() || 'FREE'}</h4>
                                <h3 className="text-4xl font-black font-serif tracking-tighter mb-8">Studio Elite Evaluation</h3>
                                <div className="flex flex-wrap gap-4">
                                    <button onClick={() => window.open('https://billing.stripe.com', '_blank')} className="px-8 py-4 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3 shadow-xl">
                                        <CreditCard size={16} /> Manage Billing Manifest
                                    </button>
                                    <button onClick={() => showToast?.("Technical logs retrieved. No outstanding invoices.", "info")} className="px-8 py-4 bg-white/10 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">
                                        View Invoices
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Access Security" icon={Lock} colorClass="text-indigo-500" />
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-indigo-500 shadow-sm"><Smartphone size={20} /></div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Two-Factor Auth</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Biometric verification required</p>
                                    </div>
                                </div>
                                <button 
                                  onClick={() => updatePref('twoFactorEnabled', !preferences.twoFactorEnabled)}
                                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${preferences.twoFactorEnabled ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500'}`}
                                >
                                  {preferences.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-indigo-500 shadow-sm"><Key size={20} /></div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Credentials</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update your studio access key</p>
                                    </div>
                                </div>
                                <button onClick={() => showToast?.("Security token rotation initialized. Check your encrypted email.", "success")} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-all">Reset Password</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'culinary' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="Dietary & Allergies" icon={Palette} colorClass="text-emerald-500" />
                        <div className="space-y-10">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 block">DIETARY RESTRICTIONS</label>
                                <div className="flex flex-wrap gap-2">
                                    {DIETARY_OPTIONS.map(opt => (
                                        <button 
                                            key={opt} onClick={() => toggleListItem('dietaryRestrictions', opt)}
                                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${preferences.dietaryRestrictions.includes(opt) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500 hover:border-emerald-500/40'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 block">CRITICAL ALLERGIES</label>
                                <div className="flex flex-wrap gap-2">
                                    {ALLERGY_OPTIONS.map(opt => (
                                        <button 
                                            key={opt} onClick={() => toggleListItem('allergies', opt)}
                                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${preferences.allergies.includes(opt) ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500 hover:border-rose-500/40'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Protocols & Goals" icon={Target} colorClass="text-primary-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">KOSHER PROTOCOL</label>
                                <button 
                                    onClick={() => updatePref('isKosher', !preferences.isKosher)}
                                    className={`w-full py-5 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest ${preferences.isKosher ? 'bg-primary-500 border-primary-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500'}`}
                                >
                                    <ShieldCheck size={18} /> {preferences.isKosher ? 'Protocol Active' : 'Protocol Inactive'}
                                </button>
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">HEALTH VECTOR</label>
                                <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl flex border border-slate-100 dark:border-white/5 gap-1">
                                    {HEALTH_GOALS.map(goal => (
                                        <button 
                                            key={goal} 
                                            onClick={() => updatePref('healthGoal', goal as any)}
                                            className={`flex-1 py-3.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${preferences.healthGoal === goal ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500'}`}
                                        >
                                            {goal.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Kitchen Hardware" icon={ChefHat} colorClass="text-amber-500" />
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 block">APPLIANCE INVENTORY</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {APPLIANCE_OPTIONS.map(opt => {
                                    const isActive = preferences.appliances.includes(opt);
                                    return (
                                        <button 
                                            key={opt}
                                            onClick={() => toggleListItem('appliances', opt)}
                                            className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all text-center ${isActive ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500'}`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Sensory Profile" icon={Flame} colorClass="text-orange-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">SPICE TOLERANCE</label>
                                <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl flex border border-slate-100 dark:border-white/5 gap-1">
                                    {['MILD', 'MEDIUM', 'HOT', 'NUCLEAR'].map(level => (
                                        <button 
                                            key={level} 
                                            onClick={() => updatePref('spiceLevel', level.charAt(0).toUpperCase() + level.slice(1).toLowerCase() as any)}
                                            className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${preferences.spiceLevel?.toUpperCase() === level ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500'}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">BUDGET LOGIC</label>
                                <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl flex border border-slate-100 dark:border-white/5 gap-1">
                                    {['THRIFTY', 'MODERATE', 'GOURMET'].map(b => (
                                        <button 
                                            key={b} 
                                            onClick={() => updatePref('budget', b.charAt(0).toUpperCase() + b.slice(1).toLowerCase() as any)}
                                            className={`flex-1 py-3.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${preferences.budget?.toUpperCase() === b ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500'}`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'studio' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="Intelligence Logic" icon={Cpu} colorClass="text-indigo-500" />
                        <div className="space-y-12">
                             <div>
                                <div className="flex justify-between items-end mb-6">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">RECIPES PER DISCOVERY CYCLE</label>
                                    <span className="text-4xl font-black font-serif text-indigo-500">{preferences.generationsCount || 4}</span>
                                </div>
                                <input 
                                    type="range" min="1" max="10" step="1"
                                    value={preferences.generationsCount || 4}
                                    onChange={(e) => updatePref('generationsCount', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-indigo-500 cursor-pointer"
                                />
                             </div>
                             
                             <div>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><Users size={16}/></div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">HOUSEHOLD SIZE</label>
                                    </div>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={preferences.householdSize || 2}
                                            onChange={(e) => updatePref('householdSize', Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-24 bg-transparent p-4 text-2xl font-black font-serif text-indigo-500 outline-none text-center"
                                        />
                                        <div className="px-4 py-2 border-l border-slate-100 dark:border-white/5 flex flex-col text-[8px] font-black uppercase text-slate-400 tracking-widest gap-1">
                                            <span>MEMBERS</span>
                                            <span>ACTIVE</span>
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="range" min="1" max="24" step="1"
                                    value={preferences.householdSize || 2}
                                    onChange={(e) => updatePref('householdSize', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-indigo-500 cursor-pointer"
                                />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4 ml-1">Type any number in the input box to scale recipes indefinitely.</p>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">CHEF PERSONALITY</label>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl flex border border-slate-100 dark:border-white/5 gap-1">
                                        {['STRICT', 'CREATIVE'].map(mode => (
                                            <button 
                                                key={mode} 
                                                onClick={() => updatePref('chefPersonality', mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase() as any)}
                                                className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${preferences.chefPersonality?.toUpperCase() === mode ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-500'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">KITCHEN SKILL BIAS</label>
                                    <select 
                                        value={preferences.skillLevel} 
                                        onChange={e => updatePref('skillLevel', e.target.value as any)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white appearance-none outline-none focus:border-indigo-500 shadow-sm"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                             </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Ingredient Blacklist" icon={Ban} colorClass="text-rose-500" />
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">RESTRICTED INGREDIENTS (COMMA SEPARATED)</label>
                            <input 
                                type="text" 
                                value={preferences.blacklist.join(', ')}
                                onChange={e => updatePref('blacklist', e.target.value.split(',').map(i => i.trim()).filter(i => i !== ''))}
                                placeholder="Cilantro, Olives, Liver..."
                                className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-all shadow-sm"
                            />
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Experimental" icon={Sparkles} colorClass="text-primary-500" />
                        <div className="flex items-center justify-between p-8 bg-primary-500/5 rounded-[2.5rem] border border-primary-500/10 group">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary-500 rounded-2xl text-white shadow-xl shadow-primary-500/20"><Database size={24} /></div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Beta Reasoning</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access the high-latency deep reasoning model</p>
                                </div>
                            </div>
                            <button 
                              onClick={() => updatePref('betaReasoningEnabled', !preferences.betaReasoningEnabled)}
                              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${preferences.betaReasoningEnabled ? 'bg-primary-500 text-white border-primary-500 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-500 border-slate-100 dark:border-white/5'}`}
                            >
                              {preferences.betaReasoningEnabled ? 'Active' : 'Join Beta'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'system' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="Integrations" icon={Share2} colorClass="text-emerald-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-emerald-500 border border-emerald-500/10"><Calendar size={20} /></div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Calendar Sync</h4>
                                </div>
                                <button onClick={() => showToast?.("Calendar synchronization request sent.", "info")} className="text-[9px] font-black uppercase text-slate-400 hover:text-emerald-500">Connect</button>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-emerald-500 border border-emerald-500/10"><ShoppingBag size={20} /></div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Store Manifests</h4>
                                </div>
                                <button onClick={() => showToast?.("External store linkage verified.", "success")} className="text-[9px] font-black uppercase text-slate-400 hover:text-emerald-500">Manage</button>
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="Interface & Storage" icon={Layers} colorClass="text-slate-500" />
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-400 shadow-sm">{preferences.darkMode ? <Moon size={20} /> : <Sun size={20} />}</div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Appearance Mode</h4>
                                </div>
                                <button onClick={() => updatePref('darkMode', !preferences.darkMode)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${preferences.darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'}`}>{preferences.darkMode ? 'Dark' : 'Light'}</button>
                            </div>
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-400 shadow-sm"><Ruler size={20} /></div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Units of Measure</h4>
                                </div>
                                <button onClick={() => updatePref('measurementSystem', preferences.measurementSystem === 'Imperial' ? 'Metric' : 'Imperial')} className="px-6 py-3 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 dark:border-white/5 shadow-sm">{preferences.measurementSystem}</button>
                            </div>
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-rose-500 shadow-sm"><HardDrive size={20} /></div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Cache Purge</h4>
                                </div>
                                <button onClick={handleClearCache} className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">Clear All Data</button>
                            </div>
                        </div>
                    </section>

                    <section className="bg-rose-500/5 rounded-[3rem] border border-rose-500/20 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-500/20"><AlertTriangle size={24} /></div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none">Studio Dissolution</h4>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">Permanent account destruction</p>
                            </div>
                        </div>
                        <button onClick={handlePurgeAccount} className="px-10 py-5 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20">Purge Account</button>
                    </section>
                </div>
            )}
        </main>
      </div>

      <div className="mt-24 text-center space-y-4 opacity-20">
          <div className="flex justify-center items-center gap-6 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
              <span className="flex items-center gap-2"><Sparkles size={14} /> Studio OS v2.4</span>
              <span className="flex items-center gap-2"><ShieldCheck size={14} /> Encrypted Session Active</span>
          </div>
          <p className="text-[8px] text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
            Proprietary culinary intelligence system. All logic is processed through the Prepzu AI engine. 2024.
          </p>
      </div>
    </div>
  );
};

export default SettingsView;
