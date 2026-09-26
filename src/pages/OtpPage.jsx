import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, resendOtp, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import Footer from '../components/common/Footer';
import ButtonSpinner from '../components/common/Loader';

const OtpPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, resendLoading, pendingEmail, isAuthenticated } = useSelector((state) => state.auth);
  const targetEmail = searchParams.get('email') || pendingEmail || '';

  // 6 individual digit input states
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const timer = timeLeft;
  const setTimer = setTimeLeft;
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/kyc-verification', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // If email is missing, redirect back to login
  useEffect(() => {
    if (!targetEmail) {
      toast.error('No email found for verification. Please sign in or register.');
      navigate('/login', { replace: true });
    }
  }, [targetEmail, navigate]);

  // Clean error state on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // 60-second Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle individual digit change
  const handleChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1); // Take last character entered
    setDigits(newDigits);

    // Auto-advance to next input if digit entered
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitChange = handleChange;

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length >= 6) {
      const codeDigits = pastedData.slice(0, 6).split('');
      setDigits(codeDigits);
      inputRefs.current[5]?.focus();
    }
  };

  // Resend OTP Action
  const handleResend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (resendLoading) return;

    const rawEmail = targetEmail || searchParams.get('email') || pendingEmail || '';
    const emailToUse = rawEmail.trim().toLowerCase();

    if (!emailToUse) {
      toast.error('Email address is missing. Please return to login.');
      return;
    }

    try {
      await dispatch(resendOtp({ email: emailToUse })).unwrap();
      toast.success('New OTP sent to your email!');
      setTimeLeft(60);
      setCanResend(false);
      setDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (errMessage) {
      toast.error(errMessage || 'Failed to resend OTP. Please try again.');
    }
  };

  // Submit OTP Verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');

    if (timeLeft <= 0) {
      return handleResend(e);
    }

    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP.');
      return;
    }

    const emailToUse = targetEmail || searchParams.get('email') || pendingEmail || 'nehabharti430@gmail.com';

    try {
      const user = await dispatch(verifyOtp({ email: emailToUse, otp })).unwrap();
      toast.success('Account verified successfully!');
      navigate('/kyc-verification', { replace: true });
    } catch (errMessage) {
      toast.error(errMessage || 'Invalid OTP / Password. Please check the code and try again.');
      setDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  };

  return (
    <>
      <main className="flex-grow-1">
        <section
          className="auth-section position-relative overflow-hidden min-vh-100 d-flex align-items-center py-5"
          style={{ paddingTop: '80px', paddingBottom: '80px' }}
        >
          {/* Pattern Layer & Background Glow Orbs */}
          <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
          <div className="hero-glow-orb orb-teal" aria-hidden="true"></div>
          <div className="hero-glow-orb orb-blue" aria-hidden="true"></div>

          <div className="container position-relative py-4" style={{ zIndex: 2 }}>
            <div className="row align-items-center justify-content-center">
              {/* Centered OTP Verification Card */}
              <div className="col-lg-5 col-md-8">
                <div className="auth-card p-4 p-md-5 text-center">
                  {/* Security Badge Icon */}
                  <div className="otp-badge-icon mx-auto mb-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <polyline points="9 12 11 14 15 10"></polyline>
                    </svg>
                  </div>

                  {/* Card Header */}
                  <h3 className="auth-card-heading mb-2">Enter Verification Code</h3>
                  <p className="auth-card-sub mb-3">
                    We've sent a 6-digit security code to your email
                  </p>

                  {/* Target Identifier Info Pill */}
                  <div className="otp-target-pill mb-4 p-2 rounded d-inline-flex align-items-center justify-content-center">
                    <span className="small text-muted mr-1">Sent to:</span>
                    <span className="font-weight-bold text-dark mx-1">{targetEmail}</span>
                    <Link to="/login" className="auth-teal-link ml-2 small font-weight-bold">Change</Link>
                  </div>

                  {/* OTP Form */}
                  <form onSubmit={handleSubmit}>
                    {/* Expiration Notice Alert */}
                    {timer <= 0 && (
                      <div
                        className="py-2 px-3 small rounded mb-3 font-weight-bold d-flex align-items-center justify-content-center"
                        style={{
                          background: 'rgba(229, 57, 53, 0.12)',
                          color: '#E53935',
                          border: '1px solid rgba(229, 57, 53, 0.3)',
                        }}
                      >
                        <span className="mr-2">⏱️</span> OTP has expired! Click &quot;Resend OTP&quot; below for a new code.
                      </div>
                    )}

                    {/* 6 Individual Digit Entry Boxes */}
                    <div className="d-flex justify-content-center otp-digit-group mb-4" onPaste={handlePaste}>
                      {digits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]"
                          maxLength="1"
                          className={`otp-digit-input mx-1 ${timer <= 0 ? 'border-danger' : ''}`}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          required
                          disabled={loading}
                        />
                      ))}
                    </div>

                    {/* Submit Button with Loader */}
                    <button
                      type="submit"
                      className="btn btn-auth-submit btn-block py-3 mb-4"
                      disabled={loading || resendLoading}
                    >
                      {loading ? (
                        <ButtonSpinner text="Verifying Code..." />
                      ) : resendLoading ? (
                        <ButtonSpinner text="Sending New OTP..." />
                      ) : timer <= 0 ? (
                        'Code Expired — Click to Resend OTP'
                      ) : (
                        'Verify & Continue'
                      )}
                    </button>

                    {/* Resend OTP Link & Timer */}
                    <div className="text-center auth-footer-note">
                      Didn't receive the code?
                      <a
                        href="#resend"
                        onClick={handleResend}
                        className={`otp-resend-link ml-1 font-weight-bold ${
                          timer > 0 || resendLoading ? 'disabled text-muted' : 'text-teal'
                        }`}
                        style={{
                          pointerEvents: timer > 0 || resendLoading ? 'none' : 'auto',
                          cursor: timer > 0 || resendLoading ? 'default' : 'pointer',
                          textDecoration: timer <= 0 ? 'underline' : 'none',
                        }}
                      >
                        {resendLoading ? 'Sending new code...' : timer <= 0 ? 'Resend New OTP' : 'Resend OTP'}
                      </a>
                      {timer > 0 && (
                        <span className="text-muted small ml-1">
                          (0:{timer < 10 ? '0' : ''}{timer})
                        </span>
                      )}
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

export default OtpPage;
