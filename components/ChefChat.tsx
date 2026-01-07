
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, ChefHat, Info, Sparkles, MessageSquare, Volume2 } from 'lucide-react';
import { Ingredient, ChatMessage, Recipe } from '../types';
import { chatWithChef, speakText } from '../services/geminiService';

interface ChefChatProps {
  pantryItems: Ingredient[];
  activeRecipe?: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

const ChefChat: React.FC<ChefChatProps> = ({ pantryItems, activeRecipe, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'init', role: 'model', text: "Bonjour! I'm your Studio Intelligence. I have full visibility of your pantry and cooking history. How can I assist your culinary journey today?", timestamp: new Date() }
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
          // Automatically speak the response
          speakText(responseText);
      } catch (e) { 
        console.error(e);
        setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Apologies, my culinary algorithms are momentarily cooling. Please try again.", timestamp: new Date() }]);
      } finally { 
        setIsTyping(false); 
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-end p-0 sm:p-6 animate-fade-in bg-slate-950/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full sm:max-w-md h-[90vh] sm:h-[700px] flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 flex justify-between items-center shrink-0 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary-500 rounded-xl shadow-lg shadow-primary-500/20 ring-1 ring-white/10">
                      <ChefHat size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-base tracking-tight">Studio AI</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Global Intelligence Active</span>
                        </div>
                    </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
            </div>
            
            {/* Context Bar */}
            <div className="bg-primary-50 dark:bg-primary-900/10 px-6 py-2.5 flex items-center justify-between border-b border-primary-100 dark:border-primary-900/30 overflow-hidden">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Sparkles size={14} className="text-primary-500 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-700 dark:text-primary-400 truncate">
                    {activeRecipe ? `Context: ${activeRecipe.title}` : `Pantry Context: ${pantryItems.length} items`}
                  </span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-800/20 no-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm leading-relaxed shadow-sm transition-all group relative ${
                          msg.role === 'user' 
                          ? 'bg-slate-900 text-white rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                        }`}>
                            {msg.text}
                            {msg.role === 'model' && (
                              <button 
                                onClick={() => speakText(msg.text)}
                                className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Volume2 size={18} />
                              </button>
                            )}
                            <div className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] rounded-bl-none p-5 shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                      <input 
                          autoFocus
                          type="text" 
                          value={inputText} 
                          onChange={(e) => setInputText(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                          placeholder="Ask anything..." 
                          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl py-4 pl-5 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-bold border border-transparent focus:border-primary-500/50" 
                      />
                      <button 
                        onClick={handleSend} 
                        disabled={!inputText.trim() || isTyping} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                      >
                        {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={10} className="text-primary-500" /> Prepzu Intelligence OS
                   </p>
                   <button className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors">
                     Clear History
                   </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChefChat;
