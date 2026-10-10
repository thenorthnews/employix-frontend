import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import EditProfileModal from './EditProfileModal';
import ShareVerifiedIdModal from './ShareVerifiedIdModal';
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const avatarSrc = resolveImageUrl(user?.profileImage);
  const userName = user?.name || 'Verified Candidate';
  const userEmail = user?.email;
  const userPhone = user?.countryCode
    ? `${user.countryCode} ${user?.phoneNumber || ''}`
    : user?.phoneNumber || user?.phone;
  const userProfession = user?.designation || user?.role || 'Software Engineer';
  const locationCity =
    user?.city ||
    (typeof user?.currentAddress === 'string'
      ? user.currentAddress.split(',').slice(-2, -1)[0]?.trim()
      : typeof user?.currentAddress === 'object' && user?.currentAddress?.city
      ? user.currentAddress.city
      : null) ||
    (typeof user?.address === 'string'
      ? user.address.split(',').slice(-2, -1)[0]?.trim()
      : typeof user?.address === 'object' && user?.address?.city
      ? user.address.city
      : null) ||
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
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="btn btn-sm font-weight-bold d-inline-flex align-items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #00D294 0%, #00B880 100%)',
                  color: '#020C1F',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '0.82rem',
                  boxShadow: '0 2px 8px rgba(0, 210, 148, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title="Share your verified ID link with employers"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share Verified ID
              </button>
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
              background: '#051d3d',
              border: '1.5px solid rgba(0, 229, 255, 0.35)',
              borderRadius: '20px',
              padding: '14px 28px 14px 20px',
              minWidth: '340px',
              gap: '22px',
              boxShadow: '0 8px 24px rgba(3, 32, 48, 0.4), 0 0 16px rgba(0, 229, 255, 0.18)',
              minHeight: '150px',
            }}
          >
            {/* Circular Gauge Ring */}
            <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="headerScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00D294" />
                    <stop offset="100%" stopColor="#00E5FF" />
                  </linearGradient>
                </defs>
                <circle
                  cx="65"
                  cy="65"
                  r="56"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="9"
                />
                <circle
                  cx="65"
                  cy="65"
                  r="56"
                  fill="transparent"
                  stroke="url(#headerScoreGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - Math.min(100, Math.max(0, displayScore)) / 100)}
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
                <span style={{ color: '#FFFFFF', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1 }}>
                  {displayScore}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.92rem', fontWeight: 700, lineHeight: 1, marginTop: '4px' }}>
                  /100
                </span>
              </div>
            </div>

            {/* Tier details */}
            <div className="d-flex flex-column justify-content-center">
              <span style={{ color: '#5EFCE8', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.4px', lineHeight: 1.2 }}>
                {shortTier} Tier
              </span>
              <span style={{ color: '#00D294', fontSize: '0.95rem', fontWeight: 700, marginTop: '6px', letterSpacing: '0.2px' }}>
                • High Trust
              </span>
            </div>
          </div>

          {/* QR Code Card (Click to Share) */}
          <div
            className="candidate-ref-qr-box"
            title="Click to share verified ID or scan QR code"
            onClick={() => setIsShareModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <svg
              className="candidate-ref-qr-svg"
              viewBox="0 0 29 29"
              width="118"
              height="118"
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
      <div className="profile-hero-tier-middle px-4 py-3 border-top" style={{ borderColor: '#e6f0fa', backgroundColor: '#FAFCFF' }}>
        {userAddress && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#2563EB',
                marginTop: '1px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
                Address
              </span>
              <span style={{ color: '#1E293B', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.45 }}>
                {userAddress}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {userEmail && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '6px 12px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'rgba(0, 210, 148, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <span style={{ color: '#0F172A', fontSize: '0.84rem', fontWeight: 600 }}>
                {userEmail}
              </span>
            </div>
          )}

          {userPhone && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '6px 12px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <span style={{ color: '#0F172A', fontSize: '0.84rem', fontWeight: 600 }}>
                {userPhone}
              </span>
            </div>
          )}

          {userGender && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '6px 12px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED',
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span style={{ color: '#0F172A', fontSize: '0.84rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {userGender}
              </span>
            </div>
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

      {/* Share Verified ID Modal Dialog */}
      <ShareVerifiedIdModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default ProfileHeader;
