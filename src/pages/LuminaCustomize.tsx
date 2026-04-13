import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { BistroButton, BistroCard } from '@/components/lumina/BistroUI';
import { ChevronLeft, Check, Coffee, Droplet, Wind } from 'lucide-react';

const JUICES = ['Mora', 'Lulada', 'Maracuyá', 'Guayaba', 'Mango'];
const RICE = ['Blanco', 'Integral', 'Con Coco'];

const LuminaCustomize = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  const [choices, setChoices] = useState({
    rice: '',
    juice: ''
  });

  if (!order) return <Navigate to="/menu" replace />;

  const isComplete = choices.rice && choices.juice;

  return (
    <div className="min-h-screen bg-bistro-black text-bistro-white p-6 md:p-12 font-sans">
      <div className="max-w-xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Personalizando</p>
            <h2 className="text-xl font-bold uppercase italic tracking-tighter">{order.name}</h2>
          </div>
        </header>

        <section className="space-y-10">
          {/* Rice Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bistro-gold/10 flex items-center justify-center">
                <Wind className="w-4 h-4 text-bistro-gold" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Tipo de Arroz</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {RICE.map(item => (
                <button
                  key={item}
                  onClick={() => setChoices(prev => ({ ...prev, rice: item }))}
                  className={`p-6 rounded-3xl text-left flex justify-between items-center transition-all duration-500 border-2 ${
                    choices.rice === item ? 'bg-white text-black border-white' : 'bg-transparent border-white/5 text-white/40 hover:border-white/10'
                  }`}
                >
                  <span className="font-bold uppercase tracking-widest text-xs">Arroz {item}</span>
                  {choices.rice === item && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Juice Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bistro-gold/10 flex items-center justify-center">
                <Droplet className="w-4 h-4 text-bistro-gold" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Bebida del Día</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {JUICES.map(item => (
                <button
                  key={item}
                  onClick={() => setChoices(prev => ({ ...prev, juice: item }))}
                  className={`p-6 rounded-3xl text-center flex flex-col items-center gap-3 transition-all duration-500 border-2 ${
                    choices.juice === item ? 'bg-bistro-gold text-bistro-black border-bistro-gold shadow-lg shadow-bistro-gold/20' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                  }`}
                >
                  <Coffee className={`w-6 h-6 ${choices.juice === item ? 'text-bistro-black' : 'text-bistro-gold'}`} />
                  <span className="font-black uppercase tracking-tighter text-[10px]">{item}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="pt-10">
          <BistroButton 
            fullWidth 
            size="lg" 
            disabled={!isComplete}
            onClick={() => navigate('/summary', { state: { order: { ...order, choices } } })}
          >
            Confirmar Selección
          </BistroButton>
        </div>
      </div>
    </div>
  );
};

export default LuminaCustomize;
