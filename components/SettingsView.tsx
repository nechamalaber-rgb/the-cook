import React, { useState } from 'react';
import { 
  User, Heart, 
  ShieldCheck, LogOut, Flame, Crown,
  Bell, Mail, HardDrive, Settings, Scale, Cpu, CreditCard, Languages
} from 'lucide-react';
import { UserPreferences, MealLog, Pantry } from '../types';
import { useNavigate } from 'react-router-dom';

interface SettingsViewProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  mealHistory: MealLog[];
  pantries: Pantry[];
  setPantries: React.Dispatch<React.SetStateAction<Pantry[]>>;
  onSignOut: () => void;
  onGoToLanding: () => void;
  showToast?: (msg: string, type: any) => void;
  onTestNotification?: () => void;
}

const CUISINE_OPTIONS = ['Japanese', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 'French', 'Chinese', 'Thai', 'Korean', 'Modern American'];

const SettingsView: React.FC<SettingsViewProps> = ({ 
  preferences, 
  setPreferences, 
  onSignOut,
  onTestNotification
}) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'account' | 'kitchen' | 'taste' | 'billing' | 'system'>('account');

  const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: val }));
  };

  const toggleListItem = <K extends keyof UserPreferences>(key: K, item: string) => {
      const current = (preferences[key] as string[]) || [];
      const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
      updatePref(key, next as any);
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
        <h2 className="text-3xl font-black font-serif text-white tracking-tighter">{title}</h2>
    </div>
  );

  return (
    <div className="animate-fade-in pb-32 max-w-7xl mx-auto px-4 lg:px-8 mt-10">
      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-72 shrink-0 space-y-2">
            <div className="p-4 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="font-black text-white leading-none">Settings</h3>
                    <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mt-1">My Account</p>
                </div>
            </div>
            <CategoryButton id="account" label="Profile" icon={User} />
            <CategoryButton id="taste" label="My Taste" icon={Heart} />
            <CategoryButton id="kitchen" label="Kitchen Setup" icon={Cpu} />
            <CategoryButton id="billing" label="Plan" icon={CreditCard} />
            <CategoryButton id="system" label="App Options" icon={Settings} />
            <div className="pt-10 border-t border-white/5 mt-10">
                <button 
                    onClick={onSignOut}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500 hover:text-white transition-all w-full group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
                </button>
            </div>
        </aside>

        <main className="flex-1 bg-[#0c1220] rounded-[4rem] p-8 md:p-14 border border-white/5 shadow-2xl min-h-[700px]">
            {activeCategory === 'account' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="Profile" icon={User} colorClass="text-rose-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Name</label>
                                <input 
                                    type="text" value={preferences.userName || ''} onChange={e => updatePref('userName', e.target.value)}
                                    className="w-full bg-slate-900 p-5 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none focus:border-rose-500 transition-all shadow-inner"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div className="space-y-3 opacity-60">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email</label>
                                <input 
                                    disabled type="email" value={preferences.email || 'chef@prepzu.com'}
                                    className="w-full bg-slate-800 p-5 rounded-2xl border border-white/5 text-sm font-bold text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </section>
                    <section>
                        <SectionHeader title="Alerts" icon={Bell} colorClass="text-sky-500" />
                        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-900 rounded-3xl border border-white/5 gap-4">
                            <div className="flex items-center gap-4 w-full">
                                <div className="p-3 bg-slate-800 rounded-xl text-sky-500"><Mail size={20} /></div>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase">App Notifications</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reminders for cooking & shopping</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={onTestNotification} className="px-6 py-2 rounded-xl text-[9px] font-black uppercase bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all whitespace-nowrap">Test Alert</button>
                                <button onClick={() => updatePref('emailNotifications', !preferences.emailNotifications)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${preferences.emailNotifications ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}>{preferences.emailNotifications ? 'Enabled' : 'Muted'}</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'taste' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="My Taste" icon={Heart} colorClass="text-rose-500" />
                        <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-primary-500/30 mb-10 flex flex-col md:flex-row items-center justify-between shadow-2xl gap-6">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary-500/10 rounded-2xl text-primary-500 shrink-0"><ShieldCheck size={32} /></div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase leading-none mb-2 tracking-tight">Kosher Rules</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">Meat and dairy will never be mixed.</p>
                                </div>
                            </div>
                            <button onClick={() => updatePref('isKosher', !preferences.isKosher)} className={`px-10 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl w-full md:w-auto ${preferences.isKosher ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{preferences.isKosher ? 'ACTIVE' : 'DISABLED'}</button>
                        </div>
                        <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 mb-10">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 mb-4 block italic">Likes & Dislikes</label>
                            <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium">Tell the AI what you enjoy. This helps it suggest better recipes.</p>
                            <textarea value={preferences.personalTasteBio || ''} onChange={e => updatePref('personalTasteBio', e.target.value)} placeholder="e.g. I hate onions. I love spicy food and healthy salads." className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] p-6 text-sm font-medium text-white outline-none focus:border-primary-500 transition-all h-40 resize-none shadow-inner" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Preferred Cuisines</label>
                                <div className="flex flex-wrap gap-2">
                                    {CUISINE_OPTIONS.map(opt => (
                                        <button key={opt} onClick={() => toggleListItem('cuisinePreferences', opt)} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${preferences.cuisinePreferences.includes(opt) ? 'bg-primary-500 border-primary-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}>{opt}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Spiciness</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {['None', 'Mild', 'Medium', 'Hot', 'Nuclear'].map(lvl => (
                                        <button key={lvl} onClick={() => updatePref('spiceLevel', lvl as any)} className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all border ${preferences.spiceLevel === lvl ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}>{lvl}</button>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-rose-400"><Flame size={12} /><span className="text-[8px] font-black uppercase tracking-widest">Adjusts recipe heat</span></div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'kitchen' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="Kitchen Info" icon={Cpu} colorClass="text-primary-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Skill Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                                            <button key={lvl} onClick={() => updatePref('skillLevel', lvl as any)} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${preferences.skillLevel === lvl ? 'bg-primary-500 border-primary-500 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500'}`}>{lvl}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">House Size</label>
                                    <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-white/5">
                                        <button onClick={() => updatePref('householdSize', Math.max(1, preferences.householdSize - 1))} className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white">-</button>
                                        <div className="flex-1 text-center font-black text-white flex items-center justify-center gap-2"><Scale size={14} className="text-primary-500" /><span>{preferences.householdSize} People</span></div>
                                        <button onClick={() => updatePref('householdSize', preferences.householdSize + 1)} className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white">+</button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Measurements</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Metric', 'Imperial'].map(u => (
                                            <button key={u} onClick={() => updatePref('measurementSystem', u as any)} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${preferences.measurementSystem === u ? 'bg-slate-700 border-slate-600 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500'}`}>{u}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'billing' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="Membership" icon={Crown} colorClass="text-amber-500" />
                        <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><Crown size={180} /></div>
                            <div className="relative z-10">
                                <div className="px-4 py-1.5 bg-primary-500/20 text-primary-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary-500/30 inline-block mb-6">Pro Active</div>
                                <h3 className="text-4xl font-black font-serif text-white tracking-tighter mb-4 italic leading-tight">Full Access</h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-10">You have unlimited searches and scanning.</p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button onClick={() => navigate('/plans')} className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-primary-500 hover:text-white transition-all active:scale-95">Upgrade / View Plans</button>
                                    <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Receipts</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeCategory === 'system' && (
                <div className="animate-fade-in space-y-16">
                    <section>
                        <SectionHeader title="App Options" icon={Settings} colorClass="text-slate-500" />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-xl text-indigo-500"><Languages size={20} /></div>
                                    <div><h4 className="text-xs font-black text-white uppercase">Language</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interface language</p></div>
                                </div>
                                <select className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none border-none">
                                    <option>English</option><option>Spanish</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-xl text-rose-500"><HardDrive size={20} /></div>
                                    <div><h4 className="text-xs font-black text-white uppercase">Storage</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clear saved data</p></div>
                                </div>
                                <button className="px-5 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Clear Cache</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default SettingsView;
