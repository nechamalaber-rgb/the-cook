
import React from 'react';
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-300 py-20 px-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-12">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-primary-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Studio
        </button>

        <header className="space-y-4">
          <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 border border-primary-500/20 shadow-xl">
            <Shield size={32} />
          </div>
          <h1 className="text-5xl font-black text-white font-serif italic tracking-tighter">Privacy Policy.</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Last Updated: February 13, 2026</p>
        </header>

        <section className="space-y-8 prose prose-invert max-w-none">
          <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Eye className="text-primary-500" size={20} /> Data Transparency
            </h2>
            <p className="text-sm leading-relaxed">
              At Prepzu, we prioritize the privacy and security of your culinary data. This policy explains how we collect and manage information when you use the Prepzu Studio.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">1. Information We Collect</h3>
            <p className="text-sm leading-relaxed">
              We collect information you provide directly, such as your name and email when you sign in via Google. We also store your pantry inventory and recipe preferences locally or in your secure account manifest to provide intelligent recipe curation.
            </p>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">2. Use of Google Data</h3>
            <p className="text-sm leading-relaxed">
              Prepzu uses Google OAuth for authentication. We only access your basic profile information (name, email, and profile picture) to personalize your studio experience. We do not sell this data to third parties.
            </p>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">3. Pantry Intelligence</h3>
            <p className="text-sm leading-relaxed">
              Images captured for pantry scanning are processed via encrypted channels and are used solely to identify food items for your inventory list. These images are not stored permanently unless specifically requested for recipe history.
            </p>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">4. Security</h3>
            <p className="text-sm leading-relaxed">
              Your session is protected with industry-standard encryption. We utilize modern cloud infrastructure to ensure your manifest remains private and accessible only by you.
            </p>

            <h3 className="text-lg font-black text-white uppercase tracking-tight">5. Contact</h3>
            <p className="text-sm leading-relaxed">
              For questions regarding your data, contact the studio administration at <span className="text-primary-500">support@prepzu.com</span>.
            </p>
          </div>
        </section>

        <footer className="pt-12 border-t border-white/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic">Prepzu Studio Security Protocol</p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyView;
