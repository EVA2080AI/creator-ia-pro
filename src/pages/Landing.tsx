import React from 'react';
import HeroSection from '../components/HeroSection';
import SocialProofSlider from '../components/SocialProofSlider';
import ValuePropositionGrid from '../components/ValuePropositionGrid';
import VisualFeatureHighlight from '../components/VisualFeatureHighlight';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <SocialProofSlider />
      <ValuePropositionGrid />
      <VisualFeatureHighlight />
    </div>
  );
};

export default Landing;
