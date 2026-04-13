import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Coffee, UtensilsCrossed, Waves, Droplet } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SOUPS = ['Sopa de Lentejas', 'Sancocho de Pollo', 'Ajiaco Santaferereño', 'Crema de Verduras', 'Cuchuco de Trigo'];
const RICE = ['Arroz Blanco', 'Arroz Integral', 'Arroz con Coco'];
const PROTEINS = ['Pechuga a la Plancha', 'Carne Asada', 'Pollo Guisado', 'Pescado Apanado', 'Lomo de Cerdo'];
const JUICES = ['Mora', 'Lulada', 'Maracuyá', 'Guayaba', 'Mango'];

const MenuDelDia = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState({
    day: '',
    soup: '',
    rice: '',
    protein: '',
    juice: ''
  });

  const handleSelect = (field: string, value: string) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  };

  const isComplete = Object.values(order).every(val => val !== '');

  const handleNext = () => {
    if (isComplete) {
      navigate('/resumen-pedido', { state: { order } });
    }
  };

  const SelectionGroup = ({ title, field, options, icon: Icon }: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon className="w-4 h-4" />
        <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => handleSelect(field, opt)}
            className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-300 border ${
              order[field as keyof typeof order] === opt
                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-6 pb-32 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-12"
      >
        <header className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-2xl"
          >
            <UtensilsCrossed className="w-8 h-8 text-black" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
              Delicias Colombianas
            </h1>
            <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-1">
              Personaliza tu Menú
            </p>
          </div>
        </header>

        <section className="space-y-10">
          <SelectionGroup title="Día de la semana" field="day" options={DAYS} icon={Calendar} />
          <SelectionGroup title="Tipo de sopa" field="soup" options={SOUPS} icon={Waves} />
          <SelectionGroup title="Tipo de arroz" field="rice" options={RICE} icon={Droplet} />
          <SelectionGroup title="Proteína" field="protein" options={PROTEINS} icon={Coffee} />
          <SelectionGroup title="Tipo de jugo" field="juice" options={JUICES} icon={Droplet} />
        </section>

        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent z-50">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleNext}
              disabled={!isComplete}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm transition-all duration-500 ${
                isComplete 
                  ? 'bg-white text-black shadow-2xl shadow-white/10 hover:scale-[1.02] active:scale-95' 
                  : 'bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              Ver Resumen
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default MenuDelDia;
