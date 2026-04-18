import React from 'react';
import HeroBanner from '../components/HeroBanner';
import FeaturesGrid from '../components/FeaturesGrid';
import TestimonialSlider from '../components/TestimonialSlider';
import PricingTiers from '../components/PricingTiers';

const Home = () => {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <FeaturesGrid />
      <TestimonialSlider />
      <PricingTiers />
    </div>
  );
};

export default Home;
