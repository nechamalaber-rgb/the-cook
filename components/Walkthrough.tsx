
import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ChevronRight, X,
  Plus, Sparkles, ShoppingBag, Zap, Calendar, 
  Search, ClipboardList, 
  RefreshCw, UserPlus, Globe, Loader2,
  Wand2, MessageSquarePlus, ChefHat
} from 'lucide-react';
import { Logo } from './Logo';

interface WalkthroughProps {
  onComplete: () => void;
  show: boolean;
}

const STEPS = [
  // --- PANTRY PHASE ---
  {
    targetId: 'pantry-add-btn',
    route: '/pantry',
    title: 'ADD INGREDIENTS',
    description: "Start by populating your kitchen. Tap here to scan a receipt, paste a list, or add items manually.",
    icon: <Plus size={14} className="text-emerald-400" />
  },
  {
    targetId: 'pantry-search-box',
    route: '/pantry',
    title: 'CHECK INVENTORY',
    description: "Before you shop, search here to see if you already have what you need. Avoid buying duplicates.",
    icon: <Search size={14} className="text-sky-400" />
  },
  
  // --- STUDIO PHASE ---
  {
    targetId: 'nav-studio',
    route: '/pantry', // Highlighting nav while on pantry
    title: 'ENTER STUDIO',
    description: "Navigate to the Studio to transform your raw ingredients into professional recipes.",
    icon: <Sparkles size={14} className="text-indigo-400" />
  },
  {
    targetId: 'studio-request-box',
    route: '/studio', // Move to studio view
    title: 'CUSTOM REQUESTS',
    description: "Tell the AI exactly what you're craving (e.g., 'Spicy Asian dinner under 30 mins using chicken').",
    icon: <MessageSquarePlus size={14} className="text-pink-400" />
  },
  {
    targetId: 'studio-curate-btn',
    route: '/studio',
    title: 'GENERATE RECIPES',
    description: "Click here to let our algorithms design 4 unique recipes based on your pantry and profile settings.",
    icon: <Wand2 size={14} className="text-purple-400" />
  },

  // --- CALENDAR PHASE ---
  {
    targetId: 'nav-calendar',
    route: '/studio', // Highlighting nav while on studio
    title: 'PLANNER',
    description: "Switch to the Calendar to organize your meals for the week ahead.",
    icon: <Calendar size={14} className="text-orange-400" />
  },
  {
    targetId: 'planner-generate-btn',
    route: '/calendar', // Move to calendar
    title: 'AUTO-PLAN WEEK',
    description: "One click generates a full weekly meal plan (even Kosher compliant) using your inventory.",
    icon: <RefreshCw size={14} className="text-emerald-400" />
  },

  // --- SHOPPING PHASE ---
  {
    targetId: 'nav-cart',
    route: '/calendar', // Highlighting nav while on calendar
    title: 'SUPPLY CHAIN',
    description: "Manage your shopping list here. Missing recipe items are automatically added.",
    icon: <ShoppingBag size={14} className="text-blue-400" />
  },
  {
    targetId: 'orchestrate-manifest-section',
    route: '/shopping', // Move to shopping
    title: 'SMART MANIFEST',
    description: "Ask the AI to build a shopping list for specific needs (e.g., '5 vegan dinners for $50').",
    icon: <ChefHat size={14} className="text-white" />
  },
  {
    targetId: 'cart-walmart-sync',
    route: '/shopping',
    title: 'RETAIL SYNC',
    description: "Export your entire manifest to Walmart or Instacart for immediate delivery logistics.",
    icon: <Globe size={14} className="text-sky-500" />
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

  // Auto-navigate to correct route for step
  useEffect(() => {
    if (!currentStep || !show || showWelcome) return;
    if (location.pathname !== currentStep.route) {
        setIsReady(false);
        navigate(currentStep.route, { replace: true });
    }
  }, [show, showWelcome, currentStepIndex, currentStep?.route, navigate, location.pathname]);

  // Find target element
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
      // Even if not found immediately, we set ready to true to show the box (it will say "Identifying...")
      setIsReady(true);
    };
    
    // Check repeatedly in case of animations/loading
    const timer = setTimeout(findTarget, 300);
    const interval = setInterval(findTarget, 800);
    
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

  const handleSkip = () => {
    onComplete();
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setIsReady(false);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleSkip();
    }
  };

  const getCardPosition = () => {
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 260 : 300;
    
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: cardWidth, position: 'fixed' as const };
    
    const padding = 20;
    let top = targetRect.bottom + padding;
    let left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);

    // Keep within horizontal bounds
    left = Math.max(20, Math.min(window.innerWidth - cardWidth - 20, left));
    
    // Flip to top if not enough space below
    if (top + 200 > window.innerHeight) {
        top = targetRect.top - 200 - padding;
    }

    return { top, left, width: `${cardWidth}px`, position: 'fixed' as const };
  };

  if (showWelcome) {
      return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in font-sans">
              <div className="bg-[#0c1220] max-w-[340px] w-full rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-center animate-slide-up relative overflow-hidden">
                  <button onClick={handleSkip} className="absolute top-4 right-4 p-3 text-slate-400 hover:text-white bg-white/5 rounded-full transition-all z-20" title="Skip Intro">
                      <X size={20} />
                  </button>
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl flex items-center justify-center text-primary-500 mb-8 border border-white/10 shadow-2xl rotate-3">
                          <Logo className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl font-black font-serif text-white mb-3 italic tracking-tighter uppercase leading-none">Welcome to Prepzu.</h2>
                      <p className="text-slate-400 text-[11px] font-bold mb-10 uppercase tracking-widest leading-relaxed">Let's initialize your Studio Intelligence protocol.</p>
                      <div className="flex flex-col w-full gap-4">
                          <button 
                              onClick={() => setShowWelcome(false)}
                              className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 group shadow-xl hover:bg-primary-500 transition-all"
                          >
                              START TOUR <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                          <button onClick={handleSkip} className="py-2 text-slate-500 hover:text-white font-black text-[9px] uppercase tracking-[0.3em] transition-colors">DISMISS</button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className={`fixed inset-0 z-[1000] transition-opacity duration-500 ${isReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect 
                x={targetRect.left - 8} 
                y={targetRect.top - 8} 
                width={targetRect.width + 16} 
                height={targetRect.height + 16} 
                rx="16" 
                fill="black" 
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2, 6, 23, 0.85)" mask="url(#spotlight-mask)" />
      </svg>
      
      {targetRect && (
          <div 
            className="absolute pointer-events-none"
            style={{
                top: targetRect.top - 12,
                left: targetRect.left - 12,
                width: targetRect.width + 24,
                height: targetRect.height + 24,
                zIndex: 1001
            }}
          >
              <div className="w-full h-full border-2 border-primary-500 rounded-2xl shadow-[0_0_30px_rgba(176,141,106,0.4)] animate-pulse" />
          </div>
      )}

      {currentStep && (
        <div 
            className="z-[1002] transition-all duration-500 pointer-events-auto"
            style={getCardPosition() as any}
        >
            <div className="bg-[#0c1220] p-6 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden backdrop-blur-xl">
                <button onClick={handleSkip} className="absolute top-4 right-4 p-1 text-slate-600 hover:text-white transition-colors"><X size={16}/></button>
                <div className="relative z-10 flex flex-col h-full">
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-primary-500 border border-white/5 shrink-0 shadow-inner">
                                {currentStep.icon}
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1">{currentStep.title}</h3>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Step {currentStepIndex + 1} of {STEPS.length}</p>
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">
                            {targetRect ? currentStep.description : <span className="flex items-center gap-2 text-primary-400"><Loader2 size={12} className="animate-spin" /> Locating element...</span>}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={handleNext}
                            className="flex-1 py-4 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 group shadow-xl hover:bg-primary-50 hover:text-primary-900 active:scale-95 transition-all"
                        >
                            {currentStepIndex === STEPS.length - 1 ? 'FINISH' : 'NEXT'} <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Walkthrough;
    