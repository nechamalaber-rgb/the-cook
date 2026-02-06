
import React, { useState } from 'react';
import { Check, ArrowRight, Zap, ShieldCheck, Crown, Flame, Sparkles, X, Globe, CreditCard } from 'lucide-react';
import { UserPreferences } from '../types';
import { CheckoutModal } from './CheckoutModal';

interface PlansViewProps {
  preferences: UserPreferences;
}

const PlansView: React.FC<PlansViewProps> = ({ preferences }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const featureComparison = [
    { name: "AI Recipe Curation", free: "3 Total Actions", pro: "Unlimited" },
    { name: "Pantry Vision (Scanning)", free: "Basic", pro: "Precision" },
    { name: "Macro-Nutrient Logic", free: "Partial", pro: "Complete" },
    { name: "Shopping List Sync", free: true, pro: true },
    { name: "Beta Reasoning Models", free: false, pro: true },
  ];

  return (
    <div className="animate-fade-in pb-32 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center py-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary-500/5 blur-[120px] pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full mb-8 border border-primary-500/20 backdrop-blur-md">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Unlock Studio Potential</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-serif font-black text-white tracking-tighter leading-none mb-8">
            Studio <span className="text-primary-500 italic">Access.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Professional culinary intelligence, scaled to your household. Join the Elite manifest today.
          </p>
      </div>

      <div className="max-w-2xl mx-auto mb-32">
          {/* Unified Pro Plan */}
          <div className="bg-[#0c1220] p-12 rounded-[3.5rem] border-2 border-primary-500 flex flex-col justify-between shadow-[0_40px_100px_rgba(176,141,106,0.15)] relative transform hover:-translate-y-3 transition-all duration-700 overflow-hidden group">
              <div className="absolute -top-1 right-0 px-8 py-3 bg-primary-500 text-white rounded-bl-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl z-20">
                  Most Popular
              </div>
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>

              <div>
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-black font-serif text-white">Monthly Pro</h3>
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest animate-pulse">Full Access</div>
                  </div>
                  
                  <div className="mb-12">
                      <div className="flex items-baseline gap-3">
                          <span className="text-8xl font-black font-serif text-white tracking-tighter">$14.99</span>
                          <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">/ Month</span>
                      </div>
                      <p className="text-primary-400 text-[10px] font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                         <Flame size={14} fill="currentColor" className="animate-bounce" /> Complete Studio Coverage • Cancel Anytime
                      </p>
                  </div>

                  <div className="space-y-5 mb-12">
                      {[
                        "Unlimited AI Recipe Synthesis", 
                        "Full Macro & Nutritional Tracking", 
                        "Advanced Pantry Vision OCR", 
                        "Instacart & Walmart Sync",
                        "Priority AI Model Access"
                      ].map((f, i) => (
                          <div key={i} className="flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                  <Check size={14} strokeWidth={4} />
                              </div>
                              <span className="text-sm font-bold text-slate-100 uppercase tracking-tight">{f}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <button 
                onClick={() => setSelectedPlan('Monthly Pro')}
                className="w-full py-7 bg-primary-500 text-white rounded-[2.2rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(176,141,106,0.3)] hover:bg-primary-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 group active:scale-95"
              >
                  Register Access <Crown size={20} className="group-hover:rotate-12 transition-transform" />
              </button>
          </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 border border-slate-800 shadow-sm mb-32">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-black font-serif text-white mb-4">Feature Matrix</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Full transparency into our studio logic</p>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
              <table className="w-full">
                  <thead>
                      <tr className="border-b border-slate-800">
                          <th className="text-left pb-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Capability</th>
                          <th className="pb-8 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Guest</th>
                          <th className="pb-8 text-center text-[11px] font-black uppercase tracking-widest text-primary-500">Pro Member</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                      {featureComparison.map((f, i) => (
                          <tr key={i} className="group">
                              <td className="py-6 text-sm font-black text-slate-300 uppercase tracking-tight">{f.name}</td>
                              <td className="py-6 text-center text-xs font-bold text-slate-400">{(f as any).free || <X size={14} className="mx-auto text-slate-700" />}</td>
                              <td className="py-6 text-center text-xs font-black text-primary-500">{(f as any).pro || <X size={14} className="mx-auto" />}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-8 space-y-4">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500 mx-auto border border-slate-700 shadow-sm">
                  <ShieldCheck size={28} />
              </div>
              <h4 className="text-lg font-black font-serif text-white">Encrypted Sync</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Your culinary data is yours. We use bank-grade AES-256 encryption to secure your manifests.</p>
          </div>
          <div className="p-8 space-y-4">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500 mx-auto border border-slate-700 shadow-sm">
                  <Globe size={28} />
              </div>
              <h4 className="text-lg font-black font-serif text-white">Global Reach</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Synchronize with local supply chains including Walmart and Instacart automatically.</p>
          </div>
          <div className="p-8 space-y-4">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500 mx-auto border border-slate-700 shadow-sm">
                  <Zap size={28} />
              </div>
              <h4 className="text-lg font-black font-serif text-white">Instant Activation</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Access full Studio Pro capabilities within seconds of registering your manifest session.</p>
          </div>
      </div>

      {selectedPlan && (
          <CheckoutModal 
            onClose={() => setSelectedPlan(null)} 
            planName={selectedPlan} 
          />
      )}
    </div>
  );
};

export default PlansView;
