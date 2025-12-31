
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ScanLine, 
  Sparkles, 
  ShoppingCart, 
  ChefHat, 
  ArrowRight, 
  Zap, 
  Package, 
  Calendar,
  Utensils,
  History,
  CheckCircle2,
  Cpu,
  Eye,
  Mic,
  Home
} from 'lucide-react';
import { Logo } from './Logo';

const AboutView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in pb-24 max-w-6xl mx-auto px-4">
      
      {/* HEADER SECTION */}
      <section className="text-center py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary-100 dark:bg-primary-900/10 rounded-[100%] blur-[120px] opacity-60 pointer-events-none"></div>
        <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                GatherHome OS 1.0
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-6 font-serif tracking-tighter leading-[0.9]">
              The Operating System <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">for Your Kitchen.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
              A unified intelligence that manages inventory, curates menus, and orchestrates your culinary life.
            </p>
            <div className="flex justify-center gap-4">
                <button 
                onClick={() => navigate('/')}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                Launch Studio <ArrowRight size={20} />
                </button>
            </div>
        </div>
      </section>

      {/* BENTO GRID SHOWCASE */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          
          {/* VISION CARD */}
          <div className="md:col-span-2 bg-slate-900 text-white rounded-[3rem] p-10 md:p-14 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
               <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="mb-12">
                       <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-indigo-400 mb-6 backdrop-blur-md border border-white/10">
                           <ScanLine size={32} />
                       </div>
                       <h2 className="text-4xl font-black font-serif mb-4">Vision Intelligence</h2>
                       <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                           Don't type. Just snap. Our multimodal intelligence analyzes receipts and pantry shelves to instantly digitize your inventory with 99% accuracy.
                       </p>
                   </div>
                   <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm max-w-sm ml-auto transform group-hover:-translate-y-2 transition-transform duration-500">
                       <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                           <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center"><Eye size={18} className="text-indigo-400"/></div>
                           <div>
                               <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Scanning</div>
                               <div className="font-bold">Whole Foods Receipt</div>
                           </div>
                       </div>
                       <div className="space-y-2">
                           <div className="flex justify-between text-sm font-medium text-slate-300"><span>Org. Avocados</span><span>x4</span></div>
                           <div className="flex justify-between text-sm font-medium text-slate-300"><span>Almond Milk</span><span>x1</span></div>
                           <div className="flex justify-between text-sm font-medium text-slate-300"><span>Sourdough</span><span>x1</span></div>
                       </div>
                   </div>
               </div>
          </div>

          {/* GENERATION CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group">
               <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary-50 dark:from-primary-900/20 to-transparent"></div>
               <div className="relative z-10">
                   <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 mb-6">
                       <Sparkles size={28} />
                   </div>
                   <h2 className="text-3xl font-black font-serif mb-4 text-slate-900 dark:text-white">Studio Chef</h2>
                   <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                       Context-aware recipe generation that respects your allergies, appliances, and goals.
                   </p>
                   <div className="space-y-3">
                       {['Zero Waste', 'Macro-Balanced', 'Cuisine Specific'].map((tag, i) => (
                           <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                               <CheckCircle2 size={16} className="text-primary-500" /> {tag}
                           </div>
                       ))}
                   </div>
               </div>
          </div>

          {/* LOGISTICS CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
               <div>
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                        <ShoppingCart size={28} />
                    </div>
                    <h2 className="text-3xl font-black font-serif mb-4 text-slate-900 dark:text-white">Auto Logistics</h2>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        Export your grocery needs to Instacart or Walmart.
                    </p>
               </div>
               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
               </div>
          </div>

          {/* VOICE CARD */}
          <div className="md:col-span-2 bg-slate-100 dark:bg-slate-800 rounded-[3rem] p-10 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
               <div className="flex-1">
                   <div className="w-16 h-16 bg-rose-500 text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20">
                       <Mic size={32} />
                   </div>
                   <h2 className="text-4xl font-black font-serif mb-4 text-slate-900 dark:text-white">Hands-Free Studio</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-8">
                       Cooking is messy. Use our voice-guided mode to step through recipes without touching your screen.
                   </p>
                   <button onClick={() => navigate('/')} className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-transform">Enter Cook Mode</button>
               </div>
               <div className="flex-1 flex justify-center">
                    <div className="w-64 h-64 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
                        <div className="absolute inset-4 border-4 border-rose-500/40 rounded-full animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
                        <ChefHat size={64} className="text-rose-500 relative z-10" />
                    </div>
               </div>
          </div>
      </section>

      {/* TECH STACK FOOTER */}
      <section className="text-center pb-20">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Powered By Next-Gen Infrastructure</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-12 opacity-50">
             <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400"><Cpu size={16}/> Neural Engine 3.0</div>
             <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400"><Eye size={16}/> Vision 4.0</div>
             <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400"><Zap size={16}/> React 19</div>
          </div>
      </section>

    </div>
  );
};

export default AboutView;
