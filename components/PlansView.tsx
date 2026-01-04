
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

  const studioFeatures = [
    'AI Recipe Curation',
    'Inventory Scanning',
    'Shopping Logistics',
    'Standard Support'
  ];

  return (
    <div className="animate-fade-in pb-24 max-w-6xl mx-auto px-4 relative">
      
      {/* FLASH SALE BANNER */}
      <div className="fixed top-20 left-0 right-0 bg-rose-600 text-white text-center py-1.5 z-40 shadow-lg flex justify-center items-center gap-2 animate-slide-down">
          <Flame size={12} fill="currentColor" className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Flash Sale Ends in {timeLeft}</span>
      </div>

      {/* HEADER */}
      <div className="text-center py-16 md:py-20 max-w-3xl mx-auto mt-8">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter font-serif leading-tight">
          The <span className="text-primary-500">Studio</span> Plan
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
          One powerful studio experience. <br/> Choose the billing cycle that fits your life.
        </p>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20 px-2">
          
          {/* MONTHLY PLAN CARD */}
          <div 
            onClick={() => handlePlanSelection('monthly')}
            className="group rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0c0c] hover:border-primary-500 transition-all duration-500 shadow-xl flex flex-col cursor-pointer min-h-[550px] justify-between relative overflow-hidden"
          >
              <div>
                  <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-primary-500 rounded-lg text-white">
                        <Logo className="w-6 h-6" />
                      </div>
                      <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tight">Prepzu</span>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-serif">$9.99</span>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ Month</span>
                    </div>
                    <p className="text-slate-500 font-bold text-xs">Flexible billing. Cancel anytime.</p>
                  </div>

                  <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-8"></div>

                  <ul className="space-y-4 mb-8">
                      {studioFeatures.map((feat, i) => (
                          <li key={i} className="flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <Check size={14} strokeWidth={3} />
                              </div>
                              <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">{feat}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              <button className="w-full py-5 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center gap-2 border border-transparent dark:border-white/10 group-hover:scale-[1.02]">
                  Select Monthly <ArrowRight size={16} />
              </button>
          </div>

          {/* YEARLY PLAN CARD - ELITE LOOK */}
          <div 
            onClick={() => handlePlanSelection('yearly')}
            className="group rounded-[2.5rem] p-8 md:p-10 border-2 border-primary-500 bg-white dark:bg-[#0c0c0c] shadow-[0_0_50px_rgba(176,141,106,0.15)] flex flex-col cursor-pointer min-h-[550px] justify-between relative overflow-hidden transform hover:-translate-y-1 transition-all duration-500"
          >
              <div className="absolute top-0 right-0 bg-primary-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-8 py-2.5 rounded-bl-[2rem] shadow-lg z-10">
                  Best Value
              </div>

              <div>
                  <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-primary-500 rounded-lg text-white shadow-lg shadow-primary-500/30">
                        <Logo className="w-6 h-6" />
                      </div>
                      <span className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tight">Prepzu</span>
                  </div>

                  <div className="mb-8">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white font-serif">$30</span>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ Year</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                             Save $90 • Like paying $2.50/mo
                          </span>
                      </div>
                  </div>

                  <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-8"></div>

                  <ul className="space-y-4 mb-8">
                      {studioFeatures.map((feat, i) => (
                          <li key={i} className="flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                                <Check size={14} strokeWidth={3} />
                              </div>
                              <span className="text-slate-900 dark:text-white font-bold text-sm">{feat}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              <button className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-2 hover:bg-primary-600 hover:text-white transition-all group-hover:scale-[1.02]">
                  Claim Annual Offer <ArrowRight size={16} />
              </button>
          </div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center border-t border-slate-200 dark:border-slate-800 pt-12">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Secured Studio Infrastructure</p>
          <div className="flex flex-wrap justify-center gap-8 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4">
              <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Verified Stripe Secure</span>
              <span className="flex items-center gap-2"><Zap size={14} className="text-emerald-500"/> Instant Activation</span>
              <span className="flex items-center gap-2"><Calendar size={14} className="text-emerald-500"/> Cancel Anytime</span>
          </div>
      </div>

    </div>
  );
};

export default PlansView;
