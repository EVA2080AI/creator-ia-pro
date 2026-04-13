import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesGrid from '../components/FeaturesGrid';
import TestimonialSlider from '../components/TestimonialSlider';
import PricingTiers from '../components/PricingTiers';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesGrid />
      <TestimonialSlider />
      <PricingTiers />
    </div>
  );
};

export default Home;
