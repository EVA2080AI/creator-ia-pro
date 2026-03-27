import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/ai-service';
import { toast } from 'sonner';

export const GeniusAssistant = ({ onAction }: { onAction: (action: string, data: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'hello operator, i am genius. how can i assist your neural orchestration today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("Genius Neural Core V8.0 [Synchronized]");
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
            const systemPrompt = `
Eres Genius AI, el copiloto experto en Aether Evolution Studio. 
Tu objetivo es ayudar al usuario a orquestar flujos de IA visuales en un canvas de React Flow.

HABILIDADES NEURALES:
Puedes ejecutar comandos en el canvas devolviendo un bloque JSON al final de tu respuesta.
Formatos de comando soportados:
1. Añadir nodo: {"action": "add_node", "data": {"type": "characterBreakdown|modelView|videoModel|layoutBuilder|campaignManager", "data": {"title": "...", "prompt": "..."}}}
2. Conectar nodos: {"action": "connect_nodes", "data": {"source": "node_id_1", "target": "node_id_2"}}
4. Aplicar template: {"action": "apply_template", "data": {"template": "meta_ads|landing_page|social_media|antigravity_ecosystem"}}

- Mantén tus respuestas limpias, cortas y profesionales.
- Tu tono es directo, proactivo e industrial.
- Si vas a añadir un nodo, explica brevemente el propósito de la manifestación.
`;

            const response = await aiService.processAction({
                action: 'chat',
                prompt: `${systemPrompt}\n\nUser: ${userMsg}`,
                model: 'gemini-3-flash'
            });

            const content = response.text || 'could not manifest a response.';
            
            const jsonMatch = content.match(/\{.*"action".*\}/s);
            if (jsonMatch && onAction) {
                try {
                    const commandData = JSON.parse(jsonMatch[0]);
                    onAction(commandData.action, commandData.data);
                } catch (e) {
                    console.error("Neural command parse error:", e);
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: content.replace(/\{.*"action".*\}/s, '').trim() || 'Command orchestrated.' }]);
        } catch (error: any) {
            toast.error("Neural core error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 left-6 z-[99999] isolation-auto">
            {!isOpen && (
                <button 
                  onClick={() => setIsOpen(true)}
                  className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-4xl hover:scale-105 active:scale-95 transition-all duration-500 border border-white/10"
                >
                    <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse opacity-10" />
                    <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {isOpen && (
                <div className="flex flex-col w-[380px] h-[550px] bg-[#0a0a0b]/98 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between py-5 px-8 border-b border-white/5 bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xl">
                               <Bot className="h-5 w-5 text-black" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase font-display mb-0.5">Genius Neural Core</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-aether-purple animate-pulse" />
                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] font-display">v8.0 Operational</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
                            <X className="h-4.5 w-4.5 text-white/20 hover:text-white" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={cn(
                                    "max-w-[90%] px-5 py-3.5 rounded-2xl text-[12px] leading-relaxed font-bold tracking-tight font-display",
                                    msg.role === 'user' 
                                    ? 'bg-white text-black rounded-tr-none shadow-2xl' 
                                    : 'bg-white/[0.03] border border-white/5 text-white/40 rounded-tl-none'
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-8 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
                        <button 
                          onClick={() => setInput("Optimize orchestration flow")}
                          className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold tracking-widest text-white/20 hover:bg-white hover:text-black transition-all shadow-sm uppercase font-display"
                        >
                            <Zap className="w-3 h-3 inline mr-1" /> optimize_flow
                        </button>
                    </div>

                    <div className="p-8 pt-4 border-t border-white/5 bg-transparent">
                        <div className="relative group">
                            <input 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder="Describe your vision..."
                              className="w-full bg-white/[0.02] border border-white/5 rounded-2.5xl px-6 py-4 pr-16 text-[12px] font-bold text-white focus:outline-none focus:bg-white/[0.04] focus:border-white/20 transition-all placeholder:text-white/10 font-display"
                            />
                            <button 
                              onClick={handleSend}
                              disabled={isLoading || !input.trim()}
                              className="absolute right-2 top-2 p-2.5 rounded-xl bg-white text-black disabled:opacity-10 shadow-xl transition-all active:scale-95"
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
