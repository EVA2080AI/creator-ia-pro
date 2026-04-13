import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { BistroButton, BistroCard } from '@/components/lumina/BistroUI';
import { MessageCircle, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';

const LuminaSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  if (!order) return <Navigate to="/menu" replace />;

  const handleSendOrder = () => {
    const text = `*✨ NUEVO PEDIDO LUMINA BISTRO ✨*%0A%0A` +
      `🍽️ *Plato:* ${order.name}%0A` +
      `📅 *Día:* ${order.day}%0A` +
      `🍚 *Arroz:* ${order.choices.rice}%0A` +
      `🥤 *Bebida:* ${order.choices.juice}%0A%0A` +
      `💰 *Total:* ${order.price}%0A%0A` +
      `_Enviado desde el lienzo de Creator IA_`;
    
    window.open(`https://wa.me/573000000000?text=${text}`, '_blank');
    navigate('/success');
  };

  return (
    <div className="min-h-screen bg-bistro-black text-bistro-white p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto space-y-8 py-12"
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Revisar Pedido</span>
        </button>

        <header className="space-y-2">
          <div className="w-12 h-1 bg-bistro-gold rounded-full mb-6" />
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
            Finaliza tu <span className="text-bistro-gold text-5xl flex">Experiencia</span>
          </h1>
        </header>

        <BistroCard className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag className="w-24 h-24" />
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-bistro-gold">Resumen de Selección</p>
              <h3 className="text-2xl font-bold italic tracking-tighter">{order.name}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex justify-between border-b border-white/5 py-3">
                <span className="text-white/40">Guarnición</span>
                <span className="font-bold text-white">Arroz {order.choices.rice}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-3">
                <span className="text-white/40">Bebida</span>
                <span className="font-bold text-white">Jugo de {order.choices.juice}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-3">
                <span className="text-white/40">Programado para</span>
                <span className="font-bold text-white">{order.day}</span>
              </div>
            </div>

            <div className="flex justify-between items-end pt-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Monto Final</span>
              <span className="text-3xl font-black italic text-white tracking-tighter">{order.price}</span>
            </div>
          </div>
        </BistroCard>

        <div className="space-y-4">
          <BistroButton fullWidth size="lg" onClick={handleSendOrder} className="bg-[#25D366] text-black hover:bg-[#20bd5a] flex gap-3">
            <MessageCircle className="w-5 h-5" />
            Enviar por WhatsApp
          </BistroButton>
          
          <div className="flex items-center justify-center gap-3 py-4 text-white/20">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Pago contra entrega asegurado</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LuminaSummary;
