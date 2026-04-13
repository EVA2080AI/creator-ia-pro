import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Send, ArrowLeft, CheckCircle2, MessageSquare } from 'lucide-react';

const ResumenDePedido = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  if (!order) {
    return <Navigate to="/menu-del-dia" replace />;
  }

  const handleWhatsApp = () => {
    const message = `*NUEVO PEDIDO - DELICIAS COLOMBIANAS*%0A%0A` +
      `📅 *Día:* ${order.day}%0A` +
      `🍲 *Sopa:* ${order.soup}%0A` +
      `🍚 *Arroz:* ${order.rice}%0A` +
      `🍗 *Proteína:* ${order.protein}%0A` +
      `🥤 *Jugo:* ${order.juice}%0A%0A` +
      `_¡Gracias por tu pedido!_`;

    const whatsappUrl = `https://wa.me/573000000000?text=${message}`;
    window.open(whatsappUrl, '_blank');
    navigate('/confirmacion-envio');
  };

  const SummaryItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto space-y-8"
      >
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Regresar</span>
        </button>

        <header className="space-y-2">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            Resumen del Pedido
          </h1>
          <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            Verifica tu selección
          </p>
        </header>

        <section className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 space-y-2 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <MessageSquare className="w-20 h-20 text-white" />
          </div>
          
          <SummaryItem label="Día" value={order.day} />
          <SummaryItem label="Sopa" value={order.soup} />
          <SummaryItem label="Arroz" value={order.rice} />
          <SummaryItem label="Proteína" value={order.protein} />
          <SummaryItem label="Jugo" value={order.juice} />
        </section>

        <div className="space-y-4">
          <button
            onClick={handleWhatsApp}
            className="w-full py-5 rounded-2xl bg-[#25D366] text-black flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#25D366]/10"
          >
            <Send className="w-4 h-4" />
            Enviar por WhatsApp
          </button>
          
          <div className="flex items-center justify-center gap-2 text-zinc-600">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Pedido seguro y rápido</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResumenDePedido;
