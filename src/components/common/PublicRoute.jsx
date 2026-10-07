import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isTokenValid, getStoredToken } from '../../utils/auth';
import { getKycVerificationFlags, isCandidateSetupCompleted } from '../../utils/profileUtils';

/**
 * PublicRoute (Guest Guard)
 * Redirects already-authenticated users away from guest pages (like /login, /register)
 * directly to /profile (if KYC completed) or /kyc-verification (if pending).
 */
const PublicRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  const localToken = getStoredToken();
  const currentToken = token || localToken;
  const hasValidSession = Boolean(currentToken && isTokenValid(currentToken));

  if (hasValidSession) {
    const flags = getKycVerificationFlags(user);
    const isCompleted = isCandidateSetupCompleted(user) || flags.isSetupCompleted || flags.isAllStepsDone;
    const defaultDest = isCompleted ? '/profile' : '/kyc-verification';
    const destination = location.state?.from?.pathname || defaultDest;
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default PublicRoute;
