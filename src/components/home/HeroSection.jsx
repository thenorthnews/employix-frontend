import React from 'react';
import { Link } from 'react-router-dom';
import ParticleCanvas from '../common/ParticleCanvas';

const HeroSection = () => {
  return (
    <section className="hero-section position-relative overflow-hidden">
      {/* Interactive Particle Canvas Background */}
      <ParticleCanvas />

      {/* Ambient Glowing Orbs */}
      <div className="hero-glow-orb orb-blue" aria-hidden="true"></div>
      <div className="hero-glow-orb orb-purple" aria-hidden="true"></div>

      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center">
          {/* Left Content Column */}
          <div className="col-lg-6 mb-5 mb-lg-0">
            {/* Top Badge */}
            <div className="hero-badge mb-4">
              <span className="badge-sparkle">✦</span> VERIFIED &middot; PORTABLE &middot; CURRENT FOR LIFE
            </div>

            {/* Headline */}
            <h1 className="hero-title section-heading mb-4">
              One verified identity.{' '}
              <span className="text-teal d-block">Trusted by every employer.</span>
            </h1>

            {/* Subtitle Paragraph */}
            <p className="hero-description section-desc mb-4 pb-2">
              One verified professional record that brings together employment, qualifications, identity and
              conduct &mdash; trusted by every employer.
            </p>

            {/* CTA Buttons */}
            <div className="hero-buttons d-flex flex-sm-row flex-column align-items-sm-center gap-3 mb-5">
              <Link to="/register" className="btn btn-primary-teal mb-3 mb-sm-0 mr-0 mr-sm-3">
                Get Your EMPLOYIX ID
              </Link>
              <a href="#how-it-works" className="btn btn-hero-outline">
                See How It Works
              </a>
            </div>

            {/* Key Stats / Highlights Row */}
            <div className="hero-stats-row">
              <div className="row">
                {/* Item 1 */}
                <div className="col-6 col-sm-3 mb-3 mb-sm-0">
                  <div className="stat-item">
                    <div className="stat-icon-light bg-teal-light">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v4l3 3"></path>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-num">100-point</span>
                      <span className="stat-label">Trust Score</span>
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="col-6 col-sm-3 mb-3 mb-sm-0">
                  <div className="stat-item">
                    <div className="stat-icon-light bg-teal-light">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-num">3 Core</span>
                      <span className="stat-label">Modules</span>
                    </div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="col-6 col-sm-3">
                  <div className="stat-item">
                    <div className="stat-icon-light bg-teal-light">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-num">Verified</span>
                      <span className="stat-label">Data</span>
                    </div>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="col-6 col-sm-3">
                  <div className="stat-item">
                    <div className="stat-icon-light bg-teal-light">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-num">Portable</span>
                      <span className="stat-label">For Life</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Column (Hero Image with Animated Laser Scanner) */}
          <div className="col-lg-6">
            <div className="hero-visual-wrapper text-center">
              <div className="scan-container">
                {/* Futuristic Scanner HUD Corner Brackets */}
                <span className="hud-corner corner-tl"></span>
                <span className="hud-corner corner-tr"></span>
                <span className="hud-corner corner-bl"></span>
                <span className="hud-corner corner-br"></span>

                {/* Animated Laser Beam & Trail Overlay */}
                <div className="scan-laser-beam">
                  <div className="scan-laser-trail"></div>
                </div>

                {/* Live Verification Scanning Status Badge */}
                <div className="scan-status-pill">
                  <span className="scan-dot"></span> IDENTITY SCAN ACTIVE
                </div>

                {/* Hero Identity Image */}
                <img
                  src="/images/heroImg.png"
                  alt="Employix Verified Digital Employee Identity"
                  className="hero-visual-img img-fluid"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
