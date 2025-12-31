
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Mail, Lock, Eye, EyeOff, X, Gift, Check, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';

interface SignInViewProps {
  onSignIn: (name: string, email: string, startTrial?: boolean) => void;
  onClose: () => void;
  isModal?: boolean;
  initialMode?: 'login' | 'signup';
}

const SignInView: React.FC<SignInViewProps> = ({ onSignIn, onClose, isModal = false, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login'); 
  const [email, setEmail] = useState(() => localStorage.getItem('ks_last_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const lastEmail = localStorage.getItem('ks_last_email');
    if (lastEmail && !email) {
      setEmail(lastEmail);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail || !password.trim()) {
        setError('Please fill in all fields.');
        return;
    }

    if (!emailRegex.test(normalizedEmail)) {
        setError('Please enter a valid email address.');
        return;
    }

    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }

    const usersData = localStorage.getItem('savor_studio_users');
    const users = usersData ? JSON.parse(usersData) : {};

    if (isLogin) {
        const user = users[normalizedEmail];
        if (!user) {
            setError('Account not found. Please sign up.');
            return;
        }
        if (user.password !== password) {
            setError('Incorrect password.');
            return;
        }
        localStorage.setItem('ks_last_email', normalizedEmail);
        onSignIn(user.name || normalizedEmail.split('@')[0], normalizedEmail);
    } else {
        if (users[normalizedEmail]) {
            setError('Account already exists. Try signing in.');
            return;
        }
        
        const newUser = {
            name: normalizedEmail.split('@')[0],
            password: password,
            email: normalizedEmail,
            createdAt: new Date().toISOString()
        };
        
        users[normalizedEmail] = newUser;
        localStorage.setItem('savor_studio_users', JSON.stringify(users));
        localStorage.setItem('ks_last_email', normalizedEmail);
        onSignIn(newUser.name, normalizedEmail, true);
    }
  };

  const containerClasses = isModal 
    ? "w-full bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl p-6 md:p-12 relative overflow-hidden border border-slate-100 dark:border-slate-800"
    : "max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl p-6 md:p-12 relative overflow-hidden animate-fade-in border border-slate-100 dark:border-slate-800";

  return (
    <div className={!isModal ? "min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500" : ""}>
      <div className={containerClasses}>
        {isModal && (
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-20"
          >
            <X size={24} />
          </button>
        )}
        
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-100 dark:bg-primary-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-start">
          
          {/* Left Column: Value Reinforcement (Only on Signup) */}
          {!isLogin && (
            <div className="lg:w-1/2 space-y-4 md:space-y-6 animate-fade-in">
                <div className="p-2 bg-primary-500 w-fit rounded-xl text-white shadow-xl shadow-primary-500/20 mb-2 md:mb-4">
                    <Logo className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-serif tracking-tighter leading-tight">
                    Start Your <br/><span className="text-primary-600">3-Day Pro Trial</span>
                </h1>
                
                <ul className="space-y-3 md:space-y-4">
                    <li className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-md">
                            <CheckCircle2 size={14} />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest leading-none mb-1">Unlimited Tracking</p>
                            <p className="text-[10px] text-slate-500 font-medium">No limits on your catalog.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-md">
                            <CheckCircle2 size={14} />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest leading-none mb-1">Smart Lists</p>
                            <p className="text-[10px] text-slate-500 font-medium">One-click store exports.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-md">
                            <CheckCircle2 size={14} />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest leading-none mb-1">Studio Planning</p>
                            <p className="text-[10px] text-slate-500 font-medium">AI curated custom menus.</p>
                        </div>
                    </li>
                </ul>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[8px] font-black">
                                <Users size={10}/>
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Join 5,000+ chefs</p>
                </div>
            </div>
          )}

          {/* Right Column: Form */}
          <div className={!isLogin ? "lg:w-1/2 w-full" : "w-full max-w-md mx-auto"}>
            {isLogin && (
                <div className="text-center mb-6">
                    <div className="mb-4 transform hover:scale-105 transition-transform duration-500 inline-block">
                        <Logo className="w-12 h-12 text-primary-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1 font-serif tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Continue your journey.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold text-sm"
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (min. 8 chars)"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-12 pr-12 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold text-sm"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {!isLogin && (
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gift className="text-primary-500" size={16} />
                            <div>
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Instant Access</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">No credit card required</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 animate-shake">
                        <AlertCircle className="shrink-0" size={14} />
                        {error}
                    </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-[1.5rem] font-black text-base shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-4"
                >
                  <span>{isLogin ? 'Enter' : 'Activate Trial'}</span>
                  <ArrowRight size={18} />
                </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-center">
                 <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                     {isLogin ? "New here?" : "Already member?"}
                     <button 
                          onClick={() => { setIsLogin(!isLogin); setError(''); }}
                          className="ml-2 font-black text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-widest text-[10px]"
                     >
                         {isLogin ? "Trial Offer" : "Sign In"}
                     </button>
                 </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
