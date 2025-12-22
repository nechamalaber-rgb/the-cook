import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Download, Play, Save, Calendar, ShoppingCart, LayoutGrid, CheckCircle2, ArrowDownCircle, User, Sparkles, Zap, Brain, ShieldCheck, ChefHat, Diamond, Crown, Check, Gift } from 'lucide-react';
import { Logo } from './Logo';

interface LandingViewProps {
  onStart: () => void;
  onSignIn: () => void;
  currentUser: string | null;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart, onSignIn, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'curate' | 'plan' | 'replenish'>('curate');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClaimTrial = () => {
    if (currentUser) {
      onStart();
    } else {
      onSignIn();
    }
  };

  const featureShowcase = {
    sync: {
      title: "Real-time Pantry Intelligence",
      description: "Stop manual tracking. Snap a photo of your receipt or shelf, and let our vision AI catalogue your ingredients, track expiry dates, and suggest which items to use first to eliminate waste.",
      cta: "EXPLORE PANTRY SYNC",
      image: "https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&w=1200&q=80",
      accent: "text-primary-500",
      icon: <Zap size={24} />
    },
    curate: {
      title: "AI-Curated Culinary Experiences",
      description: "Our proprietary Chef Gemini engine designs bespoke menus based exactly on what you have. It respects your dietary goals, favorite cuisines, and even your cooking skill level for a perfect result every time.",
      cta: "DESIGN YOUR MENU",
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
      accent: "text-accent-600",
      icon: <Brain size={24} />
    },
    plan: {
      title: "Seamless Schedule Integration",
      description: "Life is busy; dinner shouldn't be. Drag and drop your AI-generated recipes onto your personal culinary calendar. Sync your family's schedule so everyone knows exactly what's for dinner.",
      cta: "VIEW THE PLANNER",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80",
      accent: "text-blue-600",
      icon: <Calendar size={24} />
    },
    replenish: {
      title: "Smart Procurement & Logistics",
      description: "Never run out of staples again. Savor Studio automatically identifies missing ingredients for your planned meals and populates a smart shopping list that exports directly to grocery services.",
      cta: "AUTOMATE SHOPPING",
      image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1200&q=80",
      accent: "text-emerald-600",
      icon: <ShoppingCart size={24} />
    }
  };

  const currentFeature = featureShowcase[activeTab];

