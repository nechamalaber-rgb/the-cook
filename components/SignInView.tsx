
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
    if (!email || !password) {
        setError('All fields are mandatory for studio access.');
        return;
    }
    setError('');
    setIsProcessing(true);

    // Simulate authentication cycle
    setTimeout(() => {
        onSignIn(name || email.split('@')[0], email, { 
            startTrial: !isLogin, 
            goal: 'chef'
        });
        setIsProcessing(false);
    }, 800);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center ${!isModal ? 'bg-[#0a0a0c]' : 'bg-black/70 backdrop-blur-md'} p-4 md:p-8 animate-fade-in font-sans`}>
      <div className="w-full max-w-7xl h-full max-h-[820px] bg-white rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden flex border-[4px] border-slate-950 flex-col md:flex-row">
        
        {/* LEFT SIDE: STUDIO BRANDING (DEEP SLATE/CHARCOAL) */}
        <div className="hidden md:flex md:w-[42%] bg-[#0f172a] relative overflow-hidden flex-col items-center justify-center p-16 text-white border-r-[4px] border-slate-950">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(45deg, #b08d6a 12%, transparent 12%, transparent 50%, #b08d6a 50%, #b08d6a 62%, transparent 62%, transparent 100%)', 
                backgroundSize: '100px 100px' 
            }}></div>
            
            {/* Floating Props */}
            <div className="absolute top-14 left-14 p-4 bg-white rounded-[1.5rem] border-[3px] border-slate-950 shadow-[8px_8px_0px_0px_rgba(176,141,106,1)] -rotate-12 transition-transform hover:rotate-0">
                <ChefHat size={32} className="text-slate-950" />
            </div>
            <div className="absolute top-40 right-14 p-3 bg-[#b08d6a] rounded-2xl border-[3px] border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-12">
                <Salad size={26} className="text-white" />
            </div>
            <div className="absolute bottom-48 left-16 p-3 bg-white rounded-2xl border-[3px] border-slate-950 shadow-[6px_6px_0px_0px_rgba(176,141,106,1)] rotate-6">
                <Beef size={26} className="text-slate-950" />
            </div>
            <div className="absolute bottom-14 right-16 p-4 bg-[#f97316] rounded-full border-[3px] border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -rotate-6">
                <Flame size={32} className="text-white" fill="currentColor" />
            </div>

            {/* Content Hub */}
            <div className="relative z-10 text-center space-y-12 max-w-sm">
                <div className="flex flex-col items-center gap-6">
                    <div className="p-5 bg-white rounded-[2rem] text-slate-950 border-[4px] border-[#b08d6a] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        <Logo className="w-16 h-16" />
                    </div>
                    <span className="text-6xl font-black tracking-tighter uppercase italic">Prepzu</span>
                </div>
                
                <div className="space-y-6">
                    <h2 className="text-5xl font-black leading-[0.95] tracking-tight">
                        Kitchen <br/> <span className="text-[#b08d6a]">Symphony.</span>
                    </h2>
                    <p className="text-lg font-bold text-slate-400 leading-relaxed">
                        The world's most advanced <span className="text-white">Culinary OS</span> for precision pantry management.
                    </p>
                </div>

                {/* Integration Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 backdrop-blur-sm border-[3px] border-white/10 p-5 rounded-3xl">
                        <p className="text-3xl font-black text-[#b08d6a]">24/7</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">AI Support</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border-[3px] border-white/10 p-5 rounded-3xl">
                        <p className="text-3xl font-black text-[#b08d6a]">100%</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Waste-Free</p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE: AUTH FORM (CLEAN WHITE GRID) */}
        <div className="flex-1 bg-white relative flex flex-col p-8 md:p-20 overflow-y-auto" style={{ 
            backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', 
            backgroundSize: '30px 30px' 
        }}>
            {/* Close Hub */}
            <button 
              onClick={onClose} 
              className="absolute top-10 right-10 p-3 text-slate-400 hover:text-slate-950 hover:bg-slate-50 rounded-2xl transition-all z-20 border-[3px] border-transparent hover:border-slate-950"
            >
              <X size={28} />
            </button>

            <div className="max-w-md w-full mx-auto space-y-12 relative z-10 my-auto">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">
                        {isLogin ? "Welcome" : "New Studio"}
                    </h1>
                    <p className="text-slate-500 font-bold text-lg">
                        {isLogin ? "Authenticate to resume your session." : "Register your kitchen manifest today."}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-950 tracking-[0.2em] ml-2">Display Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#b08d6a] transition-colors">
                                    <User size={22} />
                                </div>
                                <input 
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Chef Gordon" 
                                    className="w-full bg-white border-[3.5px] border-slate-950 p-6 pl-16 rounded-2xl outline-none font-black text-slate-950 placeholder:text-slate-300 transition-all focus:shadow-[8px_8px_0px_0px_rgba(176,141,106,0.3)] focus:-translate-y-1" 
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-950 tracking-[0.2em] ml-2">Studio Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#b08d6a] transition-colors">
                                <Mail size={22} />
                            </div>
                            <input 
                                type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                                placeholder="name@studio.com" 
                                className="w-full bg-white border-[3.5px] border-slate-950 p-6 pl-16 rounded-2xl outline-none font-black text-slate-950 placeholder:text-slate-300 transition-all focus:shadow-[8px_8px_0px_0px_rgba(176,141,106,0.3)] focus:-translate-y-1" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-950 tracking-[0.2em] ml-2">Access Key</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#b08d6a] transition-colors">
                                <Lock size={22} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required 
                                placeholder="••••••••" 
                                className="w-full bg-white border-[3.5px] border-slate-950 p-6 pl-16 pr-16 rounded-2xl outline-none font-black text-slate-950 placeholder:text-slate-300 transition-all focus:shadow-[8px_8px_0px_0px_rgba(176,141,106,0.3)] focus:-translate-y-1" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-slate-950 transition-colors"
                            >
                                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-5 bg-rose-50 border-[3px] border-rose-500 rounded-2xl text-[11px] font-black uppercase text-rose-600 flex items-center gap-4 animate-shake">
                            <AlertCircle size={20}/> {error}
                        </div>
                    )}

                    <button 
                        type="submit" disabled={isProcessing}
                        className="w-full py-8 bg-[#b08d6a] border-[4px] border-slate-950 rounded-[2rem] font-black text-white text-xl uppercase tracking-[0.4em] shadow-[0px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-2 transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : (isLogin ? "Launch App" : "Initialize Account")} 
                    </button>
                </form>

                {/* Offer Hub */}
                {!isLogin && (
                    <div className="bg-[#fefce8] border-[3.5px] border-slate-950 p-8 rounded-[2rem] shadow-[10px_10px_0px_0px_rgba(176,141,106,0.5)] flex gap-6">
                        <Sparkles size={36} className="text-[#b08d6a] shrink-0" />
                        <div>
                            <p className="text-sm font-black text-slate-950 uppercase tracking-tight">Studio Premium Trial</p>
                            <p className="text-[13px] font-bold text-slate-600 mt-1 leading-relaxed">
                               Complete access for <span className="text-slate-950 font-black decoration-[2px] underline">3 days</span>. 
                               No financial commitment required to start.
                            </p>
                        </div>
                    </div>
                )}

                <div className="pt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-base font-bold text-slate-500 hover:text-slate-950 transition-colors">
                        {isLogin ? "No studio access? " : "Already established? "}
                        <span className="text-[#b08d6a] font-black underline underline-offset-8 decoration-[3.5px]">{isLogin ? "Join Now" : "Sign In"}</span>
                    </button>
                </div>
            </div>

            {/* Hub Footer */}
            <div className="mt-auto pt-16 flex justify-center items-center gap-4 opacity-40">
                <Logo className="w-8 h-8 grayscale" />
                <span className="font-black text-[11px] uppercase tracking-[0.6em]">Prepzu Intelligence v2.5</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
