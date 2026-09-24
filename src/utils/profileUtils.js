/**
 * Profile & KYC Central Utilities
 * Unified helpers for image resolving, Employix ID formatting,
 * KYC step verification detection, and Employix Trust Score calculation.
 */

/**
 * Resolves avatar / document image paths safely
 * @param {string} imgPath
 * @param {string} fallback
 * @returns {string}
 */
export const resolveImageUrl = (imgPath, fallback = '/images/identity.jpg') => {
  if (!imgPath) return fallback;
  if (
    imgPath.startsWith('http://') ||
    imgPath.startsWith('https://') ||
    imgPath.startsWith('blob:') ||
    imgPath.startsWith('data:')
  ) {
    return imgPath;
  }
  return imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
};

/**
 * Formats user ID into official Employix candidate ID format
 * @param {string} rawId - Stored user.employixId or empty
 * @param {string} userId - Mongo user._id
 * @returns {string}
 */
export const formatEmployixId = (rawId, userId = '') => {
  if (rawId && rawId.startsWith('EMX')) {
    return rawId;
  }
  if (rawId && rawId.startsWith('#EMP-')) {
    return rawId.replace('#EMP-', 'EMX-4021-').replace('-IN', '-1934');
  }
  const fallbackSuffix = userId ? userId.slice(-4).toUpperCase() : '7758';
  return `EMX-4021-${fallbackSuffix}-1934`;
};

/**
 * Extracts and formats clean address string from voter data or user profile
 * @param {string|object} rawAddr
 * @returns {string}
 */
export const formatCandidateAddress = (rawAddr) => {
  if (!rawAddr) return 'Address not provided';
  if (typeof rawAddr === 'object') {
    return rawAddr.fullAddress || rawAddr.address || 'Address not provided';
  }
  return typeof rawAddr === 'string' && rawAddr.trim().length > 0
    ? rawAddr.trim()
    : 'Address not provided';
};

/**
 * Detects completed verification flags across all 6 KYC steps
 * Weights: Aadhaar (20), Voter (20), DL (5), Employment (35), Education & Certs (20)
 * @param {object} user
 * @returns {object}
 */
export const getKycVerificationFlags = (user) => {
  if (!user) {
    return {
      isAadhaarDone: false,
      isEmpDone: false,
      isVoterDone: false,
      isDlDone: false,
      isEduVerified: false,
      isEduAdded: false,
      completedStepsCount: 0,
      isAllStepsDone: false,
      isSetupCompleted: false,
    };
  }

  // Step 2: Aadhaar (UIDAI OCR)
  const isAadhaarDone = user.aadhaarStatus === 1 || Boolean(user.aadhaarData);

  // Step 3: Employment (EPFO or Manual verified)
  const manualJobs = Array.isArray(user.manualEmployment) ? user.manualEmployment : [];
  const rawEpfo = user.epfoEmployment;
  const hasEpfo = Array.isArray(rawEpfo)
    ? rawEpfo.length > 0
    : Boolean(rawEpfo?.records?.length || rawEpfo?.employerName);
  const isEmpDone = user.employmentStatus === 1 || hasEpfo || manualJobs.length > 0;

  // Step 4: Voter ID Address
  const isVoterDone = user.voterStatus === 1 || Boolean(user.address) || Boolean(user.voterData);

  // Step 5: Driving License
  const isDlDone = user.dlStatus === 1 || Boolean(user.dlData);

  // Step 6: Education & Certifications
  const quals = Array.isArray(user.qualifications) ? user.qualifications : [];
  const certs = Array.isArray(user.certifications) ? user.certifications : [];
  const isEduAdded = quals.length > 0 || certs.length > 0;
  const isEduVerified =
    user.educationStatus === 1 ||
    quals.some((q) => q.isVerified && q.verificationStatus === 'verified') ||
    certs.some((c) => c.isVerified && c.verificationStatus === 'verified');

  // Count verified steps (out of 5 verification components)
  const completedStepsCount = [isAadhaarDone, isEmpDone, isVoterDone, isDlDone, isEduVerified].filter(Boolean).length;
  const isAllStepsDone = Boolean(isAadhaarDone && isEmpDone && isVoterDone && isDlDone && (isEduVerified || isEduAdded));

  // Status 8 or completed setup flag check
  const currentUserId = user._id || user.id || 'current';
  const isSetupCompleted = Boolean(
    user.kycStatus === 8 ||
    user.kycStatus >= 7 ||
    user.setupCompleted ||
    user.kycCompleted ||
    (typeof window !== 'undefined' && localStorage.getItem(`employix_setup_completed_${currentUserId}`) === 'true')
  );

  return {
    isAadhaarDone,
    isEmpDone,
    isVoterDone,
    isDlDone,
    isEduVerified,
    isEduAdded,
    completedStepsCount,
    isAllStepsDone,
    isSetupCompleted,
  };
};

