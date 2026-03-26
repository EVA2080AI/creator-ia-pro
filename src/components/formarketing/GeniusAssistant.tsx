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
        console.log("GeniusAssistant V2.0 Industrial [Autonomous]");
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
4. Aplicar template: {"action": "apply_template", "data": {"template": "meta_ads|landing_page|social_media|antigravity_ecosystem"}}

- Mantén tus respuestas limpias, cortas y sin formato markdown innecesario.
- Sé breve y profesional, tu tono es directo y proactivo.
- Si vas a añadir un nodo, explica brevemente por qué.
- Si el usuario desea clonar algo, sugiere el nodo antigravityBridge.
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
    return (
        <div className="fixed bottom-32 right-8 z-[99999] isolation-auto">
            {/* Industrial Trigger */}
            {!isOpen && (
                <button 
                  onClick={() => setIsOpen(true)}
                  className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-3xl shadow-white/5 hover:scale-105 active:scale-95 transition-all duration-500 border border-white/10"
                >
                    <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse opacity-10" />
                    <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* Industrial Chat Panel */}
            {isOpen && (
                <div className="flex flex-col w-[380px] h-[550px] bg-[#0a0a0b]/98 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    {/* Header */}
                    <div className="flex items-center justify-between py-5 px-8 border-b border-white/5 bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xl shadow-white/5">
                               <Bot className="h-5 w-5 text-black" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[11px] font-black tracking-widest text-white uppercase mb-0.5">nexus_genius_v7</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em] leading-none">system_active</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
                            <X className="h-4.5 w-4.5 text-white/20 hover:text-white" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] px-5 py-3.5 rounded-2xl text-[12px] leading-relaxed font-bold tracking-tight ${
                                    msg.role === 'user' 
                                    ? 'bg-white text-black rounded-tr-none shadow-2xl shadow-white/5' 
                                    : 'bg-white/[0.03] border border-white/5 text-white/60 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-8 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
                        <button 
                          onClick={() => setInput("optimize_current_flow")}
                          className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black tracking-widest text-white/30 hover:bg-white hover:text-black transition-all shadow-sm lowercase"
                        >
                            <Zap className="w-3 h-3 inline mr-1" /> optimize_flow
                        </button>
                    </div>

                    {/* Input */}
                    <div className="p-8 pt-4 border-t border-white/5 bg-transparent">
                        <div className="relative group">
                            <input 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder="Describe your vision..."
                              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 pr-16 text-[12px] font-bold text-white focus:outline-none focus:bg-white/[0.04] focus:border-white/20 transition-all placeholder:text-white/10"
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
        </div>
    );
};
