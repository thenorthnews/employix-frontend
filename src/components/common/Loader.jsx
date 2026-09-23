import React from 'react';

/**
 * Inline spinner for submit buttons
 */
export const ButtonSpinner = ({ text = 'Please wait...' }) => {
  return (
    <span className="d-inline-flex align-items-center justify-content-center">
      <span
        className="spinner-border spinner-border-sm mr-2"
        role="status"
        aria-hidden="true"
        style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}
      ></span>
      <span>{text}</span>
    </span>
  );
};

/**
 * Full page or section overlay loader
 */
export const FullPageLoader = ({ message = 'Loading Employix...' }) => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center position-fixed w-100 h-100"
      style={{
        top: 0,
        left: 0,
        zIndex: 9999,
        background: 'rgba(5, 11, 20, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="spinner-border text-teal mb-3"
        role="status"
        style={{ width: '3.5rem', height: '3.5rem', borderWidth: '3px', color: '#00D294' }}
      >
        <span className="sr-only">Loading...</span>
      </div>
      <h5 className="text-white font-weight-bold tracking-wide">{message}</h5>
      <p className="text-muted small mb-0">Securing verified data loop</p>
    </div>
  );
};

export default ButtonSpinner;
