
import React, { useState, useEffect } from 'react';
import { X, Play, Loader2, Sparkles, Film, Volume2, ShieldAlert, Key } from 'lucide-react';
import { Ingredient, UserPreferences } from '../types';
import { generateKitchenTrailer, speakText } from '../services/geminiService';

interface StudioReelProps {
    isOpen: boolean;
    onClose: () => void;
    pantryItems: Ingredient[];
    preferences: UserPreferences;
}

export const StudioReel: React.FC<StudioReelProps> = ({ isOpen, onClose, pantryItems, preferences }) => {
    const [status, setStatus] = useState<'idle' | 'generating' | 'playing' | 'error'>('idle');
    const [progressMsg, setProgressMsg] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [script, setScript] = useState('');

    const startSynthesis = async () => {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
            return;
        }

        setStatus('generating');
        try {
            const result = await generateKitchenTrailer(pantryItems, preferences, (msg) => setProgressMsg(msg));
            setVideoUrl(result.videoUrl);
            setScript(result.script);
            setStatus('playing');
            
            // Narrate the script once video is ready
            setTimeout(() => speakText(result.script, 'Zephyr'), 1000);
        } catch (err: any) {
            console.error(err);
            if (err.message?.includes("Requested entity was not found")) {
                await (window as any).aistudio.openSelectKey();
            }
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center animate-fade-in p-6">
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all z-[1010]"
            >
                <X size={24} />
            </button>

            {status === 'idle' && (
                <div className="max-w-xl text-center space-y-10 animate-slide-up">
                    <div className="w-24 h-24 bg-primary-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary-500/20">
                        <Film size={48} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-6xl font-black font-serif text-white tracking-tighter leading-none">Cinema Studio</h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            Synthesize a high-fidelity cinematic trailer of your current kitchen inventory. Powered by Veo Fast Synthesis.
                        </p>
                    </div>
                    <button 
                        onClick={startSynthesis}
                        className="w-full py-8 bg-white text-slate-950 rounded-[2rem] font-black text-xl uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                        <Play fill="currentColor" size={24} /> Start Synthesis
                    </button>
                    <div className="flex items-center justify-center gap-4 opacity-40">
                         <span className="text-[10px] font-black uppercase tracking-widest text-white border border-white/20 px-3 py-1 rounded-lg">Veo 3.1 Fast</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-white border border-white/20 px-3 py-1 rounded-lg">Gemini 3 Pro</span>
                    </div>
                </div>
            )}

            {status === 'generating' && (
                <div className="text-center space-y-12 animate-fade-in max-w-lg">
                    <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-primary-500">
                            <Sparkles size={40} className="animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black font-serif text-white uppercase tracking-widest">{progressMsg}</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Veo logic is visualizing your pantry assets...</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-left">
                        <div className="flex items-center gap-2 mb-2 text-primary-400">
                             <Key size={14} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Environment Status</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Generating video assets usually takes 60-90 seconds. This process consumes Studio Elite credits. Do not refresh.
                        </p>
                    </div>
                </div>
            )}

            {status === 'playing' && (
                <div className="w-full max-w-6xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 relative group animate-slide-up">
                    <video 
                        src={videoUrl} 
                        autoPlay 
                        controls 
                        className="w-full h-full object-cover"
                        onEnded={() => setStatus('idle')}
                    />
                    <div className="absolute bottom-12 left-12 right-12 p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="flex items-center gap-3 mb-3 text-primary-400">
                            <Volume2 size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Studio Narration Active</span>
                        </div>
                        <p className="text-white text-xl font-bold font-serif italic leading-relaxed">
                            "{script}"
                        </p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="text-center space-y-8 animate-fade-in">
                    <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                        <ShieldAlert size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black font-serif text-white">Synthesis Blocked</h3>
                        <p className="text-slate-500 text-sm font-medium">Veo requires an active Studio Elite Link. Please re-authenticate.</p>
                    </div>
                    <button 
                        onClick={startSynthesis}
                        className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                        Retry Authenticate
                    </button>
                </div>
            )}
        </div>
    );
};
