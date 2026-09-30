import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const AadhaarSuccessModal = ({
  isOpen,
  onClose,
  title = 'Aadhaar Card Successfully Verified!',
  pointsEarned = 20,
  badgeText = null,
  description = null,
  buttonText = 'Proceed to Next Step',
  onContinue = null,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayPoints = Number(pointsEarned);
  const finalBadgeText =
    badgeText ||
    (displayPoints > 0 ? `Earned +${displayPoints} Points` : 'Verified & Authenticated');

  const finalDescription =
    description ||
    (displayPoints > 0
      ? `Verification is completed successfully and +${displayPoints} points have been credited to your profile.`
      : 'Your credentials have been verified and authenticated successfully.');

  const handleAction = () => {
    onClose();
    if (typeof onContinue === 'function') {
      onContinue();
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '36px 28px 28px',
          position: 'relative',
          animation: 'kycSimpleModalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kycSuccessHeading"
      >
        <style>{`
          @keyframes kycSimpleModalPop {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(14px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes simplePulseRing {
            0% {
              box-shadow: 0 0 0 0 rgba(0, 210, 148, 0.45);
            }
            70% {
              box-shadow: 0 0 0 16px rgba(0, 210, 148, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 210, 148, 0);
            }
          }
        `}</style>

        {/* Close 'X' Button at top-right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#F1F5F9',
            border: 'none',
            color: '#64748B',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            lineHeight: 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E2E8F0';
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          &times;
        </button>

        {/* 1. Green Circular Tick Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: '20px',
            boxShadow: '0 10px 25px rgba(0, 210, 148, 0.35)',
            animation: 'simplePulseRing 2s infinite',
          }}
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* 2. Verification Title */}
        <h3
          id="kycSuccessHeading"
          style={{
            margin: '0 0 10px',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
          }}
        >
          {title}
        </h3>

        {/* 3. Points / Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 22px',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #00D294 0%, #10B981 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1.05rem',
            letterSpacing: '0.01em',
            boxShadow: '0 4px 14px rgba(0, 210, 148, 0.35)',
            marginTop: '6px',
            marginBottom: '14px',
          }}
        >
          <span>✨</span>
          <span>{finalBadgeText}</span>
          <span>🎉</span>
        </div>

        {/* Short Subtitle */}
        <p
          style={{
            margin: '0 0 26px',
            fontSize: '0.9rem',
            color: '#64748B',
            lineHeight: 1.5,
          }}
        >
          {finalDescription}
        </p>

        {/* 4. Action Button */}
        <button
          type="button"
          onClick={handleAction}
          style={{
            width: '100%',
            padding: '13px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 210, 148, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 210, 148, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 210, 148, 0.4)';
          }}
        >
          <span>{buttonText}</span>
          <span>&rarr;</span>
        </button>

        {/* Secondary Close link */}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: '12px',
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#475569';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default AadhaarSuccessModal;
export { AadhaarSuccessModal as KycSuccessModal };
