
import React from 'react';
import { Check, ArrowRight, Zap, Star, ShieldCheck, Crown, Flame, Sparkles } from 'lucide-react';
import { UserPreferences } from '../types';

interface PlansViewProps {
  preferences: UserPreferences;
}

const PlansView: React.FC<PlansViewProps> = ({ preferences }) => {
  const handlePurchase = (plan: string) => {
    alert(`Redirecting to secure payment for ${plan} plan...`);
  };

  const featureList = [
    "Full AI Culinary Intelligence",
    "Unlimited Inventory Scanning",
    "Smart Shopping Logistics",
    "Macro & Nutrition Curation",
    "Priority Studio Support"
  ];

  return (
    <div className="animate-fade-in pb-32 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-600 rounded-full mb-6 border border-amber-500/20">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Full Power Access</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-serif font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
            Elite <span className="text-primary-500 italic">Plans.</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Both plans include everything. There are no limits on your cooking. One is just way cheaper.
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          
          {/* Monthly */}
          <div className="bg-white dark:bg-[#0c1220] p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl transition-all h-full">
              <div>
                  <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white mb-2">Monthly Pro</h3>
                  <div className="mb-10 flex items-baseline gap-2">
                      <span className="text-6xl font-black font-serif text-slate-900 dark:text-white tracking-tighter">$9.99</span>
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ Month</span>
                  </div>
                  <ul className="space-y-4 mb-10">
                      {featureList.map((f, i) => (
                          <li key={i} className="flex items-center gap-4">
                              <Check size={18} className="text-primary-500" strokeWidth={3} />
                              <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{f}</span>
                          </li>
                      ))}
                  </ul>
              </div>
              <button 
                onClick={() => handlePurchase('Monthly')}
                className="w-full py-5 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
              >
                  Register with the Studio <ArrowRight size={18} />
              </button>
          </div>

          {/* Yearly */}
          <div className="bg-white dark:bg-[#0c1220] p-10 rounded-[3rem] border-2 border-primary-500 flex flex-col justify-between shadow-[0_0_60px_rgba(176,141,106,0.15)] relative transform hover:-translate-y-2 transition-all duration-500 h-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                  Best Value Choice
              </div>
              <div>
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Yearly Elite</h3>
                      <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Save 75%</div>
                  </div>
                  <div className="mb-10 flex items-baseline gap-2">
                      <span className="text-7xl font-black font-serif text-slate-900 dark:text-white tracking-tighter">$30</span>
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ Year</span>
                  </div>
                  <ul className="space-y-4 mb-10">
                      {featureList.map((f, i) => (
                          <li key={i} className="flex items-center gap-4">
                              <Check size={18} className="text-primary-500" strokeWidth={3} />
                              <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{f}</span>
                          </li>
                      ))}
                      <li className="pt-4 flex items-center gap-4 text-emerald-500">
                          <Flame size={18} fill="currentColor" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Equivalent to $2.50 / Month</span>
                      </li>
                  </ul>
              </div>
              <button 
                onClick={() => handlePurchase('Yearly')}
                className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-4 group"
              >
                  Register with the Studio <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
      </div>

      <div className="mt-20 max-w-2xl mx-auto text-center space-y-6 opacity-60">
          <div className="flex justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              <span className="flex items-center gap-2"><ShieldCheck size={16}/> SECURE STRIPE PAYMENTS</span>
              <span className="flex items-center gap-2"><Zap size={16}/> INSTANT ACTIVATION</span>
              <span className="flex items-center gap-2"><Check size={16}/> CANCEL ANYTIME</span>
          </div>
      </div>
    </div>
  );
};

export default PlansView;
