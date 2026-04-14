import React from 'react';
import HeroSection from '../components/HeroSection';
import ValuePropositionGrid from '../components/ValuePropositionGrid';
import TestimonialSlider from '../components/TestimonialSlider';
import PartnersLogoStrip from '../components/PartnersLogoStrip';
import { Footer } from '../components/Footer';

/**
 * Inicio Page — The primary landing experience for Genesis Builder
 */
const Inicio: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="animate-in fade-in duration-500">
        <HeroSection />
        
        <div className="relative">
          <PartnersLogoStrip />
        </div>

        <section id="features" className="py-20">
          <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tighter uppercase italic">
              Ingeniería <span className="text-primary italic">Aumentada</span>
            </h2>
            <p className="text-zinc-500 mt-4 max-w-xl mx-auto">
              Diseñado para aquellos que no se conforman con lo básico. Construye el futuro, bloque a bloque.
            </p>
          </div>
          <ValuePropositionGrid />
        </section>

        <section id="testimonials" className="bg-zinc-50/50 rounded-[4rem] mx-4 my-20">
          <TestimonialSlider />
        </section>

        <section id="cta" className="py-32 px-6 flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter mb-8 max-w-4xl leading-none italic uppercase">
            Listo para <span className="text-zinc-300">Trascender?</span>
          </h2>
          <button className="px-12 py-6 bg-primary text-white text-xl font-bold rounded-full shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all">
            Empezar a Construir Ahora
          </button>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Inicio;