  return (
    <div className="bg-[#faf9f6] text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl z-[100] px-6 md:px-12 flex items-center justify-between border-b border-slate-200/50">
          <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary-400 rounded-xl text-white shadow-lg shadow-primary-400/20">
                <Logo className="w-7 h-7" />
              </div>
              <span className="font-serif font-black text-2xl text-slate-900 tracking-tight">Savor Studio</span>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-[13px] font-bold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest">Home</button>
              <button onClick={() => scrollToSection('features')} className="text-[13px] font-bold text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-colors uppercase tracking-widest">Capabilities <ChevronDown size={14} /></button>
              <button onClick={() => scrollToSection('pricing')} className="text-[13px] font-bold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest">Pricing</button>
          </nav>
          <div className="flex items-center gap-4">
              <button 
                onClick={currentUser ? onStart : onSignIn}
                className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest px-4"
              >
                  {currentUser ? 'Dashboard' : 'Sign In'}
              </button>
              <button 
                onClick={onStart}
                className="hidden md:block px-7 py-3 bg-primary-950 text-white rounded-xl font-bold text-[13px] tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
              >
                  Start Studio
              </button>
          </div>
      </header>

      {/* Reimagined Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=2400&q=80" 
            className="w-full h-full object-cover grayscale-[20%]"
            alt="Culinary Studio"
          />
          <div className="absolute inset-0 bg-slate-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/90 via-slate-900/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-400/20 backdrop-blur-md rounded-full border border-primary-400/30 mb-8 animate-fade-in">
              <Gift size={16} className="text-primary-300" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary-50">3-Day Free Trial Available</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif font-light leading-[1] mb-10 animate-slide-up tracking-tight">
              Master your kitchen. <br/>
              <span className="italic font-normal text-primary-300">Effortlessly.</span>
            </h1>
            
            <p className="text-xl md:text-2xl font-light leading-relaxed mb-14 opacity-90 max-w-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
              Savor Studio transforms your pantry from a storage space into a creative palette. Reduce waste, save time, and cook with professional-grade intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-10 py-5 bg-white text-primary-950 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-slate-100 transition-all uppercase tracking-[0.2em] text-xs shadow-2xl group"
              >
                Launch Studio <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={handleClaimTrial}
                className="w-full sm:w-auto px-10 py-5 bg-primary-400/20 backdrop-blur-xl text-white border border-white/20 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-white/20 transition-all uppercase tracking-[0.2em] text-xs"
              >
                Claim Free Trial <Sparkles size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Floating AI Indicators */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden xl:block w-80 space-y-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
            {[
                { label: 'Vision AI', val: 'Detecting Expiry', color: 'bg-emerald-500' },
                { label: 'Chef Engine', val: 'Curating 6 Recipes', color: 'bg-accent-500' },
                { label: 'Pantry Sync', val: 'Inventory Optimized', color: 'bg-primary-400' }
            ].map((item, i) => (
                <div key={i} className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center gap-4 group hover:bg-white/10 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${item.color} animate-pulse`}></div>
                    <div>
                        <div className="text-[10px] font-black uppercase text-white/50 tracking-widest">{item.label}</div>
                        <div className="text-sm font-bold text-white">{item.val}</div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-600 mb-6 block">The Savor Stack</span>
                <h2 className="text-4xl md:text-6xl font-serif text-slate-900 mb-6 leading-tight">Culinary intelligence <br/> redefined.</h2>
                <div className="w-20 h-1 bg-primary-400 mx-auto rounded-full"></div>
            </div>

            {/* AI-First Tab System */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
                {Object.keys(featureShowcase).map((key) => (
                    <button 
                        key={key}
                        onClick={() => setActiveTab(key as any)}
                        className={`px-6 py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] transition-all uppercase border-2 ${
                            activeTab === key 
                            ? 'bg-primary-950 border-primary-950 text-white shadow-2xl scale-105' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-primary-100 hover:text-primary-900'
                        }`}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* Feature Content Block */}
            <div className="bg-white rounded-[4rem] p-10 md:p-24 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.08)] border border-slate-100/50 flex flex-col lg:flex-row items-center gap-20 text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-50 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
                
                <div className="flex-1 relative z-10">
                    <div className={`w-16 h-16 rounded-[1.5rem] ${currentFeature.accent} bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 shadow-sm`}>
                        {currentFeature.icon}
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight font-serif">
                        {currentFeature.title}
                    </h3>
                    <p className="text-xl text-slate-500 mb-12 leading-relaxed font-light">
                        {currentFeature.description}
                    </p>
                    <button 
                      onClick={onStart}
                      className="inline-flex items-center gap-5 text-[11px] font-black tracking-[0.3em] text-primary-900 uppercase group"
                    >
                        {currentFeature.cta} <div className="p-2 bg-primary-950 text-white rounded-full group-hover:bg-primary-400 transition-colors"><ArrowRight size={18} /></div>
                    </button>
                </div>
                
                <div className="flex-1 w-full relative z-10">
                    <div className="aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl relative group border-[12px] border-slate-50/50">
                        <img src={currentFeature.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={activeTab} />
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-grayscale-[0.5] group-hover:backdrop-grayscale-0 transition-all duration-700"></div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 px-6 bg-primary-50/50">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-600 mb-6 block">Membership Plans</span>
                  <h2 className="text-4xl md:text-6xl font-serif text-slate-900 mb-6 leading-tight">Investment in your <br/> lifestyle.</h2>
                  <p className="text-slate-500 font-medium max-w-xl mx-auto mb-10">Flexible plans designed for the modern home cook, from essentials to executive access.</p>
                  
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-primary-200 rounded-2xl shadow-sm">
                      <Sparkles size={18} className="text-primary-500" />
                      <span className="text-sm font-bold text-slate-700">Start with a 3-Day Free Trial on any plan</span>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Studio Pro */}
                  <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden flex flex-col h-full">
                      <div className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                              <Diamond className="text-primary-500" size={20} />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Essential Studio</span>
                          </div>
                          <h3 className="text-3xl font-black mb-2 font-serif text-slate-900">Studio Pro</h3>
                          <div className="text-4xl font-black text-primary-600 mb-4">$10.99<span className="text-sm font-bold text-slate-400">/mo</span></div>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Perfect for individuals looking to optimize their daily meal routine.</p>
                      </div>
                      
                      <ul className="space-y-4 mb-12 flex-1">
                          {[
                              "Advanced AI Menu Generation",
                              "Unlimited Inventory Storage",
                              "Basic Expiry Tracking",
                              "Smart Shopping List Export",
                              "Personal Culinary Calendar"
                          ].map(benefit => (
                              <li key={benefit} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                  <div className="w-5 h-5 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
                                      <Check size={12} strokeWidth={4} />
                                  </div>
                                  {benefit}
                              </li>
                          ))}
                      </ul>

                      <button onClick={handleClaimTrial} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                          Start 3-Day Free Trial
                      </button>
                  </div>

                  {/* Master Studio */}
                  <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl transition-all relative overflow-hidden flex flex-col h-full group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                      
                      <div className="mb-8 relative z-10">
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                  <Crown className="text-primary-300" size={20} fill="currentColor" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-300">Executive Experience</span>
                              </div>
                              <span className="bg-primary-400 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Most Popular</span>
                          </div>
                          <h3 className="text-3xl font-black mb-2 font-serif text-white">Master Studio</h3>
                          <div className="text-4xl font-black text-primary-300 mb-4">$19.99<span className="text-sm font-bold opacity-50">/mo</span></div>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed">The ultimate toolkit for the culinary enthusiast. Advanced techniques and visuals.</p>
                      </div>
                      
                      <ul className="space-y-4 mb-12 flex-1 relative z-10">
                          {[
                              "Unlimited 4K AI Food Photography",
                              "Pro-active Inventory Management",
                              "Unlimited Guest Profiles",
                              "Voice-Guided Professional Mode",
                              "Executive Masterclass Culinary Tips",
                              "VIP Support & Early Feature Access"
                          ].map(benefit => (
                              <li key={benefit} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                  <div className="w-5 h-5 rounded-full bg-white/5 text-primary-400 flex items-center justify-center shrink-0">
                                      <Check size={12} strokeWidth={4} />
                                  </div>
                                  {benefit}
                              </li>
                          ))}
                      </ul>

                      <button onClick={handleClaimTrial} className="w-full py-5 bg-primary-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary-400/20 hover:bg-primary-300 transition-all active:scale-95 relative z-10">
                          Start 3-Day Free Trial
                      </button>
                  </div>
              </div>
              
              <p className="text-center mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Cancel anytime during your trial. Sign up today to start your journey.
              </p>
          </div>
      </section>

      {/* Narrative Section */}
      <section className="py-32 px-6 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
              <div className="p-4 bg-white/5 rounded-full inline-flex mb-12">
                <ChefHat size={40} className="text-primary-300" />
              </div>
              <h2 className="text-4xl md:text-5xl font-serif mb-12 leading-tight italic font-light opacity-95">
                "Savor Studio has completely changed how we handle our groceries. We've cut our waste in half and actually enjoy planning dinner now."
              </h2>
              <div className="flex flex-col items-center">
                <div className="w-12 h-0.5 bg-primary-400 mb-4"></div>
                <p className="font-black text-white/40 tracking-[0.4em] uppercase text-[10px]">Sarah M. — Executive Chef & Mother</p>
              </div>
          </div>
      </section>

      {/* CTA Final Invitation */}
      <section className="py-48 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary-50 opacity-30"></div>
          <div className="max-w-3xl mx-auto relative z-10">
              <h2 className="text-5xl md:text-7xl font-serif mb-10 leading-tight text-slate-900">Your kitchen is ready for its upgrade.</h2>
              <p className="text-xl md:text-2xl mb-16 text-slate-500 font-light max-w-2xl mx-auto">Join a community of home chefs who have modernized their meal planning with professional AI.</p>
              <button 
                onClick={handleClaimTrial}
                className="px-16 py-6 bg-primary-950 text-white rounded-2xl font-black text-xl uppercase tracking-[0.2em] hover:bg-slate-800 hover:scale-105 transition-all shadow-2xl shadow-primary-950/20 active:scale-95"
              >
                  Claim Your 3-Day Trial
              </button>
          </div>
      </section>
      
      {/* Footer Design */}
      <footer className="bg-white py-24 px-6 border-t border-slate-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
              <div className="max-w-xs">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-1.5 bg-primary-950 rounded-lg text-white">
                        <Logo className="w-6 h-6" />
                      </div>
                      <span className="font-serif font-black text-2xl text-slate-900">Savor Studio</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Advanced culinary intelligence designed to help you live better, waste less, and cook smarter.
                  </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
                  <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-6">Product</h4>
                      <div className="flex flex-col gap-4 text-sm font-bold text-slate-400">
                          <button onClick={() => scrollToSection('features')} className="text-left hover:text-primary-600 transition-colors">Vision AI</button>
                          <button onClick={() => scrollToSection('features')} className="text-left hover:text-primary-600 transition-colors">Chef Engine</button>
                          <button onClick={() => scrollToSection('features')} className="text-left hover:text-primary-600 transition-colors">Integrations</button>
                          <button onClick={() => scrollToSection('pricing')} className="text-left hover:text-primary-600 transition-colors">Pricing</button>
                      </div>
                  </div>
                  <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-6">Company</h4>
                      <div className="flex flex-col gap-4 text-sm font-bold text-slate-400">
                          <a href="#" className="hover:text-primary-600 transition-colors">About</a>
                          <a href="#" className="hover:text-primary-600 transition-colors">Intelligence</a>
                          <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
                          <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
                      </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-6">Subscribe</h4>
                      <div className="flex">
                          <input type="email" placeholder="Email" className="bg-slate-50 border border-slate-100 rounded-l-xl px-4 py-2.5 text-sm outline-none w-full" />
                          <button className="bg-primary-950 text-white rounded-r-xl px-4 py-2.5"><ArrowRight size={18} /></button>
                      </div>
                  </div>
              </div>
          </div>
          <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-[10px] text-slate-300 font-black tracking-widest uppercase">
                  &copy; {new Date().getFullYear()} SAVOR STUDIO AI STUDIOS. ALL RIGHTS RESERVED.
              </div>
              <div className="flex gap-8">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary-600 cursor-pointer transition-colors">
                      <div className="w-4 h-4 bg-current rounded-sm"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary-600 cursor-pointer transition-colors">
                      <div className="w-4 h-4 bg-current rounded-full"></div>
                  </div>
              </div>
          </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default LandingView;