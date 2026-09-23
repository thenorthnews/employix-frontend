import React from 'react';
import { Link } from 'react-router-dom';

const FlywheelCard = ({ children, className = '' }) => {
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  return (
    <div
      className={`flywheel-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.15s ease-out' }}
    >
      {children}
    </div>
  );
};

const FlywheelSection = () => {
  return (
    <section className="flywheel-section position-relative overflow-hidden" id="how-it-works">
      <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
      <div className="container position-relative" style={{ zIndex: 2 }}>
        {/* Header Text */}
        <div className="row justify-content-center text-center mb-5">
          <div className="col-lg-9 col-xl-8">
            <span className="hero-badge">How It Works</span>
            <h2 className="flywheel-title section-heading mt-3 mb-3">
              Three modules. <br />
              <span className="text-teal">One living career identity.</span>
            </h2>
            <p className="flywheel-description section-desc mx-auto">
              It starts with the verified EMPLOYIX ID &mdash; one credential employers trust at a glance.
              Its Score surfaces trusted talent in the marketplace, hires onboard in one click, and
              the HRMS quietly keeps every ID current in the background &mdash; so the identity only
              grows more trustworthy over time.
            </p>
          </div>
        </div>

        {/* 3 Modules Cards Row (Ultra-Interactive Flywheel Cards) */}
        <div className="row g-4">
          {/* Module Card 1: Identity & Verification */}
          <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
            <FlywheelCard>
              {/* Top Accent Glow Line */}
              <div className="flywheel-card-accent"></div>

              {/* Icon & Title Header */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="flywheel-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007A5E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="3"></rect>
                    <circle cx="9" cy="10" r="2.5"></circle>
                    <line x1="15" y1="9" x2="18" y2="9"></line>
                    <line x1="15" y1="13" x2="18" y2="13"></line>
                    <path d="M6 16c0-2 2-3 3-3s3 1 3 3"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="flywheel-card-title card-heading mb-1">Identity &amp; Verification</h3>
                  <span className="flywheel-card-sub">Tamper-Proof Credential</span>
                </div>
              </div>

              <p className="flywheel-card-desc card-desc">
                The EMPLOYIX ID &amp; Score &mdash; single source of truth where work experience, background
                checks, and certifications stay cryptographically verified.
              </p>

              {/* Embedded Interactive Widget Preview: ID Verification Bar */}
              <div className="flywheel-widget-box mb-4">
                <div className="widget-header d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span className="widget-label">ID #EMP-9842</span>
                  </div>
                  <span className="widget-status-tag green">VERIFIED</span>
                </div>
                {/* Live Progress Bar */}
                <div className="widget-progress-track">
                  <div className="widget-progress-bar bar-green" style={{ width: '100%' }}></div>
                </div>
                {/* Mini Chip Badges */}
                <div className="d-flex gap-2 mt-2 pt-1 flex-wrap">
                  <span className="widget-mini-chip"><i className="chip-icon check">&#10003;</i> KYC Passed</span>
                  <span className="widget-mini-chip"><i className="chip-icon check">&#10003;</i> Work Audit</span>
                  <span className="widget-mini-chip highlight-green">Score 98.4</span>
                </div>
              </div>

              {/* Action Button & Interactive Tags */}
              <div className="flywheel-card-footer mt-auto">
                <Link to="/register" className="flywheel-link">
                  Open the ID &rarr;
                </Link>
              </div>
            </FlywheelCard>
          </div>

          {/* Module Card 2: Recruitment Marketplace */}
          <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
            <FlywheelCard>
              {/* Top Accent Glow Line */}
              <div className="flywheel-card-accent"></div>

              {/* Icon & Title Header */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="flywheel-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007A5E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="flywheel-card-title card-heading mb-1">Recruitment Marketplace</h3>
                  <span className="flywheel-card-sub">Zero-Fraud Hiring Pool</span>
                </div>
              </div>

              <p className="flywheel-card-desc card-desc">
                Filter candidate pipelines by minimum EMPLOYIX Score and hire pre-verified professionals
                instantly &mdash; bypassing reference delays.
              </p>

              {/* Embedded Interactive Widget Preview: Candidate Match Filter */}
              <div className="flywheel-widget-box mb-4">
                <div className="widget-header d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2.5">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <span className="widget-label">Marketplace Filter</span>
                  </div>
                  <span className="widget-status-tag green">MATCH 99.2%</span>
                </div>
                {/* Mini Interactive Score Dial / Sliders */}
                <div className="widget-match-row d-flex align-items-center justify-content-between p-2 rounded">
                  <div className="avatar-stack d-flex align-items-center">
                    <span className="mini-avatar av-1">JD</span>
                    <span className="mini-avatar av-2">AK</span>
                    <span className="mini-avatar av-3">SL</span>
                    <span className="mini-avatar-count">+142</span>
                  </div>
                  <span className="widget-mini-chip highlight-green">Min Score: 95+</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flywheel-card-footer mt-auto">
                <Link to="/login" className="flywheel-link">
                  Search talent &rarr;
                </Link>
              </div>
            </FlywheelCard>
          </div>

          {/* Module Card 3: Multitenant HRMS */}
          <div className="col-lg-4 col-md-6">
            <FlywheelCard>
              {/* Top Accent Glow Line */}
              <div className="flywheel-card-accent"></div>

              {/* Icon & Title Header */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="flywheel-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007A5E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="3" width="16" height="18" rx="2"></rect>
                    <rect x="9" y="15" width="6" height="3" rx="1"></rect>
                    <line x1="8" y1="7" x2="16" y2="7"></line>
                    <line x1="8" y1="11" x2="13" y2="11"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="flywheel-card-title card-heading mb-1">Multitenant HRMS</h3>
                  <span className="flywheel-card-sub">Continuous Lifecycle Engine</span>
                </div>
              </div>

              <p className="flywheel-card-desc card-desc">
                Automated 1-click onboarding, payroll, and performance logging that feed back into every
                employee's live verified credential loop.
              </p>

              {/* Embedded Interactive Widget Preview: Realtime Sync Engine */}
              <div className="flywheel-widget-box mb-4">
                <div className="widget-header d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2.5">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    <span className="widget-label">HRMS Auto-Sync</span>
                  </div>
                  <span className="widget-status-tag green">LIVE LOOP</span>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-1">
                  <span className="widget-mini-chip"><i className="chip-icon check">&#10003;</i> Auto-Onboard</span>
                  <span className="widget-mini-chip highlight-green">0 Manual Entry</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flywheel-card-footer mt-auto">
                <Link to="/login" className="flywheel-link">
                  Manage workforce &rarr;
                </Link>
              </div>
            </FlywheelCard>
          </div>
        </div>

        {/* Bottom Summary Ribbon */}
        <div className="row justify-content-center mt-5 pt-3">
          <div className="col-lg-11 text-center">
            <p className="flywheel-summary-text mb-1">
              <strong>Verified EMPLOYIX ID &amp; Score</strong> &rarr; surfaces trusted talent in the
              marketplace &rarr; hired &amp; onboarded in one click &rarr; the HRMS keeps the ID current
              &rarr;
            </p>
            <p className="flywheel-summary-highlight mb-0">
              the identity stays trustworthy for life
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlywheelSection;
