import React, { useState } from 'react';
import { ArrowRight, Sparkles, Mail, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { Logo } from './Logo';

interface SignInViewProps {
  onSignIn: (name: string, email: string, isKosher: boolean, emailNotifications: boolean) => void;
  onClose: () => void;
  isModal?: boolean;
}

const SignInView: React.FC<SignInViewProps> = ({ onSignIn, onClose, isModal = false }) => {
  const [isLogin, setIsLogin] = useState(true); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
        setError('Please fill in all fields.');
        return;
    }

    if (!isLogin && !name.trim()) {
        setError('Please tell us your name.');
        return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
    }
    
    const usersData = localStorage.getItem('kitchensync_users');
    const users = usersData ? JSON.parse(usersData) : {};
    const normalizedEmail = email.toLowerCase().trim();

    if (isLogin) {
        const user = users[normalizedEmail];
        
        if (!user) {
            setError('Account not found. Please sign up first.');
            return;
        }
        
        if (user.password !== password) {
            setError('Incorrect password.');
            return;
        }
        
        if (rememberMe) {
            localStorage.setItem('kitchensync_remembered_user', normalizedEmail);
        } else {
            localStorage.removeItem('kitchensync_remembered_user');
        }

        onSignIn(user.name, normalizedEmail, user.isKosher || false, true);
    
    } else {
        if (users[normalizedEmail]) {
            setError('Account already exists. Please log in.');
            return;
        }
        
        const newUser = {
            name: name.trim(),
            password: password,
            isKosher: false,
            createdAt: new Date().toISOString()
        };
        
        users[normalizedEmail] = newUser;
        localStorage.setItem('kitchensync_users', JSON.stringify(users));
        
        if (rememberMe) {
            localStorage.setItem('kitchensync_remembered_user', normalizedEmail);
        }

        onSignIn(newUser.name, normalizedEmail, false, true);
    }
  };

  const containerClasses = isModal 
    ? "w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden border border-slate-100 dark:border-slate-800"
    : "max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden animate-fade-in border border-slate-100 dark:border-slate-800";

  return (
    <div className={!isModal ? "min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500" : ""}>
      <div className={containerClasses}>
        {/* Close button for modal mode */}
        {isModal && (
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-20"
          >
            <X size={24} />
          </button>
        )}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 dark:bg-primary-800 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-200 dark:bg-slate-800 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 opacity-60 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
            <Logo className="w-20 h-20 text-black dark:text-white" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 font-serif tracking-tight">
            Savor Studio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">
            {isLogin ? 'Welcome back, Chef!' : 'Your intelligent culinary companion.'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
            {!isLogin && (
                <div className="relative group animate-slide-down">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={20} />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-800 dark:text-slate-100 outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                    />
                </div>
            )}

            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={20} />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-800 dark:text-slate-100 outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                />
            </div>

            <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={20} />
                <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-12 text-slate-800 dark:text-slate-100 outline-none focus:border-slate-900 dark:focus:border-white transition-all"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <div className="flex items-center gap-2 px-1">
                <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="remember" className="text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer">Remember me</label>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium p-3 rounded-xl border border-rose-100 dark:border-rose-900">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 w-full">
               <p className="text-slate-500 dark:text-slate-400 text-sm">
                   {isLogin ? "Don't have an account?" : "Already have an account?"}
                   <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="ml-2 font-bold text-slate-900 dark:text-white hover:underline"
                   >
                       {isLogin ? "Sign Up" : "Sign In"}
                   </button>
               </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;