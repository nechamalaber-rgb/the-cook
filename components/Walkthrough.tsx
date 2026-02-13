
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, ChevronRight, X,
  Plus, Sparkles, ShoppingBag, Zap, Calendar, 
  MousePointer2, Search, Utensils, ClipboardList, 
  RefreshCw, UserPlus, Globe
} from 'lucide-react';
import { Logo } from './Logo';

interface WalkthroughProps {
  onComplete: () => void;
  show: boolean;
}

const STEPS = [
  {
    targetId: 'pantry-add-btn',
    route: '/pantry',
    title: 'STOCK THE PANTRY',
    description: "Start by logging your current inventory. You can use your camera or type items manually to build your manifest.",
    icon: <Plus size={16} className="text-emerald-400" />
  },
  {
    targetId: 'pantry-search-box',
    route: '/pantry',
    title: 'SEARCH & FILTER',
    description: "Manage thousands of items instantly. Our engine categorizes everything by Produce, Dairy, Protein, and more.",
    icon: <Search size={16} className="text-sky-400" />
  },
  {
    targetId: 'nav-studio',
    route: '/pantry', 
    title: 'ENTER THE STUDIO',
    description: "Once your food is logged, the Studio becomes your command center for culinary creation.",
    icon: <Sparkles size={16} className="text-indigo-400" />
  },
  {
    targetId: 'studio-request-box', 
    route: '/studio',
    title: 'AI REQUEST ENGINE',
    description: "Tell the chef what you're in the mood for. AI will look at your pantry and design a recipe that matches your craving.",
    icon: <ClipboardList size={16} className="text-amber-400" />
  },
  {
    targetId: 'studio-curate-btn', 
    route: '/studio',
    title: 'START CURATION',
    description: "The 'Curation Cycle' analyzes every item in your inventory to design 4 gourmet meals simultaneously.",
    icon: <Zap size={16} className="text-primary-400" />
  },
  {
    targetId: 'nav-calendar',
    route: '/studio',
    title: 'MEAL PLANNER',
    description: "Take the stress out of your week. Use the calendar to schedule your curated meals and track nutrition.",
    icon: <Calendar size={16} className="text-rose-400" />
  },
  {
    targetId: 'planner-generate-btn',
    route: '/calendar',
    title: 'WEEKLY GENERATION',
    description: "One tap designs an entire week of dinners based on what you already have, minimizing food waste.",
    icon: <RefreshCw size={16} className="text-indigo-400" />
  },
  {
    targetId: 'nav-cart',
    route: '/calendar',
    title: 'THE SUPPLY CHAIN',
    description: "Items missing for your planned meals appear here. Your shopping list is built automatically as you plan.",
    icon: <ShoppingBag size={16} className="text-sky-400" />
  },
  {
    targetId: 'cart-walmart-sync',
    route: '/shopping',
    title: 'LOGISTICS SYNC',
    description: "Sync your cart directly with Walmart or Instacart to replenish your kitchen with professional efficiency.",
    icon: <Globe size={16} className="text-emerald-400" />
  },
  {
    targetId: 'nav-signup-btn',
    route: '/shopping',
    title: 'JOIN THE MANIFEST',
    description: "Finally, create your free account to secure your data and sync your kitchen across all your devices.",
    icon: <UserPlus size={16} className="text-primary-500" />
  }
];

