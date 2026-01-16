
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, DollarSign, Zap, ShieldCheck, 
  ShoppingCart, Box, ChevronRight, Settings, Calendar,
  History, MessageSquarePlus, Camera, UserPlus, Wand2, Search, Filter,
  Plus, Crown
} from 'lucide-react';

interface WalkthroughProps {
  onComplete: () => void;
  show: boolean;
}

const STEPS = [
  {
    targetId: 'nav-inventory',
    route: '/pantry',
    title: '1. Your Kitchen List',
    description: "This shows you all the food you have at home. No more guessing what is in the back of the fridge!",
    benefit: "Stops you from buying things you already have.",
    icon: <Box size={18} className="text-primary-400" />
  },
  {
    targetId: 'pantry-add-btn',
    route: '/pantry',
    title: '2. Adding Food',
    description: "Tap this button when you buy new groceries to add them to your list.",
    benefit: "Keeps your digital list perfect.",
    icon: <Plus size={18} className="text-amber-400" />
  },
  {
    targetId: 'pantry-add-btn',
    route: '/pantry',
    title: '3. Scan Receipts',
    description: "You can even take a photo of your paper receipt! The app reads it and adds the food for you.",
    benefit: "Saves you from typing every item.",
    icon: <Camera size={18} className="text-primary-400" />
  },
  {
    targetId: 'nav-studio',
    route: '/studio', 
    title: '4. The Recipe Maker',
    description: "This part finds recipes you can cook using only the food you already have.",
    benefit: "Uses up food before it goes bad.",
    icon: <Sparkles size={18} className="text-indigo-400" />
  },
  {
    targetId: 'nav-calendar',
    route: '/calendar',
    title: '5. Weekly Plan',
    description: "Pick which recipes you want to eat for the next few days.",
    benefit: "No more stress about 'what is for dinner?'",
    icon: <Calendar size={18} className="text-rose-400" />
  },
  {
    targetId: 'nav-cart',
    route: '/shopping',
    title: '6. The Shopping Cart',
    description: "This is your smart list. It knows exactly what you are missing for your planned meals.",
    benefit: "Only buy what you actually need.",
    icon: <ShoppingCart size={18} className="text-emerald-400" />
  },
  {
    targetId: 'orchestrate-manifest-section',
    route: '/shopping',
    title: '7. AI Grocery Helper',
    description: "Type something like '5 cheap dinners' and the app will build the whole list for you.",
    benefit: "Like a personal helper for your shopping.",
    icon: <Wand2 size={18} className="text-primary-400" />
  },
  {
    targetId: 'cart-view-toggles',
    route: '/shopping',
    title: '8. One-Tap Reorder',
    description: "Look at your old grocery trips and buy the same milk or eggs again with one tap.",
    benefit: "Saves a lot of time every week.",
    icon: <History size={18} className="text-sky-400" />
  },
  {
    targetId: 'nav-settings',
    route: '/settings',
    title: '9. Your Palate',
    description: "Tell the app what you like, what you hate, and if you have any allergies.",
    benefit: "Recipes get better as the app learns your taste.",
    icon: <Settings size={18} className="text-slate-400" />
  },
  {
    targetId: 'nav-inventory',
    route: '/pantry',
    title: '10. Fast Search',
    description: "Use this to quickly find a specific item in your big food list.",
    benefit: "Find things fast in a crowded pantry.",
    icon: <Search size={18} className="text-primary-400" />
  },
  {
    targetId: 'nav-go-pro',
    route: '/pantry',
    title: '11. Go Pro Upgrade',
    description: "Click here to unlock the full power. Get unlimited recipes and better AI scanning.",
    benefit: "The ultimate tool for a perfect kitchen.",
    icon: <Crown size={18} className="text-amber-500" />
  },
  {
    targetId: 'nav-chat-trigger',
    route: '/pantry',
    title: '12. Chef Chat',
    description: "Stuck while cooking? Tap the bubble to chat with the AI Chef anytime.",
    benefit: "Get instant cooking help and tips.",
    icon: <MessageSquarePlus size={18} className="text-white" />
  },
  {
    targetId: 'nav-signup-btn',
    route: '/pantry',
    title: '13. Save Your List',
    description: "Don't forget to sign up for free! It keeps your list safe so you don't lose it.",
    benefit: "Access your food list from any phone.",
    icon: <UserPlus size={18} className="text-primary-500" />
  },
  {
    targetId: 'main-header-auth-zone',
    route: '/pantry',
    title: '14. You Are All Set!',
    description: "You are ready to go! Start by adding some food or picking a recipe to save money.",
    benefit: "Welcome to a smarter kitchen.",
    icon: <ShieldCheck size={18} className="text-emerald-500" />
  }
];

