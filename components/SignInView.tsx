
import React, { useState } from 'react';
import { Mail, Lock, X, AlertCircle, Loader2, Sparkles, User, Eye, EyeOff, Utensils, Flame, Package, Carrot, ChefHat, Info, Beef, Coffee, Salad, Chrome } from 'lucide-react';
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
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);

  const handleGoogleSignIn = () => {
    setIsGoogleProcessing(true);
    // Simulate Google OAuth Redirect and Response
    setTimeout(() => {
        onSignIn("Studio Chef", "chef.user@gmail.com", { 
            startTrial: true, 
            goal: 'chef'
        });
        setIsGoogleProcessing(false);
    }, 1200);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
        setError('All fields are mandatory for studio access.');
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
        <div className="flex-1 bg-[#0c1220] relative flex flex-col p-8 md:p-14 overflow-y-auto">
            <button 
              onClick={onClose} 
              className="absolute top-8 right-8 p-3 text-slate-400 hover:text-white transition-all z-20"
            >
              <X size={28} />
            </button>

            <div className="max-w-md w-full mx-auto space-y-8 relative z-10 my-auto text-white">
                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tighter leading-none">
                        {isLogin ? "Welcome" : "Get Started"}
                    </h1>
                    <p className="text-slate-400 font-bold text-base">
                        {isLogin ? "Authenticate to resume." : "Create your free account."}
                    </p>
                </div>

                {/* Google Button */}
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleProcessing}
                  className="w-full py-4 px-6 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                    {isGoogleProcessing ? <Loader2 size={18} className="animate-spin text-primary-500" /> : <Chrome size={18} className="text-primary-600" />}
                    Continue with Google
                </button>

                <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">or use email</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Display Name</label>
                            <input 
                                type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Chef Name" 
                                className="w-full bg-slate-900 border-[2px] border-slate-800 p-4 rounded-xl outline-none font-black text-white placeholder:text-slate-600 focus:border-primary-500 transition-all" 
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Email</label>
                        <input 
                            type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                            placeholder="name@studio.com" 
                            className="w-full bg-slate-900 border-[2px] border-slate-800 p-4 rounded-xl outline-none font-black text-white placeholder:text-slate-600 focus:border-primary-500 transition-all" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required 
                                placeholder="••••••••" 
                                className="w-full bg-slate-900 border-[2px] border-slate-800 p-4 rounded-xl outline-none font-black text-white placeholder:text-slate-600 focus:border-primary-500 transition-all" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-900/20 border-2 border-rose-500 rounded-xl text-[10px] font-black uppercase text-rose-500 flex items-center gap-3">
                            <AlertCircle size={16}/> {error}
                        </div>
                    )}

                    <button 
                        type="submit" disabled={isProcessing}
                        className="w-full py-5 bg-[#b08d6a] border-[3px] border-slate-900 rounded-2xl font-black text-white text-lg uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : (isLogin ? "Sign In" : "Register")} 
                    </button>
                </form>

                <div className="pt-4 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                        {isLogin ? "No access? " : "Already registered? "}
                        <span className="text-[#b08d6a] font-black underline decoration-[2px]">{isLogin ? "Sign Up" : "Sign In"}</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
