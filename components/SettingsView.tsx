import React, { useState } from 'react';
import { 
  User, Heart, ShieldCheck, LogOut, Flame, Crown, Bell, Mail, 
  Settings, Cpu, CreditCard, Languages, 
  RefreshCw, Sparkles, Ban, ChefHat, Wallet, Utensils, X, LifeBuoy,
  History, Fingerprint, Lock, FileText, Info, HelpCircle, Trash2, Camera,
  Beef, Milk, Scale, Zap, Waves, Thermometer, Soup, Play
} from 'lucide-react';
import { UserPreferences, MealLog, Pantry } from '../types';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

interface SettingsViewProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onSignOut: () => void;
  showToast?: (msg: string, type: any) => void;
  mealHistory?: MealLog[];
  pantries?: Pantry[];
  setPantries?: React.Dispatch<React.SetStateAction<Pantry[]>>;
  onGoToLanding?: () => void;
  onRestartWalkthrough?: () => void;
}

const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Mediterranean'];
const APPLIANCE_OPTIONS = ['Oven', 'Stove', 'Air Fryer', 'Microwave', 'Slow Cooker', 'Instant Pot', 'Sous Vide', 'Grill', 'Toaster Oven'];
const CUISINE_OPTIONS = ['Japanese', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 'French', 'Chinese', 'Thai', 'Korean', 'Modern American'];

