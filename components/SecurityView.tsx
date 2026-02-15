
import React from 'react';
import { ShieldCheck, Lock, Cpu, Globe, ChevronLeft, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SecurityView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-300 py-20 px-6 animate-fade-in font-sans">
      <div className="max-w-4xl mx-auto space-y-16">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Studio
        </button>

        <header className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl">
              <Lock size={32} />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white font-serif italic tracking-tighter uppercase">Security.</h1>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Operational Integrity Protocol</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-4">
                <div className="text-blue-500 mb-4"><ShieldCheck size={40} /></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">OAuth 2.0</h3>
                <p className="text-sm leading-relaxed text-slate-400">Prepzu utilizes industry-standard OAuth 2.0 protocols via Google Identity Services. We never see or store your Google password.</p>
            </div>
            <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-4">
                <div className="text-primary-500 mb-4"><Fingerprint size={40} /></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Data Integrity</h3>
                <p className="text-sm leading-relaxed text-slate-400">All inventory data is encrypted in transit and at rest. Your manifest is isolated within your secure user context.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityView;