export const Walkthrough: React.FC<WalkthroughProps> = ({ onComplete, show }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);

  const currentStep = STEPS[currentStepIndex];

  useEffect(() => {
    const seen = localStorage.getItem('ks_onboarding_final_seen');
    if (seen === 'true' && show) {
        onComplete();
        return;
    }
  }, [show, onComplete]);

  // Handle route management for steps
  useEffect(() => {
    if (!currentStep || !show || showWelcome) return;
    if (location.pathname !== currentStep.route) {
        setIsReady(false);
        navigate(currentStep.route, { replace: true });
    }
  }, [show, showWelcome, currentStepIndex, currentStep?.route, navigate, location.pathname]);

  // Spotlight Refinement Logic
  useEffect(() => {
    if (showWelcome || !show || !currentStep) return;

    const findTarget = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          setIsReady(true);
          return;
        }
      }
      setTargetRect(null);
      setIsReady(true);
    };
    
    const timer = setTimeout(findTarget, 600); // Wait for transition
    const interval = setInterval(findTarget, 1500); // Polish tracking
    
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);
    return () => {
        clearTimeout(timer);
        clearInterval(interval);
        window.removeEventListener('resize', findTarget);
        window.removeEventListener('scroll', findTarget);
    };
  }, [show, showWelcome, currentStepIndex, currentStep?.targetId, location.pathname]);

  if (!show) return null;

  if (showWelcome) {
      return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-fade-in font-sans">
              <div className="bg-[#0c1220] max-w-sm w-full rounded-[3.5rem] p-10 border border-white/10 shadow-[0_50px_120px_rgba(0,0,0,1)] text-center relative overflow-hidden animate-slide-up">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[1.8rem] flex items-center justify-center text-primary-500 mb-8 border border-white/10 shadow-2xl rotate-3">
                          <Logo className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl font-black font-serif text-white mb-4 italic tracking-tight leading-none">
                          Ready, Chef?
                      </h2>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-xs">
                          Let's explore your new kitchen intelligence. Follow the light and learn how to orchestrate your inventory.
                      </p>
                      <div className="flex flex-col w-full gap-3">
                          <button 
                              onClick={() => setShowWelcome(false)}
                              className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                          >
                              START TOUR <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                          <button onClick={onComplete} className="py-2 text-slate-500 hover:text-white font-black text-[9px] uppercase tracking-[0.3em] transition-colors">SKIP TUTORIAL</button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setIsReady(false);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      localStorage.setItem('ks_onboarding_final_seen', 'true');
      onComplete();
    }
  };

  const getCardPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const cardWidth = 340;
    const padding = 50;
    
    let top = targetRect.bottom + padding;
    let left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);

    // Swap to top if too low
    if (top + 280 > window.innerHeight) {
        top = targetRect.top - 280 - padding;
    }
    
    left = Math.max(20, Math.min(window.innerWidth - cardWidth - 20, left));
    top = Math.max(20, Math.min(window.innerHeight - 280 - 20, top));

    return { top, left, width: `${cardWidth}px`, position: 'fixed' as const };
  };

  return (
    <div className={`fixed inset-0 z-[1000] transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect 
                x={targetRect.left - 15} 
                y={targetRect.top - 15} 
                width={targetRect.width + 30} 
                height={targetRect.height + 30} 
                rx="24" 
                fill="black" 
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2, 6, 23, 0.96)" mask="url(#spotlight-mask)" />
      </svg>
      
      {/* THE NEON SPOTLIGHT BORDER */}
      {targetRect && (
          <div 
            className="absolute pointer-events-none"
            style={{
                top: targetRect.top - 20,
                left: targetRect.left - 20,
                width: targetRect.width + 40,
                height: targetRect.height + 40,
                zIndex: 1001
            }}
          >
              <div className="w-full h-full border-[5px] border-primary-500 rounded-[2.5rem] shadow-[0_0_100px_rgba(176,141,106,0.8)] animate-pulse" />
          </div>
      )}

      {/* FLOATING INSTRUCTION CARD */}
      {currentStep && (
        <div 
            className="z-[1002] transition-all duration-700 pointer-events-auto"
            style={getCardPosition() as any}
        >
            <div className="bg-[#0c1220] p-8 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,1)] border border-white/10 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-primary-500 border border-white/5 shrink-0">
                            {currentStep.icon}
                        </div>
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary-500 block mb-0.5">PROTOCOL {currentStepIndex + 1}/10</span>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">{currentStep.title}</h3>
                        </div>
                    </div>

                    <p className="text-slate-300 text-xs font-bold leading-relaxed italic border-l-4 border-primary-500/40 pl-4 py-1">
                        {currentStep.description}
                    </p>

                    <div className="pt-4">
                        <button 
                            onClick={handleNext}
                            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                        >
                            {currentStepIndex === STEPS.length - 1 ? 'FINISH TOUR' : 'PROCEED'} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <div className="mt-6 flex gap-1 justify-center">
                            {STEPS.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'w-6 bg-primary-500' : 'w-1 bg-slate-800'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Walkthrough;
