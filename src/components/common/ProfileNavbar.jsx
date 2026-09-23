import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, logoutUser } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import EditProfileModal from '../profile/EditProfileModal';
import { resolveImageUrl, formatEmployixId } from '../../utils/profileUtils';

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

  const handleLogout = async () => {
    setDropdownOpen(false);
    try { await dispatch(logoutUser()); } catch (_) {}
    dispatch(logout());
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const userName    = user?.name || 'Candidate';
  const userAvatar  = resolveImageUrl(user?.profileImage);
  const employixId  = formatEmployixId(user?.employixId, user?._id);
  const score       = user?.employixScore ?? 0;
  const kycStatus   = user?.kycStatus ?? 0;

  const isProfile = location.pathname === '/profile';
  const isKyc     = location.pathname === '/kyc-verification';

  const scoreColor = score >= 80 ? '#00D294' : score >= 60 ? '#f59e0b' : score >= 20 ? '#3b82f6' : '#6b7280';

  return (
    <>
      {/* ════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════ */}
      <header style={{
        background: scrolled
          ? 'rgba(5, 11, 24, 0.97)'
          : 'linear-gradient(90deg, #050b18 0%, #070e1e 60%, #0a1628 100%)',
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
          padding: '0 24px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* ── LEFT: Logo ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img
              src="/images/employix-logo.png"
              alt="Employix"
              style={{ height: '42px', width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/images/identity.jpg'; }}
            />
          </Link>

          {/* ── CENTER: Nav pills (desktop only) ── */}
         

          {/* ── RIGHT: Score chip + User button ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

            {/* Score chip — desktop */}
          

            {/* User button (hidden on KYC screen, replaced with Sign Out action) */}
            {isKyc ? (
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '50px',
                  padding: '7px 18px',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
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
            <MobileLink to="/kyc-verification" label="KYC Verification" active={isKyc}     onClick={() => setMobileMenuOpen(false)} />

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
              onClick={handleLogout}
              style={{
                width: '100%', textAlign: 'left',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#ef4444', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
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
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: `${scoreColor}15`,
                  border: `1px solid ${scoreColor}30`,
                  borderRadius: '50px',
                  padding: '2px 9px',
                  marginTop: '5px',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: scoreColor, boxShadow: `0 0 5px ${scoreColor}` }} />
                  <span style={{ color: scoreColor, fontSize: '10px', fontWeight: 700 }}>
                    {score}/100 pts
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>•</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 600 }}>
                    KYC {kycStatus}/7
                  </span>
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
            <DdItem
              to="/kyc-verification"
              label="KYC Verification"
              sub="Manage identity & documents"
              badge={isKyc ? 'Active' : null}
              onClick={() => setDropdownOpen(false)}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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

          {/* Logout */}
          <div style={{ padding: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none', borderRadius: '12px',
                color: '#ef4444', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <div>
                <div>Sign Out</div>
                <div style={{ color: 'rgba(239,68,68,0.55)', fontSize: '11px', fontWeight: 400, marginTop: '1px' }}>
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

      <style>{`
        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
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