export const Walkthrough: React.FC<WalkthroughProps> = ({ onComplete, show }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const currentStep = STEPS[currentStepIndex];

  useEffect(() => {
    const seen = localStorage.getItem('ks_onboarding_final_seen');
    if (seen === 'true' && show) {
        onComplete();
        return;
    }

    if (show && location.pathname !== currentStep.route) {
        setIsReady(false);
        navigate(currentStep.route);
    }
  }, [show, currentStepIndex, currentStep.route, navigate, location.pathname]);

  useEffect(() => {
    if (show && location.pathname === currentStep.route) {
      const updateRect = () => {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0) {
            setTargetRect(rect);
            setIsReady(true);
          }
        }
      };

      const timer = setInterval(updateRect, 100);
      const el = document.getElementById(currentStep.targetId);
      if (el && 'ResizeObserver' in window) {
        resizeObserver.current = new ResizeObserver(updateRect);
        resizeObserver.current.observe(document.body);
      }

      window.addEventListener('resize', updateRect);
      return () => {
          clearInterval(timer);
          window.removeEventListener('resize', updateRect);
          if (resizeObserver.current) resizeObserver.current.disconnect();
      };
    }
  }, [show, currentStepIndex, currentStep.targetId, location.pathname]);

  if (!show) return null;

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setIsReady(false);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      localStorage.setItem('ks_onboarding_final_seen', 'true');
      onComplete();
    }
  };

  const skipTour = () => {
      localStorage.setItem('ks_onboarding_final_seen', 'true');
      onComplete();
  };

  const getTooltipStyle = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const padding = 16;
    const tooltipWidth = 320; 
    let left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, (targetRect.left + targetRect.width / 2) - tooltipWidth / 2));
    
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const top = spaceBelow > 380 ? targetRect.bottom + 25 : targetRect.top - 360;

    return { top: Math.max(padding, top), left, width: tooltipWidth };
  };

  return (
    <div className={`fixed inset-0 z-[9999] transition-opacity duration-300 pointer-events-none ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Visual Surround Surround/Spotlight Effect */}
      {targetRect && isReady && (
        <div 
            className="absolute transition-all duration-300 ease-out"
            style={{
                top: targetRect.top - 15,
                left: targetRect.left - 15,
                width: targetRect.width + 30,
                height: targetRect.height + 30,
                boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.9)', 
                borderRadius: '24px',
                border: '4px solid #b08d6a', 
                zIndex: 10,
                pointerEvents: 'none'
            }}
        >
            <div className="absolute inset-0 border border-white/20 rounded-[20px] animate-pulse-soft" />
        </div>
      )}

      <div 
        className={`absolute z-30 transition-all duration-500 ease-out pointer-events-auto ${isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
        style={getTooltipStyle()}
      >
        <div className="bg-[#0c1220] p-7 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                    <div className="bg-primary-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black italic shrink-0 shadow-lg">
                        {currentStepIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-black font-serif text-white uppercase tracking-tight italic leading-tight">{currentStep.title}</h3>
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl text-slate-500 shrink-0">
                        {currentStep.icon}
                    </div>
                </div>
                
                <p className="text-slate-300 text-[14px] font-medium leading-relaxed mb-6">
                    {currentStep.description}
                </p>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-7 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-0.5">Quick Fact</p>
                      <p className="text-[11px] font-bold text-white leading-tight italic">{currentStep.benefit}</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleNext}
                        className="w-full py-5 bg-white hover:bg-primary-500 hover:text-white text-slate-900 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-95"
                    >
                        {currentStepIndex === STEPS.length - 1 ? 'Start Saving!' : 'Next Step'} <ChevronRight size={16} />
                    </button>
                    <button onClick={skipTour} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-rose-500 transition-colors py-2 text-center">Stop the Guide</button>
                </div>

                <div className="mt-7 flex gap-1.5 justify-center">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStepIndex ? 'w-5 bg-primary-500' : 'w-2 bg-slate-800'}`} />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Walkthrough;
