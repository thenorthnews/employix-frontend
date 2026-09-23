import React from 'react';
import { Link } from 'react-router-dom';

const CtaSection = () => {
  return (
    <section className="cta-section text-center py-5" id="employers">
      <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)' }}></div>
      <div className="container py-4 position-relative" style={{ zIndex: 2 }}>
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <h2 className="cta-heading section-heading mb-4">
              <span className="d-block text-dark-title">One verified identity.</span>
              <span className="text-teal">Every employer can trust.</span>
            </h2>
            <p className="cta-subtitle section-desc mx-auto mb-5">
              Build a professional identity that stays verified, portable and
              current throughout your career.
            </p>
            <div className="cta-buttons d-flex flex-sm-row flex-column justify-content-center align-items-center mt-4">
              <Link to="/register" className="btn btn-primary-teal mb-3 mb-sm-0 mr-0 mr-sm-3">
                Get Your EMPLOYIX ID
              </Link>
              <Link to="/register" className="btn btn-outline-dark-custom">
                Book Employer Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
