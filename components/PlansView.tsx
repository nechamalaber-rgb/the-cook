
import React, { useState, useEffect } from 'react';
import { Check, Diamond, Crown, CheckCircle2, ArrowRight, Star, Zap, ShieldCheck, Heart, X, Timer, Flame, Percent, ShoppingCart, Sparkles, Calendar, Gem } from 'lucide-react';
import { UserPreferences } from '../types';

interface PlansViewProps {
  preferences: UserPreferences;
}

const STRIPE_LINKS = {
    pro_monthly: "https://buy.stripe.com/test_3cI7sNevgejJ3Tq42UfYY00",
    pro_yearly: "https://buy.stripe.com/test_3cI7sNevgejJ3Tq42UfYY01" // Placeholder for yearly
};

const PlansView: React.FC<PlansViewProps> = ({ preferences }) => {
  const [timeLeft, setTimeLeft] = useState("04:23:15");

  useEffect(() => {
    const timer = setInterval(() => {
        const date = new Date();
        const hours = 23 - date.getHours();
        const mins = 59 - date.getMinutes();
        const secs = 59 - date.getSeconds();
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlanSelection = (interval: 'monthly' | 'yearly') => {
      const link = interval === 'monthly' ? STRIPE_LINKS.pro_monthly : STRIPE_LINKS.pro_yearly;
      window.open(link, '_blank');
  };

  const isTrial = !!preferences.trialStartedAt;

  return (
    <div className="animate-fade-in pb-24 max-w-7xl mx-auto px-4 relative">
      
      {/* FLASH SALE BANNER */}
      <div className="fixed top-20 left-0 right-0 bg-rose-600 text-white text-center py-2 z-40 shadow-lg flex justify-center items-center gap-2 animate-slide-down">
          <Flame size={14} fill="currentColor" className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Flash Sale Ends in {timeLeft}</span>
      </div>

      {/* HEADER */}
      <div className="text-center py-16 md:py-24 max-w-3xl mx-auto mt-8">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter font-serif leading-tight">
          Unlock Your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Kitchen Potential</span>
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          One suite. Two ways to join. Full Studio access.
        </p>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
          
          {/* MONTHLY PLAN */}
          <div 
            onClick={() => handlePlanSelection('monthly')}
            className={`relative group rounded-[3rem] p-10 border-4 cursor-pointer transition-all duration-500 overflow-hidden flex flex-col ${preferences.subscriptionTier === 'pro' && !isTrial ? 'border-primary-500 bg-slate-900 text-white shadow-2xl' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-800 hover:shadow-2xl hover:-translate-y-1'}`}
          >
               <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-bl-[2rem] z-20">
                  Flexible
              </div>

              <div className="relative z-10 flex-1 flex flex-col">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center mb-8">
                      <Zap size={32} />
                  </div>
                  <h3 className={`text-3xl font-black font-serif mb-2 ${preferences.subscriptionTier === 'pro' && !isTrial ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Monthly</h3>
                  <p className={`text-sm font-bold uppercase tracking-widest mb-8 ${preferences.subscriptionTier === 'pro' && !isTrial ? 'text-slate-400' : 'text-slate-500'}`}>Pay as you go</p>
                  
                  <div className="flex flex-col mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black tracking-tighter ${preferences.subscriptionTier === 'pro' && !isTrial ? 'text-white' : 'text-slate-900 dark:text-white'}`}>$9.99</span>
                        <span className="text-slate-400 font-bold text-lg">/mo</span>
                      </div>
                      <span className="text-slate-400 text-xs font-bold mt-2">Billed monthly</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                      {[
                        'Full Studio Access',
                        'Cancel Anytime',
                        'Basic Support'
                      ].map((feat, i) => (
                          <li key={i} className="flex items-center gap-3 font-bold text-sm">
                              <CheckCircle2 size={16} className={preferences.subscriptionTier === 'pro' && !isTrial ? 'text-primary-500' : 'text-slate-400'} />
                              <span className={preferences.subscriptionTier === 'pro' && !isTrial ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}>{feat}</span>
                          </li>
                      ))}
                  </ul>

                  <button className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${preferences.subscriptionTier === 'pro' && !isTrial ? 'bg-slate-800 text-white cursor-default' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                      Select Monthly
                  </button>
              </div>
          </div>

          {/* YEARLY PLAN (HERO) */}
          <div 
            onClick={() => handlePlanSelection('yearly')}
            className="relative group rounded-[3rem] p-10 border-4 cursor-pointer transition-all duration-500 overflow-hidden flex flex-col border-primary-500 bg-slate-900 text-white shadow-2xl scale-[1.02] hover:scale-[1.05]"
          >
               <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-bl-[2rem] z-20 shadow-lg animate-pulse">
                  Best Value
              </div>

              {isTrial && (
                   <div className="absolute top-0 left-0 bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-br-[2rem] z-20">
                      Trial Active
                  </div>
              )}

              <div className="relative z-10 flex-1 flex flex-col">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-lg shadow-primary-900/50">
                      <Crown size={40} />
                  </div>
                  <h3 className="text-4xl font-black font-serif mb-2 text-white">Yearly Pro</h3>
                  <p className="text-sm font-bold uppercase tracking-widest mb-8 text-primary-200">The Complete Experience</p>
                  
                  <div className="flex flex-col mb-8">
                      <div className="flex items-center gap-3 mb-1">
                          <span className="text-slate-400 line-through font-bold text-xl">$119.88</span>
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">Save 75%</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-6xl font-black tracking-tighter text-white">$30.00</span>
                        <span className="text-slate-400 font-bold text-lg">/yr</span>
                      </div>
                      <span className="text-primary-200 text-xs font-bold mt-2">That's just $2.50 / month</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                      {[
                        { text: 'Unlimited AI Menu Curation', icon: <Sparkles size={18}/> },
                        { text: 'Automated Shopping Logistics', icon: <ShoppingCart size={18}/> },
                        { text: 'Weekly Meal Planning & Logs', icon: <Calendar size={18}/> },
                        { text: 'Smart Inventory Management', icon: <Diamond size={18}/> },
                        { text: 'Priority Feature Support', icon: <Star size={18}/> }
                      ].map((feat, i) => (
                          <li key={i} className="flex items-center gap-4 font-bold text-sm">
                              <div className="p-1.5 rounded-full bg-primary-500 text-white">
                                {feat.icon}
                              </div>
                              <span className="text-slate-100">{feat.text}</span>
                          </li>
                      ))}
                  </ul>

                  <button className="w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all bg-primary-600 text-white hover:bg-primary-500 shadow-xl shadow-primary-900/30">
                      Claim Yearly Offer <ArrowRight size={20} />
                  </button>
              </div>
          </div>
      </div>
      
      {/* FAQ / Trust Section */}
      <div className="max-w-4xl mx-auto text-center border-t border-slate-200 dark:border-slate-800 pt-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Trusted by 2,000+ Modern Chefs</p>
          <div className="flex flex-wrap justify-center gap-10 text-slate-500 dark:text-slate-400 font-bold text-sm">
              <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Cancel Anytime</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Secure Stripe Payment</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Full Access Guarantee</span>
          </div>
      </div>

    </div>
  );
};

export default PlansView;
