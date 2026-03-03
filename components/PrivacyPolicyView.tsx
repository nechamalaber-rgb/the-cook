import React from 'react';
import { Shield, Lock, Eye, FileText, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in pb-20 w-full max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
      </button>

      <div className="space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-500/10 rounded-2xl text-primary-500 border border-primary-500/20">
              <Shield size={24} />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter italic">Privacy.</h1>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Last Updated: March 1, 2026</p>
        </header>

        <section className="grid gap-8">
          <div className="bg-[#0c1220] border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-8 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary-400">
                <Eye size={18} />
                <h2 className="text-xl font-black font-serif italic uppercase tracking-tight">Overview</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                At Prepzu, we believe your kitchen data is personal. This policy explains how we collect, use, and protect your information when you use our Contextual Recipe & Pantry Companion.
              </p>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-400">
                <FileText size={18} />
                <h2 className="text-xl font-black font-serif italic uppercase tracking-tight">Data Collection</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Account Information</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">We collect your email address for authentication purposes via Magic Link (OTP). We do not store passwords.</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Pantry & Recipes</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">Your pantry items, shopping lists, and saved recipes are stored to provide the core functionality of the app.</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-400">
                <Lock size={18} />
                <h2 className="text-xl font-black font-serif italic uppercase tracking-tight">AI Processing</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                We use Google's Gemini AI to generate recipes and analyze pantry data. 
                <span className="block mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-xs italic">
                  Note: If you are on the Free Tier, your de-identified data may be used by Google to improve their models. Pro members enjoy enhanced privacy through our enterprise-grade API configuration.
                </span>
              </p>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-amber-400">
                <Mail size={18} />
                <h2 className="text-xl font-black font-serif italic uppercase tracking-tight">Contact</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Questions about your data? Reach out to us at <a href="mailto:privacy@prepzu.com" className="text-primary-500 hover:underline">privacy@prepzu.com</a>.
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center pt-8">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">© 2026 Prepzu Studio. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicyView;
