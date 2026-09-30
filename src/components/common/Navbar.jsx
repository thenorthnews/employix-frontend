import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserKycStatus } from '../../redux/slices/authSlice';
import { isTokenValid, getStoredToken } from '../../utils/auth';
import axiosInstance from '../../api/axiosInstance';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const activeToken = token || getStoredToken();
  const hasValidSession = Boolean(isAuthenticated && activeToken && isTokenValid(activeToken));

  // Hide Navbar completely on specific screens with dedicated headers:
  // 1. On OTP verification screen (/otp)
  // 2. On KYC screen (/kyc-verification) or Profile screen (/profile)
  if (
    location.pathname === '/otp' ||
    location.pathname === '/kyc-verification' ||
    location.pathname === '/profile'
  ) {
    return null;
  }

  // Sync latest user profile and official DB employixId from backend on session mount
  useEffect(() => {
    if (hasValidSession) {
      axiosInstance.get('/users/me')
        .then((res) => {
          const freshUser = res?.data || res;
          if (freshUser && (freshUser.email || freshUser._id)) {
            dispatch(updateUserKycStatus(freshUser));
          }
        })
        .catch(() => {});
    }
  }, [hasValidSession, dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleNavClick = (anchorId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + anchorId);
      setTimeout(() => {
        const el = document.querySelector(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''} ${location.pathname !== '/' ? 'inner-header' : ''}`}>
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container">
          {/* Brand Logo */}
          <Link className="navbar-brand py-0" to="/">
            <img src="/images/employix-logo.png" alt="Employix Logo" className="header-logo" />
          </Link>

          {/* Mobile Hamburger Toggler */}
          <button
            className={`navbar-toggler ${!mobileMenuOpen ? 'collapsed' : ''}`}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-controls="mainNavbar"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navigation items & Right Actions */}
          <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="mainNavbar">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('#how-it-works');
                  }}
                >
                  How It Works
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#employix-score"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('#employix-score');
                  }}
                >
                  EMPLOYIX Score
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#employers"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('#employers');
                  }}
                >
                  For Employers
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#agniveers"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('#agniveers');
                  }}
                >
                  For Agniveers
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="#verification"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('#verification');
                  }}
                >
                  Verification
                </a>
              </li>
            </ul>

            {/* Right Action Items */}
            <div className="header-actions d-flex align-items-center mt-3 mt-lg-0">
              <Link to={hasValidSession ? "/profile" : "/login"} className="btn btn-header-outline mr-2 ml-3">
                Candidate Login
              </Link>
              <Link to={hasValidSession ? "/profile" : "/login"} className="btn btn-header-teal">
                Employer Login
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
