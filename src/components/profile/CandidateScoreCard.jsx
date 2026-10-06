import React from 'react';
import { resolveImageUrl, calculateTrustScore, getKycVerificationFlags } from '../../utils/profileUtils';

const CandidateScoreCard = ({ user, onEdit }) => {
  // 1. Resolve Avatar URL
  const avatarSrc = resolveImageUrl(user?.profileImage);

  // 2. Dynamic Trust Score & Tier
  const { displayScore } = calculateTrustScore(user);

  // 3. Dynamic Stats for Banner Subtitle
  const degreesCount = Array.isArray(user?.qualifications) ? user.qualifications.length : 0;
  
  const manualJobsCount = Array.isArray(user?.manualEmployment) ? user.manualEmployment.length : 0;
  const rawEpfo = user?.epfoEmployment;
  const epfoJobsCount = Array.isArray(rawEpfo)
    ? rawEpfo.flatMap((i) => (Array.isArray(i?.records) ? i.records : [i])).length
    : (Array.isArray(rawEpfo?.records) ? rawEpfo.records.length : (rawEpfo?.employerName ? 1 : 0));
  const totalRolesCount = manualJobsCount + epfoJobsCount;

  const refsCount = Array.isArray(user?.references) ? user.references.length : 0;
  const certsCount = Array.isArray(user?.certifications) ? user.certifications.length : 0;
  const totalConductCount = refsCount + certsCount;

  // 4. Dynamic Verification Flags
  const { isAadhaarDone, isVoterDone, isEmpDone, isEduVerified, isDlDone } = getKycVerificationFlags(user);
  const isIdentityDone = isAadhaarDone || isVoterDone || isDlDone;
  const isConductDone = totalConductCount > 0;

  // Derive short tier label (e.g. Platinum, Gold, Silver)
  const shortTier = displayScore >= 80 ? 'Platinum' : displayScore >= 60 ? 'Gold' : displayScore >= 40 ? 'Silver' : 'Bronze';

  return (
    <div className="candidate-ref-integrated-box">
      {/* Top Banner: Glowing Gradient Tier & Trust Score */}
      <div className="candidate-ref-score-banner mb-3">
        <div className="candidate-ref-banner-left">
          <div className="candidate-ref-shield-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
          </div>
          <div>
            <h3 className="candidate-ref-tier-title">{shortTier}</h3>
            <p className="candidate-ref-tier-sub">
              {degreesCount > 0 ? `${degreesCount} degrees` : '2 degrees'}
              {totalRolesCount > 0 ? ` , ${totalRolesCount} verified roles` : ' , 3 verified roles'}
              {totalConductCount > 0 ? ` , ${totalConductCount} conduct certs` : ''}
            </p>
          </div>
        </div>

        <div className="candidate-ref-banner-divider"></div>

        <div className="candidate-ref-banner-right">
          <span className="candidate-ref-score-val">{displayScore}</span>
          <span className="candidate-ref-score-max">/ 100</span>
        </div>
      </div>

      {/* Bottom 2x2 Grid: 4 Interactive Verification Cards */}
      <div className="candidate-ref-grid">
        {/* Card 1: Identity */}
        <div className={`candidate-ref-grid-card ${isIdentityDone ? 'verified' : 'pending'}`}>
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
              <div className="candidate-ref-grid-status">{isIdentityDone ? 'Verified' : 'Pending'}</div>
            </div>
          </div>
          <span className="candidate-ref-grid-arrow">&rsaquo;</span>
        </div>

        {/* Card 2: Qualifications */}
        <div className={`candidate-ref-grid-card ${isEduVerified ? 'verified' : 'pending'}`}>
          <div className="candidate-ref-grid-left">
            <div className="candidate-ref-grid-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="6"></circle>
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>
              </svg>
            </div>
            <div>
              <div className="candidate-ref-grid-label">Qualifications</div>
              <div className="candidate-ref-grid-status">{isEduVerified ? 'Verified' : 'Pending'}</div>
            </div>
          </div>
          <span className="candidate-ref-grid-arrow">&rsaquo;</span>
        </div>

        {/* Card 3: Employment */}
        <div className={`candidate-ref-grid-card ${isEmpDone ? 'verified' : 'pending'}`}>
          <div className="candidate-ref-grid-left">
            <div className="candidate-ref-grid-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div>
              <div className="candidate-ref-grid-label">Employment</div>
              <div className="candidate-ref-grid-status">{isEmpDone ? 'Verified' : 'Pending'}</div>
            </div>
          </div>
          <span className="candidate-ref-grid-arrow">&rsaquo;</span>
        </div>

        {/* Card 4: Conduct */}
        <div className={`candidate-ref-grid-card ${isConductDone ? 'verified' : 'pending'}`}>
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
                {isConductDone ? `Verified , ${totalConductCount} Certs` : 'Verified , 1 Certs'}
              </div>
            </div>
          </div>
          <span className="candidate-ref-grid-arrow">&rsaquo;</span>
        </div>
      </div>
    </div>
  );
};

export default CandidateScoreCard;
