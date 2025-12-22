import React from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Logo } from './Logo';

const AboutView: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      title: "GATHER",
      subtitle: "Sync your inventory in seconds.",
      description: "Snap a photo of your receipt or shelf. Our AI identifies every ingredient, estimates expiry dates, and categorizes your pantry automatically. No more manual typing.",
      icon: <ScanLine size={32} />,
      color: "bg-primary-500",
      lightColor: "bg-primary-50 dark:bg-primary-950/30",
      textColor: "text-primary-600 dark:text-primary-400"
    },
    {
      title: "PLAN",
      subtitle: "Smart menus, zero waste.",
      description: "Chef Gemini reviews your pantry to curate 6 custom recipes. It prioritizes items about to expire, helping you save money and the planet one meal at a time.",
      icon: <Sparkles size={32} />,
      color: "bg-accent-500",
      lightColor: "bg-accent-50 dark:bg-accent-950/30",
      textColor: "text-accent-600 dark:text-accent-400"
    },
    {
      title: "SHOP",
      subtitle: "Bridge the gap with one tap.",
      description: "Missing a staple? Add it to your smart cart. Export your list directly to Walmart or use our Instacart integration to fill your physical cart instantly.",
      icon: <ShoppingCart size={32} />,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 dark:bg-emerald-950/30",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "COOK",
      subtitle: "Voice-guided culinary bliss.",
      description: "Step into Cook Mode with our hands-free voice assistant. As you finish, we automatically update your inventory so you always know what's in stock.",
      icon: <ChefHat size={32} />,
      color: "bg-rose-500",
      lightColor: "bg-rose-50 dark:bg-rose-950/30",
      textColor: "text-rose-600 dark:text-rose-400"
    }
  ];

  return (
    <div className="animate-fade-in pb-24 max-w-5xl mx-auto px-4">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-black uppercase tracking-widest text-slate-500 mb-8 border border-slate-200 dark:border-slate-700">
           <Zap size={14} className="text-primary-500" />
           Culinary Intelligence Reimagined
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 font-serif tracking-tight leading-none">
          Eat better.<br/><span className="text-primary-600">Waste less.</span>
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
          Savor Studio transforms your pantry from a storage space into a creative studio. Manage, plan, and cook with pure intelligence.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
        >
          Start Your Kitchen Studio <ArrowRight size={20} />
        </button>
      </section>

      {/* The Narrative Flow */}
      <section className="space-y-32 mb-24">
        {steps.map((step, idx) => (
          <div key={step.title} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20`}>
            {/* Visual Block */}
            <div className="flex-1 w-full">
               <div className={`aspect-square md:aspect-[4/3] ${step.lightColor} rounded-[3rem] border border-slate-200 dark:border-slate-800 flex items-center justify-center relative overflow-hidden group shadow-sm`}>
                  <div className={`absolute top-0 right-0 w-64 h-64 ${step.color} opacity-5 rounded-full blur-[80px] group-hover:scale-110 transition-transform`}></div>
                  <div className={`p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl ${step.textColor} transform group-hover:-rotate-3 transition-transform duration-500`}>
                      {step.icon}
                  </div>
                  
                  {/* Floating elements for visual interest */}
                  <div className="absolute bottom-10 left-10 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-float opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className={`w-2 h-2 rounded-full ${step.color}`}></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Processing...</span>
                  </div>
               </div>
            </div>

            {/* Content Block */}
            <div className="flex-1 text-center md:text-left">
               <span className={`text-xs font-black tracking-[0.2em] ${step.textColor} mb-4 block`}>STEP {idx + 1}: {step.title}</span>
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 font-serif">{step.subtitle}</h2>
               <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                 {step.description}
               </p>
            </div>
          </div>
        ))}
      </section>

      {/* Trust & Tech Section */}
      <section className="bg-slate-900 dark:bg-white rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden mb-24">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 to-transparent opacity-50"></div>
          <div className="relative z-10 flex flex-col items-center">
              <div className="p-4 bg-white/10 dark:bg-slate-100 rounded-3xl mb-8">
                <Logo className="w-16 h-16 text-white dark:text-slate-900" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white dark:text-slate-900 mb-6 font-serif leading-tight">
                Built with the future of AI.
              </h2>
              <p className="text-slate-400 dark:text-slate-500 max-w-xl mx-auto mb-12 text-lg font-medium">
                We leverage Gemini 3 Pro and Imagen 4 to deliver a culinary experience that understands you perfectly. From analyzing complex grocery receipts to generating high-fidelity food imagery.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                  {[
                    { label: "Vision", val: "Multimodal Analysis" },
                    { label: "Brain", val: "Gemini 3 Pro" },
                    { label: "Visuals", val: "Imagen 4.0" },
                    { label: "Voice", val: "Real-time TTS" }
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-2xl bg-white/5 dark:bg-slate-100 border border-white/10 dark:border-slate-200">
                        <div className="text-[10px] font-black uppercase text-primary-400 mb-1">{item.label}</div>
                        <div className="text-xs font-bold text-white dark:text-slate-700">{item.val}</div>
                    </div>
                  ))}
              </div>
          </div>
      </section>

      {/* CTA Footer */}
      <section className="text-center py-10">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 font-serif">Ready to transform your kitchen?</h3>
          <button 
            onClick={() => navigate('/')}
            className="px-12 py-5 bg-primary-600 text-white rounded-full font-black text-xl shadow-xl shadow-primary-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Create Your First Menu
          </button>
          <p className="mt-6 text-slate-400 text-sm font-medium italic">Join thousands of home chefs cooking smarter.</p>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default AboutView;