/**
 * Check whether candidate setup is completed (Status 8 or flag)
 * @param {object} user
 * @returns {boolean}
 */
export const isCandidateSetupCompleted = (user) => {
  if (!user) return false;
  const currentUserId = user._id || user.id || 'current';
  return Boolean(
    user.kycStatus === 8 ||
    user.setupCompleted ||
    user.kycCompleted ||
    (typeof window !== 'undefined' && localStorage.getItem(`employix_setup_completed_${currentUserId}`) === 'true')
  );
};

/**
 * Calculates Employee Profile Scoring System (100% Base Maximum)
 *
 * Scoring Criteria:
 * 1. Aadhaar Card = 20% (Verified = 20 pts, Not Verified = 0 pts)
 * 2. Voter ID Card = 20% (Verified = 20 pts, Not Verified = 0 pts)
 * 3. Education = 20% (Verified = 20 pts, Not Verified = 0 pts)
 * 4. Employment = 30% (Verified = 30 pts, Not Verified = 0 pts)
 * 5. Employee Reference = 10% Maximum
 *    - Maximum 2 references allowed per employee
 *    - 0 verified references -> 0/10 (Earned = 0, Applicable Target = 90)
 *    - 1 verified reference  -> 5/10 (Earned = 5, Applicable Target = 95)
 *    - 2 verified references -> 10/10 (Earned = 10, Applicable Target = 100)
 *    - Missing optional 2nd reference creates NO PENALTY (e.g. 95/95 = 100%)
 *    - More than 2 references must not be allowed
 *
 * @param {object} user
 * @param {Array} [explicitReferences]
 * @returns {object}
 */
