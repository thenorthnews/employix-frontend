import React from 'react';

const sources = [
  'DigiLocker',
  'Aadhaar eKYC',
  'NAD',
  'API Setu',
  'EPFO',
  'UAN',
  'Skill India',
  'NCVET',
  'Employer HRMS'
];

const TrustedSources = () => {
  return (
    <section className="trusted-sources-section py-5 text-center position-relative overflow-hidden" id="agniveers">
      {/* Ambient Radial Background Glow */}
      <div className="sources-glow-orb" aria-hidden="true"></div>

      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row justify-content-center">
          <div className="col-lg-11 col-xl-10">
            <p className="sources-title mb-4">ONE RECORD. VERIFIED ACROSS TRUSTED SOURCES.</p>
            <div className="sources-pills-row d-flex flex-wrap justify-content-center align-items-center gap-2 gap-md-3">
              {sources.map((source) => (
                <span key={source} className="source-pill">
                  <span className="pill-dot"></span>
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedSources;
