import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ButtonSpinner from '../components/common/Loader';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    consent: false,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // If already logged in, redirect to profile
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  // Clear previous errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log('🔥 [Register] handleSubmit triggered! formData:', formData);

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (!name) {
      toast.error('Please enter your Full Name (as per Govt ID).');
      return;
    }

    if (!email) {
      toast.error('Please enter your Email Address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!phone) {
      toast.error('Please enter your 10-digit Mobile Number.');
      return;
    }

    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!formData.consent) {
      toast.error('Please agree to the Privacy Policy and Terms of Service.');
      return;
    }

    const payload = {
      name,
      email,
      phone: phoneDigits,
      role: 'user',
    };

    console.log('📤 Submitting registration to Backend API:', payload);

    try {
      await dispatch(registerUser(payload)).unwrap();
      toast.success('Registration successful! OTP sent to your email.');
      navigate(`/otp?email=${encodeURIComponent(payload.email)}`);
    } catch (errMessage) {
      console.error('❌ Registration API Error:', errMessage);
      toast.error(errMessage || 'Registration failed. Please try again.');
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

          <div className="container position-relative py-4" style={{ zIndex: 2 }}>
            <div className="row align-items-center justify-content-center">
              {/* Left Feature Branding Column */}
              <div className="col-lg-6 mb-5 mb-lg-0 pr-lg-5">
                <div className="auth-brand-info">
                  <span className="hero-badge mb-4">✦ CREATE YOUR EMPLOYIX ID</span>
                  <h2 className="auth-title section-heading mb-4">
                    Verified once.<br />
                    <span className="text-teal">Current for life.</span>
                  </h2>
                  <p className="auth-desc section-desc mb-4">
                    Join thousands of Indian professionals building a portable, tamper-proof record. Own your
                    identity, control employer consent, and stand out instantly.
                  </p>

                  {/* 4 Pillars Verification Box Summary */}
                  <div className="auth-pillars-grid row g-3 mt-4">
                    <div className="col-sm-6 mb-3">
                      <div className="auth-pillar-card p-3 rounded">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="pillar-bullet"></span>
                          <h6 className="mb-0 font-weight-bold">Identity</h6>
                        </div>
                        <p className="mb-0 small text-muted">Aadhaar eKYC &amp; Govt ID</p>
                      </div>
                    </div>

                    <div className="col-sm-6 mb-3">
                      <div className="auth-pillar-card p-3 rounded">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="pillar-bullet"></span>
                          <h6 className="mb-0 font-weight-bold">Qualifications</h6>
                        </div>
                        <p className="mb-0 small text-muted">NAD &amp; DigiLocker Degrees</p>
                      </div>
                    </div>

                    <div className="col-sm-6 mb-3 mb-sm-0">
                      <div className="auth-pillar-card p-3 rounded">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="pillar-bullet"></span>
                          <h6 className="mb-0 font-weight-bold">Employment</h6>
                        </div>
                        <p className="mb-0 small text-muted">EPFO &amp; HRMS Authenticated</p>
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="auth-pillar-card p-3 rounded">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="pillar-bullet"></span>
                          <h6 className="mb-0 font-weight-bold">Conduct Audit</h6>
                        </div>
                        <p className="mb-0 small text-muted">100% Background Security</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Registration Form Column */}
              <div className="col-lg-6 col-md-10">
                <div className="auth-card p-4 p-md-5">
                  {/* Form Header */}
                  <div className="auth-form-header mb-4 text-center">
                    <h3 className="auth-card-heading mb-1">Create EMPLOYIX ID</h3>
                    <p className="auth-card-sub">Start building your verified professional identity</p>
                  </div>

                  {/* Register Form */}
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Full Name */}
                    <div className="form-group mb-3">
                      <label htmlFor="regFullName" className="auth-label">Full Name (as per Govt ID)</label>
                      <div className="input-group auth-input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          </span>
                        </div>
                        <input
                          type="text"
                          className="form-control auth-input"
                          id="regFullName"
                          name="name"
                          placeholder="e.g. Full Name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Email Address & Mobile in 2 Columns on Desktop */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="regEmail" className="auth-label">Email Address</label>
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
                              id="regEmail"
                              name="email"
                              placeholder="name@domain.com"
                              value={formData.email}
                              onChange={handleChange}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="regMobile" className="auth-label">Mobile Number</label>
                          <div className="input-group auth-input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text font-weight-bold text-teal">+91</span>
                            </div>
                            <input
                              type="tel"
                              className="form-control auth-input"
                              id="regMobile"
                              name="phone"
                              placeholder="10-digit number"
                              value={formData.phone}
                              onChange={handleChange}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Consent Checkbox */}
                    <div className="form-group form-check mb-4">
                      <input
                        type="checkbox"
                        className="form-check-input auth-checkbox"
                        id="consentAgree"
                        name="consent"
                        checked={formData.consent}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <label className="form-check-label auth-checkbox-label" htmlFor="consentAgree">
                        I consent to verify my credentials under EMPLOYIX <Link to="/" className="auth-teal-link">Privacy Policy</Link> &amp; <Link to="/" className="auth-teal-link">Terms of Service</Link>.
                      </label>
                    </div>

                    {/* Submit Button with Loader */}
                    <button
                      type="submit"
                      className="btn btn-auth-submit btn-block py-3 mb-4"
                      disabled={loading}
                      onClick={handleSubmit}
                    >
                      {loading ? <ButtonSpinner text="Creating Account..." /> : 'Continue & Verify OTP'}
                    </button>

                    {/* Social Auth Divider */}
                    <div className="auth-divider d-flex align-items-center mb-4">
                      <span className="flex-fill border-top"></span>
                      <span className="px-3 auth-divider-text">OR SIGN UP WITH</span>
                      <span className="flex-fill border-top"></span>
                    </div>

                    {/* Social Buttons */}
                    <div className="row justify-content-center g-2 mb-4">
                      <div className="col">
                        <button
                          type="button"
                          className="btn btn-social-auth btn-block py-2"
                          onClick={() => toast.info('Google OAuth integration configured')}
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

                    {/* Login Redirect Link */}
                    <div className="text-center auth-footer-note">
                      Already have an EMPLOYIX ID?
                      <Link to="/login" className="auth-teal-link ml-1 font-weight-bold">Sign In</Link>
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

export default RegisterPage;
