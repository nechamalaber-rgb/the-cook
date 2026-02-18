import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Loader2, Mail, Send, Inbox, Lock, Eye, EyeOff, KeyRound, RefreshCcw, Sparkles, Smartphone, Hash, ShieldCheck, Keypad, Fingerprint } from 'lucide-react';
import { Logo } from './Logo';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface SignInViewProps {
  onSignIn: (name: string, email: string) => void;
  onClose: () => void;
  isModal?: boolean;
  initialMode?: 'login' | 'signup';
}

const SignInView: React.FC<SignInViewProps> = ({ onClose, isModal = false, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('magic');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when verification screen shows
  useEffect(() => {
    if (isVerifying) {
        setTimeout(() => otpInputs.current[0]?.focus(), 100);
    }
  }, [isVerifying]);

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
        setError('Security integration pending.');
        return;
    }
    setIsGoogleProcessing(true);
    try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { 
            redirectTo: window.location.origin, 
            queryParams: { access_type: 'offline', prompt: 'consent' }
          }
        });
        if (error) throw error;
    } catch (err: any) {
        setError(err.message || 'Identity link failed.');
        setIsGoogleProcessing(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsProcessing(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    try {
        if (authMethod === 'magic') {
            const { error } = await supabase.auth.signInWithOtp({
                email: cleanEmail,
                options: {
                    data: { full_name: name },
                    shouldCreateUser: true, 
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) {
                if (error.message.includes('rate limit')) {
                    setError('Too many attempts. Please wait 60 seconds.');
                } else {
                    throw error;
                }
            } else {
                setIsVerifying(true);
            }
        } else {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password: password
                });
                
                if (signInError) {
                    if (signInError.message.toLowerCase().includes('email not confirmed')) {
                        // Resend the confirmation for the password account
                        await supabase.auth.resend({ type: 'signup', email: cleanEmail });
                        setIsVerifying(true);
                        return;
                    }
                    throw signInError;
                }
                onClose();
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password: password,
                    options: {
                        data: { full_name: name },
                        emailRedirectTo: window.location.origin
                    }
                });
                
                if (signUpError) throw signUpError;
                
                // Transition to verification screen for password signup
                setIsVerifying(true);
            }
        }
    } catch (err: any) {
        console.error("Auth Error:", err);
        setError(err.message || 'Authentication failed. Check details.');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleResendConfirm = async () => {
      setIsProcessing(true);
      setError('');
      try {
          const cleanEmail = email.trim().toLowerCase();
          if (authMethod === 'password') {
              const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email: cleanEmail,
              });
              if (error) throw error;
          } else {
              const { error } = await supabase.auth.signInWithOtp({
                  email: cleanEmail,
                  options: { shouldCreateUser: true }
              });
              if (error) throw error;
          }
          alert('A new security code has been dispatched. Please check your spam folder.');
      } catch (e: any) {
          setError(e.message || 'Failed to resend signal.');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleOtpChange = (index: number, val: string) => {
      const sanitized = val.replace(/\D/g, '').slice(-1);
      if (val && !sanitized) return;
      
      const newOtp = [...otpValue];
      newOtp[index] = sanitized;
      setOtpValue(newOtp);
      
      if (sanitized && index < 5) {
          otpInputs.current[index + 1]?.focus();
      }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (pastedData.length === 0) return;

      const newOtp = [...otpValue];
      pastedData.split('').forEach((char, idx) => {
          if (idx < 6) newOtp[idx] = char;
      });
      setOtpValue(newOtp);
      
      const nextIdx = Math.min(pastedData.length, 5);
      otpInputs.current[nextIdx]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
          otpInputs.current[index - 1]?.focus();
      }
  };

  const handleVerifyOtp = async () => {
    const code = otpValue.join('');
    if (code.length < 6) return;
    setIsProcessing(true);
    setError('');
    
    const cleanEmail = email.trim().toLowerCase();

    try {
        // Try verifying as magiclink first (OTP path)
        const { error: magicError } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: code,
            type: 'magiclink'
        });
        
        if (!magicError) {
            onClose();
            return;
        }

        // Try verifying as signup (Password path)
        const { error: signupError } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: code,
            type: 'signup'
        });

        if (signupError) throw signupError;
        
        onClose();
    } catch (err: any) {
        setError('Incorrect or expired code. Please try again.');
        setOtpValue(['', '', '', '', '', '']);
        otpInputs.current[0]?.focus();
    } finally {
        setIsProcessing(false);
    }
  };

  if (isVerifying) {
    return (
        <div className={`fixed inset-0 z-[250] flex items-center justify-center ${isModal ? 'bg-slate-950/90 backdrop-blur-md' : 'bg-[#070b14]'} p-4 animate-fade-in`}>
          <div className="w-full max-w-sm bg-[#0c1220] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden animate-slide-up">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors z-30"><X size={20} /></button>
            
            <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-primary-500/10 rounded-[2rem] flex items-center justify-center text-primary-500 mx-auto border border-primary-500/20 mb-4">
                    <Hash size={32} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Enter Security Code</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 leading-relaxed">
                    Check <span className="text-white">{email}</span> for your 6-digit confirmation code.
                </p>
            </div>
            
            <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                {otpValue.map((val, idx) => (
                    <input
                        key={idx}
                        ref={el => otpInputs.current[idx] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className={`w-10 h-14 bg-slate-900 border ${val ? 'border-primary-500 shadow-[0_0_15px_rgba(176,141,106,0.2)]' : 'border-white/10'} rounded-xl text-center text-xl font-black text-white focus:border-primary-500 outline-none transition-all`}
                    />
                ))}
            </div>

            {error && (
              <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-bold animate-fade-in">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button 
                onClick={handleVerifyOtp}
                disabled={isProcessing || otpValue.join('').length < 6}
                className="w-full py-4 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-primary-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                {isProcessing ? 'Verifying...' : 'Establish Access'}
            </button>

            <div className="mt-8 flex flex-col items-center gap-4">
               <button onClick={handleResendConfirm} disabled={isProcessing} className="text-[9px] font-black uppercase text-slate-500 hover:text-white tracking-widest transition-all flex items-center gap-2">
                   <RefreshCcw size={12} className={isProcessing ? 'animate-spin' : ''} /> Resend Signal
               </button>
               <button onClick={() => { setIsVerifying(false); setError(''); setOtpValue(['','','','','','']); }} className="text-[8px] font-black uppercase text-slate-700 hover:text-slate-400 tracking-widest transition-all">
                   Incorrect email? Go back
               </button>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[250] flex items-center justify-center ${isModal ? 'bg-slate-950/90 backdrop-blur-md' : 'bg-[#070b14]'} p-4 animate-fade-in`}>
      <div className="w-full max-w-sm bg-[#0c1220] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden animate-slide-up flex flex-col">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors z-30"><X size={20} /></button>
        
        <div className="flex flex-col items-center mb-8">
            <div className="p-1.5 bg-primary-500 rounded-xl text-white shadow-lg mb-4">
                <Logo className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white font-serif italic tracking-tighter uppercase leading-none">
                {isLogin ? 'Sign In' : 'Register'}
            </h2>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.4em] mt-2 italic">Private Manifest Access</p>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={isGoogleProcessing}
          className="w-full bg-white text-slate-950 p-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-slate-200 transition-all mb-6 disabled:opacity-50"
        >
          {isGoogleProcessing ? <Loader2 className="animate-spin" size={14}/> : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
              Continue with Google
            </>
          )}
        </button>

        <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-white/5 flex-1" />
            <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Or Use Email</span>
            <div className="h-px bg-white/5 flex-1" />
        </div>

        {/* AUTH METHOD TABS */}
        <div className="bg-slate-900/50 p-1 rounded-xl flex mb-6 border border-white/5 shadow-inner">
            <button 
                onClick={() => setAuthMethod('magic')}
                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${authMethod === 'magic' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Smartphone size={12} /> OTP Login
            </button>
            <button 
                onClick={() => setAuthMethod('password')}
                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${authMethod === 'password' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <KeyRound size={12} /> Password
            </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">Chef Name</label>
              <div className="relative">
                <input 
                  required type="text" value={name} onChange={e => setName(e.target.value)} 
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-primary-500 shadow-inner" 
                  placeholder="e.g. Gordon" 
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
            <div className="relative">
              <input 
                required type="email" value={email} onChange={e => setEmail(e.target.value)} 
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-primary-500 shadow-inner" 
                placeholder="chef@studio.com" 
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
            </div>
          </div>

          {authMethod === 'password' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">Secure Password</label>
              <div className="relative">
                <input 
                  required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-primary-500 pr-12 shadow-inner" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-bold animate-fade-in">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-primary-500 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Send size={14}/>}
            {authMethod === 'magic' ? (isLogin ? 'Send Security Code' : 'Register & Verify') : (isLogin ? 'Sign In' : 'Create Account & Verify')}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white tracking-widest transition-all">
                {isLogin ? 'Need an account? Register' : 'Registered? Sign In'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SignInView;