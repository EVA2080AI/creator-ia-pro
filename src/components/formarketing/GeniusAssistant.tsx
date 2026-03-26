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
                <div className="flex flex-col w-[320px] h-[480px] bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    {/* V6.2 Pulse Header */}
                    <div className="pulse-node-header justify-between py-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#ff0071]/10">
                               <Bot className="h-4 w-4 text-[#ff0071]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold lowercase tracking-tight text-slate-800">genius_ai</span>
                                <span className="text-[9px] font-medium text-slate-400 lowercase">active_now</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <X className="h-4 w-4 text-slate-300 hover:text-slate-800" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm font-medium ${
                                    msg.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-tr-none' 
                                    : 'bg-[#ff0071]/[0.03] border border-[#ff0071]/5 text-slate-700 rounded-tl-none'
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
                    <div className="p-5 pt-2 border-t border-slate-50 bg-white">
                        <div className="relative group">
                            <input 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder="mensaje..."
                              className="w-full bg-slate-50 border border-transparent rounded-2xl px-5 py-3.5 pr-14 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#ff0071]/20 transition-all placeholder:text-slate-300"
                            />
                            <button 
                              onClick={handleSend}
                              disabled={isLoading || !input.trim()}
                              className="absolute right-2 top-2 p-2.5 rounded-xl bg-[#ff0071] text-white hover:bg-[#e60066] disabled:opacity-0 shadow-lg shadow-[#ff0071]/20 transition-all active:scale-95"
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
