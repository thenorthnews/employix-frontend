import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        {/* Top Section: Grid Row */}
        <div className="row">
          {/* Brand Column */}
          <div className="col-lg-5 col-md-12 mb-4 mb-lg-0">
            <Link to="/" className="brand-logo mb-3 d-inline-block">
              <img src="/images/employix-logo.png" alt="Employix Logo" />
            </Link>
            <p className="brand-tagline mt-2">Verified once. Current for life.</p>
          </div>

          {/* Platform Column */}
          <div className="col-lg-3 col-md-4 col-6 mb-4 mb-md-0">
            <h6 className="column-title mb-4">PLATFORM</h6>
            <ul className="footer-links">
              <li><a href="#employix-score">EMPLOYIX Score</a></li>
              <li><a href="#verification">Verification</a></li>
              <li><a href="#how-it-works">Professionals</a></li>
              <li><a href="#employers">Employers</a></li>
              <li><a href="#agniveers">Agniveers</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="col-lg-2 col-md-4 col-6 mb-4 mb-md-0">
            <h6 className="column-title mb-4">COMPANY</h6>
            <ul className="footer-links">
              <li><Link to="/">About</Link></li>
              <li><Link to="/">Contact</Link></li>
              <li><Link to="/register">Careers</Link></li>
              <li><Link to="/">Press</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="col-lg-2 col-md-4 col-6">
            <h6 className="column-title mb-4">RESOURCES</h6>
            <ul className="footer-links">
              <li><Link to="/">Help Center</Link></li>
              <li><Link to="/">Privacy Policy</Link></li>
              <li><Link to="/">Terms of Use</Link></li>
              <li><Link to="/">Security</Link></li>
            </ul>
          </div>
        </div>

        {/* Horizontal Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section: Row */}
        <div className="row align-items-center justify-content-between footer-bottom-text">
          <div className="col-md-auto mb-2 mb-md-0">
            <div className="mb-0">&copy; 2026 EMPLOYIX. All rights reserved.</div>
          </div>
          <div className="col-md-auto">
            <div className="mb-0">
              <span className="in-badge">IN</span>India's Verified Professional Identity Platform
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
