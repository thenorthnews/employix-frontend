import React from 'react';

const VerifySection = () => {
  return (
    <section className="verify-section position-relative overflow-hidden" id="verification">
      <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
      <div className="container position-relative" style={{ zIndex: 2 }}>
        {/* Header Text */}
        <div className="row justify-content-center text-center mb-4">
          <div className="col-lg-9 col-xl-8">
            <span className="hero-badge mb-3">WHAT WE VERIFY</span>
            <h2 className="verify-title section-heading mt-2 mb-3">
              Proof, <span className="text-teal">not paperwork</span>
            </h2>
            <p className="verify-description section-desc mx-auto">
              Every line on an EMPLOYIX ID is verified &mdash; worker-owned, consent-based, and
              portable for life. The worker controls who sees it.
            </p>
          </div>
        </div>

        {/* Main Layout Grid: 2x2 Cards Left + Featured Visual Right */}
        <div className="verify-list-wrap">
          <div className="row align-items-stretch g-4">
            {/* Left 2x2 Grid Column */}
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="row g-4 h-100">
                {/* Card 1: Identity */}
                <div className="col-sm-6 mb-4">
                  <div className="verify-card h-100">
                    <div className="verify-icon-box mb-3">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <polyline points="9 12 11 14 15 10"></polyline>
                      </svg>
                    </div>
                    <h3 className="verify-card-title card-heading mb-2">Identity</h3>
                    <p className="verify-card-desc card-desc mb-0">
                      Name, date of birth and government ID &mdash; confirmed and verified.
                    </p>
                  </div>
                </div>

                {/* Card 2: Qualifications */}
                <div className="col-sm-6 mb-4">
                  <div className="verify-card h-100">
                    <div className="verify-icon-box mb-3">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                      </svg>
                    </div>
                    <h3 className="verify-card-title card-heading mb-2">Qualifications</h3>
                    <p className="verify-card-desc card-desc mb-0">
                      Every degree and certification &mdash; verified, not self-reported.
                    </p>
                  </div>
                </div>

                {/* Card 3: Employment */}
                <div className="col-sm-6 mb-4 mb-sm-0">
                  <div className="verify-card h-100">
                    <div className="verify-icon-box mb-3">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <h3 className="verify-card-title card-heading mb-2">Employment</h3>
                    <p className="verify-card-desc card-desc mb-0">
                      Every role and tenure &mdash; verified, not just claimed.
                    </p>
                  </div>
                </div>

                {/* Card 4: Conduct */}
                <div className="col-sm-6">
                  <div className="verify-card h-100">
                    <div className="verify-icon-box mb-3">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6"></path>
                        <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                      </svg>
                    </div>
                    <h3 className="verify-card-title card-heading mb-2">Conduct</h3>
                    <p className="verify-card-desc card-desc mb-0">
                      Character and conduct &mdash; verified and kept current for life.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Featured Showcase Card */}
            <div className="col-lg-6">
              <div className="verify-featured-card h-100 p-0 overflow-hidden d-flex align-items-center justify-content-center">
                <img
                  src="/images/identity.jpg"
                  alt="Employix Verified Record"
                  className="verify-featured-img img-fluid"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerifySection;
