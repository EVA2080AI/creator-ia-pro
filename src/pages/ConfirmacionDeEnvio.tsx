import React from 'react';
import { motion } from 'framer-motion';

const ConfirmacionDeEnvio = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6"
      >
        <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
          ¡Pedido Enviado!
        </h1>
        <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Tu pedido ha sido procesado y enviado vía WhatsApp. Estaremos en contacto pronto.
        </p>
      </motion.div>
    </div>
  );
};

export default ConfirmacionDeEnvio;
