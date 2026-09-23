import React from 'react';
import Navbar from '../components/common/Navbar';
import HeroSection from '../components/home/HeroSection';
import FlywheelSection from '../components/home/FlywheelSection';
import ScoreSection from '../components/home/ScoreSection';
import VerifySection from '../components/home/VerifySection';
import TrustedSources from '../components/home/TrustedSources';
import CtaSection from '../components/home/CtaSection';
import Footer from '../components/common/Footer';

const HomePage = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FlywheelSection />
        <ScoreSection />
        <VerifySection />
        <TrustedSources />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
