import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import EditProfileModal from './EditProfileModal';
import {
  getKycVerificationFlags,
  formatCandidateAddress,
  formatEmployixId,
  resolveImageUrl,
  calculateTrustScore,
} from '../../utils/profileUtils';

const ProfileHeader = ({ user: propUser, onUpdate }) => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const user = propUser || reduxUser;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const avatarSrc = resolveImageUrl(user?.profileImage);
  const userName = user?.name || 'Verified Candidate';
  const userEmail = user?.email;
  const userPhone = user?.countryCode
    ? `${user.countryCode} ${user?.phoneNumber || ''}`
    : user?.phoneNumber || user?.phone;
  const userProfession = user?.designation || 'Software Engineer';
  const locationCity =
    user?.city ||
    (user?.currentAddress ? user.currentAddress.split(',').slice(-2, -1)[0]?.trim() : null) ||
    (user?.address ? user.address.split(',').slice(-2, -1)[0]?.trim() : null) ||
    'Hoshiarpur';
  const userAddress = formatCandidateAddress(
    user?.currentAddress || user?.address || user?.voterData?.address || user?.aadhaarData?.address
  );
  const userGender = user?.gender || user?.aadhaarData?.gender || user?.voterData?.gender || 'Female';

  const { isAadhaarDone, isEmpDone, isVoterDone, isEduVerified, isDlDone } = getKycVerificationFlags(user);
  const isIdentityDone = isAadhaarDone || isVoterDone || isDlDone;

  const { displayScore } = calculateTrustScore(user);
  const shortTier =
    displayScore >= 80 ? 'Platinum' : displayScore >= 60 ? 'Gold' : displayScore >= 40 ? 'Silver' : 'Bronze';

  const refsCount = Array.isArray(user?.references) ? user.references.length : 0;
  const certsCount = Array.isArray(user?.certifications) ? user.certifications.length : 0;
  const totalConductCount = refsCount + certsCount || 1;
  const isConductDone = totalConductCount > 0;

  const formattedId = formatEmployixId(user?.employixId, user?._id);

  return (
    <div className="profile-hero-custom-card mb-5">
      {/* Tier 1: Candidate Top Header + Glowing Score Banner */}
      <div className="profile-hero-tier-top d-flex justify-content-between align-items-center flex-wrap gap-3 p-4">
        {/* Left: Avatar + Details */}
        <div className="d-flex align-items-center gap-3 flex-wrap flex-sm-nowrap">
          <div className="candidate-ref-avatar-box">
            <img
              src={avatarSrc}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/identity.jpg';
              }}
              alt={userName}
              className="candidate-ref-avatar-img"
            />
            <button
              type="button"
              className="candidate-ref-edit-btn"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Profile"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>

          <div>
            <h2 className="profile-hero-name mb-1 d-flex align-items-center">
              {userName}
              <span className="text-teal ml-2" style={{ fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
            </h2>
            <div className="profile-hero-sub-role mb-1" style={{ color: '#475569', fontWeight: 600, fontSize: '0.92rem' }}>
              {userProfession} &bull; {locationCity}
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
              <span className="candidate-ref-id-pill" style={{ marginTop: 0 }}>
                {formattedId}
              </span>
            </div>
            <div>
              <span className="badge badge-pill badge-teal-subtle text-teal px-2 py-1 font-weight-bold" style={{ fontSize: '0.8rem' }}>
                ✓ 100% Verified Candidate Profile
              </span>
            </div>
          </div>
        </div>

        {/* Right: Circular Score Gauge + Static QR Code */}
        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* Circular Trust Score Gauge */}
          <div
            className="d-flex align-items-center"
            style={{
              background: 'linear-gradient(135deg, #032030 0%, #053b49 55%, #021924 100%)',
              border: '1.5px solid rgba(0, 229, 255, 0.35)',
              borderRadius: '18px',
              padding: '8px 28px 8px 14px',
              minWidth: '290px',
              gap: '18px',
              boxShadow: '0 6px 20px rgba(3, 32, 48, 0.35), 0 0 14px rgba(0, 229, 255, 0.15)',
              height: '78px',
            }}
          >
            {/* Circular Gauge Ring */}
            <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="headerScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00D294" />
                    <stop offset="100%" stopColor="#00E5FF" />
                  </linearGradient>
                </defs>
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="transparent"
                  stroke="url(#headerScoreGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 27}
                  strokeDashoffset={2 * Math.PI * 27 * (1 - Math.min(100, Math.max(0, displayScore)) / 100)}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
                  {displayScore}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.58rem', fontWeight: 700, lineHeight: 1, marginTop: '2px' }}>
                  /100
                </span>
              </div>
            </div>

            {/* Tier details */}
            <div className="d-flex flex-column justify-content-center">
              <span style={{ color: '#5EFCE8', fontSize: '1.12rem', fontWeight: 800, letterSpacing: '0.4px', lineHeight: 1.2 }}>
                {shortTier} Tier
              </span>
              <span style={{ color: '#00D294', fontSize: '0.82rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.2px' }}>
                • High Trust
              </span>
            </div>
          </div>

          {/* Static QR Code Card */}
          <div className="candidate-ref-qr-box" title="Candidate Verification QR Code">
            <svg
              className="candidate-ref-qr-svg"
              viewBox="0 0 29 29"
              width="64"
              height="64"
              shapeRendering="crispEdges"
            >
              <rect width="29" height="29" fill="#FFFFFF" />
              {/* Outer Corners */}
              <path
                d="M2 2h7v7H2zM20 2h7v7h-7zM2 20h7v7H2z"
                fill="#0f172a"
              />
              <path
                d="M3 3h5v5H3zM21 3h5v5h-5zM3 21h5v5H3z"
                fill="#FFFFFF"
              />
              <path
                d="M4 4h3v3H4zM22 4h3v3h-3zM4 22h3v3H4z"
                fill="#0f172a"
              />
              {/* Random/Standard QR Data Matrix Grid Points */}
              <path
                d="M11 2h2v3h-2zM15 2h3v2h-3zM11 6h1v3h-1zM14 6h3v1h-3zM10 10h2v2h-2zM14 9h2v2h-2zM17 10h4v2h-4zM22 10h1v1h-1zM25 10h2v3h-2zM2 11h2v3h-2zM6 11h2v2h-2zM10 13h1v3h-1zM13 12h2v2h-2zM16 13h1v1h-1zM19 13h3v2h-3zM23 14h2v2h-2zM26 14h1v3h-1zM12 16h3v1h-3zM16 16h2v3h-2zM20 16h1v1h-1zM23 17h4v2h-4zM10 18h1v3h-1zM13 18h2v2h-2zM2 17h2v1h-2zM5 16h3v2h-3zM11 22h3v2h-3zM15 20h2v3h-2zM18 20h2v1h-2zM22 20h2v2h-2zM25 21h2v3h-2zM12 25h2v2h-2zM16 24h3v2h-3zM20 23h2v4h-2zM23 25h4v2h-4zM10 25h1v2h-1z"
                fill="#0f172a"
              />
            </svg>
            <div className="candidate-ref-qr-corner-accent"></div>
          </div>
        </div>
      </div>

      {/* Tier 2: Address & Contact Row */}
      <div className="profile-hero-tier-middle px-4 py-3 border-top" style={{ borderColor: '#e6f0fa' }}>
        {userAddress && (
          <div className="d-flex align-items-center gap-2 text-dark font-weight-600 mb-2" style={{ fontSize: '0.9rem' }}>
            <span>📍</span>
            <span style={{ color: '#1e293b' }}>{userAddress}</span>
          </div>
        )}
        <div className="d-flex align-items-center flex-wrap gap-3 text-secondary font-weight-600" style={{ fontSize: '0.88rem' }}>
          {userEmail && (
            <span className="d-inline-flex align-items-center gap-1" style={{ color: '#0f172a' }}>
              <span style={{ color: '#00D294' }}>✉️</span> {userEmail}
            </span>
          )}
          <span className="text-muted opacity-50">│</span>
          {userPhone && (
            <span className="d-inline-flex align-items-center gap-1" style={{ color: '#0f172a' }}>
              <span>📞</span> {userPhone}
            </span>
          )}
          <span className="text-muted opacity-50">│</span>
          {userGender && (
            <span className="d-inline-flex align-items-center gap-1" style={{ color: '#0f172a' }}>
              <span>👤</span> {userGender}
            </span>
          )}
        </div>
      </div>

      {/* Tier 3: Verification Status Cards in 1 Row (4 columns) */}
      <div className="profile-hero-tier-bottom px-4 py-3 border-top" style={{ borderColor: '#e6f0fa' }}>
        <div className="small font-weight-bold text-muted text-uppercase mb-2 letter-spacing-1" style={{ fontSize: '0.78rem' }}>
          Verification Status:
        </div>
        <div className="row g-3">
          {/* 1. Identity */}
          <div className="col-12 col-sm-6 col-lg-3 mb-2 mb-lg-0">
            <div className={`candidate-ref-grid-card h-100 ${isIdentityDone ? 'verified' : 'pending'}`}>
              <div className="candidate-ref-grid-left">
                <div className="candidate-ref-grid-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                    <circle cx="9" cy="10" r="2"></circle>
                    <line x1="15" y1="8" x2="19" y2="8"></line>
                    <line x1="15" y1="12" x2="19" y2="12"></line>
                    <line x1="7" y1="16" x2="17" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <div className="candidate-ref-grid-label">Identity</div>
                  <div className="candidate-ref-grid-status">{isIdentityDone ? '✓ Verified' : 'Pending'}</div>
                </div>
              </div>
              <span className="candidate-ref-grid-arrow">&rsaquo;</span>
            </div>
          </div>

          {/* 2. Qualifications */}
          <div className="col-12 col-sm-6 col-lg-3 mb-2 mb-lg-0">
            <div className={`candidate-ref-grid-card h-100 ${isEduVerified ? 'verified' : 'pending'}`}>
              <div className="candidate-ref-grid-left">
                <div className="candidate-ref-grid-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="6"></circle>
                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>
                  </svg>
                </div>
                <div>
                  <div className="candidate-ref-grid-label">Qualifications</div>
                  <div className="candidate-ref-grid-status">{isEduVerified ? '✓ Verified' : 'Pending'}</div>
                </div>
              </div>
              <span className="candidate-ref-grid-arrow">&rsaquo;</span>
            </div>
          </div>

          {/* 3. Employment */}
          <div className="col-12 col-sm-6 col-lg-3 mb-2 mb-lg-0">
            <div className={`candidate-ref-grid-card h-100 ${isEmpDone ? 'verified' : 'pending'}`}>
              <div className="candidate-ref-grid-left">
                <div className="candidate-ref-grid-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div>
                  <div className="candidate-ref-grid-label">Employment</div>
                  <div className="candidate-ref-grid-status">{isEmpDone ? '✓ Verified' : 'Pending'}</div>
                </div>
              </div>
              <span className="candidate-ref-grid-arrow">&rsaquo;</span>
            </div>
          </div>

          {/* 4. Conduct */}
          <div className="col-12 col-sm-6 col-lg-3 mb-2 mb-lg-0">
            <div className={`candidate-ref-grid-card h-100 ${isConductDone ? 'verified' : 'pending'}`}>
              <div className="candidate-ref-grid-left">
                <div className="candidate-ref-grid-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div>
                  <div className="candidate-ref-grid-label">Conduct</div>
                  <div className="candidate-ref-grid-status">
                    {isConductDone ? `✓ Verified (${totalConductCount} Cert)` : 'Pending'}
                  </div>
                </div>
              </div>
              <span className="candidate-ref-grid-arrow">&rsaquo;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onUpdate={onUpdate}
      />
    </div>
  );
};

export default ProfileHeader;
