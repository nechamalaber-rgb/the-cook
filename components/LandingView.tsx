
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Calendar, ShoppingCart, ScanLine, Utensils, HeartHandshake, Crown, Check, ChevronRight, Brain, Zap, Layers, CreditCard, AlertCircle, ChefHat, Star, Flame, Gift, Camera, RefreshCw, Wand2, Truck } from 'lucide-react';
import { Logo } from './Logo';

interface LandingViewProps {
  onStart: () => void;
  onSignIn: () => void;
  onSignOut?: () => void;
  currentUser: string | null;
}

const ScrollReveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LandingView: React.FC<LandingViewProps> = ({ onStart, onSignIn, onSignOut, currentUser }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const studioFeatures = [
    'AI Recipe Curation',
    'Inventory Scanning',
    'Shopping Logistics',
    'Standard Support'
  ];

  return (
    <div className="bg-[#000000] text-white font-sans selection:bg-primary-900 selection:text-primary-100 min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl z-[100] px-4 md:px-12 flex items-center justify-between border-b border-white/10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className="flex items-center gap-2 md:gap-2.5">
              <div className="p-1.5 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/20">
                <Logo className="w-5 h-5 md:w-7 h-7" />
              </div>
              <span className="font-serif font-black text-lg md:text-2xl text-white tracking-tight">Prepzu</span>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">Home</button>
              <button onClick={() => scrollToSection('philosophy')} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">Philosophy</button>
              <button onClick={() => scrollToSection('workflow')} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">Plans</button>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
              {!currentUser ? (
                  <button onClick={onSignIn} className="px-4 md:px-6 py-2 md:py-2.5 bg-primary-500 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-lg shadow-primary-500/20 flex items-center gap-1.5 md:gap-2 hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                    Sign Up by the Studio
                  </button>
              ) : (
                  <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={onStart} className="px-3 md:px-6 py-2 md:py-2.5 bg-white text-black rounded-xl font-bold text-[9px] md:text-[12px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-200 transition-all whitespace-nowrap">Studio</button>
                    <button onClick={onSignOut} className="px-3 md:px-6 py-2 md:py-2.5 bg-white/10 text-white border border-white/10 rounded-xl font-bold text-[9px] md:text-[12px] uppercase tracking-widest hover:bg-white/20 transition-all whitespace-nowrap">Log Out</button>
                  </div>
              )}
          </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-32 md:pt-40">
        <div className={`absolute inset-0 z-0 transition-opacity duration-[2000ms] ${isLoaded ? 'opacity-30' : 'opacity-0'}`}>
          <img src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=2400&q=80" className="w-full h-full object-cover" alt="Culinary Studio" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full text-center md:text-left">
          <div className="max-w-3xl mx-auto md:mx-0">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 backdrop-blur-md rounded-full border border-primary-500/20 mb-8 transition-all duration-1000 delay-300 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Sparkles size={16} className="text-primary-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Culinary Intelligence for the Home</span>
            </div>
            <h1 className={`text-6xl md:text-8xl font-serif font-light leading-[1.1] mb-10 tracking-tight transition-all duration-1000 delay-500 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>Master your kitchen. <br/><span className="italic font-normal text-primary-400">Intelligently.</span></h1>
            <p className={`text-xl md:text-2xl text-slate-400 max-w-2xl mb-12 font-light leading-relaxed transition-all duration-1000 delay-700 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Transform your chaotic pantry into a stream of culinary consciousness. Synchronize inventory, curate menus, and orchestrate meals with master chef precision.</p>
            <div className={`flex flex-col sm:flex-row gap-5 justify-center md:justify-start transition-all duration-1000 delay-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <button onClick={onStart} className="px-10 py-5 bg-primary-500 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">Launch Studio <ArrowRight size={22} /></button>
                <button onClick={() => scrollToSection('philosophy')} className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-lg backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">Our Philosophy</button>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="py-32 bg-[#0a0a0a] border-t border-white/5 relative text-center">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
              <ScrollReveal>
                  <div className="mb-12">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 text-primary-500"><ChefHat size={32} /></div>
                      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-500 mb-6">The Problem Space</h2>
                      <h3 className="text-4xl md:text-5xl font-black font-serif text-white tracking-tighter mb-8">Cooking is an art.<br/>Logistics is a chore.</h3>
                      <p className="text-slate-400 text-xl leading-relaxed font-light">We built Prepzu because the modern kitchen is disconnected. The joy of creating food is constantly interrupted by the friction of management.</p>
                  </div>
              </ScrollReveal>
          </div>
      </section>

      {/* How it Works / Workflow */}
      <section id="workflow" className="py-32 bg-[#050505] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
              <ScrollReveal>
                  <div className="mb-24">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-500 mb-6">Kitchen Intelligence</h2>
                      <h3 className="text-5xl md:text-7xl font-black font-serif text-white tracking-tighter leading-tight">The Kitchen <span className="italic font-normal text-primary-400">Loop.</span></h3>
                      <p className="text-slate-400 text-xl max-w-2xl mt-8 font-light leading-relaxed">Prepzu orchestrates your culinary life in four distinct beats. From the moment you buy to the moment you plate.</p>
                  </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
                  <ScrollReveal delay={100}>
                      <div className="space-y-8 group">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary-500 border border-white/10 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-xl">
                              <Camera size={28} />
                          </div>
                          <div className="space-y-4">
                              <div className="text-primary-500 font-serif text-3xl font-light italic opacity-40">01</div>
                              <h4 className="text-xl font-black uppercase tracking-widest text-white">Capture</h4>
                              <p className="text-slate-400 leading-relaxed font-light">Snap a photo of your receipt or shelf. Our vision engine extracts items, quantities, and likely expirations into your digital pantry instantly.</p>
                          </div>
                      </div>
                  </ScrollReveal>

                  <ScrollReveal delay={200}>
                      <div className="space-y-8 group">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary-500 border border-white/10 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-xl">
                              <Wand2 size={28} />
                          </div>
                          <div className="space-y-4">
                              <div className="text-primary-500 font-serif text-3xl font-light italic opacity-40">02</div>
                              <h4 className="text-xl font-black uppercase tracking-widest text-white">Curate</h4>
                              <p className="text-slate-400 leading-relaxed font-light">Stop staring at shelves. Get recipes generated specifically for what you have right now, prioritizing ingredients that need to be used before they waste.</p>
                          </div>
                      </div>
                  </ScrollReveal>

                  <ScrollReveal delay={300}>
                      <div className="space-y-8 group">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary-500 border border-white/10 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-xl">
                              <RefreshCw size={28} />
                          </div>
                          <div className="space-y-4">
                              <div className="text-primary-500 font-serif text-3xl font-light italic opacity-40">03</div>
                              <h4 className="text-xl font-black uppercase tracking-widest text-white">Sync</h4>
                              <p className="text-slate-400 leading-relaxed font-light">As you mark meals as cooked, your inventory updates in real-time. Your digital kitchen stays a perfect reflection of your physical one.</p>
                          </div>
                      </div>
                  </ScrollReveal>

                  <ScrollReveal delay={400}>
                      <div className="space-y-8 group">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary-500 border border-white/10 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-xl">
                              <Truck size={28} />
                          </div>
                          <div className="space-y-4">
                              <div className="text-primary-500 font-serif text-3xl font-light italic opacity-40">04</div>
                              <h4 className="text-xl font-black uppercase tracking-widest text-white">Replenish</h4>
                              <p className="text-slate-400 leading-relaxed font-light">Prepzu identifies missing staples and essential ingredients for your next planned meals, exporting a ready-to-go list to Instacart or Walmart.</p>
                          </div>
                      </div>
                  </ScrollReveal>
              </div>
          </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 bg-[#000000] border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
           <ScrollReveal>
               <div className="mb-20">
                  <h2 className="text-5xl md:text-6xl font-black font-serif mb-6 tracking-tight">One Studio. <span className="text-primary-500">Dual Options.</span></h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">The exact same Studio experience, billed your way.</p>
               </div>
           </ScrollReveal>
           <ScrollReveal delay={200}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
                  
                  {/* Monthly Card */}
                  <div className="flex flex-col p-8 md:p-10 rounded-[2.5rem] border border-white/10 bg-white/5 relative overflow-hidden text-left transition-all duration-500 hover:border-primary-500/40 group min-h-[500px] justify-between">
                    <div>
                        <div className="mb-8 p-3 bg-white/10 w-fit rounded-xl text-slate-400 group-hover:text-white transition-colors"><Logo className="w-6 h-6" /></div>
                        <h3 className="text-3xl font-black font-serif mb-2 text-white">Monthly Pro</h3>
                        <p className="text-slate-400 text-[10px] mb-8 font-black uppercase tracking-widest">Flexible Billing</p>
                        <div className="text-5xl font-serif mb-8 text-white">$9.99 <span className="text-[10px] font-sans text-slate-500 uppercase tracking-widest">/ month</span></div>
                        <ul className="space-y-4 mb-8 text-slate-300 text-sm font-medium">
                          {studioFeatures.map((feat, i) => (
                              <li key={i} className="flex items-center gap-4"><Check size={18} className="text-primary-400"/> {feat}</li>
                          ))}
                        </ul>
                    </div>
                    <button onClick={onSignIn} className="w-full py-5 bg-white/10 border border-white/10 text-white rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3">Register by the Studio <ArrowRight size={16}/></button>
                  </div>

                  {/* Yearly Card */}
                  <div className="flex flex-col p-8 md:p-10 rounded-[2.5rem] border-2 border-primary-500 bg-primary-950/20 relative overflow-hidden text-left shadow-[0_0_80px_rgba(176,141,106,0.15)] transition-all duration-500 hover:shadow-[0_0_100px_rgba(176,141,106,0.25)] group min-h-[500px] justify-between transform hover:-translate-y-2">
                    <div className="absolute top-0 right-0 bg-primary-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-8 py-2.5 rounded-bl-[2rem] shadow-lg animate-pulse z-10">Best Value</div>
                    
                    <div>
                        <div className="mb-8 p-3 bg-primary-500 w-fit rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"><Logo className="w-6 h-6" /></div>
                        <h3 className="text-3xl font-black font-serif mb-2 text-white">Yearly Elite</h3>
                        <p className="text-primary-400 text-[10px] mb-8 font-black uppercase tracking-widest flex items-center gap-2"><Flame size={14} className="animate-pulse" /> Complete Studio Savings</p>
                        
                        <div className="mb-8">
                          <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-serif text-white tracking-tighter">$30</span>
                            <span className="text-slate-500 uppercase tracking-widest text-[10px] font-black font-sans">/ year</span>
                          </div>
                          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block border border-emerald-500/20">Save 75% • Only $2.50 / Month</p>
                        </div>

                        <ul className="space-y-4 mb-8 text-slate-100 text-sm font-medium">
                          {studioFeatures.map((feat, i) => (
                              <li key={i} className="flex items-center gap-4"><Check size={18} className="text-primary-400"/> {feat}</li>
                          ))}
                        </ul>
                    </div>

                    <button onClick={onSignIn} className="w-full py-6 bg-white text-black rounded-full font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-2xl group-hover:scale-[1.02]">Sign Up by the Studio <ChevronRight size={18}/></button>
                  </div>

               </div>
           </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default LandingView;
