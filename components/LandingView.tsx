
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Calendar, ShoppingCart, ScanLine, Utensils, HeartHandshake, Crown, Check, ChevronRight, Brain, Zap, Layers, CreditCard, AlertCircle, ChefHat, Star, Flame, Gift } from 'lucide-react';
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
              <span className="font-serif font-black text-lg md:text-2xl text-white tracking-tight">GatherHome</span>
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
                    <span className="hidden sm:inline">Start</span> 3-Day <span className="hidden sm:inline">Free</span> Trial
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
                      <p className="text-slate-400 text-xl leading-relaxed font-light">We built GatherHome because the modern kitchen is disconnected. The joy of creating food is constantly interrupted by the friction of management.</p>
                  </div>
              </ScrollReveal>
          </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 bg-[#050505] border-t border-white/5 text-center">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
           <ScrollReveal>
               <div className="mb-20">
                  <h2 className="text-4xl md:text-6xl font-black font-serif mb-6 tracking-tight">One Studio. <span className="text-primary-500">Dual Options.</span></h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">The exact same Studio experience, billed your way.</p>
               </div>
           </ScrollReveal>
           <ScrollReveal delay={200}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
                  <div className="flex flex-col p-10 md:p-12 rounded-[3rem] border border-white/10 bg-white/5 relative overflow-hidden text-left transition-all duration-500 hover:border-primary-500/40 group">
                    <div className="mb-10 p-4 bg-white/10 w-fit rounded-2xl text-slate-400 group-hover:text-white transition-colors"><Logo className="w-8 h-8" /></div>
                    <h3 className="text-3xl font-black font-serif mb-2 text-white">Monthly Pro</h3>
                    <p className="text-slate-400 text-[10px] mb-8 font-black uppercase tracking-widest">Flexible Billing</p>
                    <div className="text-5xl font-serif mb-10 text-white">$9.99 <span className="text-[10px] font-sans text-slate-500 uppercase tracking-widest">/ month</span></div>
                    <ul className="space-y-5 mb-12 text-slate-300 text-sm font-medium flex-1">
                       {studioFeatures.map((feat, i) => (
                           <li key={i} className="flex items-center gap-4"><Check size={18} className="text-primary-400"/> {feat}</li>
                       ))}
                    </ul>
                    <button onClick={onSignIn} className="w-full py-5 bg-white/10 border border-white/10 text-white rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3">Start Pro <ArrowRight size={18}/></button>
                  </div>
                  <div className="flex flex-col p-10 md:p-12 rounded-[3rem] border-2 border-primary-500 bg-primary-950/20 relative overflow-hidden text-left shadow-[0_0_80px_rgba(176,141,106,0.15)] transition-all duration-500 hover:shadow-[0_0_100px_rgba(176,141,106,0.25)] group">
                    <div className="absolute top-0 right-0 bg-primary-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-bl-[2rem] shadow-lg animate-pulse">Best Value</div>
                    <div className="mb-10 p-4 bg-primary-500 w-fit rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><Logo className="w-8 h-8" /></div>
                    <h3 className="text-3xl font-black font-serif mb-2 text-white">Yearly Elite</h3>
                    <p className="text-primary-400 text-[10px] mb-8 font-black uppercase tracking-widest flex items-center gap-2"><Flame size={14} className="animate-pulse" /> Complete Studio Savings</p>
                    <div className="mb-10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-serif text-white">$30.00</span>
                        <span className="text-slate-500 uppercase tracking-widest text-[10px] font-black font-sans">/ year</span>
                      </div>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-2">Save 75% • Only $2.50 / Month</p>
                    </div>
                    <ul className="space-y-5 mb-12 text-slate-100 text-sm font-medium flex-1">
                       {studioFeatures.map((feat, i) => (
                           <li key={i} className="flex items-center gap-4"><Check size={18} className="text-primary-400"/> {feat}</li>
                       ))}
                    </ul>
                    <button onClick={onSignIn} className="w-full py-6 bg-white text-black rounded-full font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-2xl">Claim Studio Offer <ChevronRight size={20}/></button>
                  </div>
               </div>
           </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default LandingView;
