
import React from 'react';
import { Shield, Lock, Eye, FileText, ChevronLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-300 py-20 px-6 animate-fade-in font-sans selection:bg-primary-500/30">
      <div className="max-w-4xl mx-auto space-y-16">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-primary-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Studio
        </button>

        <header className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 border border-primary-500/20 shadow-2xl">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-white font-serif italic tracking-tighter">Privacy Policy.</h1>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Legal Documentation • Last Updated: Feb 13, 2026</p>
            </div>
          </div>
        </header>

        <section className="space-y-12">
          <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-6 shadow-inner">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <CheckCircle className="text-primary-500" size={20} /> Commitment to Privacy
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-slate-400">
              Prepzu (the "Application") is committed to protecting your privacy. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or use the Prepzu Studio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 p-8 bg-slate-900/20 rounded-[2.5rem] border border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Lock size={16} className="text-primary-500" /> 1. Data Collection
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                    We collect your email address and name via Google OAuth to create and secure your private pantry manifest. We do not access your contacts, files, or sensitive Google Drive data.
                </p>
            </div>
            <div className="space-y-4 p-8 bg-slate-900/20 rounded-[2.5rem] border border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Eye size={16} className="text-primary-500" /> 2. Data Usage
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                    Your pantry inventory is stored locally or securely in your account to generate personalized recipes. We use industry-standard encryption to ensure your culinary preferences remain private.
                </p>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-black text-white font-serif italic tracking-tight">3. Third Party Services</h3>
            <p className="text-sm leading-relaxed text-slate-400">
                Prepzu uses Google API Services for authentication. Our use and transfer of information received from Google APIs to any other app will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" className="text-primary-500 underline">Google API Service User Data Policy</a>, including the Limited Use requirements.
            </p>

            <h3 className="text-2xl font-black text-white font-serif italic tracking-tight">4. Data Retention</h3>
            <p className="text-sm leading-relaxed text-slate-400">
                You may delete your account and all associated pantry data at any time through the "Settings" menu in the Prepzu Studio. We do not retain copies of deleted manifests.
            </p>

            <h3 className="text-2xl font-black text-white font-serif italic tracking-tight">5. Contact Information</h3>
            <p className="text-sm leading-relaxed text-slate-400">
                For more information about our privacy practices, or if you have questions, please contact us by e-mail at <span className="text-primary-500 font-bold">legal@prepzu.com</span>.
            </p>
          </div>
        </section>

        <footer className="pt-16 border-t border-white/5 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-700 italic">Official Prepzu Studio Security Protocol</p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyView;
