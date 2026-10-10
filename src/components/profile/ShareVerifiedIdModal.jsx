import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { formatEmployixId, resolveImageUrl } from '../../utils/profileUtils';

const ShareVerifiedIdModal = ({ isOpen, onClose, user }) => {
  const [copied, setCopied] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  if (!isOpen || !user) return null;

  const rawEmployixId = user?.employixId || (user?._id ? `#EMP-${user._id.toString().slice(-4).toUpperCase()}-IN` : '#EMP-USER-IN');
  const cleanIdForUrl = rawEmployixId.replace(/^#/, '');
  const formattedId = formatEmployixId(user?.employixId, user?._id);
  const candidateName = user?.name || 'Verified Candidate';
  const designation = user?.designation || user?.role || 'Professional';
  const avatarSrc = resolveImageUrl(user?.profileImage);
  const score = user?.employixScore || 90;

  // Generate public verification URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://employix.com';
  const shareableUrl = `${origin}/verify-id/${encodeURIComponent(cleanIdForUrl)}`;

  const checkConsentOrWarn = () => {
    if (!hasConsented) {
      toast.warn('Please give your consent by checking the box below to unlock sharing.');
      return false;
    }
    return true;
  };

  const handleCopy = async () => {
    if (!checkConsentOrWarn()) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = shareableUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      toast.success('Verified ID link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Could not copy link. Please copy manually.');
    }
  };

  const handleWhatsAppShare = () => {
    if (!checkConsentOrWarn()) return;
    const text = `*EMPLOYIX Verified Profile Report*\n\n` +
      `👤 *Candidate:* ${candidateName}\n` +
      `💼 *Designation:* ${designation}\n` +
      `🆔 *Verified ID:* ${formattedId}\n` +
      `⭐ *Trust Score:* ${score}/100\n\n` +
      `🔗 *Click to view 100% Verified Profile & Credentials:*\n` +
      `${shareableUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleLinkedInShare = () => {
    if (!checkConsentOrWarn()) return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`, '_blank');
  };

  const handleEmailShare = () => {
    if (!checkConsentOrWarn()) return;
    const subject = `Official Verified Employix ID - ${candidateName} (${formattedId})`;
    const body = `Dear Hiring Manager,\n\nI am pleased to share my verified background credentials and ID authenticated by Employix.\n\nYou can review my complete verified profile, government ID authenticity, education, and employment records directly via this tamper-evident link:\n\n${shareableUrl}\n\nCandidate: ${candidateName}\nDesignation: ${designation}\nEmployix ID: ${formattedId}\nTrust Score: ${score}/100\n\nBest regards,\n${candidateName}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(2, 12, 31, 0.76)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45)',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(0, 210, 148, 0.25)',
          position: 'relative',
          animation: 'fadeInModal 0.22s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #020C1F 0%, #071E3D 100%)',
            padding: '20px 26px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 210, 148, 0.16)',
                border: '1.5px solid rgba(0, 210, 148, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D294',
                boxShadow: '0 0 16px rgba(0, 210, 148, 0.25)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </div>
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                }}
              >
                Share Verified ID
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                Share your official tamper-proof verification with employers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'all 0.2s ease',
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
          {/* Candidate Card Summary */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              border: '1px solid #CBD5E1',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <img
                src={avatarSrc}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/identity.jpg';
                }}
                alt={candidateName}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #00D294',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {candidateName}
                  </h5>
                  <span style={{ color: '#00D294', fontWeight: 800, fontSize: '1rem' }}>✓</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500, margin: '1px 0 4px' }}>
                  {designation}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0F172A', color: '#00D294', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>ID:</span> {formattedId}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#021B3A',
                border: '1.5px solid rgba(0, 210, 148, 0.4)',
                borderRadius: '12px',
                padding: '8px 14px',
                textAlign: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00D294', lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, marginTop: '2px' }}>
                TRUST SCORE
              </div>
            </div>
          </div>

          {/* Candidate Consent Box */}
          <div
            style={{
              background: hasConsented ? 'rgba(0, 210, 148, 0.08)' : '#FFFBEB',
              border: hasConsented ? '1.5px solid #00D294' : '1.5px solid #FCD34D',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '20px',
              transition: 'all 0.2s ease',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#00D294' }}
              />
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: hasConsented ? '#065F46' : '#92400E' }}>
                  Share my Employix ID with employer
                </span>
                <span style={{ display: 'block', fontSize: '0.76rem', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>
                  I give my consent to share my Employix Verified ID status with employers. Your private document numbers remain masked and protected.
                </span>
              </div>
            </label>
          </div>

          {/* Shareable Link Box */}
          <div style={{ marginBottom: '22px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px',
              }}
            >
              Official Verification Link (Employer Access)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '6px 8px 6px 14px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <input
                type="text"
                readOnly
                value={shareableUrl}
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  textOverflow: 'ellipsis',
                }}
              />
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: copied ? '#059669' : '#00A876',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Share Channels */}
          <div style={{ marginBottom: '22px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '10px',
              }}
            >
              Instant Share Channels
            </label>
            <div style={{ display: 'flex', width: '100%' }}>
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  background: '#ECFDF5',
                  border: '1.5px solid #A7F3D0',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#065F46',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#D1FAE5';
                  e.currentTarget.style.borderColor = '#6EE7B7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ECFDF5';
                  e.currentTarget.style.borderColor = '#A7F3D0';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                Share via WhatsApp
              </button>
            </div>
          </div>

          {/* Action Footer: Preview Link */}
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>👁️</span>
              <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                Want to see what employers will view?
              </span>
            </div>
            <a
              href={shareableUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              Preview Page
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareVerifiedIdModal;
