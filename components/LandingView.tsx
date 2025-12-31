
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Calendar, ShoppingCart, ScanLine, Utensils, HeartHandshake, Crown, Check, ChevronRight, Brain, Zap, Layers, CreditCard, AlertCircle, ChefHat } from 'lucide-react';
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
    // Trigger initial load animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#000000] text-white font-sans selection:bg-primary-900 selection:text-primary-100 min-h-screen overflow-x-hidden">
      {/* Dynamic Header */}
      <header className={`fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl z-[100] px-6 md:px-12 flex items-center justify-between border-b border-white/10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/20">
                <Logo className="w-7 h-7" />
              </div>
              <span className="font-serif font-black text-2xl text-white tracking-tight">GatherHome</span>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">Home</button>
              <button onClick={() => scrollToSection('philosophy')} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">Philosophy</button>
              <button onClick={() => scrollToSection('workflow')} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-[13px] font-bold text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">Plans</button>
          </nav>
          <div className="flex items-center gap-4">
              {!currentUser ? (
                  <button onClick={onSignIn} className="px-6 py-2.5 bg-white text-black rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-200 transition-all">Sign In</button>
              ) : (
                  <button onClick={onSignOut} className="px-6 py-2.5 bg-white/10 text-white border border-white/10 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-white/20 transition-all">Log Out</button>
              )}
          </div>
      </header>

      {/* Hero Section */}
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
            
            <h1 className={`text-6xl md:text-8xl font-serif font-light leading-[1.1] mb-10 tracking-tight transition-all duration-1000 delay-500 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                Master your kitchen. <br/>
                <span className="italic font-normal text-primary-400">Intelligently.</span>
            </h1>
            
            <p className={`text-xl md:text-2xl text-slate-400 max-w-2xl mb-12 font-light leading-relaxed transition-all duration-1000 delay-700 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Transform your chaotic pantry into a stream of culinary consciousness. Synchronize inventory, curate menus, and orchestrate meals with master chef precision.
            </p>

            <div className={`flex flex-col sm:flex-row gap-5 justify-center md:justify-start transition-all duration-1000 delay-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <button 
                  onClick={onStart}
                  className="px-10 py-5 bg-primary-500 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  Launch Studio <ArrowRight size={22} />
                </button>
                <button 
                  onClick={() => scrollToSection('philosophy')}
                  className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-lg backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  Our Philosophy
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY SECTION (WHY WE MADE IT) */}
      <section id="philosophy" className="py-32 bg-[#0a0a0a] border-t border-white/5 relative">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
              <ScrollReveal>
                  <div className="mb-12">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 text-primary-500">
                        <ChefHat size={32} />
                      </div>
                      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-500 mb-6">The Problem Space</h2>
                      <h3 className="text-4xl md:text-5xl font-black font-serif text-white tracking-tighter mb-8">Cooking is an art.<br/>Logistics is a chore.</h3>
                      <p className="text-slate-400 text-xl leading-relaxed font-light">
                        We built GatherHome because the modern kitchen is disconnected. The joy of creating food is constantly interrupted by the friction of management: tracking expiry dates, remembering what you bought, and deciding what to make. 
                      </p>
                  </div>
              </ScrollReveal>
              
              <ScrollReveal delay={200}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 text-left">
                      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <AlertCircle size={32} className="text-rose-500 mb-6" />
                          <h4 className="text-xl font-bold text-white mb-4">The Mental Load</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">
                             "What's for dinner?" is the most stressful question of the day. It requires knowing your inventory, checking expiration dates, and matching ingredients to recipes in real-time. It's a data problem that humans aren't built to solve efficiently at 5:00 PM.
                          </p>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <Brain size={32} className="text-emerald-500 mb-6" />
                          <h4 className="text-xl font-bold text-white mb-4">The Solution</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">
                             GatherHome acts as your kitchen's operating system. It holds the state of your pantry in the cloud, uses AI to bridge the gap between "ingredients" and "meals," and automates the restocking process. We handle the data so you can handle the heat.
                          </p>
                      </div>
                  </div>
              </ScrollReveal>
          </div>
      </section>

      {/* HOW IT WORKS SECTION (REVERTED TO GRID) */}
      <section id="workflow" className="py-32 bg-black border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
              <ScrollReveal>
                  <div className="text-center mb-24">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-500 mb-4">The Operating Cycle</h2>
                      <h3 className="text-4xl md:text-6xl font-black font-serif text-white tracking-tighter">How GatherHome works.</h3>
                  </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                      { icon: <ScanLine size={32} />, color: 'text-primary-500', bg: 'bg-primary-500/10', step: '01', title: 'Digitize', desc: 'Snap a photo of receipts or shelves. Vision AI catalogs ingredients instantly.' },
                      { icon: <Utensils size={32} />, color: 'text-orange-500', bg: 'bg-orange-500/10', step: '02', title: 'Curate', desc: 'AI finds the perfect intersection of what you have and what you crave.' },
                      { icon: <Calendar size={32} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10', step: '03', title: 'Schedule', desc: 'Drag recipes into your week. Inventory is reserved automatically.' },
                      { icon: <ShoppingCart size={32} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', step: '04', title: 'Restock', desc: 'One-click export to Instacart or Walmart when staples run low.' }
                  ].map((item, idx) => (
                      <ScrollReveal key={idx} delay={idx * 150} className="relative group">
                          <div className="p-8 rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all duration-300 h-full">
                              <div className="flex justify-between items-start mb-8">
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${item.bg} ${item.color}`}>
                                      {item.icon}
                                  </div>
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.step}</span>
                              </div>
                              <h4 className="text-2xl font-black font-serif mb-4 text-white group-hover:text-primary-500 transition-colors">{item.title}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.desc}</p>
                          </div>
                      </ScrollReveal>
                  ))}
              </div>
          </div>
      </section>

      {/* MISSION SECTION */}
      <section id="mission" className="py-32 bg-[#0a0a0a] relative overflow-hidden">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
                <div className="inline-flex items-center justify-center p-4 bg-primary-500/10 text-primary-500 rounded-2xl mb-8">
                    <HeartHandshake size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black font-serif mb-10 text-white leading-tight">Eliminating the "5:00 PM Panic"</h2>
                <p className="text-xl md:text-2xl text-slate-400 leading-relaxed font-light mb-12">
                    The mental load of managing a kitchen is massive. We built GatherHome to turn decision-making into a moment of culinary inspiration. No more staring at a full fridge wondering what to make—our OS tells you exactly what's possible.
                </p>
                <div className="h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
            </div>
          </ScrollReveal>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 bg-black border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
           <ScrollReveal>
               <div className="mb-20">
                  <h2 className="text-4xl md:text-6xl font-black font-serif mb-6">Complete Access</h2>
                  <p className="text-slate-400 text-lg">One unified plan for the modern culinary studio.</p>
               </div>
           </ScrollReveal>

           <ScrollReveal delay={200}>
               <div className="max-w-md mx-auto p-12 rounded-[3rem] border border-primary-500/50 bg-primary-950/20 relative overflow-hidden text-left shadow-2xl group hover:border-primary-500 transition-colors duration-500">
                  <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-bl-[2rem] shadow-lg">Studio Pro</div>
                  <div className="mb-10 p-4 bg-primary-500 w-fit rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><Crown size={32}/></div>
                  <h3 className="text-3xl font-bold mb-2">Full Subscription</h3>
                  <div className="text-5xl font-serif mb-10">$9.99 <span className="text-sm font-sans text-slate-500 uppercase tracking-widest">/ month</span></div>
                  <ul className="space-y-5 mb-12 text-slate-300 text-sm font-medium">
                     <li className="flex items-center gap-4"><Check size={20} className="text-primary-400"/> Unlimited AI Recipe Curation</li>
                     <li className="flex items-center gap-4"><Check size={20} className="text-primary-400"/> Visual Inventory Scanning</li>
                     <li className="flex items-center gap-4"><Check size={20} className="text-primary-400"/> Automated Shopping Logistics</li>
                     <li className="flex items-center gap-4"><Check size={20} className="text-primary-400"/> Smart Planner & Meal Logs</li>
                     <li className="flex items-center gap-4"><Check size={20} className="text-primary-400"/> Priority Support</li>
                  </ul>
                  <button onClick={onSignIn} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-xl">Start Journey <ChevronRight size={18}/></button>
               </div>
           </ScrollReveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 bg-black border-t border-white/10 text-center">
          <div className="flex flex-col items-center gap-6">
              <Logo className="w-14 h-14 text-primary-500" />
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">GatherHome Intelligence © 2025</p>
          </div>
      </footer>
    </div>
  );
};

export default LandingView;
