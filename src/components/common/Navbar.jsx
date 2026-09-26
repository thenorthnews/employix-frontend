import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, logoutUser, updateUserKycStatus } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { isTokenValid, getStoredToken } from '../../utils/auth';
import axiosInstance from '../../api/axiosInstance';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const activeToken = token || getStoredToken();
  const hasValidSession = Boolean(isAuthenticated && activeToken && isTokenValid(activeToken));

  // Hide Navbar completely if:
  // 1. User is logged in (hasValidSession)
  // 2. On OTP verification screen (/otp)
  // 3. On KYC screen (/kyc-verification) or Profile screen (/profile)
  if (
    hasValidSession ||
    location.pathname === '/otp' ||
    location.pathname === '/kyc-verification' ||
    location.pathname === '/profile'
  ) {
    return null;
  }

  const isProfilePage = location.pathname === '/profile';
  // KYC complete condition: kycStatus === 4, or aadhaar/voter/employment verified, or isVerified flag, or on profile page
  const isKycDone = Boolean(
    user?.kycStatus === 4 ||
    (user?.aadhaarStatus === 1 && user?.voterStatus === 1) ||
    user?.aadhaarStatus === 1 ||
    user?.isVerified ||
    isProfilePage
  );

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
    setDropdownOpen(false);
  }, [location]);

  // Click outside to close Meesho profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    setDropdownOpen(false);
    try {
      dispatch(logoutUser());
    } catch (err) {
      // background logout can fail gracefully
    }
    dispatch(logout());
    toast.success('Logged out successfully!');
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action will deactivate your profile and all associated KYC data.'
    );
    if (!confirmed) return;

    try {
      await axiosInstance.delete('/users/deleteAccount');
      dispatch(logout());
      toast.success('Account deleted successfully!');
      setDropdownOpen(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to delete account:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete account');
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

            {/* Right Action Items - Simple Click-Only Downside Profile Dropdown */}
            <div className="header-actions d-flex align-items-center mt-3 mt-lg-0">
              {/* Profile Dropdown Component - Hidden on Login/Register screens */}
              {location.pathname !== '/login' && location.pathname !== '/register' && (
                <div className="meesho-profile-wrapper" ref={dropdownRef}>
                <button
                  className={`meesho-profile-tab ${dropdownOpen ? 'active' : ''}`}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <svg
                    className="meesho-tab-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="meesho-tab-label">
                    Profile <span className="meesho-caret">&#9662;</span>
                  </span>
                </button>

                {/* Dropdown Card - Strictly Opens Downside on Click */}
                {dropdownOpen && (
                  <div className="meesho-dropdown-card">
                    {hasValidSession ? (
                      <>
                        <div className="meesho-user-header-row">
                          <img
                            src={user?.profileImage || '/images/identity.jpg'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/identity.jpg';
                            }}
                            alt="Avatar"
                            className="meesho-dropdown-avatar"
                          />
                          <div className="meesho-user-info-col">
                            <div className="meesho-card-title">
                              {user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
                            </div>
                            <div className="meesho-id-pill">
                              <span className="meesho-id-dot"></span>
                              <span>
                                {user?.employixId || (user?._id ? `#EMP-${user._id.slice(-4).toUpperCase()}-IN` : '#EMP-5178-IN')}
                              </span>
                              {isKycDone && <span className="meesho-check-tick">&#10003;</span>}
                            </div>
                          </div>
                        </div>

                        <div className="meesho-divider" />

                        {/* Clean Streamlined Menu Items */}
                        <Link
                          to="/profile"
                          className="meesho-list-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="meesho-item-icon-box teal-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <span className="item-title">My Profile</span>
                          <span className="item-arrow">&#8250;</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="meesho-list-item"
                          type="button"
                        >
                          <div className="meesho-item-icon-box neutral-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                              <polyline points="16 17 21 12 16 7"></polyline>
                              <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                          </div>
                          <span className="item-title">Log Out</span>
                          <span className="item-arrow">&#8250;</span>
                        </button>

                        <div className="meesho-divider danger-divider" />

                        <button
                          onClick={handleDeleteAccount}
                          className="meesho-list-item meesho-item-delete"
                          type="button"
                        >
                          <div className="meesho-item-icon-box danger-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </div>
                          <span className="item-title">Delete Account</span>
                          <span className="item-arrow">&#8250;</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="meesho-user-header-row">
                          <div className="meesho-card-title">Hello, Guest</div>
                        </div>

                        <div className="meesho-divider" />

                        <Link
                          to="/login"
                          className="meesho-list-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="meesho-item-icon-box teal-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <span className="item-title">Candidate Login / Sign Up</span>
                          <span className="item-arrow">&#8250;</span>
                        </Link>

                        <Link
                          to="/login"
                          className="meesho-list-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="meesho-item-icon-box neutral-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                          </div>
                          <span className="item-title">Employer Login</span>
                          <span className="item-arrow">&#8250;</span>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              )}

              {!hasValidSession && (
                <>
                  <Link to="/login" className="btn btn-header-outline mr-2 ml-3">
                    Candidate Login
                  </Link>
                  <Link to="/login" className="btn btn-header-teal">
                    Employer Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
