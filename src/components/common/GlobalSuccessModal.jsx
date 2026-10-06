import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Event-driven Global Success Modal.
 * Triggered automatically by toast.success() or window.dispatchEvent(new CustomEvent('app:show-success-modal', { detail }))
 */
const GlobalSuccessModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: 'Success!',
    message: '',
    buttonText: 'Got It',
  });

  useEffect(() => {
    const handleSuccessEvent = (e) => {
      const detail = e.detail || {};
      let title = 'Success!';
      let message = '';
      let buttonText = 'Got It';

      if (typeof detail === 'string') {
        message = detail;
      } else if (typeof detail?.message === 'string') {
        message = detail.message;
        if (detail.title) title = detail.title;
        if (detail.buttonText) buttonText = detail.buttonText;
      } else if (detail && typeof detail === 'object') {
        message = detail.text || detail.msg || 'Action completed successfully.';
      }

      // Format & shorten clean valid message
      const cleanMessage = String(message)
        .replace(/^🎉\s*/, '')
        .trim();

      setModalState({
        isOpen: true,
        title,
        message: cleanMessage,
        buttonText,
      });
    };

    window.addEventListener('app:show-success-modal', handleSuccessEvent);
    return () => {
      window.removeEventListener('app:show-success-modal', handleSuccessEvent);
    };
  }, []);

  const handleClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!modalState.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen]);

  // Auto-close after 3.2s
  useEffect(() => {
    if (!modalState.isOpen) return;
    const timer = setTimeout(() => {
      handleClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, [modalState.isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (modalState.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalState.isOpen]);

  if (!modalState.isOpen) return null;

  const modalNode = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '32px 24px 24px',
          position: 'relative',
          animation: 'globalSuccessPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <style>{`
          @keyframes globalSuccessPop {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(14px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes globalSuccessRing {
            0% {
              box-shadow: 0 0 0 0 rgba(0, 210, 148, 0.5);
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
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#F1F5F9',
            border: 'none',
            color: '#64748B',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            lineHeight: 1,
            transition: 'all 0.15s ease',
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

        {/* Animated Green Checkmark Icon */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: '18px',
            boxShadow: '0 10px 24px rgba(0, 210, 148, 0.38)',
            animation: 'globalSuccessRing 2s infinite',
          }}
        >
          <svg
            width="38"
            height="38"
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

        {/* Title */}
        <h4
          style={{
            margin: '0 0 8px',
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
          }}
        >
          {modalState.title}
        </h4>

        {/* Message */}
        <p
          style={{
            margin: '0 0 22px',
            fontSize: '0.92rem',
            color: '#475569',
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {modalState.message}
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 210, 148, 0.38)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 210, 148, 0.48)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 210, 148, 0.38)';
          }}
        >
          {modalState.buttonText}
        </button>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

export default GlobalSuccessModal;
