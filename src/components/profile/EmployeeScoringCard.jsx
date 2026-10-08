import React, { useState, useEffect } from 'react';
import { getKycVerificationFlags } from '../../utils/profileUtils';
import { getScoreConfigApi } from '../../api/kycApi';

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
  const [dbConfig, setDbConfig] = useState(user?.profileScoring?.scoreConfig || null);

  useEffect(() => {
    if (user?.profileScoring?.scoreConfig) {
      setDbConfig(user.profileScoring.scoreConfig);
    } else {
      getScoreConfigApi()
        .then((res) => {
          const cfg = res.data?.data?.config || res.data?.config || res.data?.data;
          if (cfg) setDbConfig(cfg);
        })
        .catch(() => {});
    }
  }, [user]);

  const {
    isAadhaarDone,
    isEmpDone,
    isEmpVerified,
    isVoterDone,
    isDlDone,
    isEduVerified,
    isEduAdded,
  } = getKycVerificationFlags(user);

  // Dynamic maximum score weights from DB table (with standard fallbacks: 20, 20, 20, 30, 10)
  const aadhaarMax = Number(dbConfig?.aadhaarScore ?? 20);
  const voterMax = Number(dbConfig?.voterScore ?? 20);
  const eduMax = Number(dbConfig?.educationScore ?? 20);
  const empMax = Number(dbConfig?.employmentScore ?? 30);
  const refPerItem = Number(dbConfig?.referenceScorePerItem ?? 5);
  const maxRefs = Number(dbConfig?.maxReferencesAllowed ?? 2);
  const conductMax = refPerItem * maxRefs;

  // 1. Aadhaar Card Verification
  const aadhaarScore = isAadhaarDone ? aadhaarMax : 0;

  // 2. Voter Card Verification
  const voterScore = isVoterDone ? voterMax : 0;

  // 3. Qualifications (Education & Certifications)
  const quals = Array.isArray(user?.qualifications) ? user.qualifications : [];
  const certs = Array.isArray(user?.certifications) ? user.certifications : [];
  let qualScore = 0;
  if (isEduVerified) {
    qualScore = eduMax;
  } else if (quals.length > 0 || certs.length > 0 || isEduAdded) {
    const verifiedCount =
      quals.filter((q) => q.isVerified === true || q.verificationStatus === 'verified').length +
      certs.filter((c) => c.isVerified === true || c.verificationStatus === 'verified').length;
    const totalCount = quals.length + certs.length;
    if (verifiedCount > 0 && totalCount > 0) {
      qualScore = Math.round((verifiedCount / totalCount) * eduMax);
    } else {
      qualScore = 0;
    }
  }

  // 4. Employment Record (EPFO only awards points)
  const employmentScore = isEmpVerified ? empMax : 0;

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
  const conductScore = Math.min(completedRefs, maxRefs) * refPerItem;

  const items = [
    {
      id: 'aadhaar',
      label: 'Aadhaar Card',
      score: aadhaarScore,
      max: aadhaarMax,
      percentage: aadhaarMax > 0 ? (aadhaarScore / aadhaarMax) * 100 : 0,
    },
    {
      id: 'voter',
      label: 'Voter Card',
      score: voterScore,
      max: voterMax,
      percentage: voterMax > 0 ? (voterScore / voterMax) * 100 : 0,
    },
    {
      id: 'qualifications',
      label: 'Qualifications',
      score: qualScore,
      max: eduMax,
      percentage: eduMax > 0 ? (qualScore / eduMax) * 100 : 0,
    },
    {
      id: 'employment',
      label: 'Employment Record',
      score: employmentScore,
      max: empMax,
      percentage: empMax > 0 ? (employmentScore / empMax) * 100 : 0,
    },
    {
      id: 'conduct',
      label: 'Conduct & Security',
      score: conductScore,
      max: conductMax,
      percentage: conductMax > 0 ? (conductScore / conductMax) * 100 : 0,
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
