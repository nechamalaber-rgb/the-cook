import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPreferences, MealLog } from '../types';
import { ShieldCheck, Leaf, ChefHat, AlertTriangle, Zap, Check, Plus, X, Activity, Moon, Sun, Award, LogOut, CreditCard, Star, Loader2, Lock, Home, Brain, Target, Sparkles, TrendingUp, Dumbbell, Minus, Clock, Diamond, Crown } from 'lucide-react';

interface SettingsViewProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  mealHistory: MealLog[];
  onSignOut: () => void;
  onGoToLanding: () => void;
}

const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 'Low Carb', 'Dairy-Free'];
const APPLIANCE_OPTIONS = ['Air Fryer', 'Slow Cooker', 'Blender', 'Food Processor', 'Instant Pot', 'Grill', 'Waffle Maker'];

const SettingsView: React.FC<SettingsViewProps> = ({ preferences, setPreferences, mealHistory, onSignOut, onGoToLanding }) => {
  const navigate = useNavigate();
  const [allergyInput, setAllergyInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'elite'>('pro');
  
  // Payment Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Trial Logic
  const trialDaysLeft = preferences.trialStartedAt ? Math.max(0, 3 - Math.floor((new Date().getTime() - new Date(preferences.trialStartedAt).getTime()) / (1000 * 3600 * 24))) : 0;
  // If user is a pro member but has trialStartedAt, they might still be in trial mode
  const isCurrentlyInTrial = preferences.trialStartedAt && trialDaysLeft > 0 && preferences.subscriptionTier !== 'elite';

  // Gamification Logic
  const totalMeals = mealHistory.length;
  const chefLevel = totalMeals < 5 ? 'Sous Chef' : totalMeals < 20 ? 'Chef de Partie' : totalMeals < 50 ? 'Head Chef' : 'Executive Chef';
  const progressToNext = totalMeals < 5 ? (totalMeals / 5) * 100 : totalMeals < 20 ? ((totalMeals - 5) / 15) * 100 : totalMeals < 50 ? ((totalMeals - 20) / 30) * 100 : 100;

  const toggleDarkMode = () => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }));
  const toggleKosher = () => setPreferences(prev => ({ ...prev, isKosher: !prev.isKosher }));

  const setHealthGoal = (goal: 'Lose Weight' | 'Maintain' | 'Build Muscle') => setPreferences(prev => ({ ...prev, healthGoal: goal }));

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); 
      setCardNumber(val);
      setPaymentError('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
      setCardExpiry(val);
      setPaymentError('');
  };

  const handleUpgrade = () => {
      if (!isTrialMode) {
          const cleanCard = cardNumber.replace(/\s/g, '');
          if (cleanCard.length < 13) { setPaymentError('Enter a valid card.'); return; }
          if (cardExpiry.length < 5) { setPaymentError('Invalid expiry.'); return; }
          if (cardCVC.length < 3) { setPaymentError('Invalid CVC.'); return; }
      }
      
      setIsProcessingPayment(true);
      setTimeout(() => {
          setIsProcessingPayment(false);
          setShowPaymentModal(false);
          setPreferences(prev => ({ 
              ...prev, 
              isProMember: true,
              subscriptionTier: selectedTier,
              trialStartedAt: isTrialMode ? new Date().toISOString() : prev.trialStartedAt 
          }));
          alert(isTrialMode ? "Trial Started! You have 3 days of Pro access." : `${selectedTier === 'elite' ? 'Executive Master' : 'Studio Pro'} Upgrade Successful!`);
      }, 1500);
  };

  const startCheckout = (tier: 'pro' | 'elite', trial: boolean) => {
      setSelectedTier(tier);
      setIsTrialMode(trial);
      setShowPaymentModal(true);
  };

  return (
    <div className="animate-fade-in pb-24 max-w-2xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight font-serif">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your culinary intelligence.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-4 rounded-full transition-all ${preferences.darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-400 shadow-sm border border-slate-200'}`}>
                {preferences.darkMode ? <Moon size={24} fill="currentColor" /> : <Sun size={24} />}
            </button>
            <button onClick={onGoToLanding} className="p-4 rounded-full bg-white dark:bg-slate-800 text-rose-500 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                <Home size={24} />
            </button>
        </div>
      </div>

      {/* MEMBERSHIP & TRIAL - REDESIGNED FOR HIGH FIDELITY */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4 px-1">
            <Zap className="text-primary-500" size={18} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Membership Status</h2>
        </div>

        {isCurrentlyInTrial ? (
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-primary-500 rounded-lg text-white animate-pulse"><Clock size={16} /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Exclusive 3-Day Trial</span>
                            </div>
                            <h3 className="text-2xl font-black font-serif">Studio Pro Access</h3>
                            <p className="text-sm opacity-60 mt-1">You have full access to advanced menu features.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trial Progress</span>
                            <span className="text-xs font-black">{trialDaysLeft} days left</span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 dark:bg-slate-100 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-primary-500 transition-all duration-1000 ease-out" style={{ width: `${(trialDaysLeft / 3) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button onClick={() => startCheckout('pro', false)} className="flex-1 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-all">
                            Lock in Pro ($10.99)
                        </button>
                        <button onClick={() => startCheckout('elite', false)} className="flex-1 py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-all">
                            Upgrade to Master
                        </button>
                    </div>
                </div>
            </div>
        ) : !preferences.isProMember ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* STUDIO PRO */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                      <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-4">
                            <Diamond className="text-primary-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Essential</span>
                          </div>
                          <h3 className="text-2xl font-black mb-1 font-serif text-slate-900 dark:text-white">Studio Pro</h3>
                          <div className="text-3xl font-black text-primary-600 mb-6 font-sans">$10.99<span className="text-xs font-bold text-slate-400">/mo</span></div>
                          <button onClick={() => startCheckout('pro', false)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">
                              Activate Pro
                          </button>
                      </div>
                  </div>

                  {/* MASTER STUDIO */}
                  <div className="bg-slate-900 dark:bg-white border border-slate-800 dark:border-slate-100 rounded-[2.5rem] p-8 shadow-2xl transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Crown className="text-accent-400" size={18} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-400">Executive</span>
                            </div>
                          </div>
                          <h3 className="text-2xl font-black mb-1 font-serif text-white dark:text-slate-900">Master Studio</h3>
                          <div className="text-3xl font-black text-accent-400 mb-6 font-sans">$19.99<span className="text-xs font-bold opacity-50">/mo</span></div>
                          <button onClick={() => startCheckout('elite', false)} className="w-full py-4 bg-accent-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">
                              Unlock Master
                          </button>
                      </div>
                  </div>
            </div>
        ) : (
            <div className="bg-emerald-600 text-white rounded-[2.5rem] p-8 flex items-center gap-6 shadow-xl shadow-emerald-900/20">
                <div className="p-4 bg-white/20 rounded-2xl">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black font-serif">{preferences.subscriptionTier === 'elite' ? 'Master Studio' : 'Studio Pro'} Active</h3>
                    <p className="text-emerald-100 text-sm font-medium">Your kitchen intelligence is fully powered.</p>
                </div>
            </div>
        )}
      </div>

      {/* Chef Profile / Level */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                 <ChefHat size={32} />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{chefLevel}</h3>
                  <p className="text-sm text-slate-500 font-medium">{totalMeals} meals logged</p>
              </div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 transition-all duration-1000 ease-out" style={{ width: `${progressToNext}%` }}></div>
          </div>
          <div className="flex justify-between mt-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Level {Math.floor(totalMeals / 10)}</span>
              <span className="text-[10px] font-black uppercase text-slate-400">{Math.ceil(progressToNext)}% to next rank</span>
          </div>
      </div>

      {/* KOSHER MODE TOGGLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl transition-colors ${preferences.isKosher ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <ShieldCheck size={24} />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Kosher Mode</h3>
                  <p className="text-sm text-slate-500 font-medium">Filter non-kosher combinations.</p>
              </div>
          </div>
          <button onClick={toggleKosher} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${preferences.isKosher ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${preferences.isKosher ? 'left-7' : 'left-1'}`}></div>
          </button>
      </div>
      
      {/* Health Goal Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
               <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Health Goal</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {[
                 { id: 'Lose Weight', icon: <TrendingUp className="rotate-180" size={16}/>, color: 'text-orange-500' },
                 { id: 'Maintain', icon: <Minus size={16}/>, color: 'text-blue-500' },
                 { id: 'Build Muscle', icon: <Dumbbell size={16}/>, color: 'text-emerald-500' }
             ].map((opt) => (
                 <button key={opt.id} onClick={() => setHealthGoal(opt.id as any)} className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${preferences.healthGoal === opt.id ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                     <div className={`${preferences.healthGoal === opt.id ? opt.color : 'text-slate-400'}`}>{opt.icon}</div>
                     <span className={`font-bold text-sm ${preferences.healthGoal === opt.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{opt.id}</span>
                 </button>
             ))}
        </div>
      </div>

      {/* ACCOUNT MANAGEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                 <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Account</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Logged in as <span className="font-bold text-slate-700 dark:text-slate-200">{preferences.email || 'Guest User'}</span></p>
          <button 
              onClick={onSignOut} 
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
              <LogOut size={18} />
              Sign Out from Studio
          </button>
      </div>

      {/* STRIPE SIMULATION MODAL */}
      {showPaymentModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 p-8 animate-slide-up">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                              <div className="p-2 bg-slate-900 rounded-lg text-white"><Star size={18} fill="currentColor" /></div>
                              <span className="font-bold text-slate-900 dark:text-white">Savor Studio {selectedTier === 'elite' ? 'Master' : 'Pro'}</span>
                          </div>
                          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{isTrialMode ? 'Free Trial' : selectedTier === 'elite' ? '$19.99/mo' : '$10.99/mo'}</h3>
                          <p className="text-slate-500 text-xs mt-1">{isTrialMode ? 'No payment required for 3 days.' : 'Billed monthly. Cancel anytime.'}</p>
                      </div>
                      <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500" /></button>
                  </div>

                  {!isTrialMode && (
                      <div className="space-y-4 mb-8">
                          <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Card Information</label>
                              <div className="relative">
                                  <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={cardNumber} onChange={handleCardChange} placeholder="4242 4242 4242 4242" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-mono outline-none focus:ring-2" maxLength={19} />
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                  <input type="text" value={cardExpiry} onChange={handleExpiryChange} placeholder="MM / YY" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 px-4 text-slate-800 dark:text-white font-mono outline-none" maxLength={5} />
                                  <input type="text" value={cardCVC} onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, '').substring(0,3))} placeholder="CVC" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 px-4 text-slate-800 dark:text-white font-mono outline-none" maxLength={3} />
                              </div>
                          </div>
                          {paymentError && <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100"><AlertTriangle size={14} />{paymentError}</div>}
                      </div>
                  )}

                  <button onClick={handleUpgrade} disabled={isProcessingPayment} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    {isProcessingPayment ? <Loader2 className="animate-spin" /> : <Lock size={20} />}
                    {isProcessingPayment ? 'Processing...' : isTrialMode ? 'Activate 3-Day Trial' : 'Secure Checkout'}
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-6 text-slate-400"><ShieldCheck size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Powered by Stripe Simulation</span></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsView;