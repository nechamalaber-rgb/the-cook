import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, ChevronRight, X,
  Box, Plus, Sparkles, ShoppingBag, Zap, UserPlus, ArrowUp, ArrowDown
} from 'lucide-react';
import { Logo } from './Logo';

interface WalkthroughProps {
  onComplete: () => void;
  show: boolean;
}

const STEPS = [
  {
    targetId: 'nav-inventory',
    route: '/pantry',
    title: 'Pantry',
    description: "This is your inventory. Keep it updated so we know what you can cook.",
    icon: <Box size={14} className="text-primary-400" />
  },
  {
    targetId: 'pantry-add-btn',
    route: '/pantry',
    title: 'Add Food',
    description: "Add ingredients here. You can even scan a receipt photo.",
    icon: <Plus size={14} className="text-emerald-400" />
  },
  {
    targetId: 'nav-studio',
    route: '/studio', 
    title: 'Recipes',
    description: "Our AI finds meals using only the items you already have.",
    icon: <Sparkles size={14} className="text-indigo-400" />
  },
  {
    targetId: 'init-logic-cycle-btn', 
    route: '/studio',
    title: 'Find Recipes',
    description: "Hit this to generate 4 fresh meal ideas instantly.",
    icon: <Zap size={14} className="text-amber-400" />
  },
  {
    targetId: 'nav-cart',
    route: '/shopping',
    title: 'Smart Cart',
    description: "Missing items from recipes are automatically listed here.",
    icon: <ShoppingBag size={14} className="text-rose-400" />
  },
  {
    targetId: 'nav-signup-btn',
    route: '/pantry',
    title: 'Join Free',
    description: "Create an account to save your kitchen and recipes.",
    icon: <UserPlus size={14} className="text-primary-500" />
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
    if (show && !showWelcome && location.pathname !== currentStep.route) {
        setIsReady(false);
        navigate(currentStep.route, { replace: true });
    }
  }, [show, showWelcome, currentStepIndex, currentStep.route, navigate, location.pathname, onComplete]);

  useEffect(() => {
    if (showWelcome || !show) return;

    const updateRect = () => {
      let el = document.getElementById(currentStep.targetId);
      
      if (!el && currentStepIndex === 3) {
           const buttons = document.getElementsByTagName('button');
           for(let i=0; i<buttons.length; i++) {
               if(buttons[i].textContent?.toLowerCase().includes('find recipes')) {
                   el = buttons[i];
                   break;
               }
           }
      }
      
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          setIsReady(true);
        }
      } else {
          setTargetRect(null);
          setIsReady(true);
      }
    };
    
    const timer = setTimeout(updateRect, 500);
    const interval = setInterval(updateRect, 1000);
    
    window.addEventListener('resize', updateRect);
    return () => {
        clearTimeout(timer);
        clearInterval(interval);
        window.removeEventListener('resize', updateRect);
    };
  }, [show, showWelcome, currentStepIndex, currentStep.targetId, location.pathname]);

  if (!show) return null;

  if (showWelcome) {
      return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-fade-in font-sans">
              <div className="bg-[#0c1220] max-w-sm w-full rounded-[3.5rem] p-10 border border-white/10 shadow-[0_50px_120px_rgba(0,0,0,1)] text-center relative overflow-hidden animate-slide-up">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[1.8rem] flex items-center justify-center text-primary-500 mb-8 border border-white/10 shadow-2xl rotate-3">
                          <Logo className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black font-serif text-white mb-4 italic tracking-tight leading-none">
                          Welcome home.
                      </h2>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-xs">
                          Prepzu is your AI kitchen assistant. Let's find your way around.
                      </p>
                      <div className="flex flex-col w-full gap-3">
                          <button 
                              onClick={() => setShowWelcome(false)}
                              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                          >
                              Quick Tour <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                          <button onClick={onComplete} className="py-2 text-slate-500 hover:text-white font-black text-[9px] uppercase tracking-[0.3em] transition-colors">Skip for now</button>
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
    
    const padding = 24;
    const cardHeight = 220;
    const cardWidth = 300;
    
    let top = targetRect.bottom + padding;
    let left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);

    // Flip to top if bottom is crowded
    if (top + cardHeight > window.innerHeight) {
        top = targetRect.top - cardHeight - padding;
    }
    
    // Contain within viewport
    left = Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, left));
    top = Math.max(padding, Math.min(window.innerHeight - cardHeight - padding, top));

    return { top, left, width: `${cardWidth}px`, position: 'fixed' as const };
  };

  return (
    <div className={`fixed inset-0 z-[9999] transition-opacity duration-500 pointer-events-none font-sans ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      {/* High-Contrast Laser Spotlight */}
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px]"
        style={{
            maskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.6}px, black ${Math.max(targetRect.width, targetRect.height) / 1.6 + 20}px)` : 'none',
            WebkitMaskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.6}px, black ${Math.max(targetRect.width, targetRect.height) / 1.6 + 20}px)` : 'none'
        }}
      />
      
      {/* Box and Cube Pointer */}
      {targetRect && (
        <>
            <div 
                className="absolute transition-all duration-500 border-2 border-white rounded-xl shadow-[0_0_50px_rgba(255,255,255,0.3)] z-50"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                }}
            />

            {/* Cube Pointer (Smaller and Precise) */}
            <div 
                className="absolute z-[60] transition-all duration-500 flex flex-col items-center gap-1"
                style={{
                    top: targetRect.top > 250 ? targetRect.top - 50 : targetRect.bottom + 10,
                    left: targetRect.left + (targetRect.width / 2) - 14,
                }}
            >
                {targetRect.top > 250 ? (
                    <div className="flex flex-col items-center animate-bounce">
                        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-2xl border border-white">
                            <Box size={14} />
                        </div>
                        <ArrowDown size={16} className="text-white drop-shadow-xl -mt-1" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-bounce">
                        <ArrowUp size={16} className="text-white drop-shadow-xl mb-0.5" />
                        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-2xl border border-white">
                            <Box size={14} />
                        </div>
                    </div>
                )}
            </div>
        </>
      )}

      {/* Nano Description Card */}
      <div 
        className="z-[100] transition-all duration-500 pointer-events-auto"
        style={getCardPosition() as any}
      >
        <div className="bg-[#0c1220] p-6 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,1)] border border-white/10 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-primary-400 border border-white/5 shrink-0">
                            {currentStep.icon}
                         </div>
                         <div>
                            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-primary-500 block mb-0.5">GUIDE {currentStepIndex + 1}/6</span>
                            <h3 className="text-xs font-black text-white uppercase tracking-wider">{currentStep.title}</h3>
                         </div>
                    </div>
                    <button onClick={onComplete} className="text-slate-600 hover:text-white transition-colors p-1"><X size={12} /></button>
                </div>

                <p className="text-slate-300 text-[10px] font-bold leading-relaxed italic border-l-2 border-primary-500/30 pl-3">
                    "{currentStep.description}"
                </p>

                <div className="pt-2 flex flex-col gap-2">
                     <button 
                        onClick={handleNext}
                        className="w-full py-3 bg-white text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {currentStepIndex === STEPS.length - 1 ? "Start Now" : "Next Item"} 
                        <ChevronRight size={12}/>
                    </button>
                    
                    <div className="flex justify-center gap-1 pt-1">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-0.5 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'w-5 bg-primary-500 shadow-[0_0_8px_rgba(176,141,106,0.4)]' : 'w-1 bg-slate-800'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Walkthrough;
