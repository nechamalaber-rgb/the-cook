import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, ChefHat, Info, Sparkles } from 'lucide-react';
import { Ingredient, ChatMessage, Recipe } from '../types';
import { chatWithChef } from '../services/geminiService';

interface ChefChatProps {
  pantryItems: Ingredient[];
  activeRecipe?: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

const ChefChat: React.FC<ChefChatProps> = ({ pantryItems, activeRecipe, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'init', role: 'model', text: "Bonjour! I'm Chef Gemini. I see your pantry. What are we cooking today?", timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
      if (!inputText.trim()) return;
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setIsTyping(true);
      try {
          const responseText = await chatWithChef(messages, userMsg.text, pantryItems, activeRecipe);
          const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
          setMessages(prev => [...prev, botMsg]);
      } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg h-[80vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500 rounded-full shadow-lg shadow-primary-500/30"><ChefHat size={20} className="text-white" /></div>
                    <div>
                        <h3 className="font-black text-lg">Chef Intelligence</h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-widest"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> Sous-chef online</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            {activeRecipe && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 px-6 py-3 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Info size={16} className="flex-shrink-0" />
                    <span className="truncate">Context: {activeRecipe.title}</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-800/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div className="relative flex items-center">
                    <input 
                        autoFocus
                        type="text" 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                        placeholder={activeRecipe ? "Ask about this dish..." : "Ask your chef..."} 
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl py-4 pl-6 pr-16 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium border border-transparent focus:border-primary-500/50" 
                    />
                    <button onClick={handleSend} disabled={!inputText.trim() || isTyping} className="absolute right-2 p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg active:scale-95">
                        {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                    <Sparkles size={10} /> Powered by KitchenSync Brain
                </p>
            </div>
        </div>
    </div>
  );
};

export default ChefChat;