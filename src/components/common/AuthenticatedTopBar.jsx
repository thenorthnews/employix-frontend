import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { logout, logoutUser } from '../../redux/slices/authSlice';

const AuthenticatedTopBar = ({ subtitle = 'Verified Profile Dashboard', onLogoutSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
    } catch (_) {}
    dispatch(logout());
    if (onLogoutSuccess) onLogoutSuccess();
    toast.success('You have been logged out successfully.');
    navigate('/login');
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return '/images/identity.jpg';
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('blob:')) return imgPath;
    return imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
  };

  const userName = user?.name || 'Verified Candidate';
  const userAvatar = getImageUrl(user?.image || user?.profileImage);
  const employixId = user?.employixId || (user?._id ? `EMX-${user._id.slice(-4).toUpperCase()}-1934` : 'EMX-4021-7758-1934');

  return (
    <header className="authenticated-top-bar">
      <div className="container d-flex align-items-center justify-content-between py-2 py-md-3">
        {/* Left: Brand Logo & Context */}
        <div className="d-flex align-items-center gap-3">
          <Link to="/" className="d-flex align-items-center brand-link mr-3" title="Employix Home">
            <img
              src="/images/Employix-01.png"
              alt="Employix"
              className="topbar-logo"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/identity.jpg';
              }}
            />
          </Link>

          <div className="d-none d-md-block border-left pl-3 border-secondary-subtle">
            <span className="badge badge-pill badge-teal-subtle px-2 py-1 small font-weight-bold">
              <span className="pulsing-dot mr-1">&#9679;</span> {subtitle}
            </span>
          </div>
        </div>

        {/* Right: Candidate Mini Info & PROMINENT Logout Button */}
        <div className="d-flex align-items-center gap-3">
          {/* Candidate Snippet */}
          <div className="d-none d-sm-flex align-items-center mr-3">
            <div className="position-relative mr-2">
              <img
                src={userAvatar}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/identity.jpg';
                }}
                alt={userName}
                className="rounded-circle border border-teal"
                style={{ width: '36px', height: '36px', objectFit: 'cover' }}
              />
              <span
                className="position-absolute rounded-circle bg-success"
                style={{ width: '10px', height: '10px', bottom: 0, right: 0, border: '2px solid #0B132B' }}
                title="Active Session"
              ></span>
            </div>
            <div className="text-left" style={{ lineHeight: 1.2 }}>
              <span className="d-block text-white font-weight-bold small text-truncate" style={{ maxWidth: '140px' }}>
                {userName}
              </span>
              <span className="text-teal font-weight-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                {employixId}
              </span>
            </div>
          </div>

          {/* Dedicated Prominent Logout Button */}
          <button
            type="button"
            className="btn-prominent-logout"
            onClick={handleLogout}
            title="Sign Out of Employix"
            aria-label="Logout"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 logout-svg-icon"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedTopBar;
