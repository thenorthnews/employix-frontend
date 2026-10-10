import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import ButtonSpinner from './Loader';
import { getKycVerificationFlags, isCandidateSetupCompleted } from '../../utils/profileUtils';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleAuthButton = ({
  text = 'Google',
  role = 'user',
  className = 'btn btn-social-auth btn-block py-2',
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customClientId, setCustomClientId] = useState('');

  // Dynamically load Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePostGoogleRedirect = (loggedUser) => {
    if (typeof onSuccess === 'function') {
      onSuccess(loggedUser);
      return;
    }

    const flags = getKycVerificationFlags(loggedUser);
    const isKycDone = Boolean(
      loggedUser?.isProfileComplete ||
      isCandidateSetupCompleted(loggedUser) ||
      flags.isSetupCompleted ||
      flags.isAllStepsDone
    );

    if (isKycDone) {
      navigate('/profile', { replace: true });
    } else {
      toast.info('Please complete your KYC verification to activate your Employix ID.');
      navigate('/kyc-verification', { replace: true });
    }
  };

  const handleGoogleAuthProcess = (activeClientId) => {
    if (!window.google?.accounts) {
      toast.error('Google Sign-In service is initializing. Please try again in a moment.');
      return;
    }

    setLoading(true);

    try {
      // Use Google Token Client for seamless popup experience
      if (window.google.accounts.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.error) {
              setLoading(false);
              console.error('[Google OAuth Error]', tokenResponse.error);
              toast.error(`Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}`);
              return;
            }

            if (tokenResponse?.access_token) {
              try {
                const resultAction = await dispatch(
                  googleLogin({
                    accessToken: tokenResponse.access_token,
                    role,
                  })
                );

                if (googleLogin.fulfilled.match(resultAction)) {
                  const loggedUser = resultAction.payload;
                  toast.success(`Welcome to EMPLOYIX, ${loggedUser?.name || 'User'}!`);
                  handlePostGoogleRedirect(loggedUser);
                } else {
                  toast.error(resultAction.payload || 'Google authentication failed.');
                }
              } catch (err) {
                toast.error(err.message || 'Failed to complete Google Sign-In.');
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
        });

        client.requestAccessToken();
      } else if (window.google.accounts.id) {
        // Fallback to Google ID One-Tap / Credential
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (response) => {
            if (response?.credential) {
              try {
                const resultAction = await dispatch(
                  googleLogin({
                    credential: response.credential,
                    role,
                  })
                );

                if (googleLogin.fulfilled.match(resultAction)) {
                  const loggedUser = resultAction.payload;
                  toast.success(`Welcome to EMPLOYIX, ${loggedUser?.name || 'User'}!`);
                  handlePostGoogleRedirect(loggedUser);
                } else {
                  toast.error(resultAction.payload || 'Google authentication failed.');
                }
              } catch (err) {
                toast.error(err.message || 'Google Sign-In failed.');
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
          }
        });
      }
    } catch (err) {
      setLoading(false);
      console.error('[Google Auth Launch Error]', err);
      toast.error('Unable to open Google popup. Check browser popup settings.');
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    const activeClientId = (GOOGLE_CLIENT_ID || customClientId || '').trim();

    if (!activeClientId) {
      // Show setup modal if Client ID is not yet provided in .env
      setShowConfigModal(true);
      return;
    }

    handleGoogleAuthProcess(activeClientId);
  };

  const handleTestSimulatedAuth = async () => {
    setLoading(true);
    setShowConfigModal(false);
    try {
      // Quick test account simulation when testing locally without Google credentials
      const testEmail = `google.user.${Math.floor(100 + Math.random() * 900)}@gmail.com`;
      const resultAction = await dispatch(
        googleLogin({
          email: testEmail,
          name: 'Google Verified User',
          picture: 'https://lh3.googleusercontent.com/a/default-user',
          googleId: `google_${Date.now()}`,
          role,
        })
      );

      if (googleLogin.fulfilled.match(resultAction)) {
        toast.success(`Signed in successfully as ${resultAction.payload?.name || testEmail}!`);
        handlePostGoogleRedirect(resultAction.payload);
      } else {
        toast.error(resultAction.payload || 'Authentication failed');
      }
    } catch (err) {
      toast.error(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={loading}
        id="google-auth-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? (
          <ButtonSpinner text="Connecting to Google..." />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>{text}</span>
          </>
        )}
      </button>

      {/* Google OAuth Setup & Credentials Modal */}
      {showConfigModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
            <div
              className="modal-content"
              style={{
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                className="modal-header d-flex align-items-center justify-content-between p-4"
                style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="modal-title mb-0 font-weight-bold" style={{ fontSize: '1.1rem', color: '#0F172A' }}>
                      Google Sign-In Configuration
                    </h5>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                      OAuth 2.0 Setup for EMPLOYIX
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowConfigModal(false)}
                  style={{ fontSize: '1.5rem', opacity: 0.7 }}
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div className="modal-body p-4" style={{ color: '#334155', fontSize: '0.9rem' }}>
                <div
                  className="p-3 mb-3 rounded"
                  style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}
                >
                  <p className="mb-1 font-weight-bold text-dark">How to get your Google Client ID:</p>
                  <ol className="mb-0 pl-3" style={{ lineHeight: '1.6' }}>
                    <li>
                      Go to{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-weight-bold"
                      >
                        Google Cloud Console ↗
                      </a>
                    </li>
                    <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                    <li>Add <code>http://localhost:5173</code> to <strong>Authorized JavaScript origins</strong>.</li>
                    <li>
                      Add to <code>.env</code> in frontend:<br />
                      <code style={{ color: '#00D294', fontWeight: 600 }}>VITE_GOOGLE_CLIENT_ID=your_client_id</code>
                    </li>
                  </ol>
                </div>

                <div className="form-group mb-3">
                  <label className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.85rem' }}>
                    Enter Client ID directly (Optional Test):
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                  />
                </div>

                <div className="d-flex flex-column gap-2 mt-4">
                  {customClientId.trim() && (
                    <button
                      type="button"
                      className="btn btn-primary btn-block py-2 font-weight-bold"
                      onClick={() => {
                        setShowConfigModal(false);
                        handleGoogleAuthProcess(customClientId.trim());
                      }}
                      style={{ borderRadius: '8px' }}
                    >
                      Connect with entered Client ID
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-success btn-block py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2"
                    onClick={handleTestSimulatedAuth}
                    style={{ borderRadius: '8px', background: '#00D294', borderColor: '#00D294' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Simulate Instant Google Sign-In (Local Test)
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-block py-2"
                    onClick={() => setShowConfigModal(false)}
                    style={{ borderRadius: '8px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
