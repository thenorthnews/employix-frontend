import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { isTokenValid, getStoredToken, clearStoredAuth } from '../../utils/auth';
import { logout, updateUserKycStatus } from '../../redux/slices/authSlice';
import { getKycStatusApi } from '../../api/kycApi';
import ButtonSpinner from './Loader';

/**
 * ProtectedRoute Guard
 * 1. Blocks unauthenticated users without a valid token -> redirects to /login.
 * 2. If requireAadhaar is true (for /profile), blocks access until Aadhaar status is 1 (Verified).
 *    Redirects unverified users to /kyc-verification.
 */
const ProtectedRoute = ({ children, requireAadhaar = false }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  const localToken = getStoredToken();
  const currentToken = token || localToken;
  const hasValidSession = Boolean(currentToken && isTokenValid(currentToken));

  const [checkingAadhaar, setCheckingAadhaar] = useState(requireAadhaar);
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(user?.aadhaarStatus === 1);

  useEffect(() => {
    let isMounted = true;

    if (!hasValidSession) return;

    if (requireAadhaar) {
      // If user state already confirms Aadhaar is verified (1)
      if (user?.aadhaarStatus === 1) {
        setIsAadhaarVerified(true);
        setCheckingAadhaar(false);
        return;
      }

      // Check current live status from backend database
      const verifyStatus = async () => {
        try {
          const res = await getKycStatusApi();
          const data = res.data?.data || res.data || res;
          if (isMounted) {
            if (data.aadhaarStatus === 1) {
              setIsAadhaarVerified(true);
              dispatch(
                updateUserKycStatus({
                  aadhaarStatus: 1,
                  kycStatus: data.kycStatus,
                  employixScore: data.employixScore,
                })
              );
            } else {
              setIsAadhaarVerified(false);
              toast.error('Aadhaar Card verification is required to access your Profile!');
            }
          }
        } catch (err) {
          if (isMounted) {
            setIsAadhaarVerified(false);
            toast.error('Aadhaar Card verification is required to access your Profile!');
          }
        } finally {
          if (isMounted) {
            setCheckingAadhaar(false);
          }
        }
      };

      verifyStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [hasValidSession, requireAadhaar, user, dispatch]);

  if (!hasValidSession) {
    if (isAuthenticated || localToken) {
      clearStoredAuth();
      dispatch(logout());
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAadhaar) {
    if (checkingAadhaar) {
      return (
        <div
          className="d-flex justify-content-center align-items-center min-vh-100"
          style={{ background: '#020c1f', color: '#00D294' }}
        >
          <ButtonSpinner text="Checking Aadhaar Verification Status..." />
        </div>
      );
    }

    if (!isAadhaarVerified) {
      return <Navigate to="/kyc-verification" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
