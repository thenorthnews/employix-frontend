import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, logoutUser } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import EditProfileModal from '../profile/EditProfileModal';
import { resolveImageUrl, formatEmployixId } from '../../utils/profileUtils';
import { deleteAccountApi } from '../../api/authApi';

const ProfileNavbar = ({ onUpdate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const btnRef = useRef(null);
  const dropdownRef = useRef(null);

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close dropdown on route change ── */
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  /* ── Click outside to close ── */
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Position dropdown below the button using fixed coords ── */
  const handleToggleDropdown = () => {
    if (!dropdownOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setDropdownOpen((o) => !o);
  };

  /* ── Reposition on scroll ── */
  useEffect(() => {
    if (!dropdownOpen) return;
    const onScroll = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [dropdownOpen]);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      setShowLogoutModal(false);
      try { await dispatch(logoutUser()); } catch (_) {}
      dispatch(logout());
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(logout());
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccountApi();
      setShowDeleteModal(false);
      try { await dispatch(logoutUser()); } catch (_) {}
      dispatch(logout());
      toast.success('Your account has been deleted successfully.');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const userName    = user?.name || 'Candidate';
  const userAvatar  = resolveImageUrl(user?.profileImage);
  const employixId  = formatEmployixId(user?.employixId, user?._id);
  const score       = user?.employixScore ?? 0;
  const kycStatus   = user?.kycStatus ?? 0;

  const isProfile = location.pathname === '/profile';
  const isKyc     = location.pathname === '/kyc-verification';

  const scoreColor = score >= 60 ? '#00D294' : score > 20 ? '#F59E0B' : '#EF4444';

  return (
    <>
      {/* ════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════ */}
      <header style={{
        background: scrolled
          ? '#051d3d'
          : '#051d3d',
        borderBottom: scrolled
          ? '1px solid rgba(0,210,148,0.15)'
          : '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 1030,
        boxShadow: scrolled
          ? '0 4px 30px rgba(0,0,0,0.5)'
          : '0 2px 16px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* ── LEFT: Logo ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img
              src="/images/employix-logo.png"
              alt="Employix"
              style={{ height: '87px', width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/images/identity.jpg'; }}
            />
          </Link>

          {/* ── CENTER: Nav pills (desktop only) ── */}
         

          {/* ── RIGHT: Score chip + User button ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

            {/* Score chip — desktop */}
          

            {/* User button (on KYC screen: Delete Account & Sign Out actions) */}
            {isKyc ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '50px',
                    padding: '7px 16px',
                    color: '#f87171',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                  }}
                  title="Permanently delete your account"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>

                <button
                  onClick={handleLogoutClick}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '50px',
                    padding: '7px 16px',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                ref={btnRef}
                onClick={handleToggleDropdown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: dropdownOpen
                    ? 'rgba(0,210,148,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  border: dropdownOpen
                    ? '1px solid rgba(0,210,148,0.35)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50px',
                  padding: '5px 12px 5px 5px',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Avatar + online dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={userAvatar}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/identity.jpg'; }}
                    alt={userName}
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(0,210,148,0.45)',
                    }}
                  />
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: '9px', height: '9px',
                    background: '#00D294', borderRadius: '50%',
                    border: '2px solid #070e1e',
                  }} />
                </div>
                {/* Name */}
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  maxWidth: '120px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} className="d-none d-sm-inline">
                  {userName}
                </span>
                {/* Caret */}
                <svg
                  width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            )}

            {/* Mobile hamburger */}
            {!isKyc && (
              <button
                className="d-lg-none"
                onClick={() => setMobileMenuOpen((o) => !o)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileMenuOpen
                    ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                    : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
                  }
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile menu drawer ── */}
        {!isKyc && mobileMenuOpen && (
          <div style={{
            background: '#0b1629',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 20px 16px',
          }}>
            {/* Mobile score */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,210,148,0.07)',
              border: '1px solid rgba(0,210,148,0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '12px',
            }}>
              <span style={{ color: '#00D294', fontWeight: 700 }}>{score}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>/100 pts</span>
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(0,210,148,0.12)', color: '#00D294',
                fontSize: '10px', fontWeight: 700,
                padding: '2px 8px', borderRadius: '50px',
              }}>KYC {kycStatus}/7</span>
            </div>

            <MobileLink to="/profile"          label="My Profile"       active={isProfile} onClick={() => setMobileMenuOpen(false)} />

            {!isKyc && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsEditModalOpen(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: '#00D294' }}>✎</span> Edit Profile
              </button>
            )}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              style={{
                width: '100%', textAlign: 'left',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px',
                padding: '11px 14px',
                color: '#f87171', fontSize: '13px', fontWeight: 600,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
            <button
              onClick={handleLogoutClick}
              style={{
                width: '100%', textAlign: 'left',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '11px 14px',
                color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════
          DROPDOWN — rendered via portal-like fixed
          positioning so it's NEVER clipped
      ════════════════════════════════════════════ */}
      {!isKyc && dropdownOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            right: dropdownPos.right,
            width: '290px',
            background: '#0c1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '18px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,210,148,0.06)',
            zIndex: 99999,
            overflow: 'hidden',
            animation: 'navDropIn 0.18s ease',
          }}
        >
          {/* Header row */}
          <div style={{
            padding: '18px 18px 14px',
            background: 'linear-gradient(135deg, rgba(0,210,148,0.08) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={userAvatar}
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/identity.jpg'; }}
                alt={userName}
                style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  objectFit: 'cover', border: '2px solid rgba(0,210,148,0.45)',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userName}
                </div>
                <div style={{ color: '#00D294', fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px', marginTop: '2px' }}>
                  {employixId}
                </div>
              </div>
            </div>
          </div>

          {/* Menu links */}
          <div style={{ padding: '8px' }}>
            <DdItem
              to="/profile"
              label="My Profile"
              sub="View your verified dashboard"
              badge={isProfile ? 'Active' : null}
              onClick={() => setDropdownOpen(false)}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              }
            />
            {!isKyc && (
              <DdAction
                onClick={() => {
                  setDropdownOpen(false);
                  setIsEditModalOpen(true);
                }}
                label="Edit Profile"
                sub="Update personal info & photo"
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                }
              />
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 8px' }} />

          {/* Delete Account (Directly ABOVE Sign Out) */}
          <div style={{ padding: '8px 8px 4px 8px' }}>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                background: 'transparent',
                border: 'none', borderRadius: '12px',
                color: '#f87171', fontSize: '13px', fontWeight: 600,
                cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div>{isDeleting ? 'Deleting Account...' : 'Delete Account'}</div>
                <div style={{ color: 'rgba(248,113,113,0.55)', fontSize: '11px', fontWeight: 400, marginTop: '1px' }}>
                  Permanently remove profile
                </div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '2px 8px' }} />

          {/* Sign Out */}
          <div style={{ padding: '4px 8px 8px 8px' }}>
            <button
              onClick={handleLogoutClick}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                background: 'transparent',
                border: 'none', borderRadius: '12px',
                color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div>Sign Out</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 400, marginTop: '1px' }}>
                  End current session
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal Dialog */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onUpdate={onUpdate}
      />

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 9999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxSizing: 'border-box',
            }}
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
                width: '100%',
                maxWidth: '430px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '36px 28px 28px',
                position: 'relative',
                animation: 'deleteModalPop 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                disabled={isDeleting}
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
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  lineHeight: 1,
                  transition: 'all 0.2s ease',
                }}
              >
                &times;
              </button>

              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                  border: '2px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  marginBottom: '18px',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.18)',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>

              <h3 style={{ margin: '0 0 10px', fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Delete Account?
              </h3>

              <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.55, fontWeight: 500 }}>
                Are you sure you want to permanently delete your account? All your profile verifications and data will be removed. This cannot be undone.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  No, Keep It
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAccount}
                  disabled={isDeleting}
                  style={{
                    flex: 1.2,
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Sign Out Confirmation Modal */}
      {showLogoutModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 9999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxSizing: 'border-box',
            }}
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
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
                animation: 'deleteModalPop 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => !isLoggingOut && setShowLogoutModal(false)}
                disabled={isLoggingOut}
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
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  lineHeight: 1,
                  transition: 'all 0.2s ease',
                }}
              >
                &times;
              </button>

              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E6FBF5 0%, #D1FAE5 100%)',
                  border: '2px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  marginBottom: '18px',
                  boxShadow: '0 8px 20px rgba(0, 210, 148, 0.22)',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>

              <h3 style={{ margin: '0 0 10px', fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Sign Out?
              </h3>

              <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.55, fontWeight: 500 }}>
                Are you sure you want to sign out of your account? You will need to log in again to access your dashboard.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  No, Stay
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  style={{
                    flex: 1.2,
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(0, 210, 148, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes deleteModalPop {
          0% { opacity: 0; transform: scale(0.92) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};

/* ── Sub-components ── */

const NavPill = ({ to, label, active, isHome }) => (
  <Link
    to={to}
    style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '7px 16px',
      borderRadius: '50px',
      fontSize: '13px', fontWeight: 600,
      textDecoration: 'none',
      color: active ? '#00D294' : isHome ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.65)',
      background: active ? 'rgba(0,210,148,0.1)' : 'transparent',
      border: active ? '1px solid rgba(0,210,148,0.28)' : '1px solid transparent',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}}
  >
    {label}
  </Link>
);

const DdItem = ({ to, icon, label, sub, badge, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 12px',
      borderRadius: '12px',
      textDecoration: 'none',
      color: 'rgba(255,255,255,0.85)',
      transition: 'background 0.15s ease',
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{
      width: '34px', height: '34px', borderRadius: '10px',
      background: 'rgba(0,210,148,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: '#00D294',
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '13px', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '1px' }}>{sub}</div>}
    </div>
    {badge && (
      <span style={{
        background: 'rgba(0,210,148,0.15)', color: '#00D294',
        fontSize: '10px', fontWeight: 700,
        padding: '2px 8px', borderRadius: '50px',
        border: '1px solid rgba(0,210,148,0.3)',
        flexShrink: 0,
      }}>{badge}</span>
    )}
  </Link>
);

const DdAction = ({ icon, label, sub, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 12px',
      borderRadius: '12px',
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
      color: 'rgba(255,255,255,0.85)',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{
      width: '34px', height: '34px', borderRadius: '10px',
      background: 'rgba(0,210,148,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: '#00D294',
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '13px', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '1px' }}>{sub}</div>}
    </div>
    {badge && (
      <span style={{
        background: 'rgba(0,210,148,0.15)', color: '#00D294',
        fontSize: '10px', fontWeight: 700,
        padding: '2px 8px', borderRadius: '50px',
        border: '1px solid rgba(0,210,148,0.3)',
        flexShrink: 0,
      }}>{badge}</span>
    )}
  </button>
);

const MobileLink = ({ to, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      display: 'block',
      padding: '11px 14px',
      borderRadius: '10px',
      textDecoration: 'none',
      color: active ? '#00D294' : 'rgba(255,255,255,0.72)',
      background: active ? 'rgba(0,210,148,0.09)' : 'transparent',
      fontSize: '14px', fontWeight: 600,
      marginBottom: '2px',
      transition: 'background 0.15s ease',
    }}
  >
    {label}
  </Link>
);

export default ProfileNavbar;
