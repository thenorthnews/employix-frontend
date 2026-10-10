import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import store from './redux/store';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpPage from './pages/OtpPage';
import KycVerificationPage from './pages/KycVerificationPage';
import ProfilePage from './pages/ProfilePage';
import ReferenceVerificationPage from './pages/ReferenceVerificationPage';
import VerifiedIdPage from './pages/VerifiedIdPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import GlobalSuccessModal from './components/common/GlobalSuccessModal';
import './utils/toastSetup';
import './App.css';

// Normalize .nip.io or localtest.me domains back to raw IP / localhost to preserve localStorage & login session
if (typeof window !== 'undefined') {
  const currentHost = window.location.hostname;
  if (currentHost.endsWith('.nip.io')) {
    const rawIp = currentHost.replace('.nip.io', '').replace(/-/g, '.');
    const targetUrl = window.location.href.replace(currentHost, rawIp);
    window.location.replace(targetUrl);
  } else if (currentHost === 'localtest.me') {
    const targetUrl = window.location.href.replace('localtest.me', 'localhost');
    window.location.replace(targetUrl);
  }
}

// Automatically scroll to top on route change unless hash is present
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
};

// Seamless callback forwarder that keeps client_id and step query params
const DigiLockerCallbackRoute = () => {
  const location = useLocation();
  const search = location.search || '';
  const hasStep = search.includes('step=');
  const target = `/kyc-verification${search ? (hasStep ? search : `${search}&step=education`) : '?step=education'}`;
  return <Navigate to={target} replace />;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/otp"
            element={
              <PublicRoute>
                <OtpPage />
              </PublicRoute>
            }
          />
          <Route
            path="/kyc-verification"
            element={
              <ProtectedRoute>
                <KycVerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireAadhaar={true}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc/digilocker/callback"
            element={<DigiLockerCallbackRoute />}
          />
          <Route path="/reference-verification" element={<ReferenceVerificationPage />} />
          <Route path="/verify-id/:id" element={<VerifiedIdPage />} />
          <Route path="/candidate-id/:id" element={<VerifiedIdPage />} />
          {/* Fallback route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
        {/* Middle Screen Modal for All Success Messages */}
        <GlobalSuccessModal />

        {/* Right Side Toastify Container for All Error & Warning Messages */}
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          limit={4}
        />
      </Router>
    </Provider>
  );
}

export default App;
