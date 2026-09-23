import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isTokenValid, getStoredToken } from '../../utils/auth';

/**
 * PublicRoute (Guest Guard)
 * Redirects already-authenticated users away from guest pages (like /login, /register)
 * directly to /profile or their intended page.
 */
const PublicRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  const localToken = getStoredToken();
  const currentToken = token || localToken;
  const hasValidSession = Boolean(currentToken && isTokenValid(currentToken));

  if (hasValidSession) {
    const destination = location.state?.from?.pathname || '/profile';
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default PublicRoute;