export const calculateEmployeeScore = (user, explicitReferences = null) => {
  if (!user) {
    return {
      individualScores: {
        aadhaar: 0,
        voter: 0,
        education: 0,
        employment: 0,
        reference: 0,
      },
      aadhaarScore: 0,
      voterScore: 0,
      eduScore: 0,
      empScore: 0,
      referenceScore: 0,
      totalEarnedScore: 0,
      totalApplicableScore: 100,
      finalPercentage: 0,
      verifiedReferencesCount: 0,
      criteria: [],
      score: 0,
      displayScore: 0,
      tierText: 'Base Profile · Not Verified',
      isAadhaarDone: false,
      isVoterDone: false,
      isEmpDone: false,
      isEduVerified: false,
      dlScore: 0,
      isDlDone: false,
    };
  }

  const { isAadhaarDone, isEmpDone, isVoterDone, isDlDone, isEduVerified } = getKycVerificationFlags(user);

  // 1. Aadhaar Card = 20%
  const aadhaarScore = isAadhaarDone ? 20 : 0;

  // 2. Voter ID Card = 20%
  const voterScore = isVoterDone ? 20 : 0;

  // 3. Education = 20%
  const eduScore = isEduVerified ? 20 : 0;

  // 4. Employment = 30%
  const empScore = isEmpDone ? 30 : 0;

  // 5. Employee Reference = 10% maximum (Up to 2 allowed, 5 points each)
  const refsList = explicitReferences || user.references || [];
  let completedCount = 0;
  if (Array.isArray(refsList) && refsList.length > 0) {
    completedCount = refsList.filter((ref) => {
      const s = String(ref?.status || '').toUpperCase();
      return s === 'COMPLETED' || ref?.isFeedbackSubmitted === true || ref?.isPointsAwarded === true;
    }).length;
  } else if (typeof user.verifiedReferencesCount === 'number') {
    completedCount = user.verifiedReferencesCount;
  } else if (typeof user.completedReferencesCount === 'number') {
    completedCount = user.completedReferencesCount;
  } else if (typeof user.rewardPoints === 'number' && user.rewardPoints > 0) {
    completedCount = Math.floor(user.rewardPoints / 5);
  }

  // Clamped between 0 and 2 (maximum 2 references allowed)
  const verifiedReferencesCount = Math.min(2, Math.max(0, completedCount));
  const referenceScore = verifiedReferencesCount * 5; // 0, 5, or 10

  // Total Earned Score
  const totalEarnedScore = aadhaarScore + voterScore + eduScore + empScore + referenceScore;

  // Total Applicable Score is ALWAYS fixed out of 100:
  // Aadhaar (20) + Voter (20) + Employment (30) + Education (20) + References (10) = 100
  const totalApplicableScore = 100;

  // Final Percentage Calculation (out of 100)
  const finalPercentage = Math.min(100, Math.round((totalEarnedScore / totalApplicableScore) * 100));

  let tierText = 'Base Profile · Not Verified';
  if (finalPercentage >= 80) {
    tierText = 'Platinum - Highly Trusted';
  } else if (finalPercentage >= 60) {
    tierText = 'Gold - Verified Candidate';
  } else if (finalPercentage >= 30) {
    tierText = 'Silver - Partially Verified';
  } else if (finalPercentage > 0) {
    tierText = 'Bronze - Basic Profile';
  }

  const criteria = [
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      category: 'Identity Verification',
      icon: '🪪',
      weight: '20%',
      maxScore: 20,
      earnedScore: aadhaarScore,
      isVerified: isAadhaarDone,
      statusLabel: isAadhaarDone ? 'Verified' : 'Pending',
      statusClass: isAadhaarDone ? 'text-success' : 'text-danger',
      badgeClass: isAadhaarDone ? 'badge-success' : 'badge-danger',
      description: isAadhaarDone ? 'UIDAI Official Identity Record Verified' : 'Aadhaar card not yet verified (0 Pts)',
    },
    {
      id: 'voter',
      name: 'Voter ID Card',
      category: 'Address Verification',
      icon: '🗳️',
      weight: '20%',
      maxScore: 20,
      earnedScore: voterScore,
      isVerified: isVoterDone,
      statusLabel: isVoterDone ? 'Verified' : 'Pending',
      statusClass: isVoterDone ? 'text-success' : 'text-danger',
      badgeClass: isVoterDone ? 'badge-success' : 'badge-danger',
      description: isVoterDone ? 'Election Commission Voter ID Verified' : 'Voter ID card not yet verified (0 Pts)',
    },
    {
      id: 'education',
      name: 'Education',
      category: 'Academic Proof',
      icon: '🎓',
      weight: '20%',
      maxScore: 20,
      earnedScore: eduScore,
      isVerified: isEduVerified,
      statusLabel: isEduVerified ? 'Verified' : 'Pending',
      statusClass: isEduVerified ? 'text-success' : 'text-danger',
      badgeClass: isEduVerified ? 'badge-success' : 'badge-danger',
      description: isEduVerified ? 'Qualifications & Degree Verified' : 'Education not yet verified (0 Pts)',
    },
    {
      id: 'employment',
      name: 'Employment',
      category: 'Work History',
      icon: '💼',
      weight: '30%',
      maxScore: 30,
      earnedScore: empScore,
      isVerified: isEmpDone,
      statusLabel: isEmpDone ? 'Verified' : 'Pending',
      statusClass: isEmpDone ? 'text-success' : 'text-danger',
      badgeClass: isEmpDone ? 'badge-success' : 'badge-danger',
      description: isEmpDone ? 'EPFO or Manual Employment History Verified' : 'Employment not yet verified (0 Pts)',
    },
    {
      id: 'reference',
      name: 'Employee Reference',
      category: 'Peer Endorsements',
      icon: '👥',
      weight: '10% Max',
      maxScore: 10,
      earnedScore: referenceScore,
      isVerified: verifiedReferencesCount > 0,
      statusLabel: `${verifiedReferencesCount} / 2 Verified`,
      statusClass: verifiedReferencesCount > 0 ? 'text-teal' : 'text-muted',
      badgeClass: verifiedReferencesCount > 0 ? 'badge-teal' : 'badge-light border',
      displayRatio: `${referenceScore}/10`,
      verifiedCount: verifiedReferencesCount,
      description:
        verifiedReferencesCount === 2
          ? '2 Verified References (10/10 Pts)'
          : verifiedReferencesCount === 1
          ? '1 Verified Reference (5/10 Pts)'
          : '0 Verified References (0/10 Pts)',
    },
  ];

  return {
    individualScores: {
      aadhaar: aadhaarScore,
      voter: voterScore,
      education: eduScore,
      employment: empScore,
      reference: referenceScore,
    },
    aadhaarScore,
    voterScore,
    eduScore,
    empScore,
    referenceScore,
    totalEarnedScore,
    totalApplicableScore,
    finalPercentage,
    verifiedReferencesCount,
    criteria,
    tierText,
    score: finalPercentage,
    displayScore: finalPercentage,
    isAadhaarDone,
    isVoterDone,
    isEmpDone,
    isEduVerified,
    dlScore: 0,
    isDlDone,
  };
};

/**
 * Backward compatibility alias for calculateEmployeeScore
 */
export const calculateTrustScore = (user, explicitReferences = null) => {
  return calculateEmployeeScore(user, explicitReferences);
};
