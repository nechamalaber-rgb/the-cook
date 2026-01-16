
import React, { useState } from 'react';
import { Mail, Lock, X, AlertCircle, Loader2, Sparkles, User, Eye, EyeOff, Utensils, Flame, Package, Carrot, ChefHat, Info, Beef, Coffee, Salad } from 'lucide-react';
import { Logo } from './Logo';

interface SignInViewProps {
  onSignIn: (name: string, email: string, options: { startTrial?: boolean, goal?: string, plan?: string }) => void;
  onClose: () => void;
  isModal?: boolean;
  initialMode?: 'login' | 'signup';
}

const SignInView: React.FC<SignInViewProps> = ({ onSignIn, onClose, isModal = false, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !name)) {
        setError('All fields are mandatory for studio access.');
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        setError('Please provide a legitimate studio email address.');
        return;
    }

    if (password.length < 8) {
        setError('Access key must be at least 8 characters.');
        return;
    }

    setError('');
    setIsProcessing(true);

    setTimeout(() => {
        onSignIn(name || email.split('@')[0], email, { 
            startTrial: false, 
            goal: 'chef'
        });
        setIsProcessing(false);
    }, 800);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center ${!isModal ? 'bg-[#0a0a0c]' : 'bg-black/70 backdrop-blur-md'} p-4 md:p-8 animate-fade-in font-sans`}>
      <div className="w-full max-w-7xl h-full max-h-[820px] bg-[#0c1220] rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col md:row border-[4px] border-slate-800 flex-col md:flex-row">
        
        {/* LEFT SIDE: STUDIO BRANDING */}
        <div className="hidden md:flex md:w-[42%] bg-[#0f172a] relative overflow-hidden flex-col items-center justify-center p-16 text-white border-r-[4px] border-slate-800">
            <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(45deg, #b08d6a 12%, transparent 12%, transparent 50%, #b08d6a 50%, #b08d6a 62%, transparent 62%, transparent 100%)', 
                backgroundSize: '100px 100px' 
            }}></div>
            
            <div className="relative z-10 text-center space-y-12 max-w-sm">
                <div className="flex flex-col items-center gap-6">
                    <div className="p-5 bg-white rounded-[2rem] text-slate-950 border-[4px] border-[#b08d6a] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        <Logo className="w-16 h-16" />
                    </div>
                    <span className="text-6xl font-black tracking-tighter uppercase italic">Prepzu</span>
                </div>
                <div className="space-y-6">
                    <h2 className="text-5xl font-black leading-[0.95] tracking-tight text-white">
                        Kitchen <br/> <span className="text-[#b08d6a]">Symphony.</span>
                    </h2>
                    <p className="text-lg font-bold text-slate-400 leading-relaxed">
                        Precision pantry management.
                    </p>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE: AUTH FORM */}
        <div className="flex-1 bg-[#0c1220] relative flex flex-col p-8 md:p-20 overflow-y-auto">
            <button 
              onClick={onClose} 
              className="absolute top-10 right-10 p-3 text-slate-400 hover:text-white transition-all z-20"
            >
              <X size={28} />
            </button>

            <div className="max-w-md w-full mx-auto space-y-12 relative z-10 my-auto text-white">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black tracking-tighter leading-none">
                        {isLogin ? "Welcome" : "Get Started"}
                    </h1>
                    <p className="text-slate-400 font-bold text-lg">
                        {isLogin ? "Authenticate to resume." : "Create your free account."}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2">Display Name</label>
                            <input 
                                type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Chef Name" 
                                className="w-full bg-slate-900 border-[3.5px] border-slate-800 p-6 rounded-2xl outline-none font-black text-white placeholder:text-slate-600 focus:border-primary-500 transition-all" 
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2">Studio Email</label>
                        <input 
                            type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                            placeholder="name@studio.com" 
                            className="w-full bg-slate-900 border-[3.5px] border-slate-800 p-6 rounded-2xl outline-none font-black text-white placeholder:text-slate-600 focus:border-primary-500 transition-all" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2">Access Key</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required 
                                placeholder="••••••••" 
                                className="w-full bg-slate-900 border-[3.5px] border-slate-800 p-6 rounded-2xl outline-none font-black text-white placeholder:text-slate-600 focus:border-primary-500 transition-all" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-5 bg-rose-900/20 border-[3px] border-rose-500 rounded-2xl text-[11px] font-black uppercase text-rose-500 flex items-center gap-4">
                            <AlertCircle size={20}/> {error}
                        </div>
                    )}

                    <button 
                        type="submit" disabled={isProcessing}
                        className="w-full py-8 bg-[#b08d6a] border-[4px] border-slate-900 rounded-[2rem] font-black text-white text-xl uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : (isLogin ? "Launch" : "Launch Studio")} 
                    </button>
                </form>

                <div className="pt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-base font-bold text-slate-400 hover:text-white transition-colors">
                        {isLogin ? "No access? " : "Already registered? "}
                        <span className="text-[#b08d6a] font-black underline decoration-[3.5px]">{isLogin ? "Sign Up" : "Sign In"}</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
