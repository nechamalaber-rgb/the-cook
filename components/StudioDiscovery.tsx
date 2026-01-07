
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Sparkles, Check, Info, Lightbulb } from 'lucide-react';

interface DiscoveryStep {
    target: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: DiscoveryStep[] = [
    {
        target: 'nav-inventory',
        title: 'Central Inventory',
        description: 'Synchronize your physical pantry here. Scan receipts or shelves to populate your digital manifest.',
        position: 'bottom'
    },
    {
        target: 'nav-studio',
        title: 'Curation Engine',
        description: 'This is where recipes are synthesized. We look at what you have and design what you need.',
        position: 'bottom'
    },
    {
        target: 'nav-cart',
        title: 'Supply Chain',
        description: 'Auto-identified gaps in your pantry are sent here for replenishment sync.',
        position: 'bottom'
    }
];

export const StudioDiscovery: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const currentStep = STEPS[stepIndex];

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] pointer-events-none">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
            
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto">
                <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 animate-slide-up relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary-500 p-4 rounded-3xl shadow-xl shadow-primary-500/20 text-white">
                        <Sparkles size={32} />
                    </div>
                    
                    <div className="mt-4 text-center space-y-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500">Discovery Protocol</span>
                        </div>
                        <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white leading-tight">
                            {currentStep.title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {currentStep.description}
                        </p>
                    </div>

                    <div className="mt-10 flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {STEPS.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-6 bg-primary-500' : 'w-1.5 bg-slate-200 dark:bg-slate-800'}`} />
                            ))}
                        </div>
                        <button 
                            onClick={handleNext}
                            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"
                        >
                            {stepIndex === STEPS.length - 1 ? 'Start Studio' : 'Continue'} <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SmartHint: React.FC<{ text: string }> = ({ text }) => {
    return (
        <div className="group relative inline-block ml-2">
            <Info size={14} className="text-slate-300 hover:text-primary-500 cursor-help transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 leading-relaxed border border-white/10">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
            </div>
        </div>
    );
};
