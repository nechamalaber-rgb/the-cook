
import React, { useState, useEffect } from 'react';
import { Check, Diamond, Crown, CheckCircle2, ArrowRight, Star, Zap, ShieldCheck, Heart, X, Timer, Flame, Percent, ShoppingCart, Sparkles, Calendar, Gem } from 'lucide-react';
import { UserPreferences } from '../types';
import { Logo } from './Logo';

interface PlansViewProps {
  preferences: UserPreferences;
}

const STRIPE_LINKS = {
    pro_monthly: "https://buy.stripe.com/test_3cI7sNevgejJ3Tq42UfYY00",
    pro_yearly: "https://buy.stripe.com/test_3cI7sNevgejJ3Tq42UfYY01"
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

  // Identical features for both plans as they are the same tier.
  const studioFeatures = [
    'AI Recipe Curation',
    'Inventory Scanning',
    'Shopping Logistics',
    'Standard Support'
  ];

  return (
    <div className="animate-fade-in pb-24 max-w-7xl mx-auto px-4 relative">
      
      {/* FLASH SALE BANNER */}
      <div className="fixed top-20 left-0 right-0 bg-rose-600 text-white text-center py-1.5 z-40 shadow-lg flex justify-center items-center gap-2 animate-slide-down">
          <Flame size={12} fill="currentColor" className="animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">Flash Sale Ends in {timeLeft}</span>
      </div>

      {/* HEADER */}
      <div className="text-center py-16 md:py-20 max-w-3xl mx-auto mt-8">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter font-serif leading-tight">
          The <span className="text-primary-500">Studio</span> Plan
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          The exact same features. Choose your billing cycle.
        </p>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-20 px-4">
          
          {/* MONTHLY PLAN CARD */}
          <div 
            onClick={() => handlePlanSelection('monthly')}
            className="group rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0c0c] hover:border-primary-500 transition-all duration-500 shadow-xl flex flex-col cursor-pointer"
          >
              <div className="flex items-center gap-2 mb-10">
                  <div className="p-1 bg-primary-500 rounded-lg text-white">
                    <Logo className="w-5 h-5" />
                  </div>
                  <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tight">GatherHome</span>
              </div>

              <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-10">
                    <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-serif">$9.99</span>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ Month</span>
                  </div>

                  <ul className="space-y-5 mb-12">
                      {studioFeatures.map((feat, i) => (
                          <li key={i} className="flex items-center gap-4">
                              <Check size={18} className="text-primary-500" />
                              <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">{feat}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              <button className="w-full py-5 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-full font-black text-xs uppercase tracking-widest transition-all hover:bg-primary-500 hover:text-white flex items-center justify-center gap-2 border border-transparent dark:border-white/10">
                  Start Pro <ArrowRight size={16} />
              </button>
          </div>

          {/* YEARLY PLAN CARD */}
          <div 
            onClick={() => handlePlanSelection('yearly')}
            className="group rounded-[2.5rem] p-10 border-2 border-primary-500 bg-white dark:bg-[#0c0c0c] shadow-[0_0_60px_rgba(176,141,106,0.15)] flex flex-col cursor-pointer relative"
          >
              <div className="absolute top-5 right-5 px-4 py-1.5 bg-primary-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  Start 3-Day Free Trial
              </div>

              <div className="flex items-center gap-2 mb-10">
                  <div className="p-1 bg-primary-500 rounded-lg text-white">
                    <Logo className="w-5 h-5" />
                  </div>
                  <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tight">GatherHome</span>
              </div>

              <div className="flex-1">
                  <div className="mb-10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-serif">$30.00</span>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ Year</span>
                      </div>
                      <div className="mt-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                          Save 75% • Only $2.50 / Month
                      </div>
                  </div>

                  <ul className="space-y-5 mb-12">
                      {studioFeatures.map((feat, i) => (
                          <li key={i} className="flex items-center gap-4">
                              <Check size={18} className="text-primary-500" />
                              <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">{feat}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              <button className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-2 hover:bg-primary-500 hover:text-white transition-all">
                  Claim Studio Offer <ArrowRight size={16} />
              </button>
          </div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center border-t border-slate-200 dark:border-slate-800 pt-16">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Secured Studio Infrastructure</p>
          <div className="flex flex-wrap justify-center gap-8 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4">
              <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Verified Transaction</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Auto-Logistics Active</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Cancel Anytime</span>
          </div>
      </div>

    </div>
  );
};

export default PlansView;
