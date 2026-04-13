import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BistroButton, BistroCard } from '@/components/lumina/BistroUI';
import { Utensils, ChevronRight, Clock, Star, MapPin } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MENU_ITEMS = [
  { id: '1', name: 'Sancocho Trifásico', description: 'Pollo, cerdo y res con vegetales frescos.', price: '$25.000', options: ['Arroz Blanco', 'Arroz Coco'] },
  { id: '2', name: 'Bandeja Paisa Premium', description: 'Corte de res madurado, chicharrón crocante.', price: '$35.000', options: ['Arroz Blanco', 'Arroz Integral'] },
  { id: '3', name: 'Ajiaco Santafereño', description: 'Tres tipos de papa, guasca y crema de leche.', price: '$28.000', options: ['Con Aguacate', 'Sin Aguacate'] },
];

const LuminaMenu = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [order, setOrder] = useState<any>(null);

  const handleSelectDish = (dish: any) => {
    setOrder({ ...dish, day: selectedDay });
  };

  return (
    <div className="min-h-screen bg-bistro-black text-bistro-white font-sans selection:bg-bistro-gold/30 selection:text-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-bistro-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/2 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 space-y-20">
        <header className="flex flex-col items-center text-center space-y-6">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 bg-bistro-gold rounded-[2rem] flex items-center justify-center shadow-3xl shadow-bistro-gold/20"
          >
            <Utensils className="w-10 h-10 text-bistro-black" />
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9]">
              Lumina <span className="text-bistro-gold">Bistro</span>
            </h1>
            <div className="flex items-center justify-center gap-6 text-[10px] uppercase font-black tracking-[0.3em] text-white/40">
              <span className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Bogotá, COL</span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="flex items-center gap-2"><Star className="w-3 h-3 text-bistro-gold" /> 4.9 Premium</span>
            </div>
          </div>
        </header>

        {/* Day Selector */}
        <div className="space-y-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-bistro-gold/60">Selecciona el Día</p>
          <div className="flex flex-wrap justify-center gap-3">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 border ${
                  selectedDay === day 
                    ? 'bg-bistro-gold text-bistro-black border-bistro-gold shadow-xl' 
                    : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:bg-white/10'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="wait">
            {MENU_ITEMS.map((dish, idx) => (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <BistroCard className={`h-full flex flex-col justify-between cursor-pointer group transition-all duration-500 ${order?.id === dish.id ? 'border-bistro-gold/50 bg-bistro-gold/[0.02]' : 'hover:border-white/20'}`} onClick={() => handleSelectDish(dish)}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-bistro-gold/10 transition-colors">
                        <Clock className="w-4 h-4 text-bistro-gold" />
                      </div>
                      <span className="text-lg font-black italic text-bistro-gold tracking-tight">{dish.price}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold uppercase tracking-tighter">{dish.name}</h3>
                      <p className="text-sm text-white/50 leading-relaxed font-medium">{dish.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black tracking-widest uppercase text-bistro-gold">Personalizar</span>
                    <ChevronRight className="w-4 h-4 text-bistro-gold" />
                  </div>
                </BistroCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Action Footer */}
        <AnimatePresence>
          {order && (
            <motion.footer 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-10 left-6 right-6 z-50 pointer-events-none"
            >
              <div className="max-w-md mx-auto pointer-events-auto">
                <BistroButton 
                  fullWidth 
                  size="lg"
                  onClick={() => navigate('/customize', { state: { order } })}
                  className="shadow-[0_20px_50px_rgba(212,175,55,0.3)]"
                >
                  Continuar con {order.name}
                </BistroButton>
              </div>
            </motion.footer>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LuminaMenu;
