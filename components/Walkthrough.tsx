
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowDown, ArrowUp, Sparkles, Info, UserPlus, HelpCircle } from 'lucide-react';

interface WalkthroughProps {
  onComplete: () => void;
  show: boolean;
}

const STEPS = [
  {
    targetId: 'nav-inventory',
    route: '/pantry',
    title: 'Your Digital Fridge',
    description: "Welcome! This is where you keep a list of all the food you have at home. It's like having your fridge on your phone so you always know what's inside!",
    position: 'bottom' as const
  },
  {
    targetId: 'pantry-add-btn',
    route: '/pantry',
    title: 'Adding Your Food',
    description: "Got new groceries? Tap this button to tell the robot what you bought. You can even take a photo of your receipt and the robot will read it for you. No typing needed!",
    position: 'bottom' as const
  },
  {
    targetId: 'nav-studio',
    route: '/pantry', 
    title: 'The Magic Recipe Room',
    description: "Tap here when you're hungry. Our Robot Chef looks at your list of food and tells you exactly what yummy dinners you can make right now. It chooses for you!",
    position: 'bottom' as const
  },
  {
    targetId: 'nav-cart',
    route: '/shopping',
    title: 'Your Shopping Basket',
    description: "This is your shopping list. If the robot sees you're missing an egg or a tomato for a recipe, it puts it here automatically so you don't forget to buy it.",
    position: 'bottom' as const
  },
  {
    targetId: 'orchestrate-manifest-section',
    route: '/shopping',
    title: 'The Smart Helper',
    description: "This is the best part! Just type 'I want 3 cheap dinners' here. The robot will find recipes AND put all the food you need into your basket. It's like a personal assistant!",
    position: 'top' as const
  },
  {
    targetId: 'cart-view-toggles',
    route: '/shopping',
    title: 'Stay Super Organized',
    description: "When you add items for a recipe, they stay grouped together here. You'll see exactly which food is for which dinner. It's super neat!",
    position: 'bottom' as const
  },
  {
    targetId: 'nav-inventory',
    route: '/pantry',
    title: 'No More Staring',
    description: "Never again will you stare at your fridge and wonder what to eat. The robot does the thinking, you do the cooking!",
    position: 'bottom' as const
  },
  {
    targetId: 'main-header-auth-zone',
    route: '/pantry',
    title: 'SIGN UP NOW!',
    description: "STOP! This is the most important part. Click here to make an account. If you don't, the robot will forget all your food when you close the app. Sign up now to save your kitchen!",
    position: 'bottom' as const
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
    // Force a strict check on local storage to never show if already seen
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

      const timer = setInterval(updateRect, 150);
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
    const padding = 20;
    const tooltipWidth = 360;
    let left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, (targetRect.left + targetRect.width / 2) - tooltipWidth / 2));
    
    let top;
    if (currentStep.position === 'bottom') {
      top = targetRect.bottom + 60;
      if (top + 300 > window.innerHeight) top = targetRect.top - 340;
    } else {
      top = targetRect.top - 340;
      if (top < padding) top = targetRect.bottom + 60;
    }

    return { top, left, width: tooltipWidth };
  };

  return (
    <div className={`fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300 pointer-events-none ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      
      {targetRect && isReady && (
        <>
            <div 
                className="absolute transition-all duration-300 ease-out"
                style={{
                    top: targetRect.top - 15,
                    left: targetRect.left - 15,
                    width: targetRect.width + 30,
                    height: targetRect.height + 30,
                    boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.9)',
                    borderRadius: '24px',
                    border: '5px solid #b08d6a',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}
            >
                <div className="absolute inset-0 bg-white/5 rounded-xl shadow-[inset_0_0_40px_rgba(255,255,255,0.3)]" />
            </div>

            <div 
                className="absolute z-20 transition-all duration-300 ease-out text-primary-400 drop-shadow-[0_0_20px_rgba(0,0,0,1)]"
                style={{
                    top: currentStep.position === 'bottom' ? targetRect.bottom + 15 : targetRect.top - 80,
                    left: targetRect.left + (targetRect.width / 2) - 24,
                }}
            >
                {currentStep.position === 'bottom' ? (
                    <ArrowUp size={56} className="animate-bounce" strokeWidth={4} />
                ) : (
                    <ArrowDown size={56} className="animate-bounce" strokeWidth={4} />
                )}
            </div>
        </>
      )}

      <div 
        className={`absolute z-30 transition-all duration-300 ease-out pointer-events-auto ${isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
        style={getTooltipStyle()}
      >
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.7)] border-4 border-primary-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><HelpCircle size={140} /></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-5 mb-6">
                    <div className="bg-primary-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">
                        {currentStepIndex + 1}
                    </div>
                    <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white uppercase tracking-tighter italic">{currentStep.title}</h3>
                </div>
                
                <p className="text-slate-700 dark:text-slate-100 text-lg font-bold leading-relaxed mb-12">
                    {currentStep.description}
                </p>
                
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={handleNext}
                        className="w-full py-6 bg-primary-600 hover:bg-primary-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 group active:scale-95"
                    >
                        {currentStepIndex === STEPS.length - 1 ? 'LET\'S COOK!' : 'GOT IT! NEXT!'} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button onClick={skipTour} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-colors py-2">Skip the tour</button>
                </div>

                <div className="mt-10 flex gap-3">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${i === currentStepIndex ? 'bg-primary-500 shadow-[0_0_15px_rgba(176,141,106,0.8)]' : 'bg-slate-100 dark:bg-slate-800'}`} />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Walkthrough;
