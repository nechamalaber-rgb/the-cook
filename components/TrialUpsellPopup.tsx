
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Mail, Apple, Globe, Zap } from 'lucide-react';
import { Logo } from './Logo';

interface TrialUpsellPopupProps {
  onClose: () => void;
  onClaim: () => void;
}

const TrialUpsellPopup: React.FC<TrialUpsellPopupProps> = ({ onClose, onClaim }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10:00 starting

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      m1: Math.floor(mins / 10),
      m2: mins % 10,
      s1: Math.floor(secs / 10),
      s2: secs % 10
    };
  };

  const t = formatTime(timeLeft);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#2563eb] rounded-[3rem] p-1 shadow-[0_0_100px_rgba(37,99,235,0.4)] relative overflow-hidden animate-slide-up">
        
        {/* INNER CONTAINER */}
        <div className="bg-[#2563eb] rounded-[2.8rem] p-8 md:p-12 flex flex-col items-center text-center relative">
          
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors z-20"
          >
            <X size={24} />
          </button>

          <h4 className="text-white font-black text-[13px] uppercase tracking-[0.4em] mb-10 drop-shadow-sm">
            Limited Time Offer
          </h4>

          {/* TICKET VISUAL */}
          <div className="relative w-full mb-10 group cursor-pointer" onClick={onClaim}>
             <div className="bg-[#ffcc00] rounded-2xl h-40 flex overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-500 relative">
                
                {/* NOTCH CIRCLES */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#2563eb] rounded-full -translate-x-1/2 z-10"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#2563eb] rounded-full translate-x-1/2 z-10"></div>
                
                <div className="flex-1 flex flex-col justify-center items-center px-8 border-r-2 border-dashed border-black/10">
                    <h2 className="text-5xl md:text-6xl font-black text-black leading-none mb-1 tracking-tighter">
                        FREE
                    </h2>
                    <p className="text-black/70 font-black text-[11px] uppercase tracking-[0.2em]">3 DAY STUDIO TRIAL</p>
                </div>

                <div className="w-28 bg-white flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-primary-600 rounded-xl text-white shadow-lg mb-2">
                        <Logo className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">STUDIO<br/>PRO</span>
                </div>
             </div>
          </div>

          {/* DIGITAL TIMER SEGMENTS */}
          <div className="mb-12 w-full">
              <div className="flex items-center gap-3 mb-4 justify-center">
                  <div className="flex gap-1.5">
                      <div className="w-14 h-20 bg-[#1d4ed8] rounded-2xl border border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-inner">{t.m1}</div>
                      <div className="w-14 h-20 bg-[#1d4ed8] rounded-2xl border border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-inner">{t.m2}</div>
                  </div>
                  <div className="text-4xl font-black text-white animate-pulse">:</div>
                  <div className="flex gap-1.5">
                      <div className="w-14 h-20 bg-[#1d4ed8] rounded-2xl border border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-inner">{t.s1}</div>
                      <div className="w-14 h-20 bg-[#1d4ed8] rounded-2xl border border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-inner">{t.s2}</div>
                  </div>
              </div>
              <div className="flex justify-between w-full px-12">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Minutes</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Seconds</span>
              </div>
          </div>

          {/* SIMULATED INPUT & ACTIONS */}
          <div className="w-full space-y-4">
              <div className="text-left w-full">
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1 mb-2 block">Your Email</label>
                  <div className="bg-[#1d4ed8] border border-white/10 rounded-2xl p-5 flex items-center gap-3">
                      <Mail size={18} className="text-white/40" />
                      <input 
                        readOnly
                        className="bg-transparent outline-none text-white font-bold w-full placeholder:text-white/20 text-sm" 
                        placeholder="chef@prepzu.studio" 
                      />
                  </div>
              </div>

              <button 
                onClick={onClaim}
                className="w-full py-6 bg-white text-[#2563eb] rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Continue to Studio
              </button>

              <div className="flex items-center gap-4 py-4">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">OR SIGN IN WITH</span>
                  <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div className="flex gap-4 justify-center">
                  <button className="flex-1 py-5 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/5">
                      <Globe size={22} className="text-white" />
                  </button>
                  <button className="flex-1 py-5 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/5">
                      <Apple size={22} className="text-white" fill="currentColor" />
                  </button>
                  <button className="flex-1 py-5 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/5">
                      <Zap size={22} className="text-white" fill="currentColor" />
                  </button>
              </div>
          </div>

          <p className="mt-10 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
              Instant access • No payment required to start
          </p>

        </div>
      </div>
    </div>
  );
};

export default TrialUpsellPopup;
