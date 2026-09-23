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
 * Calculates Employix Trust Score & Tier
 * Formula: Aadhaar (20) + Voter (20) + DL (5) + Employment (35) + Education (20) = 100 max
 * @param {object} user
 * @returns {{
 *   score: number,
 *   displayScore: number,
 *   tierText: string,
 *   aadhaarScore: number,
 *   voterScore: number,
 *   dlScore: number,
 *   empScore: number,
 *   eduScore: number,
 *   isAadhaarDone: boolean,
 *   isVoterDone: boolean,
 *   isDlDone: boolean,
 *   isEmpDone: boolean,
 *   isEduVerified: boolean
 * }}
 */
export const calculateTrustScore = (user) => {
  if (!user) {
    return {
      score: 0,
      displayScore: 0,
      tierText: 'Base Profile · Not Verified',
      aadhaarScore: 0,
      voterScore: 0,
      dlScore: 0,
      empScore: 0,
      eduScore: 0,
      isAadhaarDone: false,
      isVoterDone: false,
      isDlDone: false,
      isEmpDone: false,
      isEduVerified: false,
    };
  }

  const { isAadhaarDone, isEmpDone, isVoterDone, isDlDone, isEduVerified } = getKycVerificationFlags(user);

  const aadhaarScore = isAadhaarDone ? 20 : 0;
  const voterScore = isVoterDone ? 20 : 0;
  const dlScore = isDlDone ? 5 : 0;
  const empScore = isEmpDone ? 35 : 0;
  const eduScore = isEduVerified ? 20 : 0;

  const rawScore =
    user.employixScore !== undefined && user.employixScore !== null
      ? user.employixScore
      : parseFloat((aadhaarScore + voterScore + dlScore + empScore + eduScore).toFixed(1));

  const displayScore = Math.round(rawScore);

  let tierText = 'Base Profile · Not Verified';
  if (displayScore >= 80) {
    tierText = 'Platinum - Highly Trusted';
  } else if (displayScore >= 60) {
    tierText = 'Gold - Verified Candidate';
  } else if (displayScore >= 30) {
    tierText = 'Silver - Partially Verified';
  } else if (displayScore > 0) {
    tierText = 'Bronze - Basic Profile';
  }

  return {
    score: rawScore,
    displayScore,
    tierText,
    aadhaarScore,
    voterScore,
    dlScore,
    empScore,
    eduScore,
    isAadhaarDone,
    isVoterDone,
    isDlDone,
    isEmpDone,
    isEduVerified,
  };
};
