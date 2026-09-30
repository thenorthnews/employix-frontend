import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import ButtonSpinner from '../common/Loader';
import {
  addReferenceApi,
  getReferencesApi,
  resendReferenceApi,
  getReferenceShareLinkApi,
} from '../../api/referenceApi';
import { calculateReferenceScores } from '../../utils/referenceScoreCalculator';

// Strict Regex Constants
const NAME_REGEX = /^[a-zA-Z\s.']{2,50}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const ROLE_REGEX = /^[a-zA-Z0-9\s/.,&()'-]{2,60}$/;

const ProfessionalReferenceSection = ({
  isSetupCompleted = false,
  initialReferences = null,
  initialRewardPoints = 0,
}) => {
  const [references, setReferences] = useState(Array.isArray(initialReferences) ? initialReferences : []);
  const [rewardPoints, setRewardPoints] = useState(initialRewardPoints || 0);
  const [loading, setLoading] = useState(initialReferences === null);

  // Add Reference Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState('form'); // 'form' | 'sent_success'
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  // Synchronous Locks to prevent multi-submit
  const isSubmittingRef = useRef(false);
  const isResendingRef = useRef(false);

  // Form Fields & Realtime Validation
  const [refereeName, setRefereeName] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [refereeRole, setRefereeRole] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', role: '' });
  const [recentlySentReferee, setRecentlySentReferee] = useState(null);
  const [addModalCopied, setAddModalCopied] = useState(false);

  // Cooldown timers per reference ID (seconds remaining)
  const [cooldowns, setCooldowns] = useState({});

  // Share Link Modal State
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    reference: null,
    link: '',
    copied: false,
    loading: false,
  });

  // View Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    reference: null,
  });

  const fetchReferences = async () => {
    try {
      setLoading(true);
      const res = await getReferencesApi();
      const payload = res?.data || res;
      const isSuccess = Boolean(res?.success || res?.data?.success || payload?.references);
      if (isSuccess && payload) {
        setReferences(payload.references || []);
        setRewardPoints(payload.rewardPoints || 0);
      }
    } catch (err) {
      console.error('Error fetching references:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  useEffect(() => {
    if (initialReferences !== null && initialReferences !== undefined) {
      setReferences((prev) => {
        if (prev.length > 0 && prev.some((r) => r.feedback)) return prev;
        return Array.isArray(initialReferences) ? initialReferences : [];
      });
      setRewardPoints(initialRewardPoints || 0);
      setLoading(false);
      const hasMissingFeedback = Array.isArray(initialReferences) && initialReferences.some(
        (r) => (r.status === 'completed' || r.isFeedbackSubmitted) && !r.feedback
      );
      if (hasMissingFeedback) {
        fetchReferences();
      }
    }
  }, [initialReferences, initialRewardPoints]);

  // Cooldown tick timer
  useEffect(() => {
    const activeIds = Object.keys(cooldowns).filter((id) => cooldowns[id] > 0);
    if (activeIds.length === 0) return;

    const timer = setInterval(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        activeIds.forEach((id) => {
          if (next[id] > 1) {
            next[id] -= 1;
          } else {
            delete next[id];
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldowns]);

  // Form Validation Handlers
  const validateName = (val) => {
    if (!val.trim()) return 'Reference full name is required.';
    if (!NAME_REGEX.test(val.trim())) return 'Name must contain 2-50 letters/spaces only (no special numbers).';
    return '';
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'Professional email address is required.';
    if (!EMAIL_REGEX.test(val.trim())) return 'Please enter a valid professional email (e.g. name@company.com).';
    return '';
  };

  const validateRole = (val) => {
    if (!val.trim()) return 'Role / designation is required.';
    if (!ROLE_REGEX.test(val.trim())) return 'Designation must be 2-60 alphanumeric characters.';
    return '';
  };

  const handleOpenModal = () => {
    if (references.length >= 2) {
      toast.warning('Maximum 2 professional references are already added.');
      return;
    }
    setRefereeName('');
    setRefereeEmail('');
    setRefereeRole('');
    setFieldErrors({ name: '', email: '', role: '' });
    setModalStep('form');
    setShowAddModal(true);
  };

  const handleAddReference = async (e) => {
    e.preventDefault();

    const nameErr = validateName(refereeName);
    const emailErr = validateEmail(refereeEmail);
    const roleErr = validateRole(refereeRole);

    setFieldErrors({ name: nameErr, email: emailErr, role: roleErr });

    if (nameErr || emailErr || roleErr) {
      toast.error(nameErr || emailErr || roleErr);
      return;
    }

    if (isSubmittingRef.current || submitting) return;
    isSubmittingRef.current = true;

    try {
      setSubmitting(true);
      const res = await addReferenceApi({
        refereeName: refereeName.trim(),
        refereeEmail: refereeEmail.trim().toLowerCase(),
        refereeRole: refereeRole.trim(),
      });

      const isSuccess = Boolean(res?.success || res?.data?.success);
      const payload = res?.data || res;
      if (isSuccess) {
        toast.success(`Invitation email dispatched to ${refereeEmail.trim()} successfully!`);
        const newId = payload?._id || payload?.data?._id;
        const generatedLink = payload?.shareableLink || payload?.data?.shareableLink || '';

        setRecentlySentReferee({
          name: refereeName.trim(),
          email: refereeEmail.trim().toLowerCase(),
          role: refereeRole.trim(),
          id: newId,
          shareableLink: generatedLink,
        });

        if (newId) {
          setCooldowns((prev) => ({ ...prev, [newId]: 60 }));
        }

        setModalStep('sent_success');
        fetchReferences();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add reference.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleResendInvitation = async (id, email) => {
    if (cooldowns[id] > 0 || isSetupCompleted || isResendingRef.current || resendingId) return;

    isResendingRef.current = true;
    try {
      setResendingId(id);
      const res = await resendReferenceApi(id);
      const isSuccess = Boolean(res?.success || res?.data?.success || res?.message);
      if (isSuccess) {
        toast.success(res?.message || res?.data?.message || `Invitation resent to ${email}`);
        setCooldowns((prev) => ({ ...prev, [id]: 60 }));
        fetchReferences();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend invitation.';
      toast.error(msg);
    } finally {
      setResendingId(null);
      isResendingRef.current = false;
    }
  };

  const formatShareableLink = (rawUrl) => {
    if (!rawUrl) return '';
    if (typeof window !== 'undefined' && window.location?.origin) {
      try {
        const parsed = new URL(rawUrl);
        return `${window.location.origin}${parsed.pathname}${parsed.search}`;
      } catch (e) {
        return rawUrl;
      }
    }
    return rawUrl;
  };

  // Bulletproof copy function working across all devices, browsers, HTTP/HTTPS, localhost, and LAN
  const copyTextToClipboard = async (textToCopy) => {
    if (!textToCopy) return false;

    // 1. Try modern navigator.clipboard API if supported
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch (err) {
        console.warn('Async clipboard writeText blocked or failed, using fallback:', err);
      }
    }

    // 2. Reliable Fallback using hidden textarea and document.execCommand('copy')
    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('execCommand copy failed:', err);
      return false;
    }
  };

  // Open Share Link Modal & Auto-copy
  const handleShareLink = async (ref) => {
    if (isSetupCompleted) return;

    if (ref.shareableLink) {
      const activeLink = formatShareableLink(ref.shareableLink);
      setShareModal({
        isOpen: true,
        reference: ref,
        link: activeLink,
        copied: false,
        loading: false,
      });
      await copyTextToClipboard(activeLink);
      toast.success('Secure link copied to clipboard!');
      return;
    }

    try {
      setShareModal({
        isOpen: true,
        reference: ref,
        link: '',
        copied: false,
        loading: true,
      });

      const res = await getReferenceShareLinkApi(ref._id);
      const payload = res?.data || res;
      const rawLink = payload?.shareableLink || payload?.data?.shareableLink;

      if (rawLink) {
        const activeLink = formatShareableLink(rawLink);
        setShareModal({
          isOpen: true,
          reference: ref,
          link: activeLink,
          copied: false,
          loading: false,
        });
        await copyTextToClipboard(activeLink);
        toast.success('Secure link copied to clipboard!');
      } else {
        toast.error('Unable to generate share link.');
        setShareModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate link.';
      toast.error(msg);
      setShareModal((prev) => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const handleCopyFromModal = async (link) => {
    if (!link) return;
    const activeLink = formatShareableLink(link);
    const copiedOk = await copyTextToClipboard(activeLink);
    if (copiedOk) {
      setAddModalCopied(true);
      setShareModal((prev) => ({ ...prev, copied: true }));
      toast.success('Verification link copied to clipboard!');
      setTimeout(() => {
        setAddModalCopied(false);
        setShareModal((prev) => ({ ...prev, copied: false }));
      }, 2500);
    } else {
      toast.error('Unable to auto-copy. Please click and copy manually.');
    }
  };

  const handleViewFeedback = async (ref) => {
    if (ref?.feedback && ref.feedback.relationship) {
      setFeedbackModal({ isOpen: true, reference: ref });
      return;
    }

    try {
      const res = await getReferencesApi();
      const payload = res?.data || res;
      const allRefs = payload?.references || [];
      const freshRef = allRefs.find((r) => String(r._id) === String(ref._id));
      if (freshRef) {
        setReferences(allRefs);
        setFeedbackModal({ isOpen: true, reference: freshRef });
        return;
      }
    } catch (err) {
      console.error('Error fetching reference feedback:', err);
    }

    setFeedbackModal({ isOpen: true, reference: ref });
  };

  const maxReached = references.length >= 2;
  const scores = calculateReferenceScores(references);
  const displayEarned = scores.totalEarnedPoints || rewardPoints;

      console.log("🚀 ~ ProfessionalReferenceSection ~ feedbackModal.reference:", feedbackModal.reference)
  return (
    <div className="auth-card" id="step-references">
      {/* Modern Highlighted Header matching Step 6 & Image 2 */}
      <div className="auth-card-header d-flex flex-wrap align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <span className="setup-step-badge mr-2">Step 5</span>
          <div>
            <h3 className="auth-card-heading mb-0">Professional Reference Verification</h3>
            <p className="auth-card-sub small mb-0">
              Add up to 2 professional references (managers or peers) with email verification (+10 Points)
            </p>
          </div>
        </div>

        {references.length > 0 ? (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge badge-info px-3 py-2 font-weight-bold">
              &#10003; {references.length}/2 Reference(s) Added
            </span>
            {scores.completedReferencesCount > 0 ? (
              <span className="badge badge-success px-3 py-2 font-weight-bold">
                +{displayEarned} Points Secured ({scores.completedReferencesCount}/2 Verified)
              </span>
            ) : (
              <span className="badge badge-warning px-3 py-2 font-weight-bold">
                VERIFICATION PENDING (+10 PTS)
              </span>
            )}
          </div>
        ) : (
          <span className="badge badge-warning px-3 py-2 font-weight-bold">
            PENDING STEP 5
          </span>
        )}
      </div>

      <div className="auth-card-body p-4 p-md-5">
        {/* Subsection: Professional References (Managers / Peers) - Matching Image 2 */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
              <span className="mr-2" style={{ fontSize: '1.25rem' }}>🤝</span>
              Professional References (Managers / Peers)
            </h5>
            <small className="text-muted">
              Add up to 2 managers or colleagues to verify candidate's tenure, conduct &amp; soft skills
            </small>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={maxReached || isSetupCompleted}
            className={`btn btn-sm ${
              maxReached || isSetupCompleted ? 'btn-secondary text-white' : 'btn-primary-teal'
            } px-3 py-2 font-weight-bold`}
            style={
              maxReached || isSetupCompleted
                ? { opacity: 0.65, cursor: 'not-allowed', borderRadius: '50px' }
                : { borderRadius: '50px' }
            }
            title={
              isSetupCompleted
                ? 'Profile setup is complete and locked'
                : maxReached
                ? 'Maximum 2 references reached'
                : 'Add a new professional reference'
            }
          >
            + Add Reference
          </button>
        </div>

        {/* Scoring Policy Info Strip */}
        <div
          className="p-2 px-3 rounded-lg mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
       
          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-light border text-muted font-weight-bold px-2 py-1" style={{ fontSize: '11px' }}>
              {references.length}/2 Added
            </span>
            <span
              className="badge font-weight-bold px-2 py-1"
              style={{
                background: scores.completedReferencesCount > 0 ? '#dcfce7' : '#fef3c7',
                color: scores.completedReferencesCount > 0 ? '#15803d' : '#92400e',
                fontSize: '11px',
              }}
            >
              {scores.completedReferencesCount}/2 Verified (+{displayEarned} Pts)
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="text-center py-5">
            <ButtonSpinner color="#00D294" />
            <span className="small text-muted d-block mt-2 font-weight-bold">Loading professional references...</span>
          </div>
        ) : references.length === 0 ? (
          /* Empty State matching Image 2 */
          <div className="py-2">
           
          </div>
        ) : (
        /* Modern High-End Table Format */
        <div className="reference-table-container">
          <div className="table-responsive rounded-lg border shadow-sm mb-4">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr className="text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>
                  <th style={{ width: '50px' }} className="py-3 px-3 text-center">#</th>
                  <th className="py-3">Reference Person</th>
                  <th className="py-3">Role / Designation</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3">Verification Status</th>
                  <th className="py-3 text-right pr-4" style={{ width: '270px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {references.map((ref, idx) => {
                  const isCompleted = ref.isFeedbackSubmitted || ref.status === 'completed';
                  const isOtpVerified = ref.isOtpVerified;
                  const cooldownSeconds = cooldowns[ref._id] || 0;
                  const isCooldownActive = cooldownSeconds > 0;
                  const initials = ref.refereeName
                    ? ref.refereeName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'RP';

                  return (
                    <tr
                      key={ref._id || idx}
                      style={{
                        background: isCompleted ? '#f0fdf9' : '#ffffff',
                        transition: 'background 0.2s',
                      }}
                    >
                      {/* Sr No. */}
                      <td className="text-center align-middle font-weight-bold px-3">
                        <span
                          className="d-inline-flex align-items-center justify-content-center rounded-circle font-weight-bold"
                          style={{
                            width: '26px',
                            height: '26px',
                            background: isCompleted ? '#dcfce7' : '#e2e8f0',
                            color: isCompleted ? '#166534' : '#475569',
                            fontSize: '11px',
                          }}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      {/* Name & Avatar */}
                      <td className="align-middle py-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center mr-2 font-weight-bold text-white shadow-sm flex-shrink-0"
                            style={{
                              width: '36px',
                              height: '36px',
                              background: isCompleted
                                ? 'linear-gradient(135deg, #00D294 0%, #10b981 100%)'
                                : 'linear-gradient(135deg, #0b2545 0%, #134074 100%)',
                              fontSize: '12px',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <strong className="text-dark d-block" style={{ fontSize: '14px' }}>
                              {ref.refereeName}
                            </strong>
                            <small className="text-muted" style={{ fontSize: '11px' }}>
                              Added on {new Date(ref.createdAt || Date.now()).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="align-middle py-3">
                        <span
                          className="badge font-weight-bold px-2 py-1"
                          style={{
                            background: 'rgba(0, 210, 148, 0.12)',
                            color: '#00875a',
                            fontSize: '12px',
                            borderRadius: '6px',
                          }}
                        >
                          {ref.refereeRole}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="align-middle py-3">
                        <span className="text-dark small d-flex align-items-center font-monospace">
                          <span className="mr-1 text-muted">✉</span>
                          {ref.refereeEmail}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="align-middle py-3">
                        {isCompleted ? (
                          <span
                            className="badge badge-success px-3 py-1 font-weight-bold text-white shadow-sm"
                            style={{ fontSize: '11px' }}
                          >
                            ✓ Verified (+5 Pts)
                          </span>
                        ) : isOtpVerified ? (
                          <span
                            className="badge badge-info px-2 py-1 font-weight-bold text-white"
                            style={{ fontSize: '11px' }}
                          >
                            OTP Verified · Feedback Pending
                          </span>
                        ) : (
                          <span
                            className="badge px-2 py-1 font-weight-bold text-white d-inline-flex align-items-center"
                            style={{ background: '#3b82f6', fontSize: '11px' }}
                          >
                            <span className="pulsing-dot-white mr-1"></span> Email Delivered · Pending
                          </span>
                        )}
                      </td>

                      {/* Actions: Send Email (Enable/Disable) & Share Link */}
                      <td className="align-middle text-right py-3 pr-4">
                        <div className="d-inline-flex align-items-center gap-2 flex-wrap justify-content-end">
                          {/* 1. EMAIL ACTION (Enabled / Disabled logic) */}
                          {isCompleted ? (
                            <button
                              type="button"
                              disabled
                              className="btn btn-sm btn-light text-success font-weight-bold border"
                              style={{ fontSize: '11px', cursor: 'default' }}
                              title="Reference is already verified and points are awarded"
                            >
                              ✓ Verified
                            </button>
                          ) : isCooldownActive ? (
                            <button
                              type="button"
                              disabled
                              className="btn btn-sm btn-light border text-muted font-weight-bold"
                              style={{ fontSize: '11px', cursor: 'not-allowed' }}
                              title={`Please wait ${cooldownSeconds}s before resending`}
                            >
                              Sent ({cooldownSeconds}s)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResendInvitation(ref._id, ref.refereeEmail)}
                              disabled={resendingId === ref._id || isSetupCompleted}
                              className="btn btn-sm btn-outline-primary font-weight-bold"
                              style={{ fontSize: '11px' }}
                              title={isSetupCompleted ? 'Setup completed & locked' : 'Resend invitation email'}
                            >
                              {resendingId === ref._id ? (
                                <>
                                  <ButtonSpinner color="#0b2545" size="sm" /> Sending...
                                </>
                              ) : (
                                '✉ Resend Email'
                              )}
                            </button>
                          )}

                          {/* 2. SHARE LINK ACTION */}
                          {isCompleted ? (
                            <button
                              type="button"
                              onClick={() => handleViewFeedback(ref)}
                              className="btn btn-sm font-weight-bold"
                              style={{
                                background: '#e6fffa',
                                color: '#00875a',
                                border: '1px solid #00D294',
                                fontSize: '11px',
                              }}
                              title="View reference ratings and feedback"
                            >
                               View Feedback
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleShareLink(ref)}
                              disabled={isSetupCompleted}
                              className="btn btn-sm font-weight-bold shadow-sm"
                              style={{
                                background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '11px',
                              }}
                              title={isSetupCompleted ? 'Setup completed & locked' : 'Copy or share secure verification link'}
                            >
                              🔗 Share Link
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* MODAL 1: ADD PROFESSIONAL REFERENCE (With Real-Time Regex Validation) */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 12, 31, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            overflowY: 'auto',
          }}
          onClick={() => !submitting && setShowAddModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              position: 'relative',
              animation: 'fadeInModal 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalStep === 'form' ? (
              <>
                <div
                  className="modal-header border-bottom"
                  style={{
                    background: 'linear-gradient(135deg, #020C1F 0%, #07152E 100%)',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(0, 210, 148, 0.16)',
                        border: '1px solid rgba(0, 210, 148, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00D294',
                        boxShadow: '0 0 12px rgba(0, 210, 148, 0.25)',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}
                    >
                      ✉
                    </div>
                    <div>
                      <h5 className="modal-title font-weight-bold text-white mb-0" style={{ fontSize: '17px' }}>
                        Add Professional Reference
                      </h5>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Step 5: Reference Verification (+10 Points)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      lineHeight: 1,
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleAddReference} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                    {/* 1. Name with Regex Validation */}
                    <div className="form-group mb-3">
                      <label className="font-weight-bold text-dark small d-flex justify-content-between">
                        <span>Reference Full Name *</span>
                        {refereeName && !fieldErrors.name && (
                          <span className="text-success small font-weight-bold">✓ Valid Name</span>
                        )}
                      </label>
                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors.name ? 'is-invalid' : refereeName ? 'is-valid' : ''
                        }`}
                        placeholder="e.g. Full Name"
                        value={refereeName}
                        onChange={(e) => {
                          setRefereeName(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, name: validateName(e.target.value) }));
                        }}
                        required
                        disabled={submitting}
                        style={{ height: '44px', borderRadius: '10px' }}
                      />
                      {fieldErrors.name ? (
                        <div className="invalid-feedback d-block small font-weight-bold">
                          {fieldErrors.name}
                        </div>
                      ) : (
                        <small className="form-text text-muted">
                          Only letters, spaces, and periods allowed (2-50 characters).
                        </small>
                      )}
                    </div>

                    {/* 2. Email with Regex Validation */}
                    <div className="form-group mb-3">
                      <label className="font-weight-bold text-dark small d-flex justify-content-between">
                        <span>Professional Email Address *</span>
                        {refereeEmail && !fieldErrors.email && (
                          <span className="text-success small font-weight-bold">✓ Valid Email</span>
                        )}
                      </label>
                      <input
                        type="email"
                        className={`form-control ${
                          fieldErrors.email ? 'is-invalid' : refereeEmail ? 'is-valid' : ''
                        }`}
                        placeholder="e.g. rahul@company.com"
                        value={refereeEmail}
                        onChange={(e) => {
                          setRefereeEmail(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                        }}
                        required
                        disabled={submitting}
                        style={{ height: '44px', borderRadius: '10px' }}
                      />
                      {fieldErrors.email ? (
                        <div className="invalid-feedback d-block small font-weight-bold">
                          {fieldErrors.email}
                        </div>
                      ) : (
                        <small className="form-text text-muted">
                          Must be a valid email format. Verification link &amp; OTP will be sent here.
                        </small>
                      )}
                    </div>

                    {/* 3. Role with Regex Validation */}
                    <div className="form-group mb-3">
                      <label className="font-weight-bold text-dark small d-flex justify-content-between">
                        <span>Role / Designation *</span>
                        {refereeRole && !fieldErrors.role && (
                          <span className="text-success small font-weight-bold">✓ Valid Role</span>
                        )}
                      </label>
                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors.role ? 'is-invalid' : refereeRole ? 'is-valid' : ''
                        }`}
                        placeholder="e.g. Senior Engineering Manager / Team Lead"
                        value={refereeRole}
                        onChange={(e) => {
                          setRefereeRole(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, role: validateRole(e.target.value) }));
                        }}
                        required
                        disabled={submitting}
                        style={{ height: '44px', borderRadius: '10px' }}
                      />
                      {fieldErrors.role ? (
                        <div className="invalid-feedback d-block small font-weight-bold">
                          {fieldErrors.role}
                        </div>
                      ) : (
                        <small className="form-text text-muted">
                          e.g. Project Manager, Tech Lead, Senior Developer (2-60 characters).
                        </small>
                      )}
                    </div>
                  </div>

                  <div
                    className="modal-footer border-top bg-light"
                    style={{
                      padding: '14px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm px-3"
                      style={{ borderRadius: '8px', fontWeight: 600 }}
                      onClick={() => setShowAddModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-teal btn-sm font-weight-bold px-4 py-2"
                      style={{ borderRadius: '8px' }}
                      disabled={submitting || Boolean(fieldErrors.name || fieldErrors.email || fieldErrors.role)}
                    >
                      {submitting ? (
                        <>
                          <ButtonSpinner color="#ffffff" size="sm" /> Dispatching Email...
                        </>
                      ) : (
                        'Send Invitation Email →'
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Step 2: Sent Confirmation Screen with Instant Share Link Option */
              <div>
                <div
                  className="modal-header border-bottom"
                  style={{
                    background: 'linear-gradient(135deg, #020C1F 0%, #07152E 100%)',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(0, 210, 148, 0.16)',
                        border: '1px solid rgba(0, 210, 148, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00D294',
                        fontSize: '18px',
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <h5 className="modal-title font-weight-bold text-white mb-0" style={{ fontSize: '17px' }}>
                        Invitation Dispatched
                      </h5>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Verification email sent successfully
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowAddModal(false)}
                  >
                    &times;
                  </button>
                </div>

                <div className="modal-body p-4 p-md-5 text-center bg-white" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
                  <div
                    className="mb-3 d-inline-flex align-items-center justify-content-center mx-auto rounded-circle shadow-sm"
                    style={{
                      width: '74px',
                      height: '74px',
                      background: 'linear-gradient(135deg, #00D294 0%, #10b981 100%)',
                      color: '#ffffff',
                      fontSize: '38px',
                      boxShadow: '0 8px 24px rgba(0, 210, 148, 0.35)',
                    }}
                  >
                    ✓
                  </div>
                  <h4 className="font-weight-bold text-dark mb-2">Invitation Email Delivered!</h4>
                  <p className="text-muted small mb-3">
                    A secure verification link has been dispatched in the background to:
                  </p>

                  <div className="p-3 rounded-lg bg-light border mb-4 text-left small">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-muted">Recipient:</span>
                      <strong className="text-dark">{recentlySentReferee?.name}</strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-muted">Email:</span>
                      <strong className="text-teal">{recentlySentReferee?.email}</strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Designation:</span>
                      <strong className="text-dark">{recentlySentReferee?.role}</strong>
                    </div>
                  </div>

                  {/* Share Link Quick Action */}
                  {recentlySentReferee?.shareableLink && (
                    <div className="p-3 rounded-lg mb-4 text-left border" style={{ background: '#f0fdf9' }}>
                      <span className="small font-weight-bold text-dark d-block mb-1">
                        🔗 Direct Verification Link:
                      </span>
                      <div className="input-group input-group-sm">
                        <input
                          type="text"
                          readOnly
                          className="form-control font-monospace small bg-white cursor-pointer"
                          value={formatShareableLink(recentlySentReferee.shareableLink)}
                          onClick={(e) => {
                            e.target.select();
                            handleCopyFromModal(recentlySentReferee.shareableLink);
                          }}
                          title="Click to select all & copy"
                        />
                        <div className="input-group-append">
                          <button
                            type="button"
                            onClick={() => handleCopyFromModal(recentlySentReferee.shareableLink)}
                            className={`btn font-weight-bold transition-all px-3 ${
                              addModalCopied ? 'btn-success text-white' : 'btn-outline-teal'
                            }`}
                          >
                            {addModalCopied ? '✓ Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      </div>
                      <small className="text-muted d-block mt-1 mb-2" style={{ fontSize: '11px' }}>
                        💡 You can copy this link or send it directly via WhatsApp:
                      </small>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Hi ${recentlySentReferee?.name || 'there'}, please verify my professional reference on EMPLOYIX: ${formatShareableLink(recentlySentReferee.shareableLink)}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-block font-weight-bold py-2 text-white d-flex align-items-center justify-content-center shadow-2xs"
                        style={{
                          borderRadius: '8px',
                          background: '#25D366',
                          borderColor: '#25D366',
                          fontSize: '13px',
                        }}
                      >
                        <span className="mr-1" style={{ fontSize: '15px' }}>💬</span> Share directly via WhatsApp &rarr;
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-primary-teal btn-block font-weight-bold py-3 shadow-sm"
                    style={{ borderRadius: '10px' }}
                  >
                    Done &amp; View in Table →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: SHARE VERIFICATION LINK (Modern Design) */}
      {shareModal.isOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 12, 31, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            overflowY: 'auto',
          }}
          onClick={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              position: 'relative',
              animation: 'fadeInModal 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header border-bottom"
              style={{
                background: 'linear-gradient(135deg, #020C1F 0%, #07152E 100%)',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(0, 210, 148, 0.16)',
                    border: '1px solid rgba(0, 210, 148, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00D294',
                    boxShadow: '0 0 12px rgba(0, 210, 148, 0.25)',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  🔗
                </div>
                <div>
                  <h5 className="modal-title font-weight-bold text-white mb-0" style={{ fontSize: '17px' }}>
                    Share Verification Link
                  </h5>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Direct secure link for quick referee verification
                  </span>
                </div>
              </div>
              <button
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  transition: 'all 0.2s',
                }}
                onClick={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
              >
                &times;
              </button>
            </div>

            <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
              {shareModal.loading ? (
                <div className="text-center py-4">
                  <ButtonSpinner color="#00D294" />
                  <span className="small text-muted d-block mt-2 font-weight-bold">
                    Generating secure token link...
                  </span>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-light border mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1 small">
                      <span className="text-muted">Reference:</span>
                      <strong className="text-dark">
                        {shareModal.reference?.refereeName} ({shareModal.reference?.refereeRole})
                      </strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between small">
                      <span className="text-muted">Registered Email:</span>
                      <strong className="text-teal font-monospace">
                        {shareModal.reference?.refereeEmail}
                      </strong>
                    </div>
                  </div>

                  <p className="text-muted small mb-2">
                    Share this unique secure link directly with your reference via WhatsApp, LinkedIn, or messaging:
                  </p>

                  <div className="form-group mb-3">
                    <div className="input-group">
                      <input
                        type="text"
                        readOnly
                        className="form-control font-monospace small bg-white border"
                        value={shareModal.link}
                        onClick={(e) => e.target.select()}
                        style={{ height: '42px', borderRadius: '8px 0 0 8px' }}
                      />
                      <div className="input-group-append">
                        <button
                          type="button"
                          onClick={() => handleCopyFromModal(shareModal.link)}
                          className={`btn font-weight-bold px-3 ${
                            shareModal.copied ? 'btn-success text-white' : 'btn-primary-teal'
                          }`}
                          style={{ borderRadius: '0 8px 8px 0' }}
                        >
                          {shareModal.copied ? '✓ Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Social Share Buttons */}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Hi ${shareModal.reference?.refereeName}, please verify my work reference on EMPLOYIX: ${shareModal.link}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-success font-weight-bold flex-fill py-2"
                      style={{ borderRadius: '8px' }}
                    >
                      Share via WhatsApp &rarr;
                    </a>
                    <a
                      href={shareModal.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-secondary font-weight-bold flex-fill py-2"
                      style={{ borderRadius: '8px' }}
                    >
                      Open in New Tab &rarr;
                    </a>
                  </div>

                  <div
                    className="p-3 rounded-lg small"
                    style={{ background: '#f8fafc', borderLeft: '4px solid #00D294' }}
                  >
                    <strong className="text-dark d-block mb-1">Security Guard:</strong>
                    <span className="text-muted">
                      When the reference opens this link, they will verify with a 6-digit Email OTP sent to{' '}
                      <strong>{shareModal.reference?.refereeEmail}</strong> before submitting feedback.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div
              className="modal-footer bg-light border-top"
              style={{
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm px-4"
                style={{ borderRadius: '8px', fontWeight: 600 }}
                onClick={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: VIEW FEEDBACK (For Completed References) */}
      {feedbackModal.isOpen && feedbackModal.reference && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 12, 31, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            overflowY: 'auto',
          }}
          onClick={() => setFeedbackModal({ isOpen: false, reference: null })}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              position: 'relative',
              animation: 'fadeInModal 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header border-bottom"
              style={{
                background: 'linear-gradient(135deg, #020C1F 0%, #07152E 100%)',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(0, 210, 148, 0.16)',
                    border: '1px solid rgba(0, 210, 148, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00D294',
                    boxShadow: '0 0 12px rgba(0, 210, 148, 0.25)',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  ★
                </div>
                <div>
                  <h5 className="modal-title font-weight-bold text-white mb-0" style={{ fontSize: '17px' }}>
                    Verified Professional Feedback
                  </h5>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Verified candidate conduct &amp; ratings
                  </span>
                </div>
              </div>
              <button
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  transition: 'all 0.2s',
                }}
                onClick={() => setFeedbackModal({ isOpen: false, reference: null })}
              >
                &times;
              </button>
            </div>

            <div className="modal-body p-4 bg-white" style={{ overflowY: 'auto' }}>
              {/* Section 1: Professional Referee Profile Card */}
              <div
                className="p-3 rounded-xl mb-3 text-center"
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                }}
              >
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle text-white font-weight-bold shadow-sm mr-3 flex-shrink-0"
                    style={{
                      width: '46px',
                      height: '46px',
                      background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                      fontSize: '18px',
                      border: '2px solid #ffffff',
                    }}
                  >
                    {(feedbackModal.reference.refereeName || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="d-flex align-items-center">
                      <h5 className="font-weight-bold text-dark mb-0 mr-2" style={{ fontSize: '16px' }}>
                        {feedbackModal.reference.refereeName}
                      </h5>
                      <span
                        className="badge px-2 py-0 font-weight-bold"
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      >
                        ✓ Verified
                      </span>
                    </div>
                    <span className="text-muted small d-block" style={{ fontSize: '12px' }}>
                      ✉ {feedbackModal.reference.refereeEmail}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-center flex-wrap gap-1 mt-2">
                  <span
                    className="badge px-2 py-1 font-weight-bold"
                    style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    💼 {feedbackModal.reference.refereeRole}
                  </span>
                  {feedbackModal.reference.feedback?.companyName && (
                    <span
                      className="badge px-2 py-1 font-weight-bold"
                      style={{
                        background: '#ffffff',
                        color: '#0f172a',
                        borderRadius: '8px',
                        fontSize: '12px',
                        border: '1.5px solid #cbd5e1',
                      }}
                    >
                      🏢 {feedbackModal.reference.feedback.companyName}
                    </span>
                  )}
                </div>
              </div>

              {/* Section 2: Employment Tenure Confirmation */}
              <div
                className="p-3 rounded-xl mb-3"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              >
                <span className="small text-muted font-weight-bold d-block mb-2">
                  📋 Employment Confirmation &amp; Tenure:
                </span>
                <div className="d-flex align-items-center justify-content-between mb-1 small">
                  <span className="text-muted">Worked Together:</span>
                  <strong
                    className={
                      feedbackModal.reference.feedback?.workedTogether === 'No'
                        ? 'text-danger'
                        : 'text-success'
                    }
                  >
                    {feedbackModal.reference.feedback?.workedTogether === 'No'
                      ? '✗ Did not work together'
                      : '✓ Yes, worked together'}
                  </strong>
                </div>
                {feedbackModal.reference.feedback?.startDate && (
                  <div className="d-flex align-items-center justify-content-between mb-1 small">
                    <span className="text-muted">Verified Period:</span>
                    <strong className="text-dark font-monospace">
                      📅 {feedbackModal.reference.feedback.startDate} &rarr;{' '}
                      {feedbackModal.reference.feedback.isCurrentlyWorking
                        ? 'Present (Active)'
                        : feedbackModal.reference.feedback.endDate || 'Present'}
                    </strong>
                  </div>
                )}
                {feedbackModal.reference.feedback?.companyName && (
                  <div className="d-flex align-items-center justify-content-between mb-1 small">
                    <span className="text-muted">Company / Org:</span>
                    <strong className="text-dark font-weight-bold">
                      🏢 {feedbackModal.reference.feedback.companyName}
                    </strong>
                  </div>
                )}
                <div className="d-flex align-items-center justify-content-between small">
                  <span className="text-muted">Relationship / Capacity:</span>
                  <strong className="text-dark font-weight-bold">
                    {feedbackModal.reference.feedback?.relationship || feedbackModal.reference.refereeRole || 'Colleague / Manager'}
                  </strong>
                </div>
              </div>

              {/* Section 3: Conduct & Soft Skills (1 - 10) */}
              <div
                className="p-3 rounded-xl mb-3"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-muted font-weight-bold">
                    ⭐ Conduct &amp; Soft Skills (1 - 10):
                  </span>
                  <strong className="text-warning font-weight-bold" style={{ fontSize: '13px' }}>
                    {'★'.repeat(typeof feedbackModal.reference.feedback?.rating === 'number' ? feedbackModal.reference.feedback.rating : 5)}
                    {'☆'.repeat(Math.max(0, 5 - (typeof feedbackModal.reference.feedback?.rating === 'number' ? feedbackModal.reference.feedback.rating : 5)))}{' '}
                    <span className="text-dark" style={{ fontSize: '12px' }}>
                      ({typeof feedbackModal.reference.feedback?.rating === 'number' ? feedbackModal.reference.feedback.rating : 5} / 5)
                    </span>
                  </strong>
                </div>

                <div className="row g-2 text-center small">
                  <div className="col-4">
                    <div className="p-2 rounded bg-white border">
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        🎯 Diligence
                      </span>
                      <strong className="text-dark font-weight-bold" style={{ fontSize: '14px' }}>
                        {feedbackModal.reference.feedback?.diligence ?? 8} / 10
                      </strong>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 rounded bg-white border">
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        🚀 Enthusiasm
                      </span>
                      <strong className="text-dark font-weight-bold" style={{ fontSize: '14px' }}>
                        {feedbackModal.reference.feedback?.enthusiasm ?? 8} / 10
                      </strong>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 rounded bg-white border">
                      <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                        🤝 Respect
                      </span>
                      <strong className="text-dark font-weight-bold" style={{ fontSize: '14px' }}>
                        {feedbackModal.reference.feedback?.respectfulness ?? 8} / 10
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Recommendation & Written Remarks */}
              <div
                className="p-3 rounded-xl mb-3"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2 small">
                  <span className="text-muted font-weight-bold">Recommendation:</span>
                  <span
                    className={`badge font-weight-bold px-2 py-1 ${
                      feedbackModal.reference.feedback?.recommendation === 'No'
                        ? 'badge-danger'
                        : 'badge-success'
                    }`}
                  >
                    {feedbackModal.reference.feedback?.recommendation === 'No'
                      ? '✗ Not Recommended'
                      : '✓ Recommended'}
                  </span>
                </div>

                <span className="small text-muted font-weight-bold d-block mb-1">
                  Written Feedback / Summary:
                </span>
                <p
                  className="text-dark small mb-0 font-italic p-2 rounded"
                  style={{ background: '#f8fafc', borderLeft: '3px solid #00D294' }}
                >
                  "{(() => {
                    const text = feedbackModal.reference.feedback?.feedback?.trim();
                    if (text && text !== '.' && text !== '""') {
                      return text;
                    }
                    const comp = feedbackModal.reference.feedback?.companyName;
                    const d = feedbackModal.reference.feedback?.diligence ?? 8;
                    const e = feedbackModal.reference.feedback?.enthusiasm ?? 8;
                    const r = feedbackModal.reference.feedback?.respectfulness ?? 8;
                    return `Professional reference confirmed. Rated Diligence ${d}/10, Enthusiasm ${e}/10, Respectfulness ${r}/10${comp ? ` at ${comp}` : ''}.`;
                  })()}"
                </p>
              </div>

              {/* Section 5: Trust Award Banner */}
              <div
                className="d-flex align-items-center justify-content-between p-2 px-3 rounded small font-weight-bold"
                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
              >
                <span>✓ Verified &amp; Secured on DB</span>
                <span>+5 Reward Points Credited</span>
              </div>
            </div>

            <div className="modal-footer bg-light border-top d-flex align-items-center justify-content-end" style={{ padding: '14px 24px', flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm px-4 font-weight-bold"
                style={{ borderRadius: '8px' }}
                onClick={() => setFeedbackModal({ isOpen: false, reference: null })}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm px-3 font-weight-bold d-inline-flex align-items-center ml-2"
                style={{ borderRadius: '8px' }}
                onClick={() => {
                  toast.info(`Dispute / Report registered for ${feedbackModal.reference?.refereeName}. Our compliance team will review this reference.`);
                  setFeedbackModal({ isOpen: false, reference: null });
                }}
              >
                <span className="mr-1">🚩</span> Report
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProfessionalReferenceSection;
