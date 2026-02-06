
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, 
  Crown, Flame, Sparkles, Check, 
  Wallet, TrendingDown, Clock, 
  ShoppingBag, Trash2
} from 'lucide-react';

const AboutView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090e1a] animate-fade-in pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* HEADER SECTION */}
        <section className="text-center py-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full mb-8 border border-primary-500/20 backdrop-blur-md">
                  <Sparkles size={16} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Premium Orchestration</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-white mb-8 font-serif tracking-tighter leading-none italic">
                Studio <span className="text-primary-500">Access.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                The average household wastes $1,500+ in groceries annually. Prepzu Studio Pro pays for itself by turning that waste into gourmet meals.
              </p>
          </div>
        </section>

        {/* PRICING CARD */}
        <section className="max-w-2xl mx-auto mb-24 relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-[4rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
             <div className="relative bg-[#0c1220] p-10 md:p-16 rounded-[3.5rem] border-2 border-primary-500 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 px-10 py-4 bg-primary-500 text-white rounded-bl-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl z-20">
                      Studio Pro
                  </div>
                  
                  <div className="mb-12">
                      <div className="flex items-baseline gap-4 mb-2">
                          <span className="text-8xl font-black font-serif text-white tracking-tighter">$14.99</span>
                          <span className="text-slate-500 font-bold text-lg uppercase tracking-widest">/ Month</span>
                      </div>
                      <p className="text-primary-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                         <Flame size={16} fill="currentColor" className="animate-bounce" /> Total Savings Logic Enabled
                      </p>
                  </div>

                  <div className="grid md:grid-cols-1 gap-6 mb-12">
                      {[
                        { title: "Unlimited AI Synthesis", desc: "No caps. Generate recipes, plans, and lists endlessly." },
                        { title: "Precision Vision OCR", desc: "Instant manifest population from receipts and shelves." },
                        { title: "Complete Macro Analysis", desc: "Detailed tracking of calories, protein, and nutrients." },
                        { title: "Auto-Supply Sync", desc: "Direct integration with Walmart & Instacart logistics." },
                        { title: "Priority Logic Access", desc: "Use our most advanced thinking models first." }
                      ].map((f, i) => (
                          <div key={i} className="flex items-start gap-4">
                              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary-500/20 mt-1">
                                  <Check size={14} strokeWidth={4} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-100 uppercase tracking-tight">{f.title}</p>
                                <p className="text-[11px] text-slate-400 font-bold">{f.desc}</p>
                              </div>
                          </div>
                      ))}
                  </div>

                  <button 
                    onClick={() => navigate('/plans')}
                    className="w-full py-7 bg-white text-slate-950 rounded-[2.2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                  >
                      Initialize Pro Access <Crown size={20} className="group-hover:rotate-12 transition-transform text-primary-500" />
                  </button>
                  <p className="text-center mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cancel anytime • Secure checkout via Stripe</p>
             </div>
        </section>

        {/* SAVINGS LOGIC SECTION */}
        <section className="mb-24">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary-500 text-center mb-16 italic">The Economics of Studio Pro</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 shadow-sm text-center">
                     <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                         <Trash2 size={32} />
                     </div>
                     <h3 className="text-2xl font-black font-serif text-white mb-4">Zero Waste</h3>
                     <p className="text-slate-400 text-sm leading-relaxed font-medium">
                       Our "Use It Soon" algorithm saves users an average of <b>$120/month</b> by suggesting recipes for ingredients before they expire.
                     </p>
                 </div>
                 <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 shadow-sm text-center">
                     <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                         <ShoppingBag size={32} />
                     </div>
                     <h3 className="text-2xl font-black font-serif text-white mb-4">Optimized Buys</h3>
                     <p className="text-slate-400 text-sm leading-relaxed font-medium">
                       Stop impulse buying. Studio Pro calculates <b>exact portions</b>, meaning you only buy precisely what you need to cook.
                     </p>
                 </div>
                 <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 shadow-sm text-center">
                     <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                         <Wallet size={32} />
                     </div>
                     <h3 className="text-2xl font-black font-serif text-white mb-4">Time = Capital</h3>
                     <p className="text-slate-400 text-sm leading-relaxed font-medium">
                       Save 4+ hours weekly on meal planning and manual list building. At a median wage, that's over <b>$400/month</b> by reclaimed time value.
                     </p>
                 </div>
            </div>
        </section>

        {/* TRUST SIGNALS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5 pt-20">
            <div className="flex items-start gap-6">
                 <div className="p-4 bg-slate-900 rounded-2xl text-primary-500">
                     <ShieldCheck size={24} />
                 </div>
                 <div>
                     <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Encrypted Manifests</h4>
                     <p className="text-xs text-slate-500 leading-relaxed">Your dietary data and inventory history are secured with bank-grade AES-256 encryption. We prioritize your studio's privacy.</p>
                 </div>
            </div>
            <div className="flex items-start gap-6">
                 <div className="p-4 bg-slate-900 rounded-2xl text-primary-500">
                     <Zap size={24} />
                 </div>
                 <div>
                     <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Instant Orchestration</h4>
                     <p className="text-xs text-slate-500 leading-relaxed">Switch between devices seamlessly. Your inventory syncs across mobile, tablet, and desktop in real-time without latency.</p>
                 </div>
            </div>
        </section>

        {/* FINAL CTA */}
        <section className="text-center py-32">
            <button 
              onClick={() => navigate('/studio')}
              className="inline-flex items-center gap-4 bg-primary-600 text-white px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-primary-500 hover:scale-105 active:scale-95 transition-all"
            >
              Start Curation Cycle <ArrowRight size={20} />
            </button>
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
              Experience the future of home logistics.
            </p>
        </section>
      </div>
    </div>
  );
};

export default AboutView;
