import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ButtonSpinner from '../components/common/Loader';
import Footer from '../components/common/Footer';
import {
  validateReferenceTokenApi,
  sendReferenceOtpApi,
  verifyReferenceOtpApi,
  submitReferenceFeedbackApi,
} from '../api/referenceApi';

/**
 * Convert any date string (DD/MM/YYYY, YYYY-MM-DD, ISO string, etc.) into HTML <input type="month"> format (YYYY-MM)
 */
const parseToMonthFormat = (dateStr) => {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '';
  const trimmed = String(dateStr).trim();

  // Case 1: DD/MM/YYYY (Common EPFO format e.g. 01/07/2024)
  const dmy = trimmed.split('/');
  if (dmy.length === 3) {
    const year = dmy[2];
    const month = dmy[1].padStart(2, '0');
    if (year.length === 4 && !isNaN(year) && !isNaN(month)) {
      return `${year}-${month}`;
    }
  }

  // Case 2: YYYY-MM or YYYY-MM-DD
  if (/^\d{4}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 7);
  }

  // Case 3: Parseable JS Date string
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  return '';
};

const ReferenceVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Page States: 'loading' | 'invalid' | 'ready' | 'otp_sent' | 'otp_verified' | 'completed'
  const [pageState, setPageState] = useState('loading');
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionData, setSessionData] = useState(null);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // SECTION A: Employment Confirmation State
  const [workedTogether, setWorkedTogether] = useState('Yes'); // 'Yes' | 'No'
  const [selectedCompany, setSelectedCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // SECTION B: Conduct & Soft Skills Evaluation State (Scale: 1 - 10)
  const [diligence, setDiligence] = useState(8);
  const [enthusiasm, setEnthusiasm] = useState(8);
  const [respectfulness, setRespectfulness] = useState(8);

  // Additional Notes / Context
  const [relationship, setRelationship] = useState('Direct Manager / Supervisor');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [recommendation, setRecommendation] = useState('Yes');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Validate Token on Mount
  useEffect(() => {
    if (!token) {
      setErrorMessage('No verification token provided. Please check the link from your email or message.');
      setPageState('invalid');
      setInitialLoading(false);
      return;
    }

    const validate = async () => {
      try {
        setInitialLoading(true);
        const res = await validateReferenceTokenApi(token);
        const payload = res?.data || res;
        const isSuccess = Boolean(res?.success || res?.data?.success || payload?.referralId);

        if (isSuccess && payload) {
          const data = payload.referralId ? payload : (payload.data || payload);
          setSessionData(data);

          if (data.isFeedbackSubmitted || data.status === 'completed') {
            setPageState('completed');
          } else if (data.isOtpVerified || data.status === 'otp_verified') {
            setPageState('otp_verified');
          } else {
            setPageState('ready');
          }
        } else {
          setErrorMessage(res?.message || 'Verification link is invalid or has expired.');
          setPageState('invalid');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Verification link is invalid or has expired.';
        setErrorMessage(msg);
        setPageState('invalid');
      } finally {
        setInitialLoading(false);
      }
    };

    validate();
  }, [token]);

  // Automatic Start Date & End Date Pre-filling from Candidate's Verified Record
  useEffect(() => {
    if (!sessionData) return;

    const defaultComp = sessionData.companyName || sessionData.latestCompanyName || '';
    setSelectedCompany(defaultComp);

    let prefilledAny = false;

    // Prefill Start Date
    if (sessionData.joiningDate) {
      const formattedStart = parseToMonthFormat(sessionData.joiningDate);
      if (formattedStart) {
        setStartDate(formattedStart);
        prefilledAny = true;
      }
    }

    // Prefill End Date / Currently Working status
    const hasExitDate =
      sessionData.exitDate &&
      String(sessionData.exitDate).trim() !== '' &&
      String(sessionData.exitDate).toLowerCase() !== 'null';

    if (sessionData.isCurrent || !hasExitDate) {
      setIsCurrentlyWorking(true);
      setEndDate('');
      prefilledAny = true;
    } else if (hasExitDate) {
      const formattedEnd = parseToMonthFormat(sessionData.exitDate);
      if (formattedEnd) {
        setEndDate(formattedEnd);
        setIsCurrentlyWorking(false);
        prefilledAny = true;
      }
    }

    if (prefilledAny) {
      setIsPrefilled(true);
    }
  }, [sessionData]);

  // Handle manual switch of company from verified records list
  const handleCompanyChange = (targetCompanyName) => {
    setSelectedCompany(targetCompanyName);
    const found = sessionData?.allCompanies?.find((c) => c.companyName === targetCompanyName);
    if (found) {
      if (found.joiningDate) {
        const formattedStart = parseToMonthFormat(found.joiningDate);
        setStartDate(formattedStart || '');
      } else {
        setStartDate('');
      }

      const hasExit =
        found.exitDate &&
        String(found.exitDate).trim() !== '' &&
        String(found.exitDate).toLowerCase() !== 'null';

      if (found.isCurrent || !hasExit) {
        setIsCurrentlyWorking(true);
        setEndDate('');
      } else {
        setIsCurrentlyWorking(false);
        const formattedEnd = parseToMonthFormat(found.exitDate);
        setEndDate(formattedEnd || '');
      }
    }
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send Email OTP
  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      const res = await sendReferenceOtpApi(token);
      const isSuccess = Boolean(res?.success || res?.data?.success || res?.message);
      if (isSuccess) {
        toast.success(res?.message || res?.data?.message || 'Verification code sent to your email!');
        setPageState('otp_sent');
        setCountdown(60);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP.';
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify Email OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await verifyReferenceOtpApi(token, otpCode.trim());
      const payload = res?.data || res;
      const isSuccess = Boolean(res?.success || res?.data?.success || res?.isOtpVerified || payload?.isOtpVerified);
      if (isSuccess) {
        toast.success('Identity verified! Please complete the employment & conduct review.');
        if (payload) {
          setSessionData((prev) => ({
            ...prev,
            ...payload,
            companyName: payload.companyName || prev?.companyName,
            latestCompanyName: payload.companyName || prev?.latestCompanyName,
          }));
        }
        setPageState('otp_verified');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired verification code.';
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Submit Feedback & Evaluation Review
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (workedTogether === 'Yes' && !startDate.trim()) {
      toast.error('Please select an approximate start date when you worked together.');
      return;
    }

    try {
      setSubmittingFeedback(true);
      const computedRating = Math.min(5, Math.max(1, Math.round(((diligence + enthusiasm + respectfulness) / 30) * 5)));

      const res = await submitReferenceFeedbackApi({
        token,
        workedTogether,
        companyName: selectedCompany || companyName,
        startDate: workedTogether === 'Yes' ? startDate : null,
        endDate: workedTogether === 'Yes' && !isCurrentlyWorking ? endDate : null,
        isCurrentlyWorking: workedTogether === 'Yes' ? isCurrentlyWorking : false,
        diligence: Number(diligence),
        enthusiasm: Number(enthusiasm),
        respectfulness: Number(respectfulness),
        relationship,
        rating: computedRating,
        feedback:
          feedbackNotes.trim() ||
          `Verified evaluation: Diligence ${diligence}/10, Enthusiasm ${enthusiasm}/10, Respectfulness ${respectfulness}/10. Worked together: ${workedTogether}.`,
        recommendation: workedTogether === 'Yes' ? recommendation : 'No',
      });

      const isSuccess = Boolean(res?.success || res?.data?.success || res?.completed || res?.data?.completed);
      if (isSuccess) {
        toast.success('Professional reference feedback submitted successfully! +5 points awarded.');
        setPageState('completed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit feedback.';
      toast.error(msg);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const candidateName = sessionData?.candidateName || 'Candidate';
  const candidateRole = sessionData?.candidateRole || 'Professional';
  const companyName = sessionData?.companyName || sessionData?.latestCompanyName || 'your organization';
  const refereeName = sessionData?.refereeName || 'Colleague';
  const refereeEmail = sessionData?.refereeEmail || '';

  // Get score quality badge label and colors
  const getScoreBadge = (score) => {
    if (score >= 9) return { label: 'Outstanding', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    if (score >= 7) return { label: 'Very Good', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    if (score >= 5) return { label: 'Competent', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
    return { label: 'Needs Improvement', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
  };

  // Render 1-10 Pill Selector for Soft Skills
  const renderScaleSelector = (value, onChange, label, description, icon) => {
    const badge = getScoreBadge(value);
    return (
      <div
        className="p-3 p-md-4 rounded-xl mb-3 transition-all"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <div className="d-flex align-items-center">
            <span
              className="mr-2 d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '32px',
                height: '32px',
                background: '#f1f5f9',
                fontSize: '16px',
              }}
            >
              {icon}
            </span>
            <div>
              <strong className="text-dark d-block" style={{ fontSize: '15px' }}>
                {label}
              </strong>
              <span className="text-muted small" style={{ fontSize: '12.5px' }}>
                {description}
              </span>
            </div>
          </div>
          <span
            className="badge px-3 py-1 font-weight-bold"
            style={{
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              fontSize: '13px',
              borderRadius: '20px',
            }}
          >
            {value} / 10 &bull; {badge.label}
          </span>
        </div>

        <div className="d-flex align-items-center flex-wrap gap-1 mt-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
            const isSelected = value === score;
            return (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                disabled={submittingFeedback}
                className="btn btn-sm font-weight-bold transition-all"
                style={{
                  flex: '1 0 32px',
                  minWidth: '34px',
                  height: '42px',
                  borderRadius: '10px',
                  background: isSelected
                    ? 'linear-gradient(135deg, #00D294 0%, #059669 100%)'
                    : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  border: isSelected ? '1px solid #00D294' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 4px 12px rgba(0, 210, 148, 0.35)' : 'none',
                  transform: isSelected ? 'scale(1.06)' : 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {score}
              </button>
            );
          })}
        </div>
        <div className="d-flex justify-content-between text-muted mt-2 px-1" style={{ fontSize: '11px' }}>
          <span>1 - Unsatisfactory</span>
          <span>5 - Competent</span>
          <span>10 - Outstanding</span>
        </div>
      </div>
    );
  };

  return (
    <div className="reference-verification-page-container min-vh-100 d-flex flex-column" style={{ background: '#f8fafc' }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-light bg-white border-bottom py-3 shadow-2xs sticky-top">
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="navbar-brand d-flex align-items-center mb-0">
            <span
              className="d-inline-flex align-items-center justify-content-center text-white font-weight-bold mr-2 shadow-sm"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                fontSize: '15px',
              }}
            >
              E
            </span>
            <span className="font-weight-bold text-dark h5 mb-0" style={{ letterSpacing: '-0.5px' }}>
              EMPLOY<span style={{ color: '#00D294' }}>IX</span>
            </span>
          </Link>
          <div className="d-flex align-items-center">
            <span
              className="badge px-3 py-2 font-weight-bold d-inline-flex align-items-center"
              style={{
                background: '#ecfdf5',
                color: '#047857',
                borderRadius: '20px',
                border: '1px solid #a7f3d0',
                fontSize: '12px',
              }}
            >
              <span className="mr-1">🛡️</span> Secure Verification Portal
            </span>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <div className="container py-4 py-md-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 px-0">
          {initialLoading ? (
            <div
              className="card border-0 rounded-2xl p-5 text-center"
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
                background: '#ffffff',
              }}
            >
              <div className="my-3">
                <ButtonSpinner color="#00D294" size="lg" />
              </div>
              <h5 className="font-weight-bold text-dark mt-2 mb-1">Validating Secure Session...</h5>
              <p className="text-muted small mb-0">Connecting to Employix KYC Verification Gateway...</p>
            </div>
          ) : pageState === 'invalid' ? (
            <div
              className="card border-0 rounded-2xl p-4 p-md-5 text-center"
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                background: '#ffffff',
              }}
            >
              <div className="mb-3" style={{ fontSize: '50px' }}>⚠️</div>
              <h4 className="font-weight-bold text-dark mb-2">Invalid or Expired Link</h4>
              <p className="text-muted mb-4">{errorMessage}</p>
              <div>
                <Link
                  to="/"
                  className="btn font-weight-bold px-4 py-2 text-white shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                    borderRadius: '10px',
                  }}
                >
                  Go to EMPLOYIX Home &rarr;
                </Link>
              </div>
            </div>
          ) : pageState === 'completed' ? (
            /* COMPLETED SUCCESS SCREEN */
            <div
              className="card border-0 rounded-2xl p-4 p-md-5 text-center"
              style={{
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.06)',
                background: '#ffffff',
                borderRadius: '20px',
              }}
            >
              <div
                className="mb-3 d-inline-flex align-items-center justify-content-center mx-auto rounded-circle shadow-sm"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  color: '#15803d',
                  fontSize: '40px',
                }}
              >
                ✓
              </div>
              <h3 className="font-weight-bold text-dark mb-2">Reference Verified!</h3>
              <p className="text-muted mb-4" style={{ maxWidth: '520px', margin: '0 auto' }}>
                Thank you, <strong>{refereeName}</strong>! Your confidential professional reference feedback for{' '}
                <strong>{candidateName}</strong> has been successfully recorded and verified.
              </p>
              <div
                className="p-4 rounded-xl mb-4 text-left small"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted">Candidate:</span>
                  <strong className="text-dark">{candidateName} ({candidateRole})</strong>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted">Organization:</span>
                  <strong className="text-dark">{companyName}</strong>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted">Verification Status:</span>
                  <span className="badge badge-success px-2 py-1 font-weight-bold">✓ Complete &amp; Secured</span>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-muted">Candidate Trust Award:</span>
                  <span className="font-weight-bold" style={{ color: '#059669' }}>
                    +5 Trust Points Credited to Candidate
                  </span>
                </div>
              </div>
              <div>
                <Link
                  to="/"
                  className="btn btn-outline-secondary font-weight-bold px-4 py-2"
                  style={{ borderRadius: '10px' }}
                >
                  Return to EMPLOYIX Home &rarr;
                </Link>
              </div>
            </div>
          ) : pageState === 'ready' || pageState === 'otp_sent' ? (
            /* STEP 1: IDENTITY VERIFICATION (EMAIL OTP) */
            <div
              className="card border-0 rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
                borderRadius: '20px',
              }}
            >
              {/* Header */}
              <div
                className="p-4 p-md-5 text-white"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0d9488 100%)',
                }}
              >
                <div className="d-inline-flex align-items-center badge px-3 py-1 font-weight-bold mb-3" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderRadius: '20px', fontSize: '11.5px' }}>
                  STEP 1 OF 2 &bull; CONFIDENTIAL IDENTITY VERIFICATION
                </div>
                <h3 className="font-weight-bold text-white mb-2">
                  Professional Reference for {candidateName}
                </h3>
                <div className="d-flex align-items-center flex-wrap gap-2 text-white-50 small">
                  <span className="badge badge-light text-dark font-weight-bold px-2 py-1">
                    🏢 {companyName}
                  </span>
                  <span>&bull;</span>
                  <span>Candidate Role: <strong className="text-white">{candidateRole}</strong></span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 p-md-5 bg-white">
                <div className="mb-4">
                  <h5 className="font-weight-bold text-dark mb-2">Hello {refereeName},</h5>
                  <p className="text-muted small line-height-lg mb-0" style={{ fontSize: '13.5px' }}>
                    To protect candidate trust and ensure authentic reviews, please verify your registered email address before submitting the confidential feedback.
                  </p>
                </div>

                <div
                  className="p-3 rounded-xl mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                >
                  <div>
                    <span className="small text-muted d-block" style={{ fontSize: '12px' }}>
                      Verification Code Target Email:
                    </span>
                    <strong className="text-dark font-monospace" style={{ fontSize: '14px' }}>
                      ✉ {refereeEmail}
                    </strong>
                  </div>
                  <span className="badge badge-secondary px-2 py-1 small">Official Reference</span>
                </div>

                {pageState === 'ready' ? (
                  <div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="btn btn-block font-weight-bold py-3 text-white shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                        borderRadius: '12px',
                        fontSize: '15px',
                      }}
                    >
                      {sendingOtp ? (
                        <>
                          <ButtonSpinner color="#ffffff" size="sm" /> Sending Verification Code...
                        </>
                      ) : (
                        'Send 6-Digit Verification Code to My Email →'
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="form-group mb-4">
                      <label className="font-weight-bold text-dark small d-block text-center mb-2">
                        Enter 6-Digit Email Code *
                      </label>
                      <input
                        type="text"
                        maxLength="6"
                        className="form-control form-control-lg text-center font-weight-bold font-monospace mx-auto"
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{
                          letterSpacing: '8px',
                          fontSize: '26px',
                          maxWidth: '280px',
                          borderRadius: '12px',
                          border: '2px solid #cbd5e1',
                        }}
                        autoFocus
                        required
                        disabled={verifyingOtp}
                      />
                      <small className="form-text text-muted text-center mt-2">
                        Code is valid for 10 minutes. Please check your inbox or spam folder.
                      </small>
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className="btn btn-block font-weight-bold py-3 mb-3 text-white shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                        borderRadius: '12px',
                        fontSize: '15px',
                      }}
                    >
                      {verifyingOtp ? (
                        <>
                          <ButtonSpinner color="#ffffff" size="sm" /> Verifying Code...
                        </>
                      ) : (
                        'Verify Code & Open Feedback Form →'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={countdown > 0 || sendingOtp}
                        className="btn btn-link text-muted small p-0 font-weight-bold"
                      >
                        {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Verification Code'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : pageState === 'otp_verified' ? (
            /* STEP 2: POST-OTP FEEDBACK & VERIFICATION SCREEN */
            <div
              className="card border-0 rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
                borderRadius: '20px',
              }}
            >
              {/* Premium Hero Header */}
              <div
                className="p-4 p-md-4 text-white"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0d9488 100%)',
                }}
              >
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <span
                    className="badge px-3 py-1 font-weight-bold"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderRadius: '20px', fontSize: '11px' }}
                  >
                    STEP 2 OF 2 &bull; CONFIDENTIAL REVIEW
                  </span>
                  <span
                    className="badge px-2 py-1 font-weight-bold"
                    style={{ background: '#dcfce7', color: '#15803d', borderRadius: '14px', fontSize: '11px' }}
                  >
                    ✓ Identity Verified
                  </span>
                </div>

                <div className="d-flex align-items-center mt-2">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center text-white font-weight-bold mr-3 shadow-sm flex-shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #00D294 0%, #0284c7 100%)',
                      fontSize: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {candidateName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-weight-bold text-white mb-0" style={{ letterSpacing: '-0.3px' }}>
                      {candidateName}
                    </h4>
                    <p className="text-white-50 small mb-0">
                      Role: <strong className="text-white">{candidateRole}</strong> &bull; Verified Referee:{' '}
                      <span className="text-white">{refereeName}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <form onSubmit={handleSubmitFeedback} className="p-4 p-md-5 bg-white">
                {/* ---------------------------------------------------------------- */}
                {/* SECTION A: Employment Confirmation */}
                {/* ---------------------------------------------------------------- */}
                <div className="mb-5 pb-4 border-bottom">
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mr-2 text-white font-weight-bold shadow-2xs"
                      style={{
                        width: '30px',
                        height: '30px',
                        background: '#0f172a',
                        fontSize: '13px',
                      }}
                    >
                      A
                    </span>
                    <div>
                      <h5 className="font-weight-bold text-dark mb-0" style={{ fontSize: '16px' }}>
                        Employment Confirmation
                      </h5>
                      <span className="text-muted small" style={{ fontSize: '12px' }}>
                        Verify candidate's association and tenure at the designated organization
                      </span>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div
                    className="p-3 p-md-4 rounded-xl mb-3"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                    }}
                  >
                    {/* Organization Selector (if candidate has multiple verified companies) */}
                    {sessionData?.allCompanies && sessionData.allCompanies.length > 1 && (
                      <div className="mb-3 p-3 rounded-xl bg-white border">
                        <label className="text-dark small font-weight-bold mb-1 d-flex align-items-center">
                          <span className="mr-1">🏢</span> Organization being verified:
                        </label>
                        <select
                          className="form-control font-weight-bold"
                          value={selectedCompany || companyName}
                          onChange={(e) => handleCompanyChange(e.target.value)}
                          disabled={submittingFeedback}
                          style={{
                            borderRadius: '10px',
                            height: '42px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13.5px',
                            color: '#0f172a',
                          }}
                        >
                          {sessionData.allCompanies.map((c, idx) => (
                            <option key={idx} value={c.companyName}>
                              {c.companyName} {c.isCurrent ? '(Current / Active)' : `(${c.joiningDate || ''} — ${c.exitDate || 'Present'})`}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                          💡 Pre-selected previous completed company for reference verification. You can switch if verifying for another organization.
                        </small>
                      </div>
                    )}

                    <p className="text-dark mb-3" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                      Did <strong className="text-dark font-weight-bold" style={{ color: '#0f766e' }}>{candidateName}</strong> work with you at{' '}
                      <span
                        className="badge badge-light border px-2 py-1 font-weight-bold text-dark shadow-2xs"
                        style={{
                          fontSize: '14px',
                          background: '#ffffff',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                        }}
                      >
                        🏢 {selectedCompany || companyName}
                      </span>
                      ?
                    </p>

                    {/* Interactive Selection Cards: Yes / No */}
                    <div className="row g-3 mb-3">
                      {/* Yes Card */}
                      <div className="col-12 col-md-6 mb-2 mb-md-0">
                        <div
                          onClick={() => setWorkedTogether('Yes')}
                          className="p-3 rounded-xl transition-all d-flex align-items-center cursor-pointer"
                          style={{
                            background: workedTogether === 'Yes' ? '#ecfdf5' : '#ffffff',
                            border: workedTogether === 'Yes' ? '2px solid #00D294' : '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: workedTogether === 'Yes' ? '0 4px 14px rgba(0, 210, 148, 0.2)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            className="rounded-circle d-inline-flex align-items-center justify-content-center mr-3 font-weight-bold flex-shrink-0"
                            style={{
                              width: '32px',
                              height: '32px',
                              background: workedTogether === 'Yes' ? '#00D294' : '#f1f5f9',
                              color: workedTogether === 'Yes' ? '#ffffff' : '#64748b',
                              fontSize: '15px',
                            }}
                          >
                            ✓
                          </div>
                          <div>
                            <strong
                              className="d-block"
                              style={{
                                color: workedTogether === 'Yes' ? '#065f46' : '#1e293b',
                                fontSize: '14px',
                              }}
                            >
                              Yes, worked together
                            </strong>
                            <span className="small text-muted" style={{ fontSize: '11.5px' }}>
                              I can confirm candidate's tenure
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* No Card */}
                      <div className="col-12 col-md-6">
                        <div
                          onClick={() => setWorkedTogether('No')}
                          className="p-3 rounded-xl transition-all d-flex align-items-center cursor-pointer"
                          style={{
                            background: workedTogether === 'No' ? '#fff1f2' : '#ffffff',
                            border: workedTogether === 'No' ? '2px solid #f43f5e' : '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: workedTogether === 'No' ? '0 4px 14px rgba(244, 63, 94, 0.2)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            className="rounded-circle d-inline-flex align-items-center justify-content-center mr-3 font-weight-bold flex-shrink-0"
                            style={{
                              width: '32px',
                              height: '32px',
                              background: workedTogether === 'No' ? '#f43f5e' : '#f1f5f9',
                              color: workedTogether === 'No' ? '#ffffff' : '#64748b',
                              fontSize: '15px',
                            }}
                          >
                            ✗
                          </div>
                          <div>
                            <strong
                              className="d-block"
                              style={{
                                color: workedTogether === 'No' ? '#9f1239' : '#1e293b',
                                fontSize: '14px',
                              }}
                            >
                              No, did not work together
                            </strong>
                            <span className="small text-muted" style={{ fontSize: '11.5px' }}>
                              No working relationship at this company
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* If 'Yes' is selected: Tenure Period with Auto-Detected Dates */}
                    {workedTogether === 'Yes' && (
                      <div
                        className="p-3 p-md-4 rounded-xl mt-3 animate-fade-in"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '14px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                        }}
                      >
                        {/* Auto-detected Banner */}
                        {isPrefilled && (
                          <div
                            className="p-2 px-3 rounded-lg mb-3 d-flex align-items-center"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1e40af',
                              fontSize: '12px',
                              borderRadius: '8px',
                            }}
                          >
                            <span className="mr-2" style={{ fontSize: '15px' }}>⚡</span>
                            <span>
                              <strong>Auto-detected from EPFO records:</strong> Dates have been pre-filled from official verified records. You may adjust them if needed.
                            </span>
                          </div>
                        )}

                        <div className="row g-3">
                          {/* Start Date */}
                          <div className="col-12 col-md-6 mb-3 mb-md-0">
                            <label className="font-weight-bold text-dark small d-flex align-items-center mb-1">
                              <span className="mr-1">📅</span> Start Date (Month/Year) <span className="text-danger ml-1">*</span>
                            </label>
                            <input
                              type="month"
                              className="form-control font-weight-bold"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              required={workedTogether === 'Yes'}
                              disabled={submittingFeedback}
                              style={{
                                borderRadius: '10px',
                                height: '44px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '14px',
                                color: '#0f172a',
                              }}
                            />
                            <small className="form-text text-muted mt-1" style={{ fontSize: '11px' }}>
                              Approximate joining period
                            </small>
                          </div>

                          {/* End Date */}
                          <div className="col-12 col-md-6">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <label className="font-weight-bold text-dark small mb-0 d-flex align-items-center">
                                <span className="mr-1">📅</span> End Date (Month/Year)
                              </label>
                              {isCurrentlyWorking && (
                                <span
                                  className="badge px-2 py-1 font-weight-bold"
                                  style={{
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                  }}
                                >
                                  ✓ Currently Working
                                </span>
                              )}
                            </div>
                            <input
                              type="month"
                              className="form-control font-weight-bold"
                              value={isCurrentlyWorking ? '' : endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              disabled={isCurrentlyWorking || submittingFeedback}
                              placeholder={isCurrentlyWorking ? 'Present / Active' : ''}
                              style={{
                                borderRadius: '10px',
                                height: '44px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '14px',
                                background: isCurrentlyWorking ? '#f1f5f9' : '#ffffff',
                                color: '#0f172a',
                              }}
                            />

                            {/* Checkbox: Currently working here */}
                            <div
                              className="mt-2 p-2 rounded-lg d-flex align-items-center"
                              style={{
                                background: isCurrentlyWorking ? '#ecfdf5' : '#f8fafc',
                                border: isCurrentlyWorking ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                const nextState = !isCurrentlyWorking;
                                setIsCurrentlyWorking(nextState);
                                if (nextState) setEndDate('');
                              }}
                            >
                              <input
                                className="form-check-input mr-2 mt-0 ml-1"
                                type="checkbox"
                                id="currentlyWorkingCheck"
                                checked={isCurrentlyWorking}
                                onChange={(e) => {
                                  setIsCurrentlyWorking(e.target.checked);
                                  if (e.target.checked) setEndDate('');
                                }}
                                disabled={submittingFeedback}
                                style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                              />
                              <label
                                className="form-check-label small font-weight-bold mb-0 ml-2"
                                htmlFor="currentlyWorkingCheck"
                                style={{
                                  cursor: 'pointer',
                                  color: isCurrentlyWorking ? '#065f46' : '#334155',
                                  fontSize: '12.5px',
                                }}
                              >
                                Currently working here (Present)
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ---------------------------------------------------------------- */}
                {/* SECTION B: Conduct & Soft Skills Evaluation */}
                {/* ---------------------------------------------------------------- */}
                <div className="mb-5 pb-4 border-bottom">
                  <div className="d-flex align-items-center mb-2">
                    <span
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mr-2 text-white font-weight-bold shadow-2xs"
                      style={{
                        width: '30px',
                        height: '30px',
                        background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                        fontSize: '13px',
                      }}
                    >
                      B
                    </span>
                    <div>
                      <h5 className="font-weight-bold text-dark mb-0" style={{ fontSize: '16px' }}>
                        Conduct &amp; Soft Skills Evaluation
                      </h5>
                      <span className="text-muted small" style={{ fontSize: '12px' }}>
                        Rate {candidateName}'s professional competencies on a scale of 1 to 10
                      </span>
                    </div>
                  </div>

                  <p className="text-muted small mb-3">
                    Please provide an honest assessment of their work conduct and collaboration:
                  </p>

                  {/* 1. Diligence (1 - 10) */}
                  {renderScaleSelector(
                    diligence,
                    setDiligence,
                    '1. Diligence & Quality',
                    'Attention to detail, reliability, quality of output & task ownership',
                    '🎯'
                  )}

                  {/* 2. Enthusiasm (1 - 10) */}
                  {renderScaleSelector(
                    enthusiasm,
                    setEnthusiasm,
                    '2. Enthusiasm & Initiative',
                    'Energy, proactive attitude, eager to learn & problem-solving drive',
                    '🚀'
                  )}

                  {/* 3. Respectfulness (1 - 10) */}
                  {renderScaleSelector(
                    respectfulness,
                    setRespectfulness,
                    '3. Respectfulness & Teamwork',
                    'Professional behavior, empathy, active listening & team collaboration',
                    '🤝'
                  )}
                </div>

                {/* ---------------------------------------------------------------- */}
                {/* SECTION C: Context & Qualitative Remarks */}
                {/* ---------------------------------------------------------------- */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <span
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mr-2 text-white font-weight-bold shadow-2xs"
                      style={{
                        width: '30px',
                        height: '30px',
                        background: '#0284c7',
                        fontSize: '13px',
                      }}
                    >
                      C
                    </span>
                    <div>
                      <h5 className="font-weight-bold text-dark mb-0" style={{ fontSize: '16px' }}>
                        Professional Relationship &amp; Remarks
                      </h5>
                      <span className="text-muted small" style={{ fontSize: '12px' }}>
                        Complementary context to finalize the reference
                      </span>
                    </div>
                  </div>

                  <div
                    className="p-3 p-md-4 rounded-xl mb-3"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                    }}
                  >
                    <div className="form-group mb-3">
                      <label className="font-weight-bold text-dark small mb-1">
                        Your Professional Relationship with {candidateName}
                      </label>
                      <select
                        className="form-control font-weight-bold"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        disabled={submittingFeedback}
                        style={{
                          borderRadius: '10px',
                          height: '44px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      >
                        <option value="Direct Manager / Supervisor">Direct Manager / Supervisor</option>
                        <option value="Team Lead / Project Lead">Team Lead / Project Lead</option>
                        <option value="Colleague / Peer / Team Member">Colleague / Peer / Team Member</option>
                        <option value="Department Head / Director">Department Head / Director</option>
                        <option value="HR">HR</option>
                        <option value="CEO">CEO</option>

                      </select>
                    </div>

                    <div className="form-group mb-3">
                      <label className="font-weight-bold text-dark small d-block mb-2">
                        Would you recommend this candidate for future roles?
                      </label>
                      <div className="row g-2">
                        <div className="col-6">
                          <button
                            type="button"
                            onClick={() => setRecommendation('Yes')}
                            className="btn btn-block py-2 font-weight-bold transition-all"
                            style={{
                              borderRadius: '10px',
                              background: recommendation === 'Yes' ? '#ecfdf5' : '#ffffff',
                              border: recommendation === 'Yes' ? '2px solid #00D294' : '1.5px solid #cbd5e1',
                              color: recommendation === 'Yes' ? '#065f46' : '#475569',
                              fontSize: '13.5px',
                            }}
                          >
                            ✓ Yes, Recommended
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            type="button"
                            onClick={() => setRecommendation('No')}
                            className="btn btn-block py-2 font-weight-bold transition-all"
                            style={{
                              borderRadius: '10px',
                              background: recommendation === 'No' ? '#fff1f2' : '#ffffff',
                              border: recommendation === 'No' ? '2px solid #f43f5e' : '1.5px solid #cbd5e1',
                              color: recommendation === 'No' ? '#9f1239' : '#475569',
                              fontSize: '13.5px',
                            }}
                          >
                            ✗ No
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Qualitative Remarks */}
                    <div className="form-group mb-0">
                      <label className="font-weight-bold text-dark small mb-1">
                        Additional Performance Remarks or Feedback (Optional)
                      </label>
                      <textarea
                        rows="3"
                        className="form-control"
                        placeholder="Briefly describe key strengths, work ethic, dependability, or any specific achievements..."
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        disabled={submittingFeedback}
                        style={{
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13.5px',
                        }}
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Candidate Trust Award Note */}
                <div
                  className="p-3 rounded-xl mb-4 d-flex align-items-center"
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                  }}
                >
                  <span className="mr-2" style={{ fontSize: '20px' }}>🎁</span>
                  <span className="small text-dark">
                    Submitting this verified review will award{' '}
                    <strong className="text-success font-weight-bold">+5 Trust &amp; Reward Points</strong> to{' '}
                    <strong>{candidateName}</strong>'s Employix profile.
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="btn btn-block font-weight-bold py-3 text-white shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {submittingFeedback ? (
                    <>
                      <ButtonSpinner color="#ffffff" size="sm" /> Submitting Complete Review...
                    </>
                  ) : (
                    'Submit Review & Complete Verification (+5 Points Awarded) →'
                  )}
                </button>

                <p className="text-center text-muted small mt-3 mb-0" style={{ fontSize: '11.5px' }}>
                  🔒 Confidential &amp; Encrypted &bull; Official Employix KYC Verification Standard
                </p>
              </form>
            </div>
          ) : (
            <div
              className="card border-0 rounded-2xl p-5 text-center"
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                background: '#ffffff',
              }}
            >
              <div className="mb-3" style={{ fontSize: '48px', color: '#ef4444' }}>⚠️</div>
              <h4 className="font-weight-bold text-dark mb-2">Unable to Load Verification</h4>
              <p className="text-muted mb-4">{errorMessage || 'The verification link may be invalid or expired.'}</p>
              <div>
                <Link
                  to="/"
                  className="btn font-weight-bold px-4 py-2 text-white shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                    borderRadius: '10px',
                  }}
                >
                  Go to EMPLOYIX Home &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReferenceVerificationPage;
