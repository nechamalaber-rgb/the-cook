
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Sparkles, ArrowRight, Crown } from 'lucide-react';
import { UserPreferences } from '../types';

interface PaymentSuccessViewProps {
    setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({ setPreferences }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Animation sequence simulating backend verification
        const t1 = setTimeout(() => setStep(1), 500); // Verify
        const t2 = setTimeout(() => {
            setPreferences(prev => ({ 
                ...prev, 
                isProMember: true, 
                subscriptionTier: 'pro',
                dailyUsage: { date: new Date().toISOString().split('T')[0], count: 0 } // Reset limits
            }));
            setStep(2); // Activate
        }, 2000);

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [sessionId, setPreferences]);

    return (
        <div className="min-h-screen bg-[#090e1a] flex items-center justify-center p-6 animate-fade-in font-sans">
            <div className="bg-[#0c1220] border border-white/5 rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                {/* Visuals */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-10 relative">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-all duration-700 ${step >= 2 ? 'bg-emerald-500 scale-110' : 'bg-slate-800'}`}>
                            {step >= 2 ? <CheckCircle2 size={48} strokeWidth={3} /> : <Crown size={40} className="text-primary-500 animate-pulse" />}
                        </div>
                        {step < 2 && (
                            <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full border-t-primary-500 animate-spin"></div>
                        )}
                    </div>
                    
                    <h1 className="text-4xl font-black text-white font-serif tracking-tighter mb-4 italic">
                        {step < 2 ? 'Finalizing Access...' : 'You are Pro.'}
                    </h1>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10 max-w-xs mx-auto">
                        {step < 2 ? 'Securing your studio logic and syncing preference nodes.' : 'Welcome to the elite tier. Your studio has been upgraded with precision intelligence.'}
                    </p>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl w-full mb-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Transaction</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Verified</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Plan</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">Monthly Studio</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                            <div className={`h-full bg-emerald-500 transition-all duration-1000 ${step >= 2 ? 'w-full' : 'w-2/3'}`}></div>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/studio')}
                        disabled={step < 2}
                        className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-xl ${step >= 2 ? 'bg-white text-slate-950 hover:scale-105 active:scale-95 cursor-pointer' : 'bg-slate-800 text-slate-600 cursor-wait'}`}
                    >
                        Enter Studio <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessView;
