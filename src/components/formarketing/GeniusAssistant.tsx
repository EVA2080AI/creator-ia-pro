import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiService } from '@/services/ai-service';
import { toast } from 'sonner';

export const GeniusAssistant = ({ onAction }: { onAction: (action: string, data: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'hola, soy genius. ¿cómo puedo ayudarte a crear nuevos flujos de marketing hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("GeniusAssistant V6.2 Pulse [Autonomous]");
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
Eres Genius AI, el copiloto experto en Formarketing Studio. 
Tu objetivo es ayudar al usuario a crear flujos de marketing visuales en un canvas de React Flow.

HABILIDADES ESPECIALES:
Puedes ejecutar comandos en el canvas devolviendo un bloque JSON al final de tu respuesta.
Formatos de comando soportados:
1. Añadir nodo: {"action": "add_node", "data": {"type": "characterBreakdown|modelView|videoModel|layoutBuilder|campaignManager", "data": {"title": "...", "prompt": "..."}}}
2. Conectar nodos: {"action": "connect_nodes", "data": {"source": "node_id_1", "target": "node_id_2"}}
3. Aplicar template: {"action": "apply_template", "data": {"template": "meta_ads|landing_page|social_media"}}

REGLAS:
- Si el usuario pide crear algo, SIEMPRE propón añadir nodos.
- Mantén tus respuestas en minúsculas (estética Pulse).
- Sé breve y profesional.
- Si vas a añadir un nodo, explica brevemente por qué.
`;

            const response = await aiService.processAction({
                action: 'chat',
                prompt: `${systemPrompt}\n\nUsuario: ${userMsg}`,
                model: 'gemini-3-flash'
            });

            const content = response.text || 'no pude procesar eso.';
            
            // Parse for commands
            const jsonMatch = content.match(/\{.*"action".*\}/s);
            if (jsonMatch && onAction) {
                try {
                    const commandData = JSON.parse(jsonMatch[0]);
                    onAction(commandData.action, commandData.data);
                } catch (e) {
                    console.error("Error parsing assistant command:", e);
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: content.replace(/\{.*"action".*\}/s, '').trim() || 'comando ejecutado.' }]);
        } catch (error: any) {
            toast.error("error en el asistente: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-32 right-8 z-[99999] isolation-auto">
            {/* Pulse Trigger */}
            {!isOpen && (
                <button 
                  onClick={() => setIsOpen(true)}
                  className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff0071] shadow-2xl shadow-[#ff0071]/30 hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white"
                >
                    <div className="absolute inset-0 rounded-2xl bg-[#ff0071] animate-ping opacity-20" />
                    <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* Pulse Chat Panel */}
            {isOpen && (
                <div className="flex flex-col w-[360px] h-[520px] bg-[#0a0a0b]/90 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    {/* V7.0 Pulse Header */}
                    <div className="flex items-center justify-between py-5 px-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-xl bg-[#ff0071]/10 shadow-lg shadow-[#ff0071]/10">
                               <Bot className="h-4.5 w-4.5 text-[#ff0071]" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[12px] font-black lowercase tracking-tighter text-white">genius_nexus_v7</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff0071] animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">autonomous</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
                            <X className="h-4.5 w-4.5 text-slate-500 hover:text-white" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[88%] px-5 py-3.5 rounded-2xl text-[11px] leading-relaxed shadow-2xl font-bold tracking-tight ${
                                    msg.role === 'user' 
                                    ? 'bg-[#ff0071] text-white rounded-tr-none shadow-[#ff0071]/20' 
                                    : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                        <button 
                          onClick={() => setInput("optimizar flujo")}
                          className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-[#ff0071]/[0.05] border border-[#ff0071]/10 text-[10px] font-bold lowercase tracking-tight text-[#ff0071] hover:bg-[#ff0071] hover:text-white transition-all shadow-sm shadow-[#ff0071]/10"
                        >
                            <Zap className="w-2.5 h-2.5 inline mr-1" /> optimizar flujo
                        </button>
                    </div>

                    {/* Input */}
                    <div className="p-6 pt-3 border-t border-white/5 bg-white/[0.01]">
                        <div className="relative group">
                            <input 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder="mensaje industrial..."
                              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 pr-16 text-[11px] font-black text-white focus:outline-none focus:bg-white/10 focus:border-[#ff0071]/40 transition-all placeholder:text-slate-700"
                            />
                            <button 
                              onClick={handleSend}
                              disabled={isLoading || !input.trim()}
                              className="absolute right-2.5 top-2.5 p-3 rounded-xl bg-[#ff0071] text-white hover:bg-[#e60066] disabled:opacity-0 shadow-2xl shadow-[#ff0071]/20 transition-all active:scale-95"
                            >
                                <Send className="h-4.5 w-4.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
