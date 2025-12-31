
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Mail, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, X, Gift, Check } from 'lucide-react';
import { Logo } from './Logo';

interface SignInViewProps {
  onSignIn: (name: string, email: string, startTrial?: boolean) => void;
  onClose: () => void;
  isModal?: boolean;
}

const SignInView: React.FC<SignInViewProps> = ({ onSignIn, onClose, isModal = false }) => {
  const [isLogin, setIsLogin] = useState(true); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('ks_last_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Handle errors if the user tries to submit an empty form when the email was pre-filled
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
        setError('Please enter a valid, real email address.');
        return;
    }

    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }

    if (!isLogin && !name.trim()) {
        setError('Please tell us your name.');
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
        // Save email to remember it for next time
        localStorage.setItem('ks_last_email', normalizedEmail);
        onSignIn(user.name, normalizedEmail);
    } else {
        if (users[normalizedEmail]) {
            setError('Account already exists. Try signing in.');
            return;
        }
        
        const newUser = {
            name: name.trim(),
            password: password,
            email: normalizedEmail,
            createdAt: new Date().toISOString()
        };
        
        users[normalizedEmail] = newUser;
        localStorage.setItem('savor_studio_users', JSON.stringify(users));
        // Save email to remember it for next time
        localStorage.setItem('ks_last_email', normalizedEmail);
        // Always start trial on signup
        onSignIn(newUser.name, normalizedEmail, true);
    }
  };

  const containerClasses = isModal 
    ? "w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 md:p-14 relative overflow-hidden border border-slate-100 dark:border-slate-800"
    : "max-w-lg w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 md:p-14 relative overflow-hidden animate-fade-in border border-slate-100 dark:border-slate-800";

  return (
    <div className={!isModal ? "min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500" : ""}>
      <div className={containerClasses}>
        {isModal && (
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-20"
          >
            <X size={28} />
          </button>
        )}
        
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-10 transform hover:scale-105 transition-transform duration-500">
            <Logo className="w-24 h-24 text-primary-600" />
          </div>

          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 font-serif tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join the Studio'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mb-10 font-medium max-w-[280px]">
            {isLogin ? 'Continue your culinary journey.' : 'Unlock your pantry\'s full potential.'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
            {!isLogin && (
                <div className="relative group animate-slide-down">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                    <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-5 pl-14 pr-5 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                    />
                </div>
            )}

            <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-5 pl-14 pr-5 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                />
            </div>

            <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min. 8 chars)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-5 pl-14 pr-14 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
            </div>

            {!isLogin && (
                <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <Gift className="text-primary-500" size={20} />
                        <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">3-Day Free Trial Included</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Unlock Pro features instantly</p>
                        </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-primary-500 bg-primary-500 text-white flex items-center justify-center">
                        <Check size={14} strokeWidth={4} />
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-bold p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-6 uppercase tracking-widest"
            >
              <span>{isLogin ? 'Enter Studio' : 'Start Free Trial'}</span>
              <ArrowRight size={22} />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 w-full">
               <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                   {isLogin ? "New to the Studio?" : "Already a member?"}
                   <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="ml-2 font-black text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-widest text-[11px]"
                   >
                       {isLogin ? "Sign Up Free" : "Sign In Now"}
                   </button>
               </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
