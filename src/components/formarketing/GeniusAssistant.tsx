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
                <div className="flex flex-col w-[320px] h-[460px] bg-[#0a0a0b]/98 border border-white/10 rounded-[2rem] shadow-2xl backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary/20 p-1.5 rounded-lg">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/90">Genius AI</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">E-Industrial Mode</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] px-3.5 py-2.5 rounded-xl text-[11px] leading-relaxed shadow-sm font-medium ${
                                    msg.role === 'user' 
                                    ? 'bg-primary/90 text-primary-foreground' 
                                    : 'bg-white/5 border border-white/5 text-foreground/80'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                        <button 
                          onClick={() => setInput("Optimizar flujo")}
                          className="whitespace-nowrap px-2.5 py-1 rounded-full border border-white/5 bg-white/5 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                        >
                            <Zap className="w-2 h-2 inline mr-0.5" /> Optimizar
                        </button>
                    </div>

                    {/* Input */}
                    <div className="p-4 pt-1">
                        <div className="relative group">
                            <input 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder="Pregunta a Genius..."
                              className="w-full bg-[#161618] border border-white/5 rounded-xl px-4 py-2.5 pr-12 text-[11px] focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                            />
                            <button 
                              onClick={handleSend}
                              disabled={isLoading || !input.trim()}
                              className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-0 transition-all"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
