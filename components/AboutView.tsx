import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ScanLine, Sparkles, ArrowRight, ShieldCheck, Cpu, Eye, 
  Info, AlertTriangle, BookOpen, Flame, Clock, Microscope, 
  Settings, ChefHat, Database, Zap
} from 'lucide-react';
import { Logo } from './Logo';

const AboutView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in pb-24 max-w-5xl mx-auto px-4">
      
      {/* HEADER SECTION */}
      <section className="text-center py-20 relative border-b border-slate-200 dark:border-slate-800 mb-16">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary-500/10 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
        <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 font-serif tracking-tighter leading-none">
              Studio <span className="text-primary-500">Logic.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Understanding the Studio Engine: How we orchestrate your culinary data and where our intelligence meets reality.
            </p>
        </div>
      </section>

      {/* CRITICAL ACCURACY DISCLAIMER */}
      <section className="mb-20">
          <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-500/30 rounded-[3rem] p-10 md:p-14 relative overflow-hidden group">
               <div className="flex flex-col md:flex-row gap-10 items-start">
                   <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                       <AlertTriangle size={32} />
                   </div>
                   <div className="space-y-6">
                       <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-white uppercase tracking-tight">Technical Accuracy Notice</h2>
                       <div className="space-y-4 text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                           <p>
                             Prepzu is an AI-powered orchestration engine. While we utilize state-of-the-art Large Language Models (Gemini 3 series), **our outputs are estimations and NOT 100% accurate.**
                           </p>
                           <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <li className="flex items-start gap-3 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                                   <span className="text-xs font-bold">Nutritional data (calories, macros) are calculated based on general averages, not specific brand lab tests.</span>
                               </li>
                               <li className="flex items-start gap-3 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                                   <span className="text-xs font-bold">Recipe times and temperatures are suggested based on standard logic; actual hardware performance varies.</span>
                               </li>
                               <li className="flex items-start gap-3 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                                   <span className="text-xs font-bold">Ingredient substitutions may not always account for complex chemical reactions in baking or advanced techniques.</span>
                               </li>
                               <li className="flex items-start gap-3 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                                   <span className="text-xs font-bold">Image visualizations are AI-generated and may not perfectly represent the final plated dish.</span>
                               </li>
                           </ul>
                           <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-6 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                             Always verify food safety, internal temperatures, and allergen data manually.
                           </p>
                       </div>
                   </div>
               </div>
          </div>
      </section>

      {/* SYSTEM ARCHITECTURE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 mb-8">
                   <Microscope size={28} />
               </div>
               <h3 className="text-2xl font-black font-serif mb-4 text-slate-900 dark:text-white">Studio Curation Logic</h3>
               <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6">
                 Our recipes aren't "searched"—they are synthesized. The Studio Engine analyzes your available inventory, household size, and time constraints to draft a technical instruction set unique to your session.
               </p>
               <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <div className="flex items-center gap-2 mb-2">
                       <Database size={14} className="text-primary-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Sources</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">OpenFoodRepo API + LLM Technical Knowledge Base + User Preferences Matrix</p>
               </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 mb-8">
                   <Eye size={28} />
               </div>
               <h3 className="text-2xl font-black font-serif mb-4 text-slate-900 dark:text-white">Vision Recognition</h3>
               <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6">
                 When you scan a receipt or a shelf, we use OCR and multimodal object detection. It identifies item names and maps them to common culinary categories automatically.
               </p>
               <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <div className="flex items-center gap-2 mb-2">
                       <Zap size={14} className="text-indigo-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Processing Time</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Average 3.4 seconds per scan cycle. Accuracy depends on lighting and text clarity.</p>
               </div>
          </div>

      </section>

      {/* CALL TO ACTION */}
      <section className="text-center">
          <button 
            onClick={() => navigate('/studio')}
            className="inline-flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Return to Studio <ArrowRight size={20} />
          </button>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Prepzu Intelligence System • Version 1.2
          </p>
      </section>

    </div>
  );
};

export default AboutView;