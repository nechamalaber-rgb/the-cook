
import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { X, Loader2, ShieldCheck, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

// Replace with your Stripe Publishable Key
const stripePromise = loadStripe("pk_test_12345"); 

interface CheckoutModalProps {
    onClose: () => void;
    planName: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, planName }) => {
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState('');
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [demoProcessing, setDemoProcessing] = useState(false);
    const [demoSuccess, setDemoSuccess] = useState(false);

    useEffect(() => {
        // Fetch clientSecret from your Ruby backend
        fetch("http://localhost:4242/create-checkout-session", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: planName }) 
        })
        .then((res) => {
            if (!res.ok) throw new Error("Server response not ok");
            return res.json();
        })
        .then((data) => {
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                throw new Error("No client secret returned");
            }
        })
        .catch((err) => {
            console.warn("Backend not reachable, switching to Demo Mode:", err);
            // Fallback to demo mode instead of showing error
            setIsDemoMode(true);
        });
    }, [planName]);

    const handleDemoPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setDemoProcessing(true);
        // Simulate network request
        setTimeout(() => {
            setDemoProcessing(false);
            setDemoSuccess(true);
            // Close modal after showing success briefly
            setTimeout(onClose, 2000);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] md:h-[80vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                            <ShieldCheck size={20} />
                         </div>
                         <div>
                            <h3 className="font-black text-lg text-slate-900 dark:text-white">Secure Checkout</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {isDemoMode ? 'Demo Environment' : `Upgrading to ${planName}`}
                            </p>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 relative">
                    {demoSuccess ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/30">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-serif mb-2">Upgrade Complete</h2>
                            <p className="text-slate-500 font-medium">Welcome to GatherHome {planName}</p>
                        </div>
                    ) : isDemoMode ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
                            <div className="max-w-md w-full bg-white dark:bg-slate-950 p-8 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                        Backend Unavailable
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif">Simulate Payment</h3>
                                    <p className="text-slate-500 text-sm mt-2">The Ruby server couldn't be reached. You can complete a mock payment to test the flow.</p>
                                </div>
                                <form onSubmit={handleDemoPayment} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Card Information</label>
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <CreditCard className="text-slate-400" size={20} />
                                            <input disabled className="bg-transparent outline-none w-full font-mono text-slate-500" value="4242 4242 4242 4242" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Expiry</label>
                                            <input disabled className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-slate-500 outline-none" value="12/25" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CVC</label>
                                            <input disabled className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-slate-500 outline-none" value="123" />
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={demoProcessing}
                                        className="w-full py-4 mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {demoProcessing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                        {demoProcessing ? 'Processing...' : `Pay $${planName.includes('Pro') ? '9.99' : '18.99'}`}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : clientSecret ? (
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                            <EmbeddedCheckout className="h-full" />
                        </EmbeddedCheckoutProvider>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
                            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Initializing Stripe...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
