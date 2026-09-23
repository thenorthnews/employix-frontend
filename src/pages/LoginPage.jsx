import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ButtonSpinner from '../components/common/Loader';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  // If already logged in, redirect to profile
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.replace(/\s+/g, '').trim().toLowerCase();

    if (!cleanEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    console.log('📤 Submitting login to Backend API:', cleanEmail);

    try {
      await dispatch(loginUser({ email: cleanEmail })).unwrap();
      toast.success('Security OTP sent to your email!');
      navigate(`/otp?email=${encodeURIComponent(cleanEmail)}`);
    } catch (errMessage) {
      console.error('❌ Login API Error:', errMessage);
      toast.error(errMessage || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow-1">
        <section className="auth-section position-relative overflow-hidden min-vh-100 d-flex align-items-center py-5">
          {/* Pattern Layer & Background Glow Orbs */}
          <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
          <div className="hero-glow-orb orb-teal" aria-hidden="true"></div>
          <div className="hero-glow-orb orb-blue" aria-hidden="true"></div>

          <div className="container position-relative" style={{ zIndex: 2 }}>
            <div className="row align-items-center justify-content-center">
              {/* Left Feature Branding Column */}
              <div className="col-lg-6 mb-5 mb-lg-0 pr-lg-5">
                <div className="auth-brand-info">
                  <span className="hero-badge mb-4">EMPLOYIX PORTAL</span>
                  <h2 className="auth-title section-heading mb-4">
                    Welcome Back.<br />
                    <span className="text-teal">Access Your Verified ID.</span>
                  </h2>
                  <p className="auth-desc section-desc mb-4">
                    Log in to manage your portable career record, check your EMPLOYIX <br /> Trust Score, and
                    share instant verified consent with employers.
                  </p>

                  {/* Key Verification Perks List */}
                  <div className="auth-perks-list mt-4">
                    <div className="auth-perk-item d-flex align-items-center gap-3 mb-3">
                      <div className="perk-icon-wrap">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                      <span className="perk-text">100% Immutable Verification Record</span>
                    </div>

                    <div className="auth-perk-item d-flex align-items-center gap-3 mb-3">
                      <div className="perk-icon-wrap">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      </div>
                      <span className="perk-text">Worker-Owned &amp; Consent Controlled</span>
                    </div>

                    <div className="auth-perk-item d-flex align-items-center gap-3">
                      <div className="perk-icon-wrap">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                      </div>
                      <span className="perk-text">Instant Digilocker &amp; Aadhaar Sync</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Form Column */}
              <div className="col-lg-5 col-md-8">
                <div className="auth-card p-4 p-md-5">
                  {/* Form Header */}
                  <div className="auth-form-header mb-4 text-center">
                    <h3 className="auth-card-heading mb-1">Sign In to EMPLOYIX</h3>
                    <p className="auth-card-sub">Enter your verified credentials to continue</p>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Email Input */}
                    <div className="form-group mb-4">
                      <label htmlFor="loginEmail" className="auth-label">Email Address</label>
                      <div className="input-group auth-input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                          </span>
                        </div>
                        <input
                          type="email"
                          className="form-control auth-input"
                          id="loginEmail"
                          name="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Submit Button with Loader */}
                    <button
                      type="submit"
                      className="btn btn-auth-submit btn-block py-3 mb-4"
                      disabled={loading}
                    >
                      {loading ? <ButtonSpinner text="Sending Security OTP..." /> : 'Continue with OTP'}
                    </button>

                    {/* Social Auth Divider */}
                    <div className="auth-divider d-flex align-items-center mb-4">
                      <span className="flex-fill border-top"></span>
                      <span className="px-3 auth-divider-text">OR CONTINUE WITH</span>
                      <span className="flex-fill border-top"></span>
                    </div>

                    {/* Social Buttons */}
                    <div className="row justify-content-center g-2 mb-4">
                      <div className="col">
                        <button
                          type="button"
                          className="btn btn-social-auth btn-block py-2"
                          onClick={() => toast.info('Google Sign-In service configured')}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                          </svg>
                          Google
                        </button>
                      </div>
                    </div>

                    {/* Register Redirect Link */}
                    <div className="text-center auth-footer-note">
                      Don't have an EMPLOYIX ID?
                      <Link to="/register" className="auth-teal-link ml-1 font-weight-bold">Register Now</Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default LoginPage;
