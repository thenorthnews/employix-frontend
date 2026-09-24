import React from 'react';
import { getKycVerificationFlags } from '../../utils/profileUtils';

/**
 * Score Breakdown Component
 * Clean, modern score breakdown matching the Employix verification pillars:
 * 1. Aadhaar Card
 * 2. Voter Card
 * 3. Qualifications
 * 4. Employment Record
 * 5. Conduct & Security
 */
const EmployeeScoringCard = ({ user, references = null }) => {
  const {
    isAadhaarDone,
    isEmpDone,
    isVoterDone,
    isDlDone,
    isEduVerified,
    isEduAdded,
  } = getKycVerificationFlags(user);

  // 1. Aadhaar Card Verification
  const aadhaarScore = isAadhaarDone ? 100 : 0;

  // 2. Voter Card Verification
  const voterScore = isVoterDone || isDlDone ? 100 : 0;

  // 3. Qualifications (Education & Certifications)
  const quals = Array.isArray(user?.qualifications) ? user.qualifications : [];
  const certs = Array.isArray(user?.certifications) ? user.certifications : [];
  let qualScore = 0;
  if (isEduVerified) {
    qualScore = 100;
  } else if (quals.length > 0 || certs.length > 0 || isEduAdded) {
    const verifiedCount =
      quals.filter((q) => q.isVerified === true || q.verificationStatus === 'verified').length +
      certs.filter((c) => c.isVerified === true || c.verificationStatus === 'verified').length;
    const totalCount = quals.length + certs.length;
    if (verifiedCount > 0 && totalCount > 0) {
      qualScore = Math.round((verifiedCount / totalCount) * 100);
    } else {
      qualScore = 0;
    }
  }

  // 4. Employment Record (EPFO / Manual Employment)
  const hasEpfo = Boolean(user?.epfoEmployment?.length || user?.epfoEmployment?.employerName);
  const employmentScore = isEmpDone ? (hasEpfo ? 100 : 97) : 0;

  // 5. Conduct & Security (Professional References & Soft Skills Conduct)
  const refsList = references || user?.references || [];
  let completedRefs = 0;
  if (Array.isArray(refsList) && refsList.length > 0) {
    completedRefs = refsList.filter((ref) => {
      const s = String(ref?.status || '').toUpperCase();
      return s === 'COMPLETED' || ref?.isFeedbackSubmitted === true || ref?.isPointsAwarded === true;
    }).length;
  } else if (typeof user?.verifiedReferencesCount === 'number') {
    completedRefs = user.verifiedReferencesCount;
  }
  const conductScore = completedRefs >= 2 ? 100 : completedRefs === 1 ? 50 : 0;

  const items = [
    {
      id: 'aadhaar',
      label: 'Aadhaar Card',
      score: aadhaarScore,
      max: 100,
      percentage: aadhaarScore,
    },
    {
      id: 'voter',
      label: 'Voter Card',
      score: voterScore,
      max: 100,
      percentage: voterScore,
    },
    {
      id: 'qualifications',
      label: 'Qualifications',
      score: qualScore,
      max: 100,
      percentage: qualScore,
    },
    {
      id: 'employment',
      label: 'Employment Record',
      score: employmentScore,
      max: 100,
      percentage: employmentScore,
    },
    {
      id: 'conduct',
      label: 'Conduct & Security',
      score: conductScore,
      max: 100,
      percentage: conductScore,
    },
  ];

  return (
    <div
      className="card border-0 bg-white p-4 mb-4"
      id="scoring-breakdown-card"
      style={{
        borderRadius: '14px',
        border: '1px solid #edf2f7',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Card Heading */}
      <h4
        className="font-weight-bold mb-4"
        style={{
          color: '#1e293b',
          fontSize: '18px',
          letterSpacing: '-0.3px',
          fontWeight: '700',
        }}
      >
        Score Breakdown
      </h4>

      {/* Breakdown Items List */}
      <div className="d-flex flex-column" style={{ gap: '20px' }}>
        {items.map((item) => (
          <div key={item.id}>
            {/* Title & Score */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span
                style={{
                  color: '#1e293b',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  letterSpacing: '-0.1px',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  color: '#00C07F',
                  fontSize: '13.5px',
                  fontWeight: '700',
                }}
              >
                {item.score} / {item.max}
              </span>
            </div>

            {/* Horizontal Progress Bar */}
            <div
              style={{
                height: '7px',
                backgroundColor: '#E6EAEF',
                borderRadius: '9999px',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, item.percentage))}%`,
                  height: '100%',
                  backgroundColor: '#00C07F',
                  borderRadius: '9999px',
                  transition: 'width 0.8s ease-in-out',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeScoringCard;
