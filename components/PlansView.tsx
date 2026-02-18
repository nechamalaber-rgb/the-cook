
import React, { useState } from 'react';
import { Check, ArrowRight, Zap, ShieldCheck, Crown, Flame, Sparkles, X, Globe, CreditCard, LifeBuoy, Mail, Loader2 } from 'lucide-react';
import { UserPreferences } from '../types';

// USER PROVIDED STRIPE LINK
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/6oU5kD7NX6VjekP8X9djO00";

interface PlansViewProps {
  preferences: UserPreferences;
}

const PlansView: React.FC<PlansViewProps> = ({ preferences }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = () => {
    setIsRedirecting(true);
    // Visual pause for psychological reinforcement of security
    setTimeout(() => {
        window.location.href = STRIPE_PAYMENT_LINK;
    }, 1200);
  };

  const featureComparison = [
    { name: "AI Recipe Curation", free: "3 Total Actions", pro: "Unlimited" },
    { name: "Pantry Vision (Scanning)", free: "Basic", pro: "Precision" },
    { name: "Macro-Nutrient Logic", free: "Partial", pro: "Complete" },
    { name: "Shopping List Sync", free: true, pro: true },
    { name: "Kosher Logic Support", free: "Partial", pro: "Strict Separation" },
    { name: "Priority AI Reasoning", free: false, pro: true },
  ];

  return (
    <div className="animate-fade-in pb-32 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center py-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary-500/5 blur-[120px] pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full mb-8 border border-primary-500/20 backdrop-blur-md">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scale your studio capacity</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-serif font-black text-white tracking-tighter leading-none mb-8">
            Studio <span className="text-primary-500 italic">Elite.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic">
            Professional culinary intelligence, precision-tuned for your household logic.
          </p>
      </div>

      <div className="max-w-2xl mx-auto mb-20 relative">
          {isRedirecting && (
              <div className="absolute inset-0 z-50 bg-[#0c1220]/95 backdrop-blur-md rounded-[3.5rem] flex flex-col items-center justify-center text-center p-12">
                  <Loader2 size={48} className="animate-spin text-primary-500 mb-6" />
                  <h3 className="text-white text-2xl font-black font-serif italic mb-2">Secure Handshake...</h3>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Connecting to Stripe Payment Gateway</p>
              </div>
          )}

          {/* Unified Pro Plan */}
          <div className="bg-[#0c1220] p-12 rounded-[3.5rem] border-2 border-primary-500 flex flex-col justify-between shadow-[0_40px_100px_rgba(176,141,106,0.15)] relative transform hover:-translate-y-3 transition-all duration-700 overflow-hidden group">
              <div className="absolute -top-1 right-0 px-8 py-3 bg-primary-500 text-white rounded-bl-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl z-20">
                  Elite Manifest
              </div>
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>

              <div>
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-black font-serif text-white uppercase italic tracking-tighter">Elite Pass</h3>
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest animate-pulse">Unlimited</div>
                  </div>
                  
                  <div className="mb-12">
                      <div className="flex items-baseline gap-3">
                          <span className="text-8xl font-black font-serif text-white tracking-tighter">$14.99</span>
                          <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">/ Month</span>
                      </div>
                      <p className="text-primary-400 text-[10px] font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                         <Flame size={14} fill="currentColor" className="animate-bounce" /> Unrestricted Orchestration Logic
                      </p>
                  </div>

                  <div className="space-y-5 mb-12">
                      {[
                        "Unlimited AI Curation Cycles", 
                        "Full Macro & Nutritional Synthesis", 
                        "Elite Kosher & Dietary Logic", 
                        "Instacart & Walmart Sync Ready",
                        "Neural Image Generation Support"
                      ].map((f, i) => (
                          <div key={i} className="flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0">
                                  <Check size={14} strokeWidth={4} />
                              </div>
                              <span className="text-sm font-bold text-slate-100 uppercase tracking-tight italic">{f}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <button 
                onClick={handleUpgrade}
                disabled={isRedirecting}
                className="w-full py-7 bg-white text-slate-950 rounded-[2.2rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(176,141,106,0.3)] hover:bg-primary-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 group active:scale-95"
              >
                  Initialize Access <Crown size={20} className="group-hover:rotate-12 transition-transform text-primary-500" />
              </button>
          </div>
      </div>

      {/* SUPPORT & CANCELLATION */}
      <div className="max-w-2xl mx-auto mb-32">
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-inner">
              <div className="p-3 bg-white/5 rounded-2xl text-primary-500 mb-6">
                  <LifeBuoy size={32} />
              </div>
              <h3 className="text-white font-black text-xl uppercase tracking-[0.3em] mb-3 font-serif italic">Support & Logistics</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm font-medium">
                  Questions regarding billing or manual manifest sync? Our concierge team responds to all signals within 24 cycles.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                  <a href="mailto:schneurlaber@gmail.com" className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
                      <Mail size={16}/> Direct Signal
                  </a>
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest italic tracking-[0.2em]">schneurlaber@gmail.com</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pb-20">
          <div className="p-8 space-y-4">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500 mx-auto border border-slate-700 shadow-sm">
                  <ShieldCheck size={28} />
              </div>
              <h4 className="text-lg font-black font-serif text-white uppercase italic">Encrypted Manifest</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Your dietary data is secured with AES-256 protocols. Your kitchen is your fortress.</p>
          </div>
          <div className="p-8 space-y-4">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500 mx-auto border border-slate-700 shadow-sm">
                  <Globe size={28} />
              </div>
              <h4 className="text-lg font-black font-serif text-white uppercase italic">Retail Sync</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Elite logic connects missing items directly to Walmart and Instacart APIs.</p>
          </div>
          <div className="p-8 space-y-4">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500 mx-auto border border-slate-700 shadow-sm">
                  <Zap size={28} />
              </div>
              <h4 className="text-lg font-black font-serif text-white uppercase italic">Zero Latency</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Instant recipe generation using the highest priority compute cycles in our cluster.</p>
          </div>
      </div>
    </div>
  );
};

export default PlansView;