const SettingsView: React.FC<SettingsViewProps> = ({ 
  preferences, 
  setPreferences, 
  onSignOut,
  showToast,
  onRestartWalkthrough
}) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'account' | 'kitchen' | 'notifications' | 'payments' | 'prefs' | 'help'>('account');
  const [newAllergy, setNewAllergy] = useState('');

  const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: val }));
  };

  const toggleArrayItem = (key: 'dietaryRestrictions' | 'appliances' | 'cuisinePreferences', item: string) => {
      const current = preferences[key] || [];
      const next = current.includes(item) 
          ? current.filter(i => i !== item) 
          : [...current, item];
      updatePref(key, next);
  };

  const CategoryButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button 
        onClick={() => setActiveCategory(id)}
        className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all w-full text-left ${
            activeCategory === id 
            ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20 translate-x-2' 
            : 'bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
        }`}
    >
        <Icon size={18} /> {label}
    </button>
  );

  const SectionHeader = ({ title, icon: Icon, colorClass = "text-primary-500" }: any) => (
    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
        <div className={`p-3 rounded-xl bg-slate-900 border border-white/5 ${colorClass}`}>
            <Icon size={24} />
        </div>
        <h2 className="text-3xl font-black font-serif text-white tracking-tighter italic">{title}</h2>
    </div>
  );

  const Toggle = ({ enabled, onChange, label, sublabel, icon: Icon }: { enabled: boolean, onChange: (val: boolean) => void, label: string, sublabel?: string, icon?: any }) => (
    <div className="flex items-center justify-between p-6 bg-slate-900/40 rounded-3xl border border-white/5 group hover:border-white/10 transition-colors">
        <div className="flex items-center gap-4">
            {Icon && <div className={`${enabled ? 'text-primary-500' : 'text-slate-600'} transition-colors`}><Icon size={20} /></div>}
            <div>
                <h4 className="text-xs font-black text-white uppercase tracking-tight">{label}</h4>
                {sublabel && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{sublabel}</p>}
            </div>
        </div>
        <button 
            onClick={() => onChange(!enabled)}
            className={`w-14 h-8 rounded-full relative transition-all ${enabled ? 'bg-primary-500 shadow-[0_0_15px_rgba(176,141,106,0.4)]' : 'bg-slate-800'}`}
        >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${enabled ? 'left-7' : 'left-1'} shadow-lg`} />
        </button>
    </div>
  );

  return (
    <div className="animate-fade-in pb-32 max-w-7xl mx-auto px-4 lg:px-8 mt-10">
      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-72 shrink-0 space-y-2">
            <div className="p-4 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl overflow-hidden">
                    {preferences.avatarUrl ? <img src={preferences.avatarUrl} className="w-full h-full object-cover" /> : <Logo className="w-12 h-12" />}
                </div>
                <div>
                    <h3 className="font-black text-white leading-none truncate max-w-[150px]">{preferences.userName || 'Chef Studio'}</h3>
                    <p className="text-[9px] font-black uppercase text-primary-500 tracking-widest mt-1">Studio Intelligence</p>
                </div>
            </div>
            <CategoryButton id="account" label="Account" icon={User} />
            <CategoryButton id="kitchen" label="Kitchen OS" icon={Utensils} />
            <CategoryButton id="notifications" label="Signals" icon={Bell} />
            <CategoryButton id="payments" label="Billing" icon={CreditCard} />
            <CategoryButton id="prefs" label="Settings" icon={Settings} />
            <CategoryButton id="help" label="Support" icon={LifeBuoy} />
            
            <div className="pt-10 border-t border-white/5 mt-10">
                <button 
                    onClick={onSignOut}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500 hover:text-white transition-all w-full group"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </aside>

        <main className="flex-1 bg-[#0c1220] rounded-[4rem] p-8 md:p-14 border border-white/5 shadow-2xl min-h-[750px]">
            {activeCategory === 'account' && (
                <div className="animate-fade-in space-y-12">
                    <section>
                        <SectionHeader title="Studio Profile" icon={User} colorClass="text-sky-500" />
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row gap-8 items-center bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5">
                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center relative group cursor-pointer overflow-hidden border-2 border-primary-500/20">
                                    <Logo className="w-16 h-16" />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={24} />
                                    </div>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h4 className="text-xl font-black text-white italic font-serif tracking-tight uppercase">Chef Manifest</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure your identity in the studio</p>
                                </div>
                                <button className="px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Upload Avatar</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Display Name</label>
                                    <input 
                                        type="text" value={preferences.userName || ''} onChange={e => updatePref('userName', e.target.value)}
                                        className="w-full bg-slate-900 p-5 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none focus:border-primary-500 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Secure Email</label>
                                    <div className="relative group">
                                        <input disabled type="email" value={preferences.email || ''} className="w-full bg-slate-800/40 p-5 rounded-2xl border border-white/5 text-sm font-bold text-slate-500 cursor-not-allowed" />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 rounded-lg text-[8px] font-black uppercase text-slate-400">Locked</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="pt-12 border-t border-white/5">
                        <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <h4 className="text-lg font-black text-rose-500 font-serif italic tracking-tight">Erase Manifest</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">Permanently delete all recipes and pantry data from the vault.</p>
                            </div>
                            <button className="px-8 py-4 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl flex items-center gap-2">
                                <Trash2 size={16} /> Wipe Account
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'kitchen' && (
                <div className="animate-fade-in space-y-12">
                    <SectionHeader title="Kitchen OS" icon={ChefHat} colorClass="text-amber-500" />
                    
                    <div className="space-y-6">
                        <Toggle 
                            label="Kosher Certification" 
                            sublabel="Strictly separate meat and dairy protocols in AI logic"
                            enabled={preferences.isKosher} 
                            onChange={(v) => updatePref('isKosher', v)} 
                            icon={preferences.isKosher ? Beef : Soup}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Scale size={14} /> Dietary Constraints
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DIETARY_OPTIONS.map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => toggleArrayItem('dietaryRestrictions', opt)}
                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                preferences.dietaryRestrictions.includes(opt)
                                                ? 'bg-primary-500 text-white border-primary-500 shadow-lg'
                                                : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Zap size={14} /> Studio Appliances
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {APPLIANCE_OPTIONS.map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => toggleArrayItem('appliances', opt)}
                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                preferences.appliances.includes(opt)
                                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg'
                                                : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Spice Tolerance</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {['None', 'Mild', 'Medium', 'Hot', 'Nuclear'].map((s, i) => (
                                        <button 
                                            key={s} onClick={() => updatePref('spiceLevel', s as any)}
                                            className={`py-3 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all border ${preferences.spiceLevel === s ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-900 border-white/5 text-slate-600'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logistics Budget</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {['Thrifty', 'Moderate', 'Gourmet'].map((b, i) => (
                                        <button 
                                            key={b} onClick={() => updatePref('budget', b as any)}
                                            className={`py-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${preferences.budget === b ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-900 border-white/5 text-slate-600'}`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeCategory === 'notifications' && (
                <div className="animate-fade-in space-y-10">
                    <SectionHeader title="Signal Protocol" icon={Bell} colorClass="text-emerald-500" />
                    <div className="space-y-4">
                        <Toggle 
                            label="Email Magic Links" 
                            sublabel="Receive encrypted session keys via email"
                            enabled={preferences.emailNotifications} 
                            onChange={(v) => updatePref('emailNotifications', v)} 
                        />
                        <Toggle 
                            label="Intelligence Updates" 
                            sublabel="Alerts when AI models synthesize new recipe paths"
                            enabled={preferences.recipeUpdateNotifications} 
                            onChange={(v) => updatePref('recipeUpdateNotifications', v)} 
                        />
                    </div>
                </div>
            )}

            {activeCategory === 'payments' && (
                <div className="animate-fade-in space-y-12">
                    <SectionHeader title="Billing Manifest" icon={CreditCard} colorClass="text-indigo-500" />
                    
                    <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Current Access Rank</p>
                                    <h3 className="text-4xl font-black font-serif italic tracking-tighter mt-1 uppercase">
                                        {preferences.isProMember ? 'Elite Studio' : 'Standard Guest'}
                                    </h3>
                                </div>
                                <Crown size={32} className="opacity-40" />
                            </div>
                            <div className="flex items-center gap-4 pt-4">
                                <button onClick={() => navigate('/plans')} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                                    {preferences.isProMember ? 'Manage Billing' : 'Unlock Elite'}
                                </button>
                                <button className="text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">Compare Tiers</button>
                            </div>
                        </div>
                    </div>

                    <section className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
                            <History size={14} /> Transaction Log
                        </h4>
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
                            <div className="p-8 text-center py-16">
                                <FileText size={32} className="mx-auto text-slate-800 mb-4" />
                                <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic">Vault remains empty</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'prefs' && (
                <div className="animate-fade-in space-y-10">
                    <SectionHeader title="App Logic" icon={Settings} colorClass="text-primary-500" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Environment Theme</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${preferences.darkMode ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 border-white/5 text-slate-500'}`}>Dark Studio</button>
                                <button disabled className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 text-slate-500 cursor-not-allowed opacity-30`}>Cloud Light</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Metric Logic</label>
                            <div className="flex gap-2">
                                {['Metric', 'Imperial'].map(sys => (
                                    <button key={sys} onClick={() => updatePref('measurementSystem', sys as any)} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all border ${preferences.measurementSystem === sys ? 'bg-white text-slate-900 shadow-xl' : 'bg-slate-900 border-white/5 text-slate-500'}`}>{sys}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Household Capacity</label>
                            <div className="flex items-center gap-6 bg-slate-900 p-4 rounded-2xl border border-white/5">
                                <button onClick={() => updatePref('householdSize', Math.max(1, preferences.householdSize - 1))} className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">-</button>
                                <div className="flex-1 text-center font-black text-white text-lg italic">{preferences.householdSize} People</div>
                                <button onClick={() => updatePref('householdSize', preferences.householdSize + 1)} className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeCategory === 'help' && (
                <div className="animate-fade-in space-y-12">
                    <SectionHeader title="Concierge" icon={LifeBuoy} colorClass="text-rose-500" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] text-left group hover:border-primary-500/30 transition-all">
                            <div className="w-12 h-12 bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <HelpCircle size={24} />
                            </div>
                            <h4 className="text-lg font-black text-white font-serif italic mb-2 tracking-tight uppercase">Usage Protocol</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">Instructions on how to optimize your pantry synthesis cycle.</p>
                        </button>
                        
                        <a href="mailto:schneurlaber@gmail.com" className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] text-left group hover:border-emerald-500/30 transition-all">
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Mail size={24} />
                            </div>
                            <h4 className="text-lg font-black text-white font-serif italic mb-2 tracking-tight uppercase">Direct Signal</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">Report glitches or request elite features from the engineering team.</p>
                        </a>

                        {onRestartWalkthrough && (
                            <button 
                                onClick={onRestartWalkthrough}
                                className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] text-left group hover:border-indigo-500/30 transition-all md:col-span-2"
                            >
                                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Play size={24} />
                                </div>
                                <h4 className="text-lg font-black text-white font-serif italic mb-2 tracking-tight uppercase">Restart Walkthrough</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">Replay the initial onboarding tour to learn the studio controls again.</p>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default SettingsView;