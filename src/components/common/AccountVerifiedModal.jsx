import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const AccountVerifiedModal = ({
  isOpen,
  onProceed,
  title = 'Account Verified Successfully!',
  subtitle = 'Your email and login credentials have been verified. Welcome to Employix!',
  buttonText = 'Start your free verification',
  countdownSeconds = 3,
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        if (typeof onProceed === 'function') onProceed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onProceed]);

  // Lock body scroll
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

  // Optional auto-redirect countdown
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(countdownSeconds);
      return;
    }

    if (timeLeft <= 0) {
      if (typeof onProceed === 'function') onProceed();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, countdownSeconds, onProceed]);

  if (!isOpen) return null;

  const modalNode = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.45)',
          width: '100%',
          maxWidth: '430px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '38px 30px 32px',
          position: 'relative',
          animation: 'accVerifyPop 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <style>{`
          @keyframes accVerifyPop {
            0% {
              opacity: 0;
              transform: scale(0.88) translateY(18px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes accPulseRing {
            0% {
              box-shadow: 0 0 0 0 rgba(0, 210, 148, 0.5);
            }
            70% {
              box-shadow: 0 0 0 18px rgba(0, 210, 148, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 210, 148, 0);
            }
          }
        `}</style>

        {/* 1. Animated Success Icon */}
        <div
          style={{
            width: '82px',
            height: '82px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: '20px',
            boxShadow: '0 12px 28px rgba(0, 210, 148, 0.4)',
            animation: 'accPulseRing 2s infinite',
          }}
        >
          <svg
            width="44"
            height="44"
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

        {/* 2. Success Title */}
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
          }}
        >
          {title}
        </h3>

        {/* 3. Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '50px',
            background: 'rgba(0, 210, 148, 0.12)',
            color: '#009366',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.01em',
            border: '1px solid rgba(0, 210, 148, 0.3)',
            marginBottom: '16px',
          }}
        >
          <span>✓</span>
          <span>Verified &amp; Authenticated</span>
        </div>

        {/* 4. Subtitle Message */}
        <p
          style={{
            margin: '0 0 26px',
            fontSize: '0.92rem',
            color: '#64748B',
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>

        {/* 5. Primary Action Button */}
        <button
          type="button"
          onClick={onProceed}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0, 210, 148, 0.42)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 210, 148, 0.52)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 210, 148, 0.42)';
          }}
        >
          <span>{buttonText}</span>
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>&rarr;</span>
        </button>

        {/* 6. Auto-redirect helper */}
        <span
          style={{
            marginTop: '14px',
            color: '#94A3B8',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          Auto-redirecting in {timeLeft}s...
        </span>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

export default AccountVerifiedModal;
