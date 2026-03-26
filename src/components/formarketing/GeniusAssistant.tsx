import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiService } from '@/services/ai-service';
import { toast } from 'sonner';

export const GeniusAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Hola, soy Genius. ¿Cómo puedo ayudarte a optimizar tu flujo de marketing hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("GeniusAssistant V5.3 Rendered [Industrial]");
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await aiService.processAction({
                action: 'chat',
                prompt: `Actúa como un experto en marketing digital y automatización. Ayuda al usuario con su flujo de trabajo en Formarketing Studio. Pregunta: ${userMsg}`,
                model: 'gemini-3-flash'
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'No pude procesar eso en este momento lo siento.' }]);
        } catch (error: any) {
            toast.error("Error en el asistente: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-32 right-8 z-[99999] isolation-auto">
            {/* Bubble Trigger */}
            {!isOpen && (
                <button 
                  onClick={() => setIsOpen(true)}
                  className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/40 hover:scale-110 transition-all duration-300"
                >
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                    <Sparkles className="h-6 w-6 text-primary-foreground group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="flex flex-col w-[380px] h-[520px] bg-[#0a0a0b]/95 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-xl">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-widest">Genius AI</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">E-Industrial Mode</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary/90 text-primary-foreground' 
                                    : 'bg-white/5 border border-white/5 text-foreground/90'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-2">
                                    <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                                    <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-6 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                        <button 
                          onClick={() => setInput("Optimiza mi flujo actual")}
                          className="whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                        >
                            <Zap className="w-2.5 h-2.5 inline mr-1" /> Optimizar Flujo
                        </button>
                        <button 
                          onClick={() => setInput("Genera un script de Reel")}
                          className="whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                        >
                            <Sparkles className="w-2.5 h-2.5 inline mr-1" /> Reel Script
                        </button>
                    </div>

                    {/* Input */}
                    <div className="p-6 pt-2">
                        <div className="relative group">
                            <input 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder="Pregúntale a Genius..."
                              className="w-full bg-[#161618] border border-white/10 rounded-2xl px-5 py-3.5 pr-14 text-[13px] focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                            />
                            <button 
                              onClick={handleSend}
                              disabled={isLoading || !input.trim()}
                              className="absolute right-2 top-1.5 p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-0 transition-all"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
