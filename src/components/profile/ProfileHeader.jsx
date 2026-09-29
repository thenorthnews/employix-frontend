import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import CandidateScoreCard from './CandidateScoreCard';
import EditProfileModal from './EditProfileModal';
import { getKycVerificationFlags, formatCandidateAddress, calculateEmployeeScore } from '../../utils/profileUtils';

const ProfileHeader = ({ user: propUser, onUpdate }) => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const user = propUser || reduxUser;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const userName = user?.name;
  const userEmail = user?.email;
  const userPhone = user?.countryCode ? `${user.countryCode} ${user?.phoneNumber || ''}` : (user?.phoneNumber || user?.phone);
  const userProfession = user?.designation;
  const userAddress = formatCandidateAddress(user?.currentAddress || user?.address || user?.voterData?.address || user?.aadhaarData?.address);
  const userGender = user?.gender || user?.aadhaarData?.gender || user?.voterData?.gender || '';

  const {
    isAadhaarDone,
    isEmpDone,
    isVoterDone,
    isEduVerified,
  } = getKycVerificationFlags(user);

  const scoreData = calculateEmployeeScore(user);
  const cfg = user?.profileScoring?.scoreConfig || {};
  const aadhaarWeight = Number(cfg.aadhaarScore ?? 20);
  const voterWeight = Number(cfg.voterScore ?? 20);
  const empWeight = Number(cfg.employmentScore ?? 30);
  const eduWeight = Number(cfg.educationScore ?? 20);
  const refPerItem = Number(cfg.referenceScorePerItem ?? 5);
  const maxRefs = Number(cfg.maxReferencesAllowed ?? 2);
  const maxRefWeight = refPerItem * maxRefs;

  const isRefDone = (scoreData.verifiedReferencesCount || 0) > 0;
  const verifiedPillars = [isAadhaarDone, isVoterDone, isEmpDone, isEduVerified, isRefDone].filter(Boolean).length;

  return (
    <div className="profile-header-showcase mb-5">
      <div className="row align-items-center g-4">
        {/* Left Column: Candidate Summary & Verification Matrix */}
        <div className="col-lg-7 col-xl-7">
          <div className="profile-details-hero-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between">
            <div>
              {/* Header Pill & Synced Status */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <span className={`badge badge-pill ${verifiedPillars > 0 ? 'badge-teal-subtle text-teal' : 'badge-danger-subtle text-danger'} px-3 py-1 font-weight-bold`}>
                  {verifiedPillars === 5
                    ? '✓ 100% VERIFIED CANDIDATE PROFILE'
                    : verifiedPillars > 0
                    ? `✓ CANDIDATE PROFILE (${verifiedPillars}/5 VERIFIED)`
                    : '✗ UNVERIFIED CANDIDATE PROFILE'}
                </span>
                <span className="small text-muted d-inline-flex align-items-center">
                  <span className="pulsing-dot-success mr-2"></span> Last Synced Today
                </span>
              </div>

              {/* Candidate Heading & Role */}
              <div className="mb-3">
                <h2 className="profile-hero-name mb-1 d-flex align-items-center flex-wrap">
                  {userName}
                  <span
                    className={`ml-2 ${verifiedPillars > 0 ? 'text-teal' : 'text-danger'}`}
                    style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                    title={verifiedPillars > 0 ? `${verifiedPillars}/5 Steps Verified` : 'Unverified Profile'}
                  >
                    {verifiedPillars > 0 ? '✓' : '✗'}
                  </span>
                </h2>
                <p className="profile-hero-designation text-teal font-weight-bold mb-0">
                  {userProfession}
                </p>
              </div>

              {/* Verification Badges Matrix */}
              <div className="verification-badges-matrix my-4 p-3 rounded-lg">
                <div className="small font-weight-bold text-uppercase letter-spacing-1 text-muted mb-2">
                  KYC Verification Weights ({verifiedPillars}/5 Completed):
                </div>
                <div className="d-flex flex-wrap" style={{ gap: '10px' }}>
                  <span className={`kyc-weight-badge ${isAadhaarDone ? 'completed' : 'pending'}`}>
                    <span className={isAadhaarDone ? 'text-teal font-weight-bold mr-1' : 'text-danger font-weight-bold mr-1'}>
                      {isAadhaarDone ? '✓' : '✗'}
                    </span>
                    Aadhaar Identity{' '}
                    <span className="weight-pts font-weight-normal">({isAadhaarDone ? aadhaarWeight : 0}/{aadhaarWeight} Pts)</span>
                  </span>
                  <span className={`kyc-weight-badge ${isVoterDone ? 'completed' : 'pending'}`}>
                    <span className={isVoterDone ? 'text-teal font-weight-bold mr-1' : 'text-danger font-weight-bold mr-1'}>
                      {isVoterDone ? '✓' : '✗'}
                    </span>
                    Voter Address{' '}
                    <span className="weight-pts font-weight-normal">({isVoterDone ? voterWeight : 0}/{voterWeight} Pts)</span>
                  </span>
                  <span className={`kyc-weight-badge ${isEmpDone ? 'completed' : 'pending'}`}>
                    <span className={isEmpDone ? 'text-teal font-weight-bold mr-1' : 'text-danger font-weight-bold mr-1'}>
                      {isEmpDone ? '✓' : '✗'}
                    </span>
                    EPFO Employment{' '}
                    <span className="weight-pts font-weight-normal">({isEmpDone ? empWeight : 0}/{empWeight} Pts)</span>
                  </span>
                  <span className={`kyc-weight-badge ${isEduVerified ? 'completed' : 'pending'}`}>
                    <span className={isEduVerified ? 'text-teal font-weight-bold mr-1' : 'text-danger font-weight-bold mr-1'}>
                      {isEduVerified ? '✓' : '✗'}
                    </span>
                    Qualifications &amp; Certs{' '}
                    <span className="weight-pts font-weight-normal">({isEduVerified ? eduWeight : 0}/{eduWeight} Pts)</span>
                  </span>
                  <span className={`kyc-weight-badge ${isRefDone ? 'completed' : 'pending'}`}>
                    <span className={isRefDone ? 'text-teal font-weight-bold mr-1' : 'text-danger font-weight-bold mr-1'}>
                      {isRefDone ? '✓' : '✗'}
                    </span>
                    Professional References{' '}
                    <span className="weight-pts font-weight-normal">({scoreData.referenceScore}/{maxRefWeight} Pts)</span>
                  </span>
                </div>
              </div>

              {/* Contact Info Row with highlighted badges and high-contrast styling */}
              <div className="profile-contact-list my-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'stretch' }}>
                {userAddress ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      background: 'linear-gradient(135deg, rgba(0, 210, 148, 0.08) 0%, #f8fafc 100%)',
                      border: '1.5px solid rgba(0, 210, 148, 0.35)',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      maxWidth: '100%',
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                    }}
                    title={userAddress}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>📍</span>
                    <span style={{ lineHeight: '1.45', color: '#1e293b' }}>{userAddress}</span>
                  </div>
                ) : null}

                {userEmail ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      wordBreak: 'break-all',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ color: '#00D294', fontSize: '1.05rem', flexShrink: 0 }}>✉</span>
                    <span style={{ color: '#1e293b' }}>{userEmail}</span>
                  </div>
                ) : null}

                {userPhone ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>📱</span>
                    <span style={{ color: '#1e293b' }}>{userPhone}</span>
                  </div>
                ) : null}

                {userGender ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>👤</span>
                    <span style={{ color: '#1e293b' }}>Gender: {userGender}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Candidate Trust Score Card matching the Screenshot */}
        <div className="col-lg-5 col-xl-5 text-center">
          <CandidateScoreCard
            user={user}
            onEdit={() => setIsEditModalOpen(true)}
          />
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
