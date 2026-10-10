import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import ButtonSpinner from '../common/Loader';
import ProfessionalReferenceSection from '../profile/ProfessionalReferenceSection';
import { updateUserKycStatus, updateProfileSuccess } from '../../redux/slices/authSlice';
import {
  verifyPanApi,
  extractPanOcrApi,
  verifyAadhaarApi,
  verifyVoterApi,
  verifyVoterOcrApi,
  fetchEmploymentHistoryApi,
  fetchEmploymentByUanApi,
  addManualEmploymentApi,
  deleteManualEmploymentApi,
  addQualificationApi,
  deleteQualificationApi,
  addCertificationApi,
  deleteCertificationApi,
  verifyDlOcrApi,
  completeKycSetupApi,
  getScoreConfigApi,
  initializeDigilockerApi,
  getDigilockerDocumentsApi,
} from '../../api/kycApi';
import { updateProfileApi, getProfileApi } from '../../api/authApi';
import { resolveImageUrl, resolveDocumentUrl, POPULAR_DESIGNATIONS } from '../../utils/profileUtils';
import {
  isValidProfileImage,
  isValidDocumentOrImage,
  processUploadFile,
  processProfileImageFile,
  PROFILE_IMAGE_ACCEPT,
  DOCUMENT_UPLOAD_ACCEPT,
} from '../../utils/imageUtils';
import AadhaarSuccessModal from './AadhaarSuccessModal';
import KycScoreGauge from './KycScoreGauge';
import DesignationSelect from '../common/DesignationSelect';
import { getSocket, joinUserRoom } from '../../utils/socket';
import './KYCVerification.css';

const MONTH_OPTIONS = [
  { value: '01', label: '01 - January' },
  { value: '02', label: '02 - February' },
  { value: '03', label: '03 - March' },
  { value: '04', label: '04 - April' },
  { value: '05', label: '05 - May' },
  { value: '06', label: '06 - June' },
  { value: '07', label: '07 - July' },
  { value: '08', label: '08 - August' },
  { value: '09', label: '09 - September' },
  { value: '10', label: '10 - October' },
  { value: '11', label: '11 - November' },
  { value: '12', label: '12 - December' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1970 + 1 }, (_, i) => String(CURRENT_YEAR - i));

const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  if (!y) return dateStr;
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[parseInt(m, 10)] || m;
  return monthName ? `${monthName} ${y}` : y;
};

const KYCVerification = ({
  onFinish,
  onStepSuccess,
  showHeroBanner = true,
  className = '',
  userProp = null,
  readOnly = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const user = userProp || authUser;

  // Status Loading State
  const [fetchingStatus, setFetchingStatus] = useState(true);

  // Smooth scroll to target hash anchor (e.g. #step-education)
  useEffect(() => {
    if (location.hash && !fetchingStatus) {
      const targetId = location.hash.replace('#', '');
      const elem = document.getElementById(targetId);
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [location.hash, fetchingStatus]);

  // Dynamic Trust Score
  const initialUserScore = typeof user?.employixScore === 'number' && user.employixScore > 0 ? user.employixScore : 0;
  const [score, setScore] = useState(initialUserScore);
  const [scoreTier, setScoreTier] = useState(
    initialUserScore >= 80
      ? 'Platinum Tier · Highly Trusted'
      : initialUserScore >= 60
      ? 'Gold Tier · Verified Candidate'
      : initialUserScore > 20
      ? 'Silver Tier · Partially Verified'
      : 'Base Profile · Not Verified'
  );

  // KYC Completion Status (8 = Complete Setup finished, 7 = ready to complete)
  const [kycStatus, setKycStatus] = useState(user?.kycStatus || 0);

  // Candidate Setup Completed state (Status 8)
  const currentUserId = user?._id || user?.id || 'current';
  const isSetupCompleted = Boolean(
    kycStatus === 8 ||
    user?.kycStatus === 8 ||
    user?.setupCompleted ||
    user?.kycCompleted ||
    localStorage.getItem(`employix_setup_completed_${currentUserId}`) === 'true'
  );

  // STEP 1: Personal & Designation State (Prefix removed)
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || '');
  const initialDesignation = (user?.designation || '').trim();
  const [designation, setDesignation] = useState(initialDesignation);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(user?.profileImage || null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(initialDesignation.length > 0);
  const [profileErrors, setProfileErrors] = useState({ photo: '', name: '', phone: '', designation: '' });

  // STEP 2: Aadhaar State (OCR Scan & Verification)
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(null);
  const [dragActiveFront, setDragActiveFront] = useState(false);
  const [dragActiveBack, setDragActiveBack] = useState(false);
  const aadhaarFrontInputRef = useRef(null);
  const aadhaarBackInputRef = useRef(null);
  // Default disabled (false) as required
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarResult, setAadhaarResult] = useState(null);
  const [kycSuccessModal, setKycSuccessModal] = useState({
    isOpen: false,
    title: '',
    pointsEarned: 20,
    badgeText: null,
    description: '',
    buttonText: 'Proceed to Next Step',
    targetStepId: null,
  });

  const showVerificationSuccessModal = ({
    title,
    pointsEarned = null,
    badgeText = null,
    description = '',
    buttonText = 'Proceed to Next Step',
    targetStepId = null,
  }) => {
    setKycSuccessModal({
      isOpen: true,
      title,
      pointsEarned,
      badgeText,
      description,
      buttonText,
      targetStepId,
    });
  };

  const handleModalProceed = () => {
    const target = kycSuccessModal.targetStepId;
    setKycSuccessModal((prev) => ({ ...prev, isOpen: false }));
    if (target) {
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) {
          const headerOffset = 90;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 150);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleRemoveAadhaarFront = (e) => {
    if (e) e.stopPropagation();
    setAadhaarFront(null);
    setAadhaarFrontPreview(null);
    if (aadhaarFrontInputRef.current) aadhaarFrontInputRef.current.value = '';
  };

  const handleRemoveAadhaarBack = (e) => {
    if (e) e.stopPropagation();
    setAadhaarBack(null);
    setAadhaarBackPreview(null);
    if (aadhaarBackInputRef.current) aadhaarBackInputRef.current.value = '';
  };

  const handleRemoveVoterFront = (e) => {
    if (e) e.stopPropagation();
    setVoterFront(null);
    setVoterFrontPreview(null);
    if (voterFrontInputRef.current) voterFrontInputRef.current.value = '';
  };

  const handleRemoveVoterBack = (e) => {
    if (e) e.stopPropagation();
    setVoterBack(null);
    setVoterBackPreview(null);
    if (voterBackInputRef.current) voterBackInputRef.current.value = '';
  };

  const handleRemoveDlFront = (e) => {
    if (e) e.stopPropagation();
    setDlFront(null);
    setDlFrontPreview(null);
    if (dlFrontInputRef.current) dlFrontInputRef.current.value = '';
  };

  const handleRemoveDlBack = (e) => {
    if (e) e.stopPropagation();
    setDlBack(null);
    setDlBackPreview(null);
    if (dlBackInputRef.current) dlBackInputRef.current.value = '';
  };

  const [empMethod, setEmpMethod] = useState('uan'); // 'uan' | 'manual'
  const [uanNumber, setUanNumber] = useState('');     // 12-digit UAN
  const [empMobile, setEmpMobile] = useState('');     // Mobile fallback
  const [empConsent, setEmpConsent] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [employmentVerified, setEmploymentVerified] = useState(false);
  const [epfoRecords, setEpfoRecords] = useState([]);
  const [manualJobs, setManualJobs] = useState([]);
  const [userReferences, setUserReferences] = useState(user?.references || []);
  const [rewardPoints, setRewardPoints] = useState(user?.rewardPoints || 0);
  const [scoreConfig, setScoreConfig] = useState({
    aadhaarScore: 20,
    voterScore: 20,
    educationScore: 20,
    employmentScore: 30,
    referenceScorePerItem: 5,
    maxReferencesAllowed: 2,
    totalApplicableScore: 100,
  });
  const [jobForm, setJobForm] = useState({ companyName: '', designation: '', startDate: '', endDate: '', isCurrent: false, description: '' });
  const [jobFormLoading, setJobFormLoading] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [voterMethod, setVoterMethod] = useState('number'); 
  const [voterNumber, setVoterNumber] = useState('');
  const [voterFront, setVoterFront] = useState(null);
  const [voterFrontPreview, setVoterFrontPreview] = useState(null);
  const [voterBack, setVoterBack] = useState(null);
  const [voterBackPreview, setVoterBackPreview] = useState(null);
  const [dragActiveVoterFront, setDragActiveVoterFront] = useState(false);
  const [dragActiveVoterBack, setDragActiveVoterBack] = useState(false);
  const voterFrontInputRef = useRef(null);
  const voterBackInputRef = useRef(null);
  const [voterNumConsent, setVoterNumConsent] = useState(false);
  const [voterOcrConsent, setVoterOcrConsent] = useState(false);
  const [voterLoading, setVoterLoading] = useState(false);
  const [voterVerified, setVoterVerified] = useState(false);
  const [voterResult, setVoterResult] = useState(null);
  const [addressText, setAddressText] = useState('');

  // STEP 5: Driving License (DL) State (OCR Scan)
  const [dlFront, setDlFront] = useState(null);
  const [dlFrontPreview, setDlFrontPreview] = useState(null);
  const [dlBack, setDlBack] = useState(null);
  const [dlBackPreview, setDlBackPreview] = useState(null);
  const [dragActiveDlFront, setDragActiveDlFront] = useState(false);
  const [dragActiveDlBack, setDragActiveDlBack] = useState(false);
  const dlFrontInputRef = useRef(null);
  const dlBackInputRef = useRef(null);
  // Default disabled (false) as required
  const [dlConsent, setDlConsent] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlVerified, setDlVerified] = useState(false);
  const [dlResult, setDlResult] = useState(null);

  // STEP 6: Educational Qualifications & Professional Certifications
  const [qualifications, setQualifications] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [digilockerDocuments, setDigilockerDocuments] = useState([]);
  const [educationMode, setEducationMode] = useState('manual'); // 'manual' | 'digilocker'
  const [digilockerEduLoading, setDigilockerEduLoading] = useState(false);
  const isReturningFromDigilocker = typeof window !== 'undefined' && Boolean(
    new URLSearchParams(window.location.search).get('client_id') ||
    (new URLSearchParams(window.location.search).get('step') === 'education' && window.sessionStorage?.getItem('digilocker_edu_client_id'))
  );
  const [digilockerSyncLoading, setDigilockerSyncLoading] = useState(isReturningFromDigilocker);
  const [digilockerEduConsent, setDigilockerEduConsent] = useState(false);
  const [showDigilockerReconnect, setShowDigilockerReconnect] = useState(false);
  const [showQualForm, setShowQualForm] = useState(false);
  const [qualFormLoading, setQualFormLoading] = useState(false);
  const [qualForm, setQualForm] = useState({
    degree: '',
    institution: '',
    fieldOfStudy: '',
    year: '',
    grade: '',
    document: null,
  });
  const [showCertForm, setShowCertForm] = useState(false);
  const [certFormLoading, setCertFormLoading] = useState(false);
  const [certForm, setCertForm] = useState({
    title: '',
    issuer: '',
    year: '',
    credentialId: '',
    credentialUrl: '',
    document: null,
  });

  const updateScoreAndTier = (numericScore) => {
    const finalScore = parseFloat(Number(numericScore).toFixed(1));
    setScore(finalScore);
    if (finalScore >= 80) {
      setScoreTier('Platinum Tier · Highly Trusted');
    } else if (finalScore >= 60) {
      setScoreTier('Gold Tier · Verified Candidate');
    } else if (finalScore > 20) {
      setScoreTier('Silver Tier · Partially Verified');
    } else {
      setScoreTier('Base Profile · Not Verified');
    }
  };

  const checkIsEduVerified = () => {
    const hasDigi = digilockerDocuments && digilockerDocuments.some((d) => {
      const norm = (d.docType || '').toLowerCase();
      const name = (d.docName || '').toLowerCase();
      return (
        !['aadhaar', 'pan', 'driving_license', 'voter_id'].includes(norm) &&
        !name.includes('aadhaar') &&
        !name.includes('pan card') &&
        !name.includes('income tax') &&
        !name.includes('voter') &&
        !name.includes('driving license')
      );
    });
    const hasQual = qualifications && qualifications.some((q) => q.isVerified === true && q.verificationStatus === 'verified');
    const hasCert = certifications && certifications.some((c) => c.isVerified === true && c.verificationStatus === 'verified');
    return Boolean(hasDigi || hasQual || hasCert);
  };

  const countVerifiedReferences = (refs) => {
    if (!Array.isArray(refs)) return 0;
    return refs.filter(
      (r) => r.isFeedbackSubmitted || r.status === 'completed' || r.isPointsAwarded || r.isVerified
    ).length;
  };

  const calculateDynamicScore = (isAadhaarDone, isEpfoDone, isVoterDone, isDlDone, isEduDone, isEduVerified = undefined, refCount = undefined) => {
    const aadhaarPts = isAadhaarDone ? (scoreConfig.aadhaarScore ?? 20) : 0;
    const voterPts = isVoterDone ? (scoreConfig.voterScore ?? 20) : 0;
    const actualEduVerified = isEduVerified !== undefined ? isEduVerified : checkIsEduVerified();
    const eduPts = actualEduVerified ? (scoreConfig.educationScore ?? 20) : 0;
    const empPts = (isEpfoDone || epfoRecords.length > 0) ? (scoreConfig.employmentScore ?? 30) : 0;
    const currentRefs = refCount !== undefined ? refCount : countVerifiedReferences(userReferences);
    const validRefs = Math.min(scoreConfig.maxReferencesAllowed ?? 2, Math.max(0, currentRefs));
    const refPts = validRefs * (scoreConfig.referenceScorePerItem ?? 5);

    const earned = aadhaarPts + voterPts + eduPts + empPts + refPts;
    const applicable = scoreConfig.totalApplicableScore ?? 100;
    const finalScore = Math.min(100, Math.round((earned / applicable) * 100));
    updateScoreAndTier(finalScore);
    return finalScore;
  };

  // Helper function to recompute overall KYC status up to 7
  const recomputeKyc = ({ isAadhaar, isEmp, isVoter, isDl, hasEdu, isProfile }) => {
    const allDone = Boolean(isProfile && isAadhaar && isEmp && isVoter && isDl && hasEdu);
    if (allDone) return 7;
    let count = isProfile ? 1 : 0;
    if (isAadhaar) count++;
    if (isEmp) count++;
    if (isVoter) count++;
    if (isDl) count++;
    if (hasEdu) count++;
    return Math.min(6, count);
  };

  // Load existing profile & KYC verification status on mount using single GET /v1/users/me
  const fetchInitialData = useCallback(async () => {
    try {
      setFetchingStatus(true);

      try {
        const cfgRes = await getScoreConfigApi();
        const cfgData = cfgRes.data?.data?.config || cfgRes.data?.config;
        if (cfgData) {
          setScoreConfig((prev) => ({ ...prev, ...cfgData }));
        }
      } catch (cfgErr) {
        console.error('Failed to load score config from DB:', cfgErr);
      }

      const profileRes = await getProfileApi();
      const pData = profileRes.data || profileRes;
      if (!pData) return;

      if (pData.profileScoring?.scoreConfig) {
        setScoreConfig((prev) => ({ ...prev, ...pData.profileScoring.scoreConfig }));
      }

      // Step 1: Personal profile fields
      if (pData.name) setFullName(pData.name);
      if (pData.email) setEmail(pData.email);
      if (pData.phoneNumber) setPhone(pData.phoneNumber);
      const fetchedDesignation = (pData.designation || '').trim();
      setDesignation(fetchedDesignation);
      if (pData.address) setAddressText(pData.address);
      if (pData.profileImage) {
        setProfilePhotoPreview(pData.profileImage);
      }
      if (fetchedDesignation.length > 0) {
        setProfileSaved(true);
      } else {
        setProfileSaved(false);
      }

      // Step 4: Education & Certifications directly from profile
      const loadedQuals = Array.isArray(pData.qualifications) ? pData.qualifications : [];
      const loadedCerts = Array.isArray(pData.certifications) ? pData.certifications : [];
      const loadedDocs = Array.isArray(pData.digilockerDocuments) ? pData.digilockerDocuments : [];
      setQualifications(loadedQuals);
      setCertifications(loadedCerts);
      setDigilockerDocuments(loadedDocs);

      // References & Reward Points from profile
      if (pData.references && Array.isArray(pData.references)) {
        setUserReferences(pData.references);

        // Check if any reference was recently verified while user was away and hasn't been acknowledged
        const currentUserId = pData._id || pData.id || user?._id || user?.id || 'current_user';
        const ackKey = `employix_acked_refs_${currentUserId}`;
        let ackedIds = [];
        try {
          ackedIds = JSON.parse(localStorage.getItem(ackKey) || localStorage.getItem('employix_acked_refs_global') || '[]');
        } catch (e) {
          ackedIds = [];
        }

        const completedRefs = pData.references.filter(
          (r) => r.status === 'completed' || r.isFeedbackSubmitted || r.isPointsAwarded
        );

        const unackedRef = completedRefs.find((r) => {
          const refId = String(r._id || r.id || r.referenceId || '');
          return refId && !ackedIds.includes(refId);
        });

        if (unackedRef) {
          // Immediately mark all completed IDs as acknowledged
          const allCompletedIds = completedRefs.map((r) => String(r._id || r.id || r.referenceId || '')).filter(Boolean);
          const updatedAcked = Array.from(new Set([...ackedIds, ...allCompletedIds]));
          try {
            localStorage.setItem(ackKey, JSON.stringify(updatedAcked));
            localStorage.setItem('employix_acked_refs_global', JSON.stringify(updatedAcked));
          } catch (e) {}

          const hasShownInSession = sessionStorage.getItem(`shown_ref_popup_${unackedRef._id || unackedRef.id}`);
          if (!hasShownInSession) {
            sessionStorage.setItem(`shown_ref_popup_${unackedRef._id || unackedRef.id}`, 'true');
            setTimeout(() => {
              showVerificationSuccessModal({
                title: '🎉 You Earned 5 Reward Points!',
                pointsEarned: 5,
                badgeText: '✓ Reference Endorsed',
                description: `Great news! Your behavioral reference from ${unackedRef.refereeName || 'your manager'} has been authenticated and +5 Reward Points have been added to your balance!`,
                buttonText: 'View Updated Score',
                targetStepId: 'step-references',
              });
            }, 600);
          }
        }
      }
      if (pData.rewardPoints !== undefined) {
        setRewardPoints(pData.rewardPoints);
      }

      // Step 2 & 3: Verification statuses
      const isEduDone = loadedQuals.length > 0 || loadedCerts.length > 0 || loadedDocs.length > 0 || pData.educationStatus === 1;
      const isAadhaarDone = pData.aadhaarStatus === 1 || Boolean(pData.aadhaarData) || loadedDocs.some(d => d.docType === 'aadhaar');
      const isVoterDone = pData.voterStatus === 1 || Boolean(pData.voterData);
      const isDlDone = pData.dlStatus === 1 || Boolean(pData.dlData);
      const epfoList = pData.rawEpfoRecords || pData.epfoEmployment;
      const hasEpfo = (Array.isArray(epfoList) && epfoList.length > 0) || Boolean(pData.epfoData);
      const isEmpDone = hasEpfo || pData.employmentStatus === 1;

      if (isAadhaarDone) {
        setAadhaarVerified(true);
        const aData = pData.aadhaarData ? { ...pData.aadhaarData } : {
          maskedDocumentNumber: 'Verified',
          name: pData.name || user?.name || fullName,
          scoreEarned: 20,
        };
        setAadhaarResult(aData);
      }

      if (isVoterDone) {
        setVoterVerified(true);
        const vData = pData.voterData ? { ...pData.voterData } : {};
        setVoterResult(vData);
      }

      if (isDlDone) {
        setDlVerified(true);
        const dData = pData.dlData ? { ...pData.dlData } : {};
        setDlResult(dData);
      }

      // Employment records: load both Manual and EPFO
      if (pData.manualEmployment && Array.isArray(pData.manualEmployment)) {
        setManualJobs(pData.manualEmployment);
      }
      if (epfoList && Array.isArray(epfoList)) {
        setEpfoRecords(epfoList);
      }
      const hasManualEmp = (pData.manualEmployment && Array.isArray(pData.manualEmployment) && pData.manualEmployment.length > 0);
      if (isEmpDone || hasManualEmp) {
        setEmploymentVerified(true);
      }

      // Score & Tier: Prioritize authoritative server score, avoiding premature low-score overwrites
      const nonEduTypes = ['aadhaar', 'pan', 'driving_license', 'voter_id'];
      const realEduDocs = loadedDocs.filter(d => {
        const norm = (d.docType || '').toLowerCase();
        const name = (d.docName || '').toLowerCase();
        return !nonEduTypes.includes(norm) && !name.includes('aadhaar') && !name.includes('pan card') && !name.includes('income tax') && !name.includes('voter') && !name.includes('driving license');
      });
      const hasVerifiedEdu = realEduDocs.length > 0 || loadedQuals.some(q => q.isVerified && q.verificationStatus === 'verified') || loadedCerts.some(c => c.isVerified && c.verificationStatus === 'verified');
      const authoritativeScore = pData.employixScore ?? user?.employixScore;
      if (authoritativeScore !== undefined && authoritativeScore !== null && Number(authoritativeScore) > 0) {
        updateScoreAndTier(Number(authoritativeScore));
        dispatch(
          updateUserKycStatus({
            employixScore: Number(authoritativeScore),
            kycStatus: pData.kycStatus,
            aadhaarStatus: pData.aadhaarStatus,
            voterStatus: pData.voterStatus,
            employmentStatus: pData.employmentStatus,
            educationStatus: pData.educationStatus,
          })
        );
      } else {
        calculateDynamicScore(isAadhaarDone, hasEpfo, isVoterDone, isDlDone, isEduDone, hasVerifiedEdu, countVerifiedReferences(pData.references));
      }

      // Restore kycStatus (preserve status 8 if completed)
      const isStatus8 = pData.kycStatus === 8 || user?.kycStatus === 8 || localStorage.getItem(`employix_setup_completed_${currentUserId}`) === 'true';
      const isRefDone = Array.isArray(pData.references) && pData.references.length > 0;
      const isProfDone = Boolean(fetchedDesignation.length > 0);
      const all7StepsDone = Boolean(isProfDone && isAadhaarDone && isVoterDone && isEmpDone && isDlDone && isEduDone && isRefDone);

      if (isStatus8) {
        setKycStatus(8);
        setProfileSaved(true);
      } else if (all7StepsDone) {
        setKycStatus(7);
        setProfileSaved(true);
      } else {
        const stepCount = [
          isProfDone,
          isAadhaarDone,
          isVoterDone,
          isEmpDone,
          isRefDone,
          isEduDone,
          isDlDone,
        ].filter(Boolean).length;
        setKycStatus(Math.min(6, stepCount));
      }
    } catch (err) {
      console.warn('Could not fetch user profile & KYC data:', err.message);
    } finally {
      setFetchingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Detect DigiLocker return callback via URL query params or sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryClientId = params.get('client_id');
    const queryStep = params.get('step');
    const storedEduClientId = sessionStorage.getItem('digilocker_edu_client_id');

    if (queryStep === 'education') {
      setEducationMode('digilocker');
    }

    if (queryClientId || (queryStep === 'education' && storedEduClientId)) {
      const targetClientId = queryClientId || storedEduClientId;
      if (targetClientId) {
        handleSyncDigilockerEducation(targetClientId);
      }
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname + (window.location.hash || '');
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    // Detect Account Verified callback from OTP page
    const storedVerifiedMsg = typeof window !== 'undefined' && window.sessionStorage?.getItem('employix_account_verified_msg');
    const isAccountJustVerified =
      Boolean(storedVerifiedMsg) ||
      params.get('verified') === 'true' ||
      params.get('accountVerified') === 'true' ||
      location.state?.accountVerified;

    if (isAccountJustVerified) {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('employix_account_verified_msg');
      }
      showVerificationSuccessModal({
        title: 'Account Verified Successfully!',
        pointsEarned: 0,
        badgeText: 'Account Activated',
        description: 'Your email credentials have been authenticated. Welcome to Employix! Please complete your KYC verification below.',
        buttonText: 'Start your free verification',
        targetStepId: 'step-profile',
      });
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname + (window.location.hash || '');
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [location.search]);

  // Real-time WebSocket listener for Behavioral Reference Verification & +5 Points
  useEffect(() => {
    const currentUserId = user?._id || user?.id;
    if (currentUserId) {
      joinUserRoom(currentUserId);
    }

    const socket = getSocket();
    if (!socket) return;

    const handleReferenceVerified = (data) => {
      console.log('[KYC Real-time Reference Verified Event Received]:', data);
      if (data?.targetUserId && currentUserId && String(data.targetUserId) !== String(currentUserId)) {
        return;
      }

      // Instantly update userReferences array in state
      setUserReferences((prev) =>
        prev.map((r) => {
          const matchId = data?.referenceId && String(r._id || r.id || '') === String(data.referenceId);
          const matchEmail = data?.refereeEmail && (r.refereeEmail || '').toLowerCase() === data.refereeEmail.toLowerCase();
          if (matchId || matchEmail) {
            return {
              ...r,
              status: 'completed',
              isFeedbackSubmitted: true,
              isPointsAwarded: true,
            };
          }
          return r;
        })
      );

      // Pop up center celebration modal immediately when socket hits
      showVerificationSuccessModal({
        title: 'Behavioral Reference Verified! 🎉',
        pointsEarned: data?.points || 5,
        badgeText: '✓ +5 Points Credited',
        description: `${data?.refereeName ? `${data.refereeName} has verified your behavioral reference!` : 'Your reference has been successfully evaluated!'} +5 Reward Points have been credited to your Employix balance.`,
        buttonText: 'Awesome, View My Score',
        targetStepId: 'step-references',
      });

      // Instantly increment local points & score
      setRewardPoints((prev) => (prev || 0) + (data?.points || 5));
      if (data?.newScore) {
        updateScoreAndTier(Number(data.newScore));
      }

      // Mark in local storage as acknowledged
      if (data?.referenceId && currentUserId) {
        const ackKey = `employix_acked_refs_${currentUserId}`;
        try {
          const ackedIds = JSON.parse(localStorage.getItem(ackKey) || '[]');
          if (!ackedIds.includes(String(data.referenceId))) {
            localStorage.setItem(ackKey, JSON.stringify([...ackedIds, String(data.referenceId)]));
          }
        } catch (e) {}
      }

      // Refresh full profile data to sync references state
      fetchInitialData();
    };

    socket.on('reference_verified', handleReferenceVerified);

    return () => {
      socket.off('reference_verified', handleReferenceVerified);
    };
  }, [user?._id, user?.id, fetchInitialData]);

  // Auto sync KYC state when user switches back to tab or focuses the window
  useEffect(() => {
    const handleFocus = () => {
      fetchInitialData();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInitialData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchInitialData]);

  // Handle Photo selection (supports JPEG, PNG, HEIC, WEBP)
  const handlePhotoChange = async (e) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      if (!isValidProfileImage(rawFile)) {
        setProfileErrors((prev) => ({ ...prev, photo: 'Please select a valid image file (JPEG, PNG, HEIC, WEBP).' }));
        return;
      }
      if (rawFile.size > 5 * 1024 * 1024) {
        setProfileErrors((prev) => ({ ...prev, photo: 'Image size must be less than 5MB' }));
        return;
      }
      try {
        setProfileErrors((prev) => ({ ...prev, photo: '' }));
        const result = await processProfileImageFile(rawFile);
        if (result) {
          setProfilePhotoFile(result.file);
          setProfilePhotoPreview(result.previewUrl);
          setProfileSaved(false);
        }
      } catch (err) {
        console.error('Error processing KYC profile image:', err);
        setProfileErrors((prev) => ({ ...prev, photo: 'Could not process selected image. Please try another.' }));
      }
    }
  };

  // Handle Step 1 Save (Personal Profile & Designation)
  const handleSaveProfile = async (e, isSilent = false) => {
    if (e && e.preventDefault) e.preventDefault();

    const newErrors = { photo: '', name: '', phone: '', designation: '' };
    let hasError = false;

    if (!profilePhotoFile && !profilePhotoPreview && !user?.profileImage) {
      newErrors.photo = 'Profile Photo is required.';
      hasError = true;
    }
    if (!fullName || !fullName.trim()) {
      newErrors.name = 'Full Name is required.';
      hasError = true;
    }
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.phone = 'Valid 10-digit Mobile Number is required.';
      hasError = true;
    }
    if (!designation.trim()) {
      newErrors.designation = 'Professional Designation / Role is required.';
      hasError = true;
    }

    if (hasError) {
      setProfileErrors(newErrors);
      return;
    }

    setProfileErrors({ photo: '', name: '', phone: '', designation: '' });

    setProfileSaving(true);
    try {
      const formData = new FormData();
      if (fullName) formData.append('name', fullName.trim());
      if (phone) formData.append('phoneNumber', phone.trim());
      formData.append('designation', designation.trim());
      if (addressText) formData.append('address', addressText.trim());
      if (profilePhotoFile) formData.append('profileImage', profilePhotoFile);
      const res = await updateProfileApi(formData);
      const updated = res?.data || res;

      dispatch(
        updateProfileSuccess({
          name: updated?.name || fullName,
          designation: updated?.designation || designation,
          phoneNumber: updated?.phoneNumber || phone,
          address: addressText,
          profileImage: updated?.profileImage || profilePhotoPreview,
        })
      );

      setProfileSaved(true);
      // Check if all steps done → kycStatus = 7
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      if (aadhaarVerified && employmentVerified && voterVerified && dlVerified && hasEdu) {
        setKycStatus(7);
      } else {
        const nextStatus = recomputeKyc({
          isAadhaar: aadhaarVerified,
          isEmp: employmentVerified,
          isVoter: voterVerified,
          isDl: dlVerified,
          hasEdu,
          isProfile: true,
        });
        setKycStatus(nextStatus);
      }
      if (!isSilent) {
        toast.success('Profile details saved successfully.', {
          showModal: true,
          title: 'Profile Details Saved!',
          buttonText: 'Continue',
        });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      if (!isSilent) {
        toast.error(err.response?.data?.message || 'Could not update profile details.');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // Format PAN: ABCDE1234F
  const handlePanChange = (e) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    setPanNumber(raw);
  };

  // Format Voter ID: WXD1234567
  const handleVoterNumberChange = (e) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
    setVoterNumber(raw);
  };

  // Validate document file helper (Supports: JPEG, PNG, HEIC, WEBP & PDF <= 5MB)
  const validateDocFile = (file) => {
    if (!file) return false;
    if (!isValidDocumentOrImage(file)) {
      toast.error('Invalid file format. Supported formats: JPEG, JPG, PNG, HEIC, WEBP, PDF.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit. Maximum file size: 5MB.');
      return false;
    }
    return true;
  };

  // Specific Aadhaar Image Validation (Dimensions, Crop, and Blur Check)
  const validateAadhaarImageFile = (file) => {
    return new Promise((resolve) => {
      if (!validateDocFile(file)) {
        resolve({ valid: false });
        return;
      }

      if (file.size < 10 * 1024) {
        resolve({
          valid: false,
          error: 'File size is too small (< 10KB). Please upload a clear photo of your Aadhaar card.',
        });
        return;
      }

      // If PDF, skip image canvas checks
      if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
        resolve({ valid: true });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // 1. Dimensions / Crop check
        if (width < 320 || height < 180) {
          resolve({
            valid: false,
            error: 'The uploaded Aadhaar card image appears cropped or resolution is too low. Please upload the full card.',
          });
          return;
        }

        const aspect = width / height;
        if (aspect < 0.45 || aspect > 2.8) {
          resolve({
            valid: false,
            error: 'The uploaded Aadhaar card image appears cropped or cut off. Please ensure all 4 corners are visible.',
          });
          return;
        }

        // 2. Blur check via Laplacian variance on scaled canvas
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxDim = 250;
          const scale = Math.min(1, maxDim / Math.max(width, height));
          const sw = Math.max(10, Math.floor(width * scale));
          const sh = Math.max(10, Math.floor(height * scale));
          canvas.width = sw;
          canvas.height = sh;
          ctx.drawImage(img, 0, 0, sw, sh);

          const imgData = ctx.getImageData(0, 0, sw, sh);
          const data = imgData.data;

          const gray = new Float32Array(sw * sh);
          for (let i = 0; i < data.length; i += 4) {
            gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }

          let sum = 0;
          let sumSq = 0;
          let count = 0;
          for (let y = 1; y < sh - 1; y++) {
            for (let x = 1; x < sw - 1; x++) {
              const idx = y * sw + x;
              const lap =
                gray[idx - sw] +
                gray[idx + sw] +
                gray[idx - 1] +
                gray[idx + 1] -
                4 * gray[idx];
              sum += lap;
              sumSq += lap * lap;
              count++;
            }
          }

          const mean = sum / count;
          const variance = sumSq / count - mean * mean;

          if (variance < 35) {
            resolve({
              valid: false,
              error: 'The uploaded Aadhaar card image is blurry or unclear. Please upload a clear and sharp photo.',
            });
            return;
          }

          resolve({ valid: true });
        } catch {
          resolve({ valid: true });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ valid: false, error: 'Could not read image file. Please upload a valid JPG, PNG, or PDF.' });
      };

      img.src = objectUrl;
    });
  };

  const handleAadhaarFrontChange = async (rawFile, inputElem) => {
    if (!rawFile) return;

    const processed = await processUploadFile(rawFile);
    const file = processed?.file || rawFile;

    if (
      aadhaarBack &&
      ((file.name === aadhaarBack.name && file.size === aadhaarBack.size) ||
        (file.lastModified && aadhaarBack.lastModified && file.lastModified === aadhaarBack.lastModified))
    ) {
      toast.error('Front and Back side cannot be the same image. Please upload Front and Back sides separately.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const isBackAadhaar = /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(file.name) || /[-_.]back[-_.]/i.test(file.name) || /aadhaar[-_\s]*back/i.test(file.name) || /aadhar[-_\s]*back/i.test(file.name);
    const isFrontAadhaar = /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(file.name) || /[-_.]front[-_.]/i.test(file.name) || /aadhaar[-_\s]*front/i.test(file.name) || /aadhar[-_\s]*front/i.test(file.name);
    if (isBackAadhaar && !isFrontAadhaar) {
      toast.error('Aadhaar card (Back side) detected in Front side upload. Please upload the Front side of your Aadhaar card.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const check = await validateAadhaarImageFile(file);
    if (!check.valid) {
      if (check.error) toast.error(check.error);
      if (inputElem) inputElem.value = '';
      return;
    }

    setAadhaarFront(file);
    setAadhaarFrontPreview(
      processed?.previewUrl || (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : URL.createObjectURL(file))
    );
  };

  const handleAadhaarBackChange = async (rawFile, inputElem) => {
    if (!rawFile) return;

    const processed = await processUploadFile(rawFile);
    const file = processed?.file || rawFile;

    if (
      aadhaarFront &&
      ((file.name === aadhaarFront.name && file.size === aadhaarFront.size) ||
        (file.lastModified && aadhaarFront.lastModified && file.lastModified === aadhaarFront.lastModified))
    ) {
      toast.error('Front and Back side cannot be the same image. Please upload Front and Back sides separately.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const isBackAadhaar = /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(file.name) || /[-_.]back[-_.]/i.test(file.name) || /aadhaar[-_\s]*back/i.test(file.name) || /aadhar[-_\s]*back/i.test(file.name);
    const isFrontAadhaar = /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(file.name) || /[-_.]front[-_.]/i.test(file.name) || /aadhaar[-_\s]*front/i.test(file.name) || /aadhar[-_\s]*front/i.test(file.name);
    if (isFrontAadhaar && !isBackAadhaar) {
      toast.error('Aadhaar card (Front side) detected in Back side upload. Please upload the Back side of your Aadhaar card.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const check = await validateAadhaarImageFile(file);
    if (!check.valid) {
      if (check.error) toast.error(check.error);
      if (inputElem) inputElem.value = '';
      return;
    }

    setAadhaarBack(file);
    setAadhaarBackPreview(
      processed?.previewUrl || (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : URL.createObjectURL(file))
    );
  };

  // Submit Aadhaar Verification - Option 2: OCR Upload
  const handleVerifyAadhaarOcr = async (e) => {
    e.preventDefault();
    if (!aadhaarFront) {
      toast.error('Please upload your Aadhaar card (Front side) image to verify.');
      return;
    }
    if (!aadhaarBack) {
      toast.error('Please upload your Aadhaar card (Back side) image to verify.');
      return;
    }

    if (
      (aadhaarFront.name === aadhaarBack.name && aadhaarFront.size === aadhaarBack.size) ||
      (aadhaarFront.lastModified && aadhaarBack.lastModified && aadhaarFront.lastModified === aadhaarBack.lastModified)
    ) {
      toast.error('Front and Back side cannot be the same image. Please upload Front and Back sides separately.');
      return;
    }

    if (!aadhaarConsent) {
      toast.error('Please accept the mandatory UIDAI OCR Consent checkbox before proceeding.');
      return;
    }

    setAadhaarLoading(true);
    try {
      const formData = new FormData();
      formData.append('documentFront', aadhaarFront);
      formData.append('documentBack', aadhaarBack);
      formData.append('consent', 'true');
      formData.append('consentPurpose', 'UIDAI Aadhaar OCR scan for Employix Trust Profile');

      const res = await verifyAadhaarApi(formData);
      const data = res.data?.data || res.data || res;

      setAadhaarVerified(true);
      setAadhaarResult(data);
      if (data?.name || data?.fullName) {
        setFullName((data.name || data.fullName).trim());
      }
      const extractedAddr = data.address?.fullAddress || (typeof data.address === 'string' ? data.address : '');
      if (extractedAddr) {
        setAddressText(extractedAddr);
      }
      const hasEdu = qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const isEpfoVerified = epfoRecords.length > 0;
      const clientScore = calculateDynamicScore(true, isEpfoVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      const serverScore = data.newScore !== undefined ? data.newScore : data.employixScore;
      const nextLiveScore = (serverScore !== undefined && serverScore !== null)
        ? Number(serverScore)
        : clientScore;
      updateScoreAndTier(nextLiveScore);

      const nextKyc = data.kycStatus || recomputeKyc({
        isAadhaar: true,
        isEmp: employmentVerified,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextKyc);

      dispatch(
        updateUserKycStatus({
          aadhaarStatus: 1,
          aadhaarData: data,
          employixScore: nextLiveScore,
          kycStatus: nextKyc,
        })
      );
      showVerificationSuccessModal({
        title: 'Aadhaar Card Successfully Verified!',
        pointsEarned: scoreConfig.aadhaarScore ?? 20,
        description: `Your UIDAI identity verification is completed and ${scoreConfig.aadhaarScore ?? 20} points have been credited to your profile.`,
        targetStepId: 'step-voter',
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.error?.detail ||
        (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : null) ||
        err.message ||
        'Aadhaar verification failed.';
      toast.error(msg);
    } finally {
      setAadhaarLoading(false);
    }
  };

  // Submit Voter ID Address Verification - Option 1: EPIC Number
  const handleVerifyVoterNumber = async (e) => {
    e.preventDefault();
    if (!voterNumConsent) {
      toast.error('Please give consent to verify Voter ID.');
      return;
    }
    if (!voterNumber.trim()) {
      toast.error('Please enter your 10-character Voter ID / EPIC Number.');
      return;
    }

    setVoterLoading(true);
    try {
      const payload = {
        number: voterNumber.trim(),
        consentPurpose: 'Address verification for Employix verified candidate profile',
      };
      const res = await verifyVoterApi(payload);
      const data = res.data?.data || res.data || res;

      setVoterVerified(true);
      setVoterResult(data);
      if (data.address?.fullAddress) {
        setAddressText(data.address.fullAddress);
      }
      const hasEdu = qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const isEpfoVerified = epfoRecords.length > 0;
      const clientScore = calculateDynamicScore(aadhaarVerified, isEpfoVerified, true, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      const serverScore = data.newScore !== undefined ? data.newScore : data.employixScore;
      const nextLiveScore = (serverScore !== undefined && serverScore !== null)
        ? Number(serverScore)
        : clientScore;
      updateScoreAndTier(nextLiveScore);

      const newKycSt = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: employmentVerified,
        isVoter: true,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(newKycSt);

      dispatch(
        updateUserKycStatus({
          voterStatus: 1,
          voterData: data,
          address: data.address?.fullAddress || addressText,
          employixScore: nextLiveScore,
          kycStatus: newKycSt,
        })
      );
      showVerificationSuccessModal({
        title: 'Voter ID Successfully Verified!',
        pointsEarned: scoreConfig.voterScore ?? 20,
        description: `Your ECI residential address proof is verified and ${scoreConfig.voterScore ?? 20} points have been credited to your profile.`,
        targetStepId: 'step-employment',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Voter ID verification failed.');
    } finally {
      setVoterLoading(false);
    }
  };

  const handleVoterFrontChange = async (rawFile, inputElem) => {
    if (!rawFile) return;

    const processed = await processUploadFile(rawFile);
    const file = processed?.file || rawFile;

    if (
      voterBack &&
      ((file.name === voterBack.name && file.size === voterBack.size) ||
        (file.lastModified && voterBack.lastModified && file.lastModified === voterBack.lastModified))
    ) {
      toast.error('Front and Back side cannot be the same file. Please upload Front and Back sides separately.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const fname = file.name?.toLowerCase() || '';
    const isBack = /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(fname) || /[-_.]back[-_.]/i.test(fname) || /voter[-_\s]*back/i.test(fname);
    const isFront = /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(fname) || /[-_.]front[-_.]/i.test(fname) || /voter[-_\s]*front/i.test(fname);
    if (isBack && !isFront) {
      toast.error('Voter ID (Back side) detected in Front side upload. Please upload the Front side of your Voter ID.');
      if (inputElem) inputElem.value = '';
      return;
    }

    if (!validateDocFile(file)) {
      if (inputElem) inputElem.value = '';
      return;
    }

    setVoterFront(file);
    setVoterFrontPreview(
      processed?.previewUrl || (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : URL.createObjectURL(file))
    );
  };

  const handleVoterBackChange = async (rawFile, inputElem) => {
    if (!rawFile) return;

    const processed = await processUploadFile(rawFile);
    const file = processed?.file || rawFile;

    if (
      voterFront &&
      ((file.name === voterFront.name && file.size === voterFront.size) ||
        (file.lastModified && voterFront.lastModified && file.lastModified === voterFront.lastModified))
    ) {
      toast.error('Front and Back side cannot be the same file. Please upload Front and Back sides separately.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const fname = file.name?.toLowerCase() || '';
    const isBack = /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(fname) || /[-_.]back[-_.]/i.test(fname) || /voter[-_\s]*back/i.test(fname);
    const isFront = /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(fname) || /[-_.]front[-_.]/i.test(fname) || /voter[-_\s]*front/i.test(fname);
    if (isFront && !isBack) {
      toast.error('Voter ID (Front side) detected in Back side upload. Please upload the Back side of your Voter ID.');
      if (inputElem) inputElem.value = '';
      return;
    }

    if (!validateDocFile(file)) {
      if (inputElem) inputElem.value = '';
      return;
    }

    setVoterBack(file);
    setVoterBackPreview(
      processed?.previewUrl || (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : URL.createObjectURL(file))
    );
  };

  // Submit Voter ID Address Verification - Option 2: OCR Document Upload
  const handleVerifyVoterOcr = async (e) => {
    e.preventDefault();
    if (!voterOcrConsent) {
      toast.error('Please give consent to scan Voter ID.');
      return;
    }
    if (!voterFront || !voterBack) {
      toast.error('Voter ID ka Front aur Back dono photos upload karna compulsory hai.');
      return;
    }

    const isBackVoter = (str) => /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(str) || /[-_.]back[-_.]/i.test(str) || /voter[-_\s]*back/i.test(str);
    const isFrontVoter = (str) => /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(str) || /[-_.]front[-_.]/i.test(str) || /voter[-_\s]*front/i.test(str);
    if (voterFront?.name && isBackVoter(voterFront.name) && !isFrontVoter(voterFront.name)) {
      toast.error('Voter ID (Back side) detected in Front side upload. Please upload the Front side of your Voter ID.');
      return;
    }
    if (voterBack?.name && isFrontVoter(voterBack.name) && !isBackVoter(voterBack.name)) {
      toast.error('Voter ID (Front side) detected in Back side upload. Please upload the Back side of your Voter ID.');
      return;
    }

    setVoterLoading(true);
    try {
      const formData = new FormData();
      formData.append('documentFront', voterFront);
      formData.append('documentBack', voterBack);
      formData.append('consentPurpose', 'Address extraction from Voter ID OCR for candidate records');

      const res = await verifyVoterOcrApi(formData);
      const data = res.data?.data || res.data || res;

      setVoterVerified(true);
      setVoterResult(data);
      if (data.address?.fullAddress) {
        setAddressText(data.address.fullAddress);
      }
      const hasEdu = qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const isEpfoVerified = epfoRecords.length > 0;
      const clientScore = calculateDynamicScore(aadhaarVerified, isEpfoVerified, true, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      const serverScore = data.newScore !== undefined ? data.newScore : data.employixScore;
      const nextLiveScore = (serverScore !== undefined && serverScore !== null)
        ? Number(serverScore)
        : clientScore;
      updateScoreAndTier(nextLiveScore);

      const ocrKycSt = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: employmentVerified,
        isVoter: true,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(ocrKycSt);

      dispatch(
        updateUserKycStatus({
          voterStatus: 1,
          voterData: data,
          address: data.address?.fullAddress || addressText,
          employixScore: nextLiveScore,
          kycStatus: ocrKycSt,
        })
      );
      showVerificationSuccessModal({
        title: 'Voter ID Successfully Verified!',
        pointsEarned: scoreConfig.voterScore ?? 20,
        description: `Your ECI residential address proof is verified and ${scoreConfig.voterScore ?? 20} points have been credited to your profile.`,
        targetStepId: 'step-employment',
      });
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Voter ID OCR processing failed.';
      const lower = String(msg).toLowerCase();
      if (
        lower.includes('non compliant') ||
        lower.includes('quality standard') ||
        lower.includes('not compliant') ||
        lower.includes('document_quality')
      ) {
        msg = 'Uploaded document is not a valid Voter ID card. Please upload a clear photo of your original Voter ID card (Front & Back).';
      }
      toast.error(msg);
    } finally {
      setVoterLoading(false);
    }
  };

  const handleDlFrontChange = async (rawFile, inputElem) => {
    if (!rawFile) return;

    const processed = await processUploadFile(rawFile);
    const file = processed?.file || rawFile;

    if (
      dlBack &&
      ((file.name === dlBack.name && file.size === dlBack.size) ||
        (file.lastModified && dlBack.lastModified && file.lastModified === dlBack.lastModified))
    ) {
      toast.error('Front and Back side cannot be the same file. Please upload Front and Back sides separately.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const fname = file.name?.toLowerCase() || '';
    const isBack = /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(fname) || /[-_.]back[-_.]/i.test(fname) || /dl[-_\s]*back/i.test(fname);
    const isFront = /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(fname) || /[-_.]front[-_.]/i.test(fname) || /dl[-_\s]*front/i.test(fname);
    if (isBack && !isFront) {
      toast.error('Driving License (Back side) detected in Front side upload. Please upload the Front side of your Driving License.');
      if (inputElem) inputElem.value = '';
      return;
    }

    if (!validateDocFile(file)) {
      if (inputElem) inputElem.value = '';
      return;
    }

    setDlFront(file);
    setDlFrontPreview(
      processed?.previewUrl || (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : URL.createObjectURL(file))
    );
  };

  const handleDlBackChange = async (rawFile, inputElem) => {
    if (!rawFile) return;

    const processed = await processUploadFile(rawFile);
    const file = processed?.file || rawFile;

    if (
      dlFront &&
      ((file.name === dlFront.name && file.size === dlFront.size) ||
        (file.lastModified && dlFront.lastModified && file.lastModified === dlFront.lastModified))
    ) {
      toast.error('Front and Back side cannot be the same file. Please upload Front and Back sides separately.');
      if (inputElem) inputElem.value = '';
      return;
    }

    const fname = file.name?.toLowerCase() || '';
    const isBack = /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(fname) || /[-_.]back[-_.]/i.test(fname) || /dl[-_\s]*back/i.test(fname);
    const isFront = /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(fname) || /[-_.]front[-_.]/i.test(fname) || /dl[-_\s]*front/i.test(fname);
    if (isFront && !isBack) {
      toast.error('Driving License (Front side) detected in Back side upload. Please upload the Back side of your Driving License.');
      if (inputElem) inputElem.value = '';
      return;
    }

    if (!validateDocFile(file)) {
      if (inputElem) inputElem.value = '';
      return;
    }

    setDlBack(file);
    setDlBackPreview(
      processed?.previewUrl || (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : URL.createObjectURL(file))
    );
  };

  // ── STEP 5: Driving License (DL) Handler ──────────────────────────────────
  const handleVerifyDlOcr = async (e) => {
    e.preventDefault();
    if (!dlConsent) {
      toast.error('Please give consent to verify Driving License.');
      return;
    }
    if (!dlFront || !dlBack) {
      toast.error('Driving License ka Front aur Back dono photos upload karna compulsory hai.');
      return;
    }

    const isBackName = (str) =>
      /(^|[^a-z0-9])(back|piche|rear|bck)($|[^a-z0-9])/i.test(str) ||
      /[-_.]back[-_.]/i.test(str) ||
      /dl[-_\s]*back/i.test(str);

    const isFrontName = (str) =>
      /(^|[^a-z0-9])(front|aage|frnt)($|[^a-z0-9])/i.test(str) ||
      /[-_.]front[-_.]/i.test(str) ||
      /dl[-_\s]*front/i.test(str);

    if (dlFront?.name && isBackName(dlFront.name) && !isFrontName(dlFront.name)) {
      toast.error('Driving License (Back side) detected in Front side upload. Please upload the Front side of your Driving License.');
      return;
    }

    if (dlBack?.name && isFrontName(dlBack.name) && !isBackName(dlBack.name)) {
      toast.error('Driving License (Front side) detected in Back side upload. Please upload the Back side of your Driving License.');
      return;
    }

    setDlLoading(true);
    try {
      const formData = new FormData();
      formData.append('documentFront', dlFront);
      formData.append('documentBack', dlBack);
      formData.append('consent', 'true');
      formData.append('consentPurpose', 'Driving License OCR verification for Employix candidate profile');

      const res = await verifyDlOcrApi(formData);
      const data = res.data?.data || res.data || res;

      setDlVerified(true);
      setDlResult(data);

      const hasEdu = qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const isEpfoVerified = epfoRecords.length > 0;
      const clientScore = calculateDynamicScore(aadhaarVerified, isEpfoVerified, voterVerified, true, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      const serverScore = data.newScore !== undefined ? data.newScore : data.employixScore;
      const nextLiveScore = (serverScore !== undefined && serverScore !== null)
        ? Number(serverScore)
        : clientScore;
      updateScoreAndTier(nextLiveScore);

      const dlNextKyc = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: employmentVerified,
        isVoter: voterVerified,
        isDl: true,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(dlNextKyc);

      dispatch(
        updateUserKycStatus({
          dlStatus: 1,
          dlData: data,
          employixScore: nextLiveScore,
          kycStatus: dlNextKyc,
        })
      );
      showVerificationSuccessModal({
        title: 'Driving License Successfully Verified!',
        pointsEarned: 0,
        badgeText: 'Verified & Authenticated',
        description: 'Your government driving license has been authenticated with MoRTH / State RTO records.',
        buttonText: 'Proceed to Complete Setup →',
        targetStepId: 'step-finish',
      });
    } catch (err) {
      console.error('DL OCR Error:', err);
      let msg = err.response?.data?.message || err.message || 'Driving License OCR verification failed.';
      const lower = String(msg).toLowerCase();
      if (
        lower.includes('non compliant') ||
        lower.includes('quality standard') ||
        lower.includes('not compliant') ||
        lower.includes('document_quality')
      ) {
        if (lower.includes('front') || lower.includes('documentfront')) {
          msg = 'Please upload a valid Driving License (Front side). Only Driving License is accepted.';
        } else if (lower.includes('back') || lower.includes('documentback')) {
          msg = 'Please upload a valid Driving License (Back side). Only Driving License is accepted.';
        } else {
          msg = 'Uploaded document is not a valid Driving License. Please upload a clear photo of your original Driving License (Front & Back).';
        }
      }
      toast.error(msg);
    } finally {
      setDlLoading(false);
    }
  };

  // ── STEP 3: Employment Handlers ──────────────────────────────────────────

  // Option A: Fetch via UAN Number (12-digit)
  const handleFetchUan = async (e) => {
    e.preventDefault();
    if (!empConsent) { toast.error('Please give consent to verify employment.'); return; }
    const cleanUan = uanNumber.replace(/\D/g, '');
    if (!cleanUan) {
      toast.error('Please enter your 12-digit UAN number.');
      return;
    }
    if (cleanUan.length !== 12) {
      toast.error('Invalid UAN number. UAN must be exactly 12 digits.');
      return;
    }
    if (cleanUan.startsWith('0')) {
      toast.error('Invalid UAN number. UAN cannot start with 0.');
      return;
    }
    if (/^(\d)\1{11}$/.test(cleanUan)) {
      toast.error('Invalid UAN number. Repeating digits sequence is not allowed.');
      return;
    }
    if (cleanUan === '123456789012' || cleanUan === '234567890123') {
      toast.error('Invalid UAN number. Sequential dummy numbers are not allowed.');
      return;
    }

    setEmpLoading(true);
    try {
      const res = await fetchEmploymentByUanApi({ uan: cleanUan });
      const data = res.data?.data || res.data || res;
      if (!data.records || data.records.length === 0) {
        toast.error('No EPFO employment records found for this UAN. Please add employment manually.');
        return;
      }
      setEmploymentVerified(true);
      const epfoList = data.records && data.records.length > 0 ? [data] : [];
      setEpfoRecords(epfoList);
      const hasEdu = qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const clientScore = calculateDynamicScore(aadhaarVerified, true, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      const serverScore = data.newScore !== undefined ? data.newScore : data.employixScore;
      const nextLiveScore = (serverScore !== undefined && serverScore !== null)
        ? Number(serverScore)
        : clientScore;
      updateScoreAndTier(nextLiveScore);

      const nextStatus = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: true,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextStatus);
      dispatch(updateUserKycStatus({ employmentStatus: 1, employixScore: nextLiveScore, kycStatus: nextStatus }));
      showVerificationSuccessModal({
        title: 'Employment Records Successfully Verified!',
        pointsEarned: scoreConfig.employmentScore ?? 30,
        description: `Your EPFO employment records have been authenticated and ${scoreConfig.employmentScore ?? 30} points have been credited to your profile.`,
        targetStepId: 'step-references',
      });
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Invalid UAN number. Please enter a valid 12-digit UAN number.';
      const lower = String(msg).toLowerCase();
      if (lower.includes('bad request') || lower === 'bad request.') {
        msg = 'Invalid UAN number. Please enter a valid 12-digit UAN number.';
      }
      toast.error(msg);
    } finally {
      setEmpLoading(false);
    }
  };

  // Option A2: Fetch via Mobile Number (EPFO fallback)
  const handleFetchEpfo = async (e) => {
    e.preventDefault();
    if (!empConsent) { toast.error('Please give consent to verify employment.'); return; }
    const clean = empMobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(clean)) { toast.error('Please enter a valid 10-digit mobile number linked to EPFO.'); return; }
    setEmpLoading(true);
    try {
      const res = await fetchEmploymentHistoryApi({ mobileNumber: clean, consent: true, consentPurpose: 'EPFO employment history for Employix Trust Profile' });
      const data = res.data?.data || res.data || res;
      setEmploymentVerified(true);
      const epfoList = Array.isArray(data.records) ? [data] : [];
      setEpfoRecords(epfoList);
      const hasEdu = qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const clientScore = calculateDynamicScore(aadhaarVerified, true, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      const serverScore = data.newScore !== undefined ? data.newScore : data.employixScore;
      const nextLiveScore = (serverScore !== undefined && serverScore !== null)
        ? Number(serverScore)
        : clientScore;
      updateScoreAndTier(nextLiveScore);

      const nextStatus = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: true,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextStatus);
      dispatch(updateUserKycStatus({ employmentStatus: 1, employixScore: nextLiveScore, kycStatus: nextStatus }));
      showVerificationSuccessModal({
        title: 'Employment Records Successfully Verified!',
        pointsEarned: scoreConfig.employmentScore ?? 30,
        description: `Your EPFO employment records have been authenticated and ${scoreConfig.employmentScore ?? 30} points have been credited to your profile.`,
        targetStepId: 'step-references',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'EPFO fetch failed. Try adding manually.');
    } finally {
      setEmpLoading(false);
    }
  };

  // Option B: Add Manual Job - Date Selection Helpers
  const jobStartParts = (jobForm.startDate || '').split('-');
  const jobStartYear = jobStartParts[0] || '';
  const jobStartMonth = jobStartParts[1] || '';

  const jobEndParts = (jobForm.endDate || '').split('-');
  const jobEndYear = jobEndParts[0] || '';
  const jobEndMonth = jobEndParts[1] || '';

  const handleJobStartMonth = (val) => {
    if (!val) {
      setJobForm((p) => ({ ...p, startDate: '' }));
      return;
    }
    const yr = jobStartYear || String(CURRENT_YEAR);
    setJobForm((p) => ({ ...p, startDate: `${yr}-${val}` }));
  };

  const handleJobStartYear = (val) => {
    if (!val) {
      setJobForm((p) => ({ ...p, startDate: '' }));
      return;
    }
    const mo = jobStartMonth || '01';
    setJobForm((p) => ({ ...p, startDate: `${val}-${mo}` }));
  };

  const handleJobEndMonth = (val) => {
    if (!val) {
      setJobForm((p) => ({ ...p, endDate: '' }));
      return;
    }
    const yr = jobEndYear || String(CURRENT_YEAR);
    setJobForm((p) => ({ ...p, endDate: `${yr}-${val}` }));
  };

  const handleJobEndYear = (val) => {
    if (!val) {
      setJobForm((p) => ({ ...p, endDate: '' }));
      return;
    }
    const mo = jobEndMonth || '01';
    setJobForm((p) => ({ ...p, endDate: `${val}-${mo}` }));
  };

  // Option B: Add Manual Job
  const handleAddManualJob = async (e) => {
    e.preventDefault();
    if (!jobForm.companyName.trim() || !jobForm.designation.trim() || !jobForm.startDate) {
      toast.error('Company name, designation, and start date are required.');
      return;
    }
    if (!jobForm.isCurrent && jobForm.startDate && jobForm.endDate && jobForm.endDate < jobForm.startDate) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }
    setJobFormLoading(true);
    try {
      const res = await addManualEmploymentApi(jobForm);
      const data = res.data?.data || res.data || res;
      setManualJobs((prev) => [data.record || jobForm, ...prev]);
      setEmploymentVerified(true);
      setShowJobForm(false);
      setJobForm({ companyName: '', designation: '', startDate: '', endDate: '', isCurrent: false, description: '' });

      const isAlreadyEpfoVerified = epfoRecords.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const hasEdu = qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0;
      const clientScore = calculateDynamicScore(aadhaarVerified, isAlreadyEpfoVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      const serverScore = data.newScore !== undefined ? data.newScore : data.employixScore;
      const nextLiveScore = (serverScore !== undefined && serverScore !== null)
        ? Number(serverScore)
        : clientScore;
      updateScoreAndTier(nextLiveScore);

      const nextStatus = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: true,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextStatus);
      dispatch(updateUserKycStatus({
        employmentStatus: isAlreadyEpfoVerified ? 1 : 0,
        employixScore: nextLiveScore,
        kycStatus: nextStatus,
      }));

      showVerificationSuccessModal({
        title: 'Success!',
        pointsEarned: 0,
        badgeText: null,
        description: 'Employment Record added (Not Verified - Points awarded upon verification).',
        buttonText: 'Got It',
        targetStepId: 'step-references',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to add employment record.');
    } finally {
      setJobFormLoading(false);
    }
  };

  // Delete Manual Job
  const handleDeleteJob = async (id) => {
    try {
      const res = await deleteManualEmploymentApi(id);
      const data = res.data || res;
      const remainingJobs = manualJobs.filter(j => j._id !== id);
      setManualJobs(remainingJobs);
      const hasAnyEmp = remainingJobs.length > 0 || epfoRecords.length > 0;
      if (!hasAnyEmp) {
        setEmploymentVerified(false);
      }
      const isAlreadyEpfoVerified = epfoRecords.length > 0;
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      const hasVerifiedEdu = checkIsEduVerified();
      const nextStatus = recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: hasAnyEmp,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextStatus);
      dispatch(updateUserKycStatus({ employmentStatus: isAlreadyEpfoVerified ? 1 : 0, kycStatus: nextStatus }));
      calculateDynamicScore(aadhaarVerified, isAlreadyEpfoVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      toast.success('Employment record removed.');
    } catch (err) {
      toast.error('Failed to delete record.');
    }
  };

  // Helper to recompute overall KYC status for education
  const updateEducationKycStatus = (qualsList, certsList) => {
    const hasEdu = (qualsList && qualsList.length > 0) || (certsList && certsList.length > 0);
    const hasEmp = employmentVerified || epfoRecords.length > 0 || manualJobs.length > 0;
    const computedStatus = recomputeKyc({
      isAadhaar: aadhaarVerified,
      isEmp: hasEmp,
      isVoter: voterVerified,
      isDl: dlVerified,
      hasEdu,
      isProfile: profileSaved,
    });
    setKycStatus(computedStatus);
    dispatch(updateUserKycStatus({ kycStatus: computedStatus }));
    return computedStatus;
  };

  // ── STEP 6: Education Handlers ───────────────────────────────────────────
  const handleAddQualification = async (e) => {
    e.preventDefault();
    if (!qualForm.degree.trim() || !qualForm.institution.trim()) {
      toast.error('Degree name and institution are required.');
      return;
    }
    setQualFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('degree', qualForm.degree.trim());
      formData.append('institution', qualForm.institution.trim());
      if (qualForm.fieldOfStudy) formData.append('fieldOfStudy', qualForm.fieldOfStudy.trim());
      if (qualForm.year) formData.append('year', qualForm.year.trim());
      if (qualForm.grade) formData.append('grade', qualForm.grade.trim());
      if (qualForm.document) formData.append('document', qualForm.document);

      const res = await addQualificationApi(formData);
      const data = res.data?.data || res.data || res;
      const createdRecord = data.record || {
        degree: qualForm.degree,
        institution: qualForm.institution,
        year: qualForm.year,
        grade: qualForm.grade,
        _id: Date.now().toString(),
      };

      const updatedQuals = [createdRecord, ...qualifications];
      setQualifications(updatedQuals);
      setShowQualForm(false);
      setQualForm({
        degree: '',
        institution: '',
        fieldOfStudy: '',
        year: '',
        grade: '',
        document: null,
      });

      const nextStatus = data.kycStatus || updateEducationKycStatus(updatedQuals, certifications);
      setKycStatus(nextStatus);
      if (nextStatus === 7) setProfileSaved(true);
      const hasEdu = true;
      const hasVerifiedEdu = updatedQuals.some(q => q.isVerified && q.verificationStatus === 'verified') || certifications.some(c => c.isVerified && c.verificationStatus === 'verified');
      if (data?.employixScore !== undefined && data?.employixScore !== null) {
        updateScoreAndTier(data.employixScore);
      } else {
        const isEpfoVerified = epfoRecords.length > 0;
        calculateDynamicScore(aadhaarVerified, isEpfoVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      }
      toast.success('Educational Qualification added (Not Verified - Points awarded upon verification).');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add qualification.');
    } finally {
      setQualFormLoading(false);
    }
  };

  const handleDeleteQualification = async (id) => {
    if (!id) return;
    try {
      const res = await deleteQualificationApi(id);
      const data = res.data?.data || res.data || res;
      const updatedQuals = qualifications.filter((q) => q._id !== id);
      setQualifications(updatedQuals);
      const nextStatus = data.kycStatus !== undefined ? data.kycStatus : updateEducationKycStatus(updatedQuals, certifications);
      setKycStatus(nextStatus);
      const hasEdu = updatedQuals.length > 0 || certifications.length > 0;
      const hasVerifiedEdu = updatedQuals.some(q => q.isVerified && q.verificationStatus === 'verified') || certifications.some(c => c.isVerified && c.verificationStatus === 'verified');
      if (data?.employixScore !== undefined && data?.employixScore !== null) {
        updateScoreAndTier(data.employixScore);
      } else {
        const isEpfoVerified = epfoRecords.length > 0;
        calculateDynamicScore(aadhaarVerified, isEpfoVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      }
      toast.success('Qualification record deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete qualification.');
    }
  };

  // ── STEP 6: Professional Certifications Handlers ─────────────────────────
  const handleAddCertification = async (e) => {
    e.preventDefault();
    if (!certForm.title.trim() || !certForm.issuer.trim()) {
      toast.error('Certification title and issuer are required.');
      return;
    }
    setCertFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', certForm.title.trim());
      formData.append('issuer', certForm.issuer.trim());
      if (certForm.year) formData.append('year', certForm.year.trim());
      if (certForm.credentialId) formData.append('credentialId', certForm.credentialId.trim());
      if (certForm.credentialUrl) formData.append('credentialUrl', certForm.credentialUrl.trim());
      if (certForm.document) formData.append('document', certForm.document);

      const res = await addCertificationApi(formData);
      const data = res.data?.data || res.data || res;
      const createdRecord = data.record || {
        title: certForm.title,
        issuer: certForm.issuer,
        year: certForm.year,
        credentialId: certForm.credentialId,
        credentialUrl: certForm.credentialUrl,
        _id: Date.now().toString(),
      };

      const updatedCerts = [createdRecord, ...certifications];
      setCertifications(updatedCerts);
      setShowCertForm(false);
      setCertForm({
        title: '',
        issuer: '',
        year: '',
        credentialId: '',
        credentialUrl: '',
        document: null,
      });

      const nextStatus = data.kycStatus || updateEducationKycStatus(qualifications, updatedCerts);
      setKycStatus(nextStatus);
      if (nextStatus === 7) setProfileSaved(true);
      const hasEdu = true;
      const hasVerifiedEdu = qualifications.some(q => q.isVerified && q.verificationStatus === 'verified') || updatedCerts.some(c => c.isVerified && c.verificationStatus === 'verified');
      if (data?.employixScore !== undefined && data?.employixScore !== null) {
        updateScoreAndTier(data.employixScore);
      } else {
        const isEpfoVerified = epfoRecords.length > 0;
        calculateDynamicScore(aadhaarVerified, isEpfoVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      }
      toast.success('Professional Certification added (Not Verified - Points awarded upon verification).');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add certification.');
    } finally {
      setCertFormLoading(false);
    }
  };

  const handleDeleteCertification = async (id) => {
    if (!id) return;
    try {
      const res = await deleteCertificationApi(id);
      const data = res.data?.data || res.data || res;
      const updatedCerts = certifications.filter((c) => c._id !== id);
      setCertifications(updatedCerts);
      const nextStatus = data.kycStatus !== undefined ? data.kycStatus : updateEducationKycStatus(qualifications, updatedCerts);
      setKycStatus(nextStatus);
      const hasVerifiedEdu = qualifications.some(q => q.isVerified && q.verificationStatus === 'verified') || updatedCerts.some(c => c.isVerified && c.verificationStatus === 'verified');
      if (data?.employixScore !== undefined && data?.employixScore !== null) {
        updateScoreAndTier(data.employixScore);
      } else {
        const isEpfoVerified = epfoRecords.length > 0;
        calculateDynamicScore(aadhaarVerified, isEpfoVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu, countVerifiedReferences(userReferences));
      }
      toast.success('Certification record deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete certification.');
    }
  };

  // ── STEP 6: DigiLocker Education Handlers ────────────────────────────────
  const handleInitiateDigilockerEducation = async () => {
    if (!digilockerEduConsent) {
      toast.warn('Please grant authorization by checking the DigiLocker consent box before proceeding.');
      return;
    }
    setDigilockerEduLoading(true);
    try {
      const callbackUrl = `${window.location.origin}${window.location.pathname}?step=education`;
      const res = await initializeDigilockerApi({
        redirect_url: callbackUrl,
        config: {
          consent: 'Y',
          consent_purpose: 'Voluntary consent to verify educational degrees, marksheets and certifications via DigiLocker and NAD',
          purpose: 'Verify educational degrees, marksheets and certifications',
        },
      });
      const data = res.data?.data || res.data;
      if (data?.url) {
        if (data.client_id || data.clientId) {
          sessionStorage.setItem('digilocker_edu_client_id', data.client_id || data.clientId);
          sessionStorage.setItem('digilocker_pending_step', 'education');
        }
        toast.info('Connecting to DigiLocker for educational document verification...');
        window.location.href = data.url;
      } else {
        toast.error('Failed to get DigiLocker authorization URL');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'DigiLocker initialization failed');
    } finally {
      setDigilockerEduLoading(false);
    }
  };

  async function handleSyncDigilockerEducation(customClientId = null) {
    const activeClientId = customClientId || sessionStorage.getItem('digilocker_edu_client_id');
    if (!activeClientId) {
      toast.info('No active DigiLocker session found. Please click "Verify with DigiLocker" first.');
      return;
    }
    setDigilockerSyncLoading(true);
    try {
      const res = await getDigilockerDocumentsApi(activeClientId);
      const data = res.data?.data || res.data;
      if (data?.isPending) {
        toast.warn('DigiLocker verification is still in progress. Please complete the consent steps on DigiLocker.');
        return;
      }

      if (data?.documents && Array.isArray(data.documents)) {
        setDigilockerDocuments(data.documents);
      }
      if (data?.qualifications && Array.isArray(data.qualifications)) {
        setQualifications(data.qualifications);
      }
      if (data?.certifications && Array.isArray(data.certifications)) {
        setCertifications(data.certifications);
      }
      // Set authoritative verified score (+20 pts for education) returned by backend
      const authoritativeScore = data?.employixScore ?? data?.newScore ?? data?.score;
      if (authoritativeScore !== undefined && authoritativeScore !== null && Number(authoritativeScore) > 0) {
        updateScoreAndTier(Number(authoritativeScore));
        dispatch(
          updateUserKycStatus({
            educationStatus: 1,
            employixScore: Number(authoritativeScore),
            kycStatus: data?.newKycState || data?.kycStatus || kycStatus,
          })
        );
      }
      setEducationMode('digilocker');

      sessionStorage.removeItem('digilocker_edu_client_id');
      sessionStorage.removeItem('digilocker_pending_step');

      // Re-fetch entire user profile so all states (quals, certs, KYC status, score) are 100% in sync with database
      await fetchInitialData();

      showVerificationSuccessModal({
        title: 'Education Documents Successfully Verified!',
        pointsEarned: scoreConfig.educationScore ?? 20,
        badgeText: 'DigiLocker Verified',
        description: `Your academic credentials from DigiLocker / NAD have been verified and ${scoreConfig.educationScore ?? 20} points have been credited to your profile.`,
        buttonText: 'Proceed to Driving License Verification →',
        targetStepId: 'step-dl',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to sync DigiLocker documents');
    } finally {
      setDigilockerSyncLoading(false);
    }
  };

  const isProfileDone = Boolean(profileSaved && designation && designation.trim().length > 0);
  const isAadhaarDone = Boolean(aadhaarVerified);
  const isVoterDone = Boolean(voterVerified);
  const isEmpDone = Boolean(employmentVerified || epfoRecords.length > 0 || manualJobs.length > 0);
  const isRefDone = Boolean(
    userReferences &&
    userReferences.length > 0 &&
    userReferences.some((r) => r.isFeedbackSubmitted || r.status === 'completed' || r.isVerified)
  );
  const isEduDone = Boolean(qualifications.length > 0 || certifications.length > 0 || digilockerDocuments.length > 0);
  const isDlDone = Boolean(dlVerified);

  const completedStepsCount = [
    isProfileDone,
    isAadhaarDone,
    isVoterDone,
    isEmpDone,
    isRefDone,
    isEduDone,
    isDlDone,
  ].filter(Boolean).length;

  const allStepsDone = Boolean(
    isProfileDone &&
    isAadhaarDone &&
    isVoterDone &&
    isEmpDone &&
    isRefDone &&
    isEduDone &&
    isDlDone
  );

  const handleFinish = async () => {
    if (kycStatus === 8 || isSetupCompleted) {
      if (typeof onFinish === 'function') {
        onFinish();
      } else {
        navigate('/profile');
      }
      return;
    }

    if (!allStepsDone) {
      if (!isProfileDone) {
        toast.error('Step 1 incomplete: Please fill and save your Profile Details (Designation & Address).');
      } else if (!isAadhaarDone) {
        toast.error('Step 2 incomplete: Aadhaar card verification is required.');
      } else if (!isVoterDone) {
        toast.error('Step 3 incomplete: Voter ID verification is required.');
      } else if (!isEmpDone) {
        toast.error('Step 4 incomplete: Employment history (EPFO or Manual) is required.');
      } else if (!isRefDone) {
        toast.error('Step 5 incomplete: At least 1 Behavioral Reference must be verified (feedback submitted by referee).');
      } else if (!isEduDone) {
        toast.error('Step 6 incomplete: Educational Degree / Certification verification is required.');
      } else if (!isDlDone) {
        toast.error('Step 7 incomplete: Driving License verification is required.');
      } else {
        toast.error(`Please complete all 7 KYC verification steps (Completed: ${completedStepsCount}/7).`);
      }
      return;
    }

    // Ensure latest profile info is saved silently without duplicate toast
    try {
      await handleSaveProfile(null, true);
    } catch (err) {
      // proceed even if silent
    }

    // Call API to persist kycStatus: 8 in database
    try {
      await completeKycSetupApi();
    } catch (err) {
      console.warn('Could not complete setup via API:', err.message);
    }

    // Mark setup as completed (Status 8) in state, localStorage & Redux
    const activeUserId = user?._id || user?.id || 'current';
    localStorage.setItem(`employix_setup_completed_${activeUserId}`, 'true');
    setKycStatus(8);
    dispatch(updateUserKycStatus({ setupCompleted: true, kycCompleted: true, kycStatus: 8, isVerified: true }));

    toast.dismiss();
    toast.success('KYC setup completed successfully!');
    if (typeof onFinish === 'function') {
      onFinish();
    } else {
      navigate('/profile');
    }
  };

  const educationalDigiDocs = digilockerDocuments.filter((doc) => {
    const norm = (doc.docType || '').toLowerCase();
    const name = (doc.docName || '').toLowerCase();
    if (
      norm === 'aadhaar' ||
      norm === 'pan' ||
      norm === 'driving_license' ||
      norm === 'voter_id' ||
      name.includes('aadhaar') ||
      name.includes('pan card') ||
      name.includes('income tax') ||
      name.includes('driving license') ||
      name.includes('voter')
    ) {
      return false;
    }
    return true;
  });

  const hasDigilockerVerified =
    educationalDigiDocs.length > 0 ||
    qualifications.some((q) => q.isVerified === true && q.verificationStatus === 'verified' && q.degree !== 'DigiLocker Verified Academic Profile (NAD)') ||
    certifications.some((c) => c.isVerified === true && c.verificationStatus === 'verified');

  if (digilockerSyncLoading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #0c213d 0%, #07152B 100%)',
          color: '#ffffff',
        }}
      >
        <div
          className="text-center p-5 rounded-2xl shadow-lg position-relative"
          style={{
            maxWidth: '520px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 210, 148, 0.3)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 210, 148, 0.15)',
          }}
        >
          {/* Animated Pulse Icon */}
          <div className="position-relative d-inline-flex align-items-center justify-content-center mb-4">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '90px',
                height: '90px',
                background: 'linear-gradient(135deg, rgba(0, 210, 148, 0.2) 0%, rgba(0, 102, 255, 0.2) 100%)',
                border: '2px solid rgba(0, 210, 148, 0.5)',
              }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/23/DigiLocker.py.png"
                alt="DigiLocker"
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <span
              className="spinner-border text-teal position-absolute"
              style={{
                width: '108px',
                height: '108px',
                borderWidth: '3.5px',
                borderColor: '#00D294 transparent #00D294 transparent',
              }}
            />
          </div>

          <h4 className="font-weight-bold text-white mb-2" style={{ letterSpacing: '-0.3px' }}>
            Syncing DigiLocker Verified Documents
          </h4>
          <p className="mb-4 small" style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: '1.6' }}>
            Please wait a moment while we authenticate your educational records and update your <strong>EMPLOYIX Trust Score</strong>...
          </p>

          <div className="progress mb-3" style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #00D294 0%, #0066FF 100%)',
                borderRadius: '10px',
              }}
            />
          </div>

          <div className="d-flex align-items-center justify-content-center small" style={{ color: '#00D294', fontSize: '12.5px' }}>
            256-bit Encrypted Government NAD Sync
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`kyc-verification-container ${className}`}>
      <main className="flex-grow-1">
        {/* Top Hero Banner */}
        {showHeroBanner && (
          <div className="auth-top-banner text-center position-relative overflow-hidden py-4">
            <div className="patern-layer-one kyc-pattern-bg"></div>
            <div className="hero-glow-orb orb-teal" aria-hidden="true"></div>
            <div className="hero-glow-orb orb-blue" aria-hidden="true"></div>
            <div className="container position-relative py-2" style={{ zIndex: 2 }}>
              <h1 className="page-banner-title kyc-hero-title mb-1">
                Candidate Profile &amp; <span className="text-teal">KYC Verification</span>
              </h1>
              <p className="text-white-50 kyc-hero-subtitle mb-0">
                Complete your candidate details and official verifications to activate your Employix Trust Profile.
              </p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <section className="auth-section py-5 position-relative kyc-main-section">
          <div className="patern-layer-one kyc-pattern-bg"></div>
          <div className="container position-relative" style={{ zIndex: 3 }}>
            
            {/* STEP 1: Personal Profile, Designation & Photo Setup */}
            <div className="row justify-content-center mb-5" id="step-profile" style={{ position: 'relative', zIndex: 60 }}>
              <div className="col-lg-10">
                <div className="auth-card" style={{ position: 'relative', zIndex: 60 }}>
                  <div className="auth-card-header d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 1</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Candidate Profile &amp; Professional Designation</h3>
                        <p className="auth-card-sub small mb-0">Primary profile details, contact information &amp; avatar</p>
                      </div>
                    </div>
                    {profileSaved && (
                      <span className="badge badge-success px-3 py-2 font-weight-bold">
                        &#10003; PROFILE SAVED
                      </span>
                    )}
                  </div>

                  <div className="auth-card-body p-4 p-md-5">
                    <form onSubmit={handleSaveProfile} noValidate>
                    <div className="row align-items-center mb-4">
                      {/* Profile Photo Uploader */}
                      <div className="col-md-3 text-center mb-4 mb-md-0">
                        <div
                          className="setup-photo-wrap mb-2"
                          onClick={() => document.getElementById('photoUploadInput')?.click()}
                          style={{ cursor: 'pointer' }}
                          title="Click to upload or change profile photo"
                        >
                          {profilePhotoPreview ? (
                            <img
                              src={resolveImageUrl(profilePhotoPreview)}
                              onError={() => setProfilePhotoPreview(null)}
                              alt="Profile Avatar"
                              className="setup-photo-img"
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center text-white font-weight-bold mx-auto"
                              style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #022b3a 0%, #008060 100%)',
                                border: '3px solid #00D294',
                                fontSize: '2rem',
                              }}
                            >
                              {fullName ? fullName.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EX'}
                            </div>
                          )}
                          <label htmlFor="photoUploadInput" className="setup-photo-badge" title="Upload / Change Photo" onClick={(e) => e.stopPropagation()}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                              <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                          </label>
                          <input
                            type="file"
                            id="photoUploadInput"
                            accept={PROFILE_IMAGE_ACCEPT}
                            onChange={handlePhotoChange}
                            style={{ display: 'none' }}
                          />
                        </div>
                        <span className="small text-muted font-weight-bold d-block">
                          {profilePhotoPreview || user?.profileImage ? (
                            'Profile Photo'
                          ) : (
                            <>Upload Profile Photo <span className="text-danger">*</span></>
                          )}
                        </span>
                        <span className="d-block text-muted" style={{ fontSize: '0.74rem', marginTop: '2px', color: '#64748B' }}>
                          JPG, JPEG, PNG, WEBP, or HEIC (Max 5MB)
                        </span>
                        {profileErrors.photo && (
                          <small className="text-danger font-weight-bold mt-1 d-block" style={{ fontSize: '0.82rem' }}>
                            {profileErrors.photo}
                          </small>
                        )}
                      </div>

                      {/* Full Name & Details */}
                      <div className="col-md-9">
                        <div className="row g-3">
                          {/* Full Name */}
                          <div className="col-12 mb-3">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <label className="auth-label mb-0">
                                Full Name {aadhaarVerified ? '(Verified via Aadhaar)' : <><span className="text-danger">*</span></>}
                              </label>
                              {aadhaarVerified && (
                                <span className="badge badge-success px-2 py-1 font-weight-bold" style={{ fontSize: '0.74rem' }}>
                                  ✓ Aadhaar Verified (Locked)
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              className={`form-control auth-input-group px-3 py-2 ${
                                aadhaarVerified ? 'bg-light text-muted' : ''
                              } ${profileErrors.name ? 'is-invalid border-danger' : ''}`}
                              style={{
                                cursor: aadhaarVerified ? 'not-allowed' : 'text',
                                backgroundColor: aadhaarVerified ? '#f8fafc' : '#ffffff',
                                ...(profileErrors.name ? { borderColor: '#dc3545', boxShadow: '0 0 0 2px rgba(220,53,69,0.15)' } : {})
                              }}
                              value={fullName}
                              readOnly={Boolean(aadhaarVerified)}
                              disabled={Boolean(aadhaarVerified)}
                              onChange={(e) => {
                                if (aadhaarVerified) return;
                                setFullName(e.target.value.slice(0, 50));
                                if (profileErrors.name) {
                                  setProfileErrors((prev) => ({ ...prev, name: '' }));
                                }
                              }}
                              placeholder="e.g. Full Name"
                              title={aadhaarVerified ? 'Full Name is permanently locked as per verified Aadhaar card' : 'Enter your full name'}
                            />
                            {profileErrors.name && !aadhaarVerified && (
                              <small className="text-danger font-weight-bold mt-1 d-block" style={{ fontSize: '0.82rem' }}>
                                {profileErrors.name}
                              </small>
                            )}
                          </div>

                          {/* Email (Read-Only) */}
                          <div className="col-sm-6 mb-3">
                            <label className="auth-label">Email Address (Registered)</label>
                            <input
                              type="email"
                              className="form-control auth-input-group px-3 py-2 bg-light text-muted"
                              value={email}
                              readOnly
                              disabled
                              title="Email is linked to your account"
                            />
                          </div>

                          {/* Phone */}
                          <div className="col-sm-6 mb-3">
                            <label className="auth-label">
                              Mobile Number <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <div className="input-group-prepend">
                                <span className="input-group-text bg-light font-weight-bold text-dark border-right-0" style={{ borderRadius: '30px 0 0 30px' }}>
                                  +91
                                </span>
                              </div>
                              <input
                                type="tel"
                                className={`form-control auth-input-group px-3 ${profileErrors.phone ? 'is-invalid border-danger' : ''}`}
                                style={{
                                  borderRadius: '0 30px 30px 0',
                                  ...(profileErrors.phone ? { borderColor: '#dc3545', boxShadow: '0 0 0 2px rgba(220,53,69,0.15)' } : {})
                                }}
                                value={phone}
                                onChange={(e) => {
                                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                                  if (profileErrors.phone) {
                                    setProfileErrors((prev) => ({ ...prev, phone: '' }));
                                  }
                                }}
                                placeholder="9876543210"
                                maxLength={10}
                              />
                            </div>
                            {profileErrors.phone && (
                              <small className="text-danger font-weight-bold mt-1 d-flex align-items-center" style={{ fontSize: '0.84rem' }}>
                                {profileErrors.phone}
                              </small>
                            )}
                          </div>

                          {/* Designation */}
                          <div className="col-12 mb-3">
                            <label className="auth-label mb-1">
                              Professional Designation / Role <span className="text-danger">*</span>
                            </label>
                            <DesignationSelect
                              id="kyc-profile-designation"
                              value={designation}
                              onChange={(val) => {
                                setDesignation(val);
                                if (profileErrors.designation) {
                                  setProfileErrors((prev) => ({ ...prev, designation: '' }));
                                }
                              }}
                              error={profileErrors.designation}
                              placeholder="Select from categorized list or type role (e.g. Software Engineer, Product Manager)"
                              maxLength={60}
                            />
                            {profileErrors.designation && (
                              <small className="text-danger font-weight-bold mt-1 d-flex align-items-center" style={{ fontSize: '0.84rem' }}>
                                {profileErrors.designation}
                              </small>
                            )}
                          </div>
                        </div>

                        <div className="text-right mt-2">
                          <button
                            type="submit"
                            className="btn btn-primary-teal px-4 py-2 font-weight-bold"
                            disabled={profileSaving}
                            style={{ cursor: profileSaving ? 'not-allowed' : 'pointer' }}
                          >
                            {profileSaving ? (
                              <ButtonSpinner text="Saving Profile..." />
                            ) : profileSaved ? (
                              'Update Profile Details'
                            ) : (
                              'Save Profile Details'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Aadhaar Identity Verification (Number OR OCR) */}
            <div className="row justify-content-center mb-5" id="step-aadhaar">
              <div className="col-lg-10">
                <div className="auth-card">
                  <div className="auth-card-header d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 2</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Aadhaar Identity Verification</h3>
                        <p className="auth-card-sub small mb-0">Official UIDAI Identity Verification</p>
                      </div>
                    </div>

                    {aadhaarVerified ? (
                      <span className="badge badge-success px-3 py-2 font-weight-bold">
                        &#10003; AADHAAR VERIFIED
                      </span>
                    ) : (
                      <span className="badge badge-light text-muted px-3 py-2 font-weight-bold border">
                        Aadhaar Document OCR Upload
                      </span>
                    )}
                  </div>

                  <div className="auth-card-body p-4 p-md-5">
                    {aadhaarVerified ? (
                    <div className="p-4 rounded-lg bg-light border border-success">
                      <div className="d-flex align-items-center justify-content-between flex-wrap pb-3 mb-3 border-bottom">
                        <div className="d-flex align-items-center mb-2 mb-sm-0">
                          <div className="stat-icon-light bg-teal-light mr-3" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-white h4 mb-0 font-weight-bold">&#10003;</span>
                          </div>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-0">
                              Aadhaar Card Verified Successfully
                            </h6>
                            <span className="text-success small font-weight-bold">
                              Official UIDAI Document Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complete Extracted Aadhaar Details */}
                      <div className="row g-3 mt-1">
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Full Name</span>
                          <strong className="text-dark">{aadhaarResult?.name || fullName || 'Verified User'}</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Aadhaar Number</span>
                          <strong className="text-dark">{aadhaarResult?.maskedDocumentNumber || 'Verified'}</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Date of Birth (DOB)</span>
                          <strong className="text-dark">
                            {aadhaarResult?.dob
                              ? (typeof aadhaarResult.dob === 'string' && aadhaarResult.dob.includes('T')
                                  ? new Date(aadhaarResult.dob).toLocaleDateString('en-GB')
                                  : aadhaarResult.dob)
                              : 'Verified'}
                          </strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Gender</span>
                          <strong className="text-dark" style={{ textTransform: 'capitalize' }}>
                            {aadhaarResult?.gender || 'Verified'}
                          </strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Verification Method</span>
                          <strong className="text-teal">UIDAI OCR Scan</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Status</span>
                          <span className="badge badge-success px-2 py-1">Verified</span>
                        </div>
                        {(() => {
                          const displayAddr =
                            aadhaarResult?.address?.fullAddress ||
                            (typeof aadhaarResult?.address === 'string' && aadhaarResult.address.trim()) ||
                            null;
                          if (!displayAddr) return null;
                          return (
                            <div className="col-12 mt-2 pt-2 border-top">
                              <span className="text-muted small d-block">Aadhaar Registered Address</span>
                              <span className="text-dark font-weight-bold small">{displayAddr}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyAadhaarOcr}>
                      {/* Document Guidelines Header */}
                      <div className="kyc-upload-guide-banner mb-4 p-3 rounded-lg border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'rgba(0, 210, 148, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: '#00B880',
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="16" rx="2" />
                              <circle cx="9" cy="10" r="2" />
                              <line x1="15" y1="8" x2="17" y2="8" />
                              <line x1="15" y1="12" x2="17" y2="12" />
                              <line x1="7" y1="16" x2="17" y2="16" />
                            </svg>
                          </div>
                          <div>
                            <h6 className="font-weight-bold mb-0 text-dark kyc-banner-heading">
                              Aadhaar Card OCR Verification
                            </h6>
                            <p className="text-muted small mb-0 kyc-banner-subtext">
                              Upload front &amp; back images of your Aadhaar card for instant verification.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dual Upload Cards: Front and Back */}
                      <div className="row g-4 mb-4">
                        {/* FRONT SIDE CARD */}
                        <div className="col-md-6 mb-3 mb-md-0">
                          <div className="kyc-doc-card">
                            <div className="kyc-doc-card-header">
                              <div>
                                <span className="kyc-tag-pill kyc-badge-front mr-2">FRONT SIDE</span>
                                <span className="font-weight-bold text-dark small">Aadhaar Front *</span>
                              </div>
                              <span className="text-muted small kyc-text-xs">Photo &amp; Number</span>
                            </div>

                            <div className="kyc-doc-card-body">
                              <input
                                ref={aadhaarFrontInputRef}
                                type="file"
                                className="d-none"
                                accept={DOCUMENT_UPLOAD_ACCEPT}
                                onChange={(e) => {
                                  const f = e.target.files[0];
                                  if (f) {
                                    handleAadhaarFrontChange(f, e.target);
                                  }
                                }}
                              />

                              {!aadhaarFront ? (
                                <div
                                  className={`kyc-modern-dropzone ${dragActiveFront ? 'drag-active' : ''}`}
                                  onClick={() => aadhaarFrontInputRef.current?.click()}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActiveFront(true);
                                  }}
                                  onDragLeave={() => setDragActiveFront(false)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDragActiveFront(false);
                                    const f = e.dataTransfer.files[0];
                                    if (f) handleAadhaarFrontChange(f, aadhaarFrontInputRef.current);
                                  }}
                                >
                                  <div className="kyc-upload-icon-wrapper">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                  </div>
                                  <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                                    Upload Front Side
                                  </div>
                                  <div className="text-muted small mb-2">
                                    Drag &amp; drop or <span className="text-teal font-weight-bold">Browse file</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="badge badge-light border text-muted px-2 py-1 small">JPG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PNG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PDF &lt; 5MB</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="kyc-preview-container">
                                    {aadhaarFrontPreview === 'pdf' ? (
                                      <div className="kyc-preview-pdf">
                                        <div className="kyc-pdf-icon">
                                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                          </svg>
                                        </div>
                                        <strong className="text-white small text-center kyc-pdf-filename">
                                          {aadhaarFront.name}
                                        </strong>
                                        <span className="badge badge-teal px-2 py-1 mt-2 text-dark font-weight-bold small">PDF Document</span>
                                      </div>
                                    ) : (
                                      <img src={aadhaarFrontPreview} alt="Aadhaar Front Preview" className="kyc-preview-image" />
                                    )}
                                  </div>

                                  <div className="kyc-file-meta-bar">
                                    <div className="d-flex align-items-center overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                                      <span className="text-teal mr-2 font-weight-bold">✓</span>
                                      <div className="text-truncate" style={{ minWidth: 0 }}>
                                        <span className="text-dark font-weight-bold small d-block text-truncate" title={aadhaarFront.name}>
                                          {aadhaarFront.name}
                                        </span>
                                        <span className="text-muted small kyc-text-xs">
                                          {formatFileSize(aadhaarFront.size)} • Ready
                                        </span>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border py-1 px-2 text-dark small"
                                        onClick={() => aadhaarFrontInputRef.current?.click()}
                                        title="Change Front Document"
                                      >
                                        Change
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger py-1 px-2 small"
                                        onClick={handleRemoveAadhaarFront}
                                        title="Remove Front Document"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="text-muted small text-center mt-2 kyc-text-subtle">
                                Ensure Photo, Name &amp; Aadhaar number are clearly visible
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BACK SIDE CARD */}
                        <div className="col-md-6">
                          <div className="kyc-doc-card">
                            <div className="kyc-doc-card-header">
                              <div>
                                <span className="kyc-tag-pill kyc-badge-back mr-2">BACK SIDE</span>
                                <span className="font-weight-bold text-dark small">Aadhaar Back *</span>
                              </div>
                              <span className="text-muted small kyc-text-xs">Address &amp; QR Code</span>
                            </div>

                            <div className="kyc-doc-card-body">
                              <input
                                ref={aadhaarBackInputRef}
                                type="file"
                                className="d-none"
                                accept={DOCUMENT_UPLOAD_ACCEPT}
                                onChange={(e) => {
                                  const f = e.target.files[0];
                                  if (f) {
                                    handleAadhaarBackChange(f, e.target);
                                  }
                                }}
                              />

                              {!aadhaarBack ? (
                                <div
                                  className={`kyc-modern-dropzone ${dragActiveBack ? 'drag-active' : ''}`}
                                  onClick={() => aadhaarBackInputRef.current?.click()}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActiveBack(true);
                                  }}
                                  onDragLeave={() => setDragActiveBack(false)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDragActiveBack(false);
                                    const f = e.dataTransfer.files[0];
                                    if (f) handleAadhaarBackChange(f, aadhaarBackInputRef.current);
                                  }}
                                >
                                  <div className="kyc-upload-icon-wrapper">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                  </div>
                                  <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                                    Upload Back Side
                                  </div>
                                  <div className="text-muted small mb-2">
                                    Drag &amp; drop or <span className="text-teal font-weight-bold">Browse file</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="badge badge-light border text-muted px-2 py-1 small">JPG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PNG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PDF &lt; 5MB</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="kyc-preview-container">
                                    {aadhaarBackPreview === 'pdf' ? (
                                      <div className="kyc-preview-pdf">
                                        <div className="kyc-pdf-icon">
                                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                          </svg>
                                        </div>
                                        <strong className="text-white small text-center kyc-pdf-filename">
                                          {aadhaarBack.name}
                                        </strong>
                                        <span className="badge badge-teal px-2 py-1 mt-2 text-dark font-weight-bold small">PDF Document</span>
                                      </div>
                                    ) : (
                                      <img src={aadhaarBackPreview} alt="Aadhaar Back Preview" className="kyc-preview-image" />
                                    )}
                                  </div>

                                  <div className="kyc-file-meta-bar">
                                    <div className="d-flex align-items-center overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                                      <span className="text-teal mr-2 font-weight-bold">✓</span>
                                      <div className="text-truncate" style={{ minWidth: 0 }}>
                                        <span className="text-dark font-weight-bold small d-block text-truncate" title={aadhaarBack.name}>
                                          {aadhaarBack.name}
                                        </span>
                                        <span className="text-muted small kyc-text-xs">
                                          {formatFileSize(aadhaarBack.size)} • Ready
                                        </span>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border py-1 px-2 text-dark small"
                                        onClick={() => aadhaarBackInputRef.current?.click()}
                                        title="Change Back Document"
                                      >
                                        Change
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger py-1 px-2 small"
                                        onClick={handleRemoveAadhaarBack}
                                        title="Remove Back Document"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="text-muted small text-center mt-2 kyc-text-subtle">
                                Ensure Address &amp; QR code are clearly visible
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Short & Clean Consent Card */}
                      <div
                        className={`kyc-consent-card-modern mb-4 ${aadhaarConsent ? 'consented' : ''}`}
                        
                      >
                        <div className="form-check d-flex align-items-center m-0">
                          <input
                            type="checkbox"
                            id="aadhaarOcrConsent"
                            checked={aadhaarConsent}
                            onChange={(e) => setAadhaarConsent(e.target.checked)}
                            className="form-check-input mr-3 kyc-consent-input"
                          />
                          <label
                            htmlFor="aadhaarOcrConsent"
                            className="form-check-label mb-0 text-dark kyc-consent-label"
                          >
                            I authorize Employix to securely verify my identity and address details from my Aadhaar card for KYC verification.
                          </label>
                        </div>
                      </div>

                      {/* Submit Action Button */}
                      <button
                        type="submit"
                        className="btn btn-primary-teal btn-block py-3 font-weight-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                        disabled={aadhaarLoading || !aadhaarConsent || !aadhaarFront || !aadhaarBack}
                        style={{ fontSize: '0.98rem', letterSpacing: '0.01em', borderRadius: '10px' }}
                      >
                        {aadhaarLoading ? (
                          <ButtonSpinner text="Scanning &amp; Verifying Aadhaar..." />
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 7V4h3" />
                              <path d="M20 7V4h-3" />
                              <path d="M4 17v3h3" />
                              <path d="M20 17v3h-3" />
                              <line x1="4" y1="12" x2="20" y2="12" />
                            </svg>
                            <span>Scan &amp; Verify Aadhaar</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Address Proof via Voter ID Card */}
            <div className="row justify-content-center mb-5" id="step-voter">
              <div className="col-lg-10">
                <div className="auth-card">
                  <div className="auth-card-header d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 3</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Address Verification via Voter ID Card</h3>
                        <p className="auth-card-sub small mb-0">Election Commission of India (ECI) Residential Address Proof</p>
                      </div>
                    </div>

                    {voterVerified ? (
                      <span className="badge badge-success px-3 py-2 font-weight-bold">
                        &#10003; ADDRESS VERIFIED
                      </span>
                    ) : (
                      <div className="kyc-method-tabs d-flex">
                        <button
                          type="button"
                          className={`kyc-method-btn ${voterMethod === 'number' ? 'active' : ''}`}
                          onClick={() => {
                            setVoterMethod('number');
                            setVoterNumConsent(false);
                            setVoterOcrConsent(false);
                          }}
                        >
                          Voter ID Number
                        </button>
                        <button
                          type="button"
                          className={`kyc-method-btn ${voterMethod === 'ocr' ? 'active' : ''}`}
                          onClick={() => {
                            setVoterMethod('ocr');
                            setVoterNumConsent(false);
                            setVoterOcrConsent(false);
                          }}
                        >
                          Voter Card OCR Upload
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="auth-card-body p-4 p-md-5">

                  {voterVerified ? (
                    <div className="p-4 rounded-lg bg-light border border-success">
                      <div className="d-flex align-items-center justify-content-between flex-wrap pb-3 mb-3 border-bottom">
                        <div className="d-flex align-items-center mb-2 mb-sm-0">
                          <div className="stat-icon-light bg-teal-light mr-3" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-white h4 mb-0 font-weight-bold">&#10003;</span>
                          </div>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-0">
                              Voter ID &amp; Residential Address Verified
                            </h6>
                            <span className="text-success small font-weight-bold">
                              Official Election Commission of India (ECI) Record Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complete Extracted Voter ID Details */}
                      <div className="row g-3 mt-1">
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Full Name</span>
                          <strong className="text-dark">{voterResult?.name || fullName || 'Verified Voter'}</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Voter ID / EPIC Number</span>
                          <strong className="text-dark">{voterResult?.maskedDocumentNumber || voterNumber || 'WXD1****92'}</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Age / DOB</span>
                          <strong className="text-dark">
                            {voterResult?.age
                              ? `${voterResult.age} Years`
                              : (voterResult?.dob || 'Verified')}
                          </strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Gender</span>
                          <strong className="text-dark" style={{ textTransform: 'capitalize' }}>
                            {voterResult?.gender || 'Verified'}
                          </strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Verification Method</span>
                          <strong className="text-teal">
                            {voterResult?.verificationMethod === 'manual_number' ? 'ECI Online Record' : 'ECI Voter Card OCR'}
                          </strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Status</span>
                          <span className="badge badge-success px-2 py-1">Verified</span>
                        </div>
                        {(() => {
                          const displayAddr =
                            voterResult?.address?.fullAddress ||
                            (typeof voterResult?.address === 'string' && voterResult.address.trim()) ||
                            null;
                          if (!displayAddr) return null;
                          return (
                            <div className="col-12 mt-2 pt-2 border-top">
                              <span className="text-muted small d-block">Voter ID Residential Address</span>
                              <span className="text-dark font-weight-bold small">{displayAddr}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Voter Option 1: EPIC Number */}
                      {voterMethod === 'number' && (
                        <form onSubmit={handleVerifyVoterNumber}>
                          <div className="form-group mb-4">
                            <label className="auth-label">Voter ID / EPIC Number</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-3 font-weight-bold text-uppercase"
                              value={voterNumber}
                              onChange={handleVoterNumberChange}
                              placeholder="e.g. WXD1234567"
                              maxLength={10}
                              required
                            />
                            <small className="form-text text-muted">
                              Enter the 10-character alphanumeric EPIC code printed on your Voter Card.
                            </small>
                          </div>

                          <div className="kyc-consent-box p-3 rounded mb-4">
                            <div className="form-check d-flex align-items-start">
                              <input
                                className="form-check-input mt-1 mr-3"
                                type="checkbox"
                                id="voterNumConsent"
                                checked={voterNumConsent}
                                onChange={(e) => setVoterNumConsent(e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor="voterNumConsent">
                                <div className="kyc-consent-title">Address &amp; Voter Record Consent:</div>
                                <div className="kyc-consent-desc">
                                  I grant consent to verify my official residential address through the Election Commission of India database for EMPLOYIX credential verification.
                                </div>
                              </label>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary-teal btn-block py-3 font-weight-bold"
                            disabled={voterLoading || !voterNumConsent || !voterNumber.trim()}
                          >
                            {voterLoading ? <ButtonSpinner text="Verifying Voter ID & Address..." /> : 'Verify Voter ID Address'}
                          </button>
                        </form>
                      )}

                      {/* Voter Option 2: OCR Upload */}
                      {voterMethod === 'ocr' && (
                        <form onSubmit={handleVerifyVoterOcr}>
                          {/* Document Guidelines & Security Notice */}
                          <div className="p-3 mb-4 rounded-lg border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center">
                              <div
                                className="kyc-banner-icon-box"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="16" rx="2" />
                                  <circle cx="9" cy="10" r="2" />
                                  <line x1="15" y1="8" x2="17" y2="8" />
                                  <line x1="15" y1="12" x2="17" y2="12" />
                                  <line x1="7" y1="16" x2="17" y2="16" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h6 className="font-weight-bold mb-0 text-dark kyc-banner-heading">
                                  Voter ID Card OCR Verification
                                </h6>
                                <p className="text-muted small mb-0 kyc-banner-subtext">
                                  Upload front &amp; back images of your Voter ID card for instant verification.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Dual Upload Cards: Front and Back */}
                          <div className="row g-4 mb-4">
                            {/* FRONT SIDE CARD */}
                            <div className="col-md-6 mb-3 mb-md-0">
                              <div className="kyc-doc-card">
                                <div className="kyc-doc-card-header">
                                  <div>
                                    <span className="kyc-tag-pill kyc-badge-front mr-2">FRONT SIDE</span>
                                    <span className="font-weight-bold text-dark small">Voter Card Front *</span>
                                  </div>
                                  <span className="text-muted small kyc-text-xs">Photo &amp; Number</span>
                                </div>

                                <div className="kyc-doc-card-body">
                                  <input
                                    ref={voterFrontInputRef}
                                    type="file"
                                    className="d-none"
                                    accept={DOCUMENT_UPLOAD_ACCEPT}
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      if (f) {
                                        handleVoterFrontChange(f, e.target);
                                      }
                                    }}
                                  />

                                  {!voterFront ? (
                                    <div
                                      className={`kyc-modern-dropzone ${dragActiveVoterFront ? 'drag-active' : ''}`}
                                      onClick={() => voterFrontInputRef.current?.click()}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragActiveVoterFront(true);
                                      }}
                                      onDragLeave={() => setDragActiveVoterFront(false)}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        setDragActiveVoterFront(false);
                                        const f = e.dataTransfer.files[0];
                                        if (f) handleVoterFrontChange(f, voterFrontInputRef.current);
                                      }}
                                    >
                                      <div className="kyc-upload-icon-wrapper">
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                          <polyline points="17 8 12 3 7 8" />
                                          <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                      </div>
                                      <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>
                                        Upload Front Side
                                      </div>
                                      <div className="text-muted small mb-3">
                                        Drag &amp; drop or <span className="text-teal font-weight-bold">Browse file</span>
                                      </div>
                                      <div className="d-flex align-items-center gap-1">
                                        <span className="badge badge-light border text-muted px-2 py-1 small">JPG</span>
                                        <span className="badge badge-light border text-muted px-2 py-1 small">PNG</span>
                                        <span className="badge badge-light border text-muted px-2 py-1 small">PDF</span>
                                        <span className="badge badge-light border text-muted px-2 py-1 small">&lt; 5MB</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="kyc-preview-container">
                                        {voterFrontPreview === 'pdf' ? (
                                          <div className="kyc-preview-pdf">
                                            <div className="kyc-pdf-icon">
                                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                              </svg>
                                            </div>
                                            <strong className="text-white small text-center kyc-pdf-filename">
                                              {voterFront.name}
                                            </strong>
                                            <span className="badge badge-teal px-2 py-1 mt-2 text-dark font-weight-bold small">PDF Document</span>
                                          </div>
                                        ) : (
                                          <img src={voterFrontPreview} alt="Voter Front Preview" className="kyc-preview-image" />
                                        )}
                                      </div>

                                      <div className="kyc-file-meta-bar">
                                        <div className="d-flex align-items-center overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                                          <span className="text-teal mr-2 font-weight-bold">✓</span>
                                          <div className="text-truncate" style={{ minWidth: 0 }}>
                                            <span className="text-dark font-weight-bold small d-block text-truncate" title={voterFront.name}>
                                              {voterFront.name}
                                            </span>
                                            <span className="text-muted small kyc-text-xs">
                                              {formatFileSize(voterFront.size)} • Ready
                                            </span>
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light border py-1 px-2 text-dark small"
                                            onClick={() => voterFrontInputRef.current?.click()}
                                            title="Change Front Document"
                                          >
                                            Change
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger py-1 px-2 small"
                                            onClick={handleRemoveVoterFront}
                                            title="Remove Front Document"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-muted small text-center mt-2 kyc-text-subtle">
                                    Ensure Photo, Name &amp; EPIC number are clearly visible
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* BACK SIDE CARD */}
                            <div className="col-md-6">
                              <div className="kyc-doc-card">
                                <div className="kyc-doc-card-header">
                                  <div>
                                    <span className="kyc-tag-pill kyc-badge-back mr-2">BACK SIDE</span>
                                    <span className="font-weight-bold text-dark small">Voter Card Back *</span>
                                  </div>
                                  <span className="text-muted small kyc-text-xs">Address Details</span>
                                </div>

                                <div className="kyc-doc-card-body">
                                  <input
                                    ref={voterBackInputRef}
                                    type="file"
                                    className="d-none"
                                    accept={DOCUMENT_UPLOAD_ACCEPT}
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      if (f) {
                                        handleVoterBackChange(f, e.target);
                                      }
                                    }}
                                  />

                                  {!voterBack ? (
                                    <div
                                      className={`kyc-modern-dropzone ${dragActiveVoterBack ? 'drag-active' : ''}`}
                                      onClick={() => voterBackInputRef.current?.click()}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragActiveVoterBack(true);
                                      }}
                                      onDragLeave={() => setDragActiveVoterBack(false)}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        setDragActiveVoterBack(false);
                                        const f = e.dataTransfer.files[0];
                                        if (f) handleVoterBackChange(f, voterBackInputRef.current);
                                      }}
                                    >
                                      <div className="kyc-upload-icon-wrapper">
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                          <polyline points="17 8 12 3 7 8" />
                                          <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                      </div>
                                      <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>
                                        Upload Back Side
                                      </div>
                                      <div className="text-muted small mb-3">
                                        Drag &amp; drop or <span className="text-teal font-weight-bold">Browse file</span>
                                      </div>
                                      <div className="d-flex align-items-center gap-1">
                                        <span className="badge badge-light border text-muted px-2 py-1 small">JPG</span>
                                        <span className="badge badge-light border text-muted px-2 py-1 small">PNG</span>
                                        <span className="badge badge-light border text-muted px-2 py-1 small">PDF</span>
                                        <span className="badge badge-light border text-muted px-2 py-1 small">&lt; 5MB</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="kyc-preview-container">
                                        {voterBackPreview === 'pdf' ? (
                                          <div className="kyc-preview-pdf">
                                            <div className="kyc-pdf-icon">
                                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                              </svg>
                                            </div>
                                            <strong className="text-white small text-center kyc-pdf-filename">
                                              {voterBack.name}
                                            </strong>
                                            <span className="badge badge-teal px-2 py-1 mt-2 text-dark font-weight-bold small">PDF Document</span>
                                          </div>
                                        ) : (
                                          <img src={voterBackPreview} alt="Voter Back Preview" className="kyc-preview-image" />
                                        )}
                                      </div>

                                      <div className="kyc-file-meta-bar">
                                        <div className="d-flex align-items-center overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                                          <span className="text-teal mr-2 font-weight-bold">✓</span>
                                          <div className="text-truncate" style={{ minWidth: 0 }}>
                                            <span className="text-dark font-weight-bold small d-block text-truncate" title={voterBack.name}>
                                              {voterBack.name}
                                            </span>
                                            <span className="text-muted small kyc-text-xs">
                                              {formatFileSize(voterBack.size)} • Ready
                                            </span>
                                          </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light border py-1 px-2 text-dark small"
                                            onClick={() => voterBackInputRef.current?.click()}
                                            title="Change Back Document"
                                          >
                                            Change
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger py-1 px-2 small"
                                            onClick={handleRemoveVoterBack}
                                            title="Remove Back Document"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-muted small text-center mt-2 kyc-text-subtle">
                                    Ensure Address &amp; Assembly details are clearly visible
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Short & Clean Consent Card */}
                          <div
                            className={`kyc-consent-card-modern mb-4 ${voterOcrConsent ? 'consented' : ''}`}
                            
                          >
                            <div className="form-check d-flex align-items-center m-0">
                              <input
                                type="checkbox"
                                id="voterOcrConsent"
                                checked={voterOcrConsent}
                                onChange={(e) => setVoterOcrConsent(e.target.checked)}
                                className="form-check-input mr-3 kyc-consent-input"
                              />
                              <label
                                htmlFor="voterOcrConsent"
                                className="form-check-label mb-0 text-dark kyc-consent-label"
                              >
                                I authorize Employix to securely verify my identity and address details from my Voter ID card for KYC verification.
                              </label>
                            </div>
                          </div>

                          {/* Submit Action Button */}
                          <button
                            type="submit"
                            className="btn btn-primary-teal btn-block py-3 font-weight-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                            disabled={voterLoading || !voterOcrConsent || !voterFront || !voterBack}
                            style={{ fontSize: '1rem', letterSpacing: '0.02em', borderRadius: '10px' }}
                          >
                            {voterLoading ? (
                              <ButtonSpinner text="Scanning &amp; Extracting Voter Card Details (AI OCR)..." />
                            ) : (
                              <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 7V4h3" />
                                  <path d="M20 7V4h-3" />
                                  <path d="M4 17v3h3" />
                                  <path d="M20 17v3h-3" />
                                  <line x1="4" y1="12" x2="20" y2="12" />
                                </svg>
                                <span>Scan &amp; Verify Voter Card (OCR)</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: Employment Verification */}
            <div className="row justify-content-center mb-5" id="step-employment">
              <div className="col-lg-10">
                <div className="auth-card">
                  <div className="auth-card-header d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 4</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Employment Verification</h3>
                        <p className="auth-card-sub small mb-0">Add employment history via UAN Number, EPFO Mobile, or manually (+{scoreConfig.employmentScore ?? 30} Points)</p>
                      </div>
                    </div>
                    {epfoRecords.length > 0 ? (
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-success px-3 py-2 font-weight-bold">
                          &#10003; EPFO VERIFIED
                        </span>
                      </div>
                    ) : manualJobs.length > 0 ? (
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge px-3 py-2 font-weight-bold" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                          SELF-REPORTED (NOT VERIFIED)
                        </span>
                      </div>
                    ) : (
                      <span className="badge badge-warning px-3 py-2 font-weight-bold">
                        PENDING STEP 4
                      </span>
                    )}
                  </div>

                  <div className="auth-card-body p-4 p-md-5">

                    {/* Clean Minimalist Mode Selector Toggle */}
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-weight-bold text-dark" style={{ fontSize: '1rem' }}>
                            Employment Method
                          </span>
                          {empMethod === 'uan' && epfoRecords.length > 0 && (
                            <span className="kyc-badge-verified">✓ EPFO Authenticated</span>
                          )}
                        </div>
                      </div>

                      {/* Sleek Switcher Toggle */}
                      <div
                        className="d-inline-flex p-1 flex-shrink-0"
                        style={{
                          background: '#F1F5F9',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <button
                          type="button"
                          className={`kyc-method-btn ${empMethod === 'uan' ? 'active-digilocker' : 'inactive'}`}
                          style={{ padding: '6px 14px', fontSize: '12.5px' }}
                          onClick={() => {
                            setEmpMethod('uan');
                            setEmpConsent(false);
                          }}
                        >
                          <span>UAN / EPFO Lookup</span>
                          {epfoRecords.length > 0 && (
                            <span
                              style={{
                                background: '#ECFDF5',
                                color: '#047857',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                marginLeft: '6px',
                              }}
                            >
                              ✓ Verified
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          className={`kyc-method-btn ${empMethod === 'manual' ? 'active-manual' : 'inactive'}`}
                          style={{ padding: '6px 14px', fontSize: '12.5px' }}
                          onClick={() => {
                            setEmpMethod('manual');
                            setEmpConsent(false);
                          }}
                        >
                          <span>Manual Entry</span>
                        </button>
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════
                        OPTION 1: UAN / EPFO AUTHENTICATION
                        ═══════════════════════════════════════════════════════════ */}
                    {empMethod === 'uan' && (
                      <div className="mb-4">
                        {/* If EPFO records exist */}
                        {epfoRecords.length > 0 ? (
                          <div className="mb-4">
                            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                              <h6 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
                                Verified Employment History (EPFO Authenticated)
                              </h6>
                            </div>

                            <div style={{ borderLeft: '3px solid #00D294', paddingLeft: '1rem' }}>
                              {epfoRecords.map((epfo, i) => {
                                const recordsToDisplay = Array.isArray(epfo.records) ? epfo.records : (epfo.employerName ? [epfo] : []);
                                return recordsToDisplay.map((rec, j) => {
                                  const empCandidateName = rec.name || epfo.name || fullName || user?.name || '';
                                  const isCurrentEmp = Boolean(rec.isCurrent || !rec.exitDate || rec.exitDate === 'Present');
                                  return (
                                    <div
                                      key={`epfo-${i}-${j}`}
                                      className="p-3 mb-3 rounded border"
                                      style={{
                                        background: 'linear-gradient(135deg, rgba(0,210,148,0.04) 0%, rgba(2,12,31,0.02) 100%)',
                                        borderColor: 'rgba(0,210,148,0.22)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                      }}
                                    >
                                      <div className="d-flex align-items-start justify-content-between flex-wrap">
                                        <div className="d-flex align-items-start flex-grow-1">
                                          <div
                                            className="stat-icon-light bg-teal-light mr-3 mt-1 d-flex align-items-center justify-content-center"
                                            style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px' }}
                                          >
                                            <span className="text-white font-weight-bold" style={{ fontSize: '16px' }}>&#10003;</span>
                                          </div>
                                          <div className="flex-grow-1">
                                            <div className="d-flex align-items-center flex-wrap justify-content-between mb-1">
                                              <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '15px' }}>
                                                {rec.employerName}
                                              </h6>
                                            </div>

                                            <div className="mt-2 pt-2 border-top" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                                              <div className="row no-gutters">
                                                {empCandidateName && (
                                                  <div className="col-12 col-md-6 mb-2 pr-md-2">
                                                    <div className="d-flex align-items-center">
                                                      <span className="text-muted small mr-2">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                                                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                          <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                        Employee Name:
                                                      </span>
                                                      <span className="font-weight-bold text-dark small" style={{ letterSpacing: '0.2px' }}>
                                                        {empCandidateName}
                                                      </span>
                                                    </div>
                                                  </div>
                                                )}

                                                {rec.memberId && (
                                                  <div className="col-12 col-md-6 mb-2">
                                                    <div className="d-flex align-items-center">
                                                      <span className="text-muted small mr-2">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                                                          <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                                                          <line x1="7" y1="8" x2="17" y2="8"></line>
                                                          <line x1="7" y1="12" x2="13" y2="12"></line>
                                                        </svg>
                                                        Member ID:
                                                      </span>
                                                      <code className="small font-weight-bold" style={{ color: '#00875A', background: 'rgba(0,210,148,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                                                        {rec.memberId}
                                                      </code>
                                                    </div>
                                                  </div>
                                                )}

                                                <div className="col-12 col-md-6 mb-2 pr-md-2">
                                                  <div className="d-flex align-items-center">
                                                    <span className="text-muted small mr-2">
                                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                      </svg>
                                                      Period:
                                                    </span>
                                                    <span className="text-dark font-weight-500 small">
                                                      {rec.joiningDate || 'N/A'} &mdash; {rec.exitDate || <span className="text-teal font-weight-bold">Present</span>}
                                                    </span>
                                                  </div>
                                                </div>

                                                {rec.guardian && (
                                                  <div className="col-12 col-md-6 mb-2">
                                                    <div className="d-flex align-items-center">
                                                      <span className="text-muted small mr-2">Father / Guardian:</span>
                                                      <span className="text-dark font-weight-500 small">{rec.guardian}</span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="mt-1 d-flex align-items-center flex-wrap">
                                              <span className="badge badge-success px-2 py-1 mr-2" style={{ fontSize: '10px', fontWeight: 600 }}>
                                                &#10003; EPFO Authenticated
                                              </span>
                                              {isCurrentEmp && (
                                                <span
                                                  className="badge px-2 py-1"
                                                  style={{
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    background: 'rgba(0,210,148,0.15)',
                                                    color: '#00875A',
                                                    border: '1px solid rgba(0,210,148,0.3)',
                                                  }}
                                                >
                                                  Active Employment
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })}
                            </div>

                            {/* If manual jobs also exist, show them clearly as Self-Reported */}
                            {manualJobs.length > 0 && (
                              <div className="mt-4 pt-3 border-top">
                                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                  <h6 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
                                    Additional Manual Experience ({manualJobs.length})
                                  </h6>
                                </div>
                                <div className="d-flex flex-column gap-2 mb-3">
                                  {manualJobs.map((job) => (
                                    <div
                                      key={job._id}
                                      className="p-3 rounded-3"
                                      style={{
                                        background: '#FFFFFF',
                                        border: '1.5px solid #E2E8F0',
                                        borderLeft: '4px solid #F59E0B',
                                      }}
                                    >
                                      <div className="d-flex align-items-start justify-content-between">
                                        <div className="d-flex align-items-start" style={{ flex: 1, minWidth: 0 }}>
                                          <div
                                            className="mr-3 mt-1 d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{
                                              width: '32px',
                                              height: '32px',
                                              borderRadius: '8px',
                                              background: '#FEF3C7',
                                              color: '#B45309',
                                              fontSize: '14px',
                                            }}
                                          >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                                              <h6 className="font-weight-bold text-dark mb-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{job.designation}</h6>
                                              {job.isCurrent && (
                                                <span className="badge badge-success px-2 py-0.5" style={{ fontSize: '10px' }}>Active</span>
                                              )}
                                            </div>
                                            <div className="font-weight-600 small" style={{ color: '#475569', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{job.companyName}</div>
                                            <small className="text-muted d-block mt-0.5">
                                              {formatMonthYear(job.startDate)} &mdash; {job.isCurrent ? <span className="text-success font-weight-bold">Present</span> : (formatMonthYear(job.endDate) || '—')}
                                            </small>
                                            {job.description && (
                                              <p className="small text-muted mt-2 mb-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                {job.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        {!isSetupCompleted && kycStatus !== 8 && (
                                          <button
                                            type="button"
                                            className="item-delete-btn-danger ml-3 flex-shrink-0"
                                            onClick={() => handleDeleteJob(job._id)}
                                            title="Delete record"
                                            aria-label="Delete record"
                                          >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                      </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Option to also add manual experience alongside UAN */}
                            <div
                              className="mt-3 d-flex align-items-center justify-content-between p-3 rounded-3 flex-wrap gap-2"
                              style={{
                                background: '#F0FDF4',
                                border: '1.5px solid #BBF7D0',
                              }}
                            >
                              <div>
                                <strong className="small d-block font-weight-bold" style={{ color: '#166534' }}>
                                  Add additional past or current experience?
                                </strong>
                                <span className="small" style={{ color: '#15803D' }}>
                                  You can add non-EPFO companies or freelance work manually to your profile.
                                </span>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary-teal font-weight-bold flex-shrink-0 shadow-sm"
                                style={{ borderRadius: '8px', padding: '6px 14px' }}
                                onClick={() => {
                                  setEmpMethod('manual');
                                  setShowJobForm(true);
                                }}
                              >
                                + Add Manual Experience
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* If no EPFO records yet, check if there are manual jobs to display */
                          <>
                            {manualJobs.length > 0 && (
                              <div className="mb-4">
                                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                  <h6 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
                                    Manual Experience Records ({manualJobs.length})
                                  </h6>
                                </div>
                                <div className="d-flex flex-column gap-2 mb-3">
                                  {manualJobs.map((job) => (
                                    <div
                                      key={job._id}
                                      className="p-3 rounded-3"
                                      style={{
                                        background: '#FFFFFF',
                                        border: '1.5px solid #E2E8F0',
                                        borderLeft: '4px solid #F59E0B',
                                      }}
                                    >
                                      <div className="d-flex align-items-start justify-content-between">
                                        <div className="d-flex align-items-start" style={{ flex: 1, minWidth: 0 }}>
                                          <div
                                            className="mr-3 mt-1 d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{
                                              width: '32px',
                                              height: '32px',
                                              borderRadius: '8px',
                                              background: '#FEF3C7',
                                              color: '#B45309',
                                              fontSize: '14px',
                                            }}
                                          >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                                              <h6 className="font-weight-bold text-dark mb-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{job.designation}</h6>
                                              {job.isCurrent && (
                                                <span className="badge badge-success px-2 py-0.5" style={{ fontSize: '10px' }}>Active</span>
                                              )}
                                            </div>
                                            <div className="font-weight-600 small" style={{ color: '#475569', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{job.companyName}</div>
                                            <small className="text-muted d-block mt-0.5">
                                              {formatMonthYear(job.startDate)} &mdash; {job.isCurrent ? <span className="text-success font-weight-bold">Present</span> : (formatMonthYear(job.endDate) || '—')}
                                            </small>
                                            {job.description && (
                                              <p className="small text-muted mt-2 mb-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                {job.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        {!isSetupCompleted && kycStatus !== 8 && (
                                          <button
                                            type="button"
                                            className="item-delete-btn-danger ml-3 flex-shrink-0"
                                            onClick={() => handleDeleteJob(job._id)}
                                            title="Delete record"
                                            aria-label="Delete record"
                                          >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                      </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                  {/* Option A1: UAN Number Lookup Form (when EPFO not yet verified and on UAN tab) */}
                  {epfoRecords.length === 0 && empMethod === 'uan' && (
                    <form onSubmit={handleFetchUan}>
                      <div className="form-group mb-3">
                        <label className="auth-label">12-Digit Universal Account Number (UAN) *</label>
                        <div className="input-group">
                          <div className="input-group-prepend">
                            <span className="input-group-text bg-light font-weight-bold" style={{ borderRadius: '30px 0 0 30px' }}>UAN</span>
                          </div>
                          <input
                            type="text"
                            className="form-control auth-input-group px-3"
                            style={{ borderRadius: '0 30px 30px 0' }}
                            value={uanNumber}
                            onChange={(e) => setUanNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                            placeholder="Enter 12-digit UAN (e.g. 101234567890)"
                            maxLength={12}
                            required
                          />
                        </div>
                        <small className="text-muted">Enter your official 12-digit UAN linked to EPFO to fetch your authenticated employment history records.</small>
                      </div>
                      <div className="kyc-consent-box p-3 rounded mb-4">
                        <div className="form-check d-flex align-items-start">
                          <input className="form-check-input mt-1 mr-3" type="checkbox" id="empUanConsent" checked={empConsent} onChange={(e) => setEmpConsent(e.target.checked)} />
                          <label className="form-check-label" htmlFor="empUanConsent">
                            <div className="kyc-consent-title">Employment Verification Consent:</div>
                            <div className="kyc-consent-desc">I grant consent to fetch my employment history via UAN from EPFO records for Employix Trust Score verification.</div>
                          </label>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary-teal btn-block py-3 font-weight-bold" disabled={empLoading || !empConsent || uanNumber.length < 12}>
                        {empLoading ? <ButtonSpinner text="Fetching UAN Records..." /> : 'Fetch Employment History via UAN'}
                      </button>
                    </form>
                  )}

                  {/* Option A2: EPFO Mobile Option */}
                  {!employmentVerified && empMethod === 'mobile' && (
                    <form onSubmit={handleFetchEpfo}>
                      <div className="form-group mb-3">
                        <label className="auth-label">Mobile Number Linked to EPFO / UAN</label>
                        <div className="input-group">
                          <div className="input-group-prepend">
                            <span className="input-group-text bg-light font-weight-bold" style={{ borderRadius: '30px 0 0 30px' }}>+91</span>
                          </div>
                          <input
                            type="tel"
                            className="form-control auth-input-group px-3"
                            style={{ borderRadius: '0 30px 30px 0' }}
                            value={empMobile}
                            onChange={(e) => setEmpMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="Mobile number linked to EPFO"
                            maxLength={10}
                            required
                          />
                        </div>
                        <small className="text-muted">This should be the mobile number registered with your EPFO/UAN account.</small>
                      </div>
                      <div className="kyc-consent-box p-3 rounded mb-4">
                        <div className="form-check d-flex align-items-start">
                          <input className="form-check-input mt-1 mr-3" type="checkbox" id="empConsent" checked={empConsent} onChange={(e) => setEmpConsent(e.target.checked)} />
                          <label className="form-check-label" htmlFor="empConsent">
                            <div className="kyc-consent-title">Employment Verification Consent:</div>
                            <div className="kyc-consent-desc">I grant consent to fetch my employment history from EPFO records for Employix Trust Score verification.</div>
                          </label>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary-teal btn-block py-3 font-weight-bold" disabled={empLoading || !empConsent || empMobile.length < 10}>
                        {empLoading ? <ButtonSpinner text="Fetching EPFO Records..." /> : 'Fetch EPFO Employment History'}
                      </button>
                    </form>
                  )}

                  {/* Manual Option */}
                  {empMethod === 'manual' && (
                    <div>
                      {/* Self-Reported Disclaimer Alert */}
                      <div
                        className="p-3 mb-4 rounded-3"
                        style={{
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          color: '#92400E',
                          fontSize: '13px',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Self-Reported (0 Points):</strong> Manual entries do not add to your verified Trust Score. For official +30 verified points, please verify using <strong>UAN / EPFO Lookup</strong>.
                      </div>

                      {/* Existing Manual Jobs List */}
                      {manualJobs.length > 0 && (
                        <div className="mb-4">
                          <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center">
                            Manual Experience Records ({manualJobs.length})
                          </h6>
                          <div className="d-flex flex-column gap-3">
                            {manualJobs.map((job) => (
                              <div
                                key={job._id}
                                className="p-3 rounded-3"
                                style={{
                                  background: '#FFFFFF',
                                  border: '1.5px solid #E2E8F0',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                  borderLeft: '4px solid #00D294',
                                }}
                              >
                                <div className="d-flex align-items-start justify-content-between">
                                  <div className="d-flex align-items-start" style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                                        <h6 className="font-weight-bold text-dark mb-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{job.designation}</h6>
                                        {job.isCurrent && (
                                          <span className="badge badge-success px-2 py-1" style={{ fontSize: '10px' }}>Active</span>
                                        )}
                                      </div>
                                      <div className="font-weight-600 small" style={{ color: '#475569', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{job.companyName}</div>
                                      <small className="text-muted d-block mt-0.5">
                                        {formatMonthYear(job.startDate)} &mdash; {job.isCurrent ? <span className="text-success font-weight-bold">Present</span> : (formatMonthYear(job.endDate) || '—')}
                                      </small>
                                      {job.description && (
                                        <p className="small text-muted mt-2 mb-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                          {job.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {!isSetupCompleted && kycStatus !== 8 && (
                                    <button
                                            type="button"
                                            className="item-delete-btn-danger ml-3 flex-shrink-0"
                                            onClick={() => handleDeleteJob(job._id)}
                                            title="Delete record"
                                            aria-label="Delete record"
                                          >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                      </svg>
                                          </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!showJobForm ? (
                        <div className="text-center py-4 px-3 bg-light rounded-3 border">
                          <p className="text-muted mb-3 font-weight-500">
                            {manualJobs.length > 0
                              ? `You have added ${manualJobs.length} manual employment record(s).`
                              : 'No manual employment records added yet. Add your current or previous job details manually.'}
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary-teal px-4 py-2 font-weight-bold shadow-sm"
                            style={{ borderRadius: '10px' }}
                            onClick={() => setShowJobForm(true)}
                          >
                            + Add Employment Record
                          </button>
                        </div>
                      ) : (
                        <div
                          className="p-3 p-md-4 rounded-3 border bg-white shadow-sm my-2"
                          style={{ borderColor: '#e2e8f0' }}
                        >
                          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '10px',
                                  background: '#FEF3C7',
                                  color: '#B45309',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '18px',
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </div>
                              <div>
                                <h6 className="mb-0 font-weight-bold text-dark" style={{ fontSize: '15px' }}>
                                  Add Employment Record
                                </h6>
                              </div>
                            </div>
                          </div>

                          <form onSubmit={handleAddManualJob}>
                            <div className="row g-3">
                              {/* Company Name */}
                              <div className="col-md-6 mb-3">
                                <label className="auth-label font-weight-bold small mb-1 d-flex align-items-center gap-1">
                                  <span>Company / Organization Name</span>
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control auth-input-group px-3"
                                  style={{ height: '42px', borderRadius: '10px', fontSize: '14px' }}
                                  placeholder="e.g. TechCorp Solutions Pvt Ltd"
                                  maxLength={80}
                                  value={jobForm.companyName}
                                  onChange={(e) =>
                                    setJobForm((p) => ({ ...p, companyName: e.target.value.slice(0, 80) }))
                                  }
                                  required
                                />
                              </div>

                              {/* Designation */}
                              <div className="col-md-6 mb-3">
                                <label className="auth-label font-weight-bold small mb-1 d-flex align-items-center gap-1">
                                  <span>Designation / Role</span>
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control auth-input-group px-3"
                                  style={{ height: '42px', borderRadius: '10px', fontSize: '14px' }}
                                  placeholder="e.g. Senior Software Engineer"
                                  maxLength={60}
                                  value={jobForm.designation}
                                  onChange={(e) => {
                                    e.target.setCustomValidity('');
                                    setJobForm((p) => ({ ...p, designation: e.target.value.slice(0, 60) }));
                                  }}
                                  onInvalid={(e) => e.target.setCustomValidity('Designation / Role is required.')}
                                  required
                                />
                              </div>

                              {/* Start Date */}
                              <div className="col-md-6 mb-3">
                                <label className="auth-label font-weight-bold small mb-1 d-flex align-items-center gap-1">
                                  <span>Start Date</span>
                                  <span className="text-danger">*</span>
                                </label>
                                <div className="row g-2">
                                  <div className="col-7">
                                    <select
                                      className="form-control font-weight-bold kyc-filter-select auth-input-group px-2"
                                      value={jobStartMonth}
                                      onChange={(e) => handleJobStartMonth(e.target.value)}
                                      required
                                    >
                                      <option value="">Select Month</option>
                                      {MONTH_OPTIONS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                          {m.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="col-5">
                                    <select
                                      className="form-control font-weight-bold kyc-filter-select auth-input-group px-2"
                                      value={jobStartYear}
                                      onChange={(e) => handleJobStartYear(e.target.value)}
                                      required
                                    >
                                      <option value="">Select Year</option>
                                      {YEAR_OPTIONS.map((yr) => (
                                        <option key={yr} value={yr}>
                                          {yr}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* End Date */}
                              <div className="col-md-6 mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <label className="auth-label font-weight-bold small mb-0 d-flex align-items-center gap-1">
                                    <span>End Date</span>
                                  </label>
                                  <div className="form-check form-switch m-0 d-flex align-items-center gap-1">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="isCurrentJob"
                                      checked={jobForm.isCurrent}
                                      onChange={(e) =>
                                        setJobForm((p) => ({
                                          ...p,
                                          isCurrent: e.target.checked,
                                          endDate: '',
                                        }))
                                      }
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <label
                                      className="form-check-label small font-weight-bold text-success"
                                      htmlFor="isCurrentJob"
                                      style={{ cursor: 'pointer' }}
                                    >
                                      Current Job
                                    </label>
                                  </div>
                                </div>

                                {jobForm.isCurrent ? (
                                  <div
                                    className="d-flex align-items-center justify-content-between px-3 rounded-3"
                                    style={{
                                      height: '42px',
                                      borderRadius: '10px',
                                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                                      border: '1.5px solid #86efac',
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        style={{
                                          width: '18px',
                                          height: '18px',
                                          borderRadius: '50%',
                                          background: '#10b981',
                                          color: '#fff',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        ✓
                                      </span>
                                      <span className="small font-weight-bold text-success">
                                        Present / Currently Working Here
                                      </span>
                                    </div>
                                    <span className="badge bg-white text-success border border-success px-2 py-1 small">
                                      Active
                                    </span>
                                  </div>
                                ) : (
                                  <div className="row g-2">
                                    <div className="col-7">
                                      <select
                                        className="form-control font-weight-bold kyc-filter-select"
                                        value={jobEndMonth}
                                        onChange={(e) => handleJobEndMonth(e.target.value)}
                                      >
                                        <option value="">Select Month</option>
                                        {MONTH_OPTIONS.map((m) => (
                                          <option key={m.value} value={m.value}>
                                            {m.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-5">
                                      <select
                                        className="form-control font-weight-bold kyc-filter-select"
                                        value={jobEndYear}
                                        onChange={(e) => handleJobEndYear(e.target.value)}
                                      >
                                        <option value="">Select Year</option>
                                        {YEAR_OPTIONS.map((yr) => (
                                          <option key={yr} value={yr}>
                                            {yr}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              <div className="col-12 mb-3">
                                <label className="auth-label font-weight-bold small mb-1 d-flex align-items-center gap-1">
                                  <span>Job Description</span>
                                  <span className="text-muted fw-normal small">(optional)</span>
                                </label>
                                <textarea
                                  className="form-control auth-input-group px-3 py-2"
                                  style={{ borderRadius: '10px', fontSize: '14px' }}
                                  rows={2}
                                  placeholder="Brief description of your role, key projects, and responsibilities"
                                  maxLength={400}
                                  value={jobForm.description}
                                  onChange={(e) =>
                                    setJobForm((p) => ({ ...p, description: e.target.value.slice(0, 400) }))
                                  }
                                />
                              </div>
                            </div>

                            {/* Buttons */}
                            <div className="d-flex gap-2 justify-content-end align-items-center mt-2 pt-2 border-top">
                              <button
                                type="button"
                                className="btn btn-outline-dark-custom px-4 py-2"
                                style={{ borderRadius: '10px' }}
                                onClick={() => setShowJobForm(false)}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="btn btn-primary-teal px-4 py-2 font-weight-bold"
                                style={{ borderRadius: '10px' }}
                                disabled={jobFormLoading}
                              >
                                {jobFormLoading ? <ButtonSpinner text="Saving..." /> : 'Save Employment Record'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 5: Professional Reference Verification Section */}
            <div className="row justify-content-center mb-5" id="step-references">
              <div className="col-lg-10">
                <ProfessionalReferenceSection
                  isSetupCompleted={isSetupCompleted}
                  initialReferences={userReferences}
                  initialRewardPoints={rewardPoints}
                  onReferenceUpdated={(updatedRefs, updatedPoints) => {
                    setUserReferences(updatedRefs);
                    if (typeof updatedPoints === 'number') {
                      setRewardPoints(updatedPoints);
                    }
                    fetchInitialData();
                  }}
                />
              </div>
            </div>

            {/* STEP 6: Educational Qualifications & Professional Certifications */}
            <div className="row justify-content-center mb-5" id="step-education">
              <div className="col-lg-10">
                <div className="auth-card">
                  <div className="auth-card-header d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 6</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Educational Qualifications &amp; Professional Certifications</h3>
                        <p className="auth-card-sub small mb-0">Add academic degrees and vendor certifications with document proof (+{scoreConfig.educationScore ?? 20} Points)</p>
                      </div>
                    </div>

                    {(qualifications.length > 0 || certifications.length > 0 || educationalDigiDocs.length > 0) ? (
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge badge-success px-3 py-2 font-weight-bold">
                          &#10003; {educationalDigiDocs.length > 0
                            ? `${educationalDigiDocs.length} Verified Document(s) via DigiLocker`
                            : `${qualifications.length} Degree(s) · ${certifications.length} Certificate Added`}
                        </span>
                      </div>
                    ) : (
                      <span className="badge badge-warning px-3 py-2 font-weight-bold">
                        PENDING STEP 6
                      </span>
                    )}
                  </div>

                  <div className="auth-card-body p-4 p-md-5">

                    {/* Clean Minimalist Mode Selector Toggle */}
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-weight-bold text-dark" style={{ fontSize: '1rem' }}>
                            Verification Method
                          </span>
                        </div>
                      </div>

                      {/* Sleek Toggle Switcher */}
                      <div
                        className="d-inline-flex p-1 flex-shrink-0"
                        style={{
                          background: '#F1F5F9',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <button
                          type="button"
                          className={`kyc-method-btn ${educationMode === 'manual' ? 'active-manual' : 'inactive'}`}
                          style={{ padding: '6px 14px', fontSize: '12.5px' }}
                          onClick={() => setEducationMode('manual')}
                        >
                          <span>Manual Upload</span>
                        </button>

                        <button
                          type="button"
                          className={`kyc-method-btn ${educationMode === 'digilocker' ? 'active-digilocker' : 'inactive'}`}
                          style={{ padding: '6px 14px', fontSize: '12.5px' }}
                          onClick={() => setEducationMode('digilocker')}
                        >
                          <span>DigiLocker</span>
                          {hasDigilockerVerified && (
                            <span
                              style={{
                                background: '#ECFDF5',
                                color: '#047857',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                marginLeft: '6px',
                              }}
                            >
                              ✓ Verified
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════
                        DIGILOCKER MODE (Official Verified Credentials)
                        ═══════════════════════════════════════════════════════════ */}
                    {educationMode === 'digilocker' && (
                      <div className="mb-4">
                        {educationalDigiDocs.length > 0 ? (
                          /* State 1: Verified Documents List */
                          <div
                            className="bg-light"
                            style={{
                              borderRadius: '16px',
                              border: '1.5px solid #00D294',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              className="p-3.5 p-md-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
                              style={{ background: '#f8f9fa', borderColor: '#E2E8F0' }}
                            >
                              <div className="d-flex align-items-center gap-2.5">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                </svg>
                                <div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <h6 className="font-weight-bold mb-0 text-dark" style={{ fontSize: '1rem' }}>
                                      Verified Academic Credentials
                                    </h6>
                                    <span className="kyc-badge-verified">✓ Verified (+20 Pts)</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 p-md-4" style={{ background: '#FAFDFB' }}>
                              <div className="d-flex flex-column gap-2.5">
                                {educationalDigiDocs.map((doc, idx) => (
                                  <div
                                    key={doc.fileId || `dl-doc-${idx}`}
                                    className="p-3 bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
                                    style={{
                                      borderRadius: '12px',
                                      border: '1px solid #E2E8F0',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                                      <div
                                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '10px',
                                          background: '#ECFDF5',
                                          color: '#047857',
                                          border: '1px solid #A7F3D0',
                                        }}
                                      >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                          <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                      </div>
                                      <div style={{ minWidth: 0 }}>
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                          <h6 className="font-weight-bold text-dark mb-0 text-truncate" style={{ fontSize: '14.5px' }}>
                                            {doc.docName}
                                          </h6>
                                          <span className="kyc-badge-verified" style={{ fontSize: '10px', padding: '2px 7px' }}>
                                            ✓ Verified
                                          </span>
                                        </div>
                                        <div className="text-muted small" style={{ fontSize: '12px' }}>
                                          {doc.issuer || 'Official Examination Board / University'}
                                        </div>
                                      </div>
                                    </div>

                                    {doc.downloadUrl && (
                                      <div className="flex-shrink-0">
                                        <a
                                          href={resolveDocumentUrl(doc.downloadUrl)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-sm font-weight-bold d-inline-flex align-items-center text-white"
                                          style={{
                                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            padding: '6px 14px',
                                            textDecoration: 'none',
                                            gap: '5px',
                                          }}
                                        >
                                          <span>View Document</span>
                                          <span>↗</span>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* State 2: Clean, Simple Connect DigiLocker Box */
                          <div
                            className="p-4 bg-light"
                            style={{
                              borderRadius: '16px',
                              border: '1.5px solid #00D294',
                            }}
                          >
                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                              <div className="d-flex align-items-start gap-3">
                                <div
                                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                                  style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '12px',
                                    background: '#ECFDF5',
                                    color: '#059669',
                                    border: '1px solid #A7F3D0',
                                  }}
                                >
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 21h18"></path>
                                    <path d="M3 10h18"></path>
                                    <path d="M5 6l7-3 7 3"></path>
                                    <path d="M4 10v11"></path>
                                    <path d="M20 10v11"></path>
                                    <path d="M8 14v4"></path>
                                    <path d="M12 14v4"></path>
                                    <path d="M16 14v4"></path>
                                  </svg>
                                </div>
                                <div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                    <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
                                      DigiLocker Education Verification
                                    </h6>
                                    <span className="kyc-badge-verified">+{scoreConfig.educationScore ?? 20} Points</span>
                                  </div>
                                  <p className="text-muted small mb-2" style={{ fontSize: '13px' }}>
                                    Directly fetch official 10th/12th marksheets, graduation degrees, and diplomas from CBSE, State Boards, and Universities.
                                  </p>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '8px',
                                      background: '#FFFBEB',
                                      border: '1px solid #FDE68A',
                                      borderRadius: '8px',
                                      padding: '8px 12px',
                                      marginBottom: '10px',
                                    }}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="12" y1="16" x2="12" y2="12"></line>
                                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <div style={{ color: '#92400E', fontSize: '12px', lineHeight: '1.45' }}>
                                      <strong style={{ color: '#B45309', fontWeight: 700 }}>Important:</strong> Please ensure all your educational certificates (10th/12th marksheets, degree, diploma) are already issued &amp; available in your DigiLocker account before proceeding with verification.
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="digilockerEduConsent"
                                      checked={digilockerEduConsent}
                                      onChange={(e) => setDigilockerEduConsent(e.target.checked)}
                                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#059669' }}
                                    />
                                    <label htmlFor="digilockerEduConsent" className="small text-muted mb-0 user-select-none" style={{ cursor: 'pointer', fontSize: '12px' }}>
                                      I authorize Employix to fetch educational records via DigiLocker (NAD).
                                    </label>
                                  </div>
                                </div>
                              </div>

                              <div className="d-flex flex-column gap-2 flex-shrink-0 align-items-stretch align-items-md-end">
                                <button
                                  type="button"
                                  className="btn font-weight-bold text-white px-4 py-2"
                                  onClick={handleInitiateDigilockerEducation}
                                  disabled={digilockerEduLoading || !digilockerEduConsent || isSetupCompleted}
                                  style={{
                                    borderRadius: '10px',
                                    background: (!digilockerEduConsent && !isSetupCompleted)
                                      ? '#94A3B8'
                                      : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                    border: 'none',
                                    fontSize: '13px',
                                    boxShadow: digilockerEduConsent ? '0 3px 10px rgba(5, 150, 105, 0.25)' : 'none',
                                    cursor: (!digilockerEduConsent && !isSetupCompleted) ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {digilockerEduLoading ? (
                                    <ButtonSpinner text="Connecting..." />
                                  ) : (
                                    'Verify with DigiLocker'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm text-muted font-weight-bold p-0 text-decoration-none"
                                  onClick={() => handleSyncDigilockerEducation()}
                                  disabled={digilockerSyncLoading || isSetupCompleted}
                                  style={{ fontSize: '11.5px' }}
                                >
                                  {digilockerSyncLoading ? <ButtonSpinner text="Checking..." /> : 'Sync Existing Documents'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        MANUAL UPLOAD MODE (Ultra-Clean, Premium Design)
                        ═══════════════════════════════════════════════════════════ */}
                    {educationMode === 'manual' && (
                      <div className="d-flex flex-column gap-4 mb-4">
                        {/* SECTION 6A: Academic Qualifications */}
                        <div
                          className="p-4 rounded-xl"
                          style={{
                            background: '#FFFFFF',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: '16px',
                            boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)',
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                                  Academic Qualifications (Degrees / Diplomas)
                                </h6>
                                {qualifications.length > 0 && (
                                  <span
                                    className="badge badge-pill font-weight-bold"
                                    style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '11px', padding: '3px 8px' }}
                                  >
                                    {qualifications.length} Added
                                  </span>
                                )}
                              </div>
                              <p className="text-muted small mb-0" style={{ fontSize: '12.5px' }}>
                                Universities, colleges, graduation degrees &amp; diploma certificates
                              </p>
                            </div>
                            {!showQualForm && (
                              <button
                                type="button"
                                className="btn btn-sm d-inline-flex align-items-center gap-1.5 font-weight-bold"
                                onClick={() => !isSetupCompleted && setShowQualForm(true)}
                                disabled={isSetupCompleted}
                                style={{
                                  borderRadius: '10px',
                                  fontSize: '12.5px',
                                  padding: '8px 18px',
                                  background: isSetupCompleted ? '#94A3B8' : 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  boxShadow: isSetupCompleted ? 'none' : '0 3px 12px rgba(0, 210, 148, 0.3)',
                                  opacity: isSetupCompleted ? 0.65 : 1,
                                  cursor: isSetupCompleted ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
                                <span>Add Qualification</span>
                              </button>
                            )}
                          </div>

                          {/* Qualifications List */}
                          {qualifications.length > 0 && (
                            <div className="d-flex flex-column gap-3 mb-3">
                              {qualifications.map((qual, idx) => (
                                <div
                                  key={qual._id || `q-${idx}`}
                                  className="kyc-record-card"
                                >
                                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                                    <div className="d-flex align-items-start flex-grow-1 gap-3" style={{ minWidth: 0, flex: 1 }}>
                                      <div
                                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                          width: '44px',
                                          height: '44px',
                                          borderRadius: '12px',
                                          background: '#ECFDF5',
                                          border: '1px solid #A7F3D0',
                                          color: '#047857',
                                          fontSize: '20px',
                                        }}
                                      >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                        </svg>
                                      </div>
                                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                        <div className="d-flex align-items-center flex-wrap mb-1.5 gap-2">
                                          <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '15px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {qual.degree}
                                          </h6>
                                          {qual.grade && (
                                            <span
                                              className="badge font-weight-bold flex-shrink-0"
                                              style={{
                                                fontSize: '11px',
                                                padding: '3px 9px',
                                                background: '#F0FDF4',
                                                color: '#166534',
                                                border: '1px solid #BBF7D0',
                                                borderRadius: '20px',
                                              }}
                                            >
                                              Grade: {qual.grade}
                                            </span>
                                          )}
                                        </div>

                                        <div className="d-flex align-items-center flex-wrap gap-2 text-muted small mb-2" style={{ fontSize: '12.5px' }}>
                                          <span className="kyc-meta-pill" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{qual.institution}</span>
                                          {qual.fieldOfStudy && <span className="kyc-meta-pill" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{qual.fieldOfStudy}</span>}
                                        </div>

                                        {qual.documentUrl && (
                                          <div>
                                            <a
                                              href={resolveDocumentUrl(qual.documentUrl)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 font-weight-bold"
                                              style={{
                                                background: '#F0FDF4',
                                                color: '#166534',
                                                border: '1px solid #BBF7D0',
                                                borderRadius: '8px',
                                                fontSize: '11.5px',
                                                padding: '4px 12px',
                                                textDecoration: 'none',
                                              }}
                                            >
                                              <span>View Document Proof</span>
                                              <span>↗</span>
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status Badge & Delete Button */}
                                    <div className="d-flex align-items-center gap-2 align-self-start flex-shrink-0">
                                      {qual.isVerified ? (
                                        <span className="kyc-badge-verified">✓ Verified (+20 Pts)</span>
                                      ) : (
                                        <span className="kyc-badge-unverified">Self-Reported</span>
                                      )}
                                      {!isSetupCompleted && kycStatus !== 8 && (
                                        <button
                                          type="button"
                                          className="item-delete-btn-danger flex-shrink-0"
                                          onClick={() => handleDeleteQualification(qual._id)}
                                          title="Delete qualification"
                                          aria-label="Delete qualification"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Qualification Form */}
                          {showQualForm && !isSetupCompleted && (
                            <form onSubmit={handleAddQualification} className="kyc-form-card mt-3">
                              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                <div className="d-flex align-items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                  </svg>
                                  <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '15px' }}>
                                    Add Educational Qualification
                                  </h6>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                                  onClick={() => setShowQualForm(false)}
                                  title="Close form"
                                  style={{ fontSize: '16px', lineHeight: 1 }}
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="row g-3">
                                <div className="col-md-6 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Degree / Diploma Name <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="kyc-input-modern"
                                    placeholder="e.g. Bachelor of Technology (B.Tech)"
                                    maxLength={80}
                                    value={qualForm.degree}
                                    onChange={(e) => setQualForm({ ...qualForm, degree: e.target.value.slice(0, 80) })}
                                    required
                                  />
                                </div>
                                <div className="col-md-6 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    College / University <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="kyc-input-modern"
                                    placeholder="e.g. Delhi University / IIT Delhi"
                                    maxLength={100}
                                    value={qualForm.institution}
                                    onChange={(e) => setQualForm({ ...qualForm, institution: e.target.value.slice(0, 100) })}
                                    required
                                  />
                                </div>
                                <div className="col-md-5 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Field of Study / Branch
                                  </label>
                                  <input
                                    type="text"
                                    className="kyc-input-modern"
                                    placeholder="e.g. Computer Science & Engineering"
                                    maxLength={60}
                                    value={qualForm.fieldOfStudy}
                                    onChange={(e) => setQualForm({ ...qualForm, fieldOfStudy: e.target.value.slice(0, 60) })}
                                  />
                                </div>
                                <div className="col-md-3 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Graduation Year
                                  </label>
                                  <input
                                    type="number"
                                    className="kyc-input-modern"
                                    placeholder="e.g. 2022"
                                    min="1970"
                                    max="2035"
                                    value={qualForm.year}
                                    onChange={(e) => setQualForm({ ...qualForm, year: e.target.value })}
                                  />
                                </div>
                                <div className="col-md-4 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Grade / CGPA / %
                                  </label>
                                  <input
                                    type="text"
                                    className="kyc-input-modern"
                                    placeholder="e.g. 8.4 CGPA or 85%"
                                    value={qualForm.grade}
                                    onChange={(e) => setQualForm({ ...qualForm, grade: e.target.value })}
                                  />
                                </div>

                                {/* Custom Sleek File Upload */}
                                <div className="col-12 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Degree Certificate / Marksheet Proof (Optional)
                                  </label>
                                  <label className="kyc-custom-file-upload d-block position-relative mb-0">
                                    <input
                                      type="file"
                                      accept={DOCUMENT_UPLOAD_ACCEPT}
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          setQualForm({ ...qualForm, document: e.target.files[0] });
                                        }
                                      }}
                                    />
                                    {qualForm.document ? (
                                      <div className="d-flex align-items-center justify-content-between py-1 px-2">
                                        <div className="d-flex align-items-center gap-2 text-truncate" style={{ minWidth: 0 }}>
                                          <span className="text-success font-weight-bold">✓</span>
                                          <span className="font-weight-bold text-dark small text-truncate">
                                            {qualForm.document.name}
                                          </span>
                                          <span className="badge badge-light border text-muted small">
                                            {formatFileSize(qualForm.document.size)}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-danger py-0 px-2 ml-2 font-weight-bold"
                                          style={{ fontSize: '11px', borderRadius: '6px' }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setQualForm({ ...qualForm, document: null });
                                          }}
                                        >
                                          ✕ Remove
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="d-flex align-items-center justify-content-center gap-2 py-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                          <polyline points="17 8 12 3 7 8" />
                                          <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <span className="font-weight-bold text-dark small">
                                          Click to upload degree certificate or marksheet (PDF, JPG, JPEG, PNG)
                                        </span>
                                      </div>
                                    )}
                                  </label>
                                </div>
                              </div>

                              <div className="d-flex gap-2 justify-content-end mt-3 pt-2 border-top">
                                <button
                                  type="button"
                                  className="btn font-weight-bold px-3 py-1.5"
                                  style={{
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    border: '1px solid #CBD5E1',
                                    color: '#475569',
                                    background: '#FFFFFF',
                                  }}
                                  onClick={() => {
                                    setShowQualForm(false);
                                    setQualForm({ degree: '', institution: '', fieldOfStudy: '', year: '', grade: '', document: null });
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn font-weight-bold px-4 py-1.5 text-white"
                                  style={{
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    background: 'linear-gradient(135deg, #00D294 0%, #00B880 100%)',
                                    border: 'none',
                                    boxShadow: '0 3px 10px rgba(0, 210, 148, 0.25)',
                                  }}
                                  disabled={qualFormLoading}
                                >
                                  {qualFormLoading ? <ButtonSpinner text="Saving..." /> : 'Save Qualification'}
                                </button>
                              </div>
                            </form>
                          )}

                          {qualifications.length === 0 && !showQualForm && (
                            <div
                              className="text-center py-4 px-3 rounded-lg"
                              style={{
                                background: '#F8FAFC',
                                border: '1.5px dashed #CBD5E1',
                                borderRadius: '14px',
                              }}
                            >
                              <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>
                                No Academic Qualifications Added Yet
                              </h6>
                              <p className="text-muted small mb-0" style={{ fontSize: '12.5px', maxWidth: '460px', margin: '0 auto' }}>
                                Add your graduation, master's degree, or diploma credentials to strengthen your verified profile.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* SECTION 6B: Professional Certifications */}
                        <div
                          className="p-4 rounded-xl"
                          style={{
                            background: '#FFFFFF',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: '16px',
                            boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)',
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                                  Professional Certifications &amp; Credentials
                                </h6>
                                {certifications.length > 0 && (
                                  <span
                                    className="badge badge-pill font-weight-bold"
                                    style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '11px', padding: '3px 8px' }}
                                  >
                                    {certifications.length} Added
                                  </span>
                                )}
                              </div>
                              <p className="text-muted small mb-0" style={{ fontSize: '12.5px' }}>
                                Cloud, security, coding, vendor credentials (AWS, Google, Microsoft, Scrum, etc.)
                              </p>
                            </div>
                            {!showCertForm && (
                              <button
                                type="button"
                                className="btn btn-sm d-inline-flex align-items-center gap-1.5 font-weight-bold"
                                onClick={() => !isSetupCompleted && setShowCertForm(true)}
                                disabled={isSetupCompleted}
                                style={{
                                  borderRadius: '10px',
                                  fontSize: '12.5px',
                                  padding: '8px 18px',
                                  background: isSetupCompleted ? '#94A3B8' : 'linear-gradient(135deg, #00D294 0%, #059669 100%)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  boxShadow: isSetupCompleted ? 'none' : '0 3px 12px rgba(0, 210, 148, 0.3)',
                                  opacity: isSetupCompleted ? 0.65 : 1,
                                  cursor: isSetupCompleted ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
                                <span>Add Certification</span>
                              </button>
                            )}
                          </div>

                          {/* Certifications List */}
                          {certifications.length > 0 && (
                            <div className="d-flex flex-column gap-3 mb-3">
                              {certifications.map((cert, idx) => (
                                <div
                                  key={cert._id || `c-${idx}`}
                                  className="kyc-record-card"
                                >
                                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                                    <div className="d-flex align-items-start flex-grow-1 gap-3" style={{ minWidth: 0, flex: 1 }}>
                                      <div
                                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                          width: '44px',
                                          height: '44px',
                                          borderRadius: '12px',
                                          background: '#FEF3C7',
                                          border: '1px solid #FCD34D',
                                          color: '#92400E',
                                          fontSize: '20px',
                                        }}
                                      >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="12" cy="8" r="6"></circle>
                                          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                                        </svg>
                                      </div>
                                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                        <div className="d-flex align-items-center flex-wrap mb-1.5 gap-2">
                                          <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '15px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {cert.title}
                                          </h6>
                                          {cert.credentialId && (
                                            <span
                                              className="badge font-weight-bold flex-shrink-0"
                                              style={{
                                                fontSize: '11px',
                                                padding: '3px 8px',
                                                background: '#F1F5F9',
                                                color: '#334155',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '20px',
                                                wordBreak: 'break-word',
                                                overflowWrap: 'anywhere',
                                              }}
                                            >
                                              ID: {cert.credentialId}
                                            </span>
                                          )}
                                        </div>

                                        <div className="d-flex align-items-center flex-wrap gap-2 text-muted small mb-2" style={{ fontSize: '12.5px' }}>
                                          <span className="kyc-meta-pill" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{cert.issuer}</span>
                                          {cert.year && <span className="kyc-meta-pill flex-shrink-0">Issued {cert.year}</span>}
                                        </div>

                                        {(cert.credentialUrl || cert.documentUrl) && (
                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                            {cert.credentialUrl && (
                                              <a
                                                href={cert.credentialUrl && (cert.credentialUrl.startsWith('http://') || cert.credentialUrl.startsWith('https://')) ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm d-inline-flex align-items-center gap-1 font-weight-bold"
                                                style={{
                                                  background: '#EFF6FF',
                                                  color: '#1D4ED8',
                                                  border: '1px solid #BFDBFE',
                                                  borderRadius: '8px',
                                                  fontSize: '11.5px',
                                                  padding: '4px 12px',
                                                  textDecoration: 'none',
                                                }}
                                              >
                                                <span>Verify Credential</span>
                                                <span>↗</span>
                                              </a>
                                            )}
                                            {cert.documentUrl && (
                                              <a
                                                href={resolveDocumentUrl(cert.documentUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm d-inline-flex align-items-center gap-1 font-weight-bold"
                                                style={{
                                                  background: '#F0FDF4',
                                                  color: '#166534',
                                                  border: '1px solid #BBF7D0',
                                                  borderRadius: '8px',
                                                  fontSize: '11.5px',
                                                  padding: '4px 12px',
                                                  textDecoration: 'none',
                                                }}
                                              >
                                                <span>View Proof</span>
                                                <span>↗</span>
                                              </a>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status Badge & Delete Button */}
                                    <div className="d-flex align-items-center gap-2 align-self-start flex-shrink-0">
                                      {cert.isVerified ? (
                                        <span className="kyc-badge-verified">✓ Verified (+20 Pts)</span>
                                      ) : (
                                        <span className="kyc-badge-unverified">Self-Reported</span>
                                      )}
                                      {!isSetupCompleted && kycStatus !== 8 && (
                                        <button
                                          type="button"
                                          className="item-delete-btn-danger flex-shrink-0"
                                          onClick={() => handleDeleteCertification(cert._id)}
                                          title="Delete certification"
                                          aria-label="Delete certification"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Certification Form */}
                          {showCertForm && !isSetupCompleted && (
                            <form onSubmit={handleAddCertification} className="kyc-form-card mt-3">
                              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                <div className="d-flex align-items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="6"></circle>
                                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                                  </svg>
                                  <h6 className="font-weight-bold text-dark mb-0" style={{ fontSize: '15px' }}>
                                    Add Professional Certification
                                  </h6>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                                  onClick={() => setShowCertForm(false)}
                                  title="Close form"
                                  style={{ fontSize: '16px', lineHeight: 1 }}
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="row g-3">
                                <div className="col-md-6 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Certification Title <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="kyc-input-modern"
                                    placeholder="e.g. AWS Solutions Architect - Associate"
                                    maxLength={80}
                                    value={certForm.title}
                                    onChange={(e) => setCertForm({ ...certForm, title: e.target.value.slice(0, 80) })}
                                    required
                                  />
                                </div>
                                <div className="col-md-6 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Issuing Organization <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="kyc-input-modern"
                                    placeholder="e.g. Amazon Web Services, Google, Microsoft"
                                    maxLength={100}
                                    value={certForm.issuer}
                                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value.slice(0, 100) })}
                                    required
                                  />
                                </div>
                                <div className="col-md-4 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Issue Year
                                  </label>
                                  <input
                                    type="number"
                                    className="kyc-input-modern"
                                    placeholder="e.g. 2023"
                                    min="1970"
                                    max="2035"
                                    value={certForm.year}
                                    onChange={(e) => setCertForm({ ...certForm, year: e.target.value })}
                                  />
                                </div>
                                <div className="col-md-4 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Credential ID (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    className="kyc-input-modern"
                                    placeholder="e.g. AWS-SEC-984210"
                                    value={certForm.credentialId}
                                    onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                                  />
                                </div>
                                <div className="col-md-4 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Verification Link (Optional)
                                  </label>
                                  <input
                                    type="url"
                                    className="kyc-input-modern"
                                    placeholder="https://..."
                                    value={certForm.credentialUrl}
                                    onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                                  />
                                </div>

                                {/* Custom Sleek File Upload */}
                                <div className="col-12 mb-2">
                                  <label className="d-block small font-weight-bold text-dark mb-1">
                                    Certificate Document Proof (Optional)
                                  </label>
                                  <label className="kyc-custom-file-upload d-block position-relative mb-0">
                                    <input
                                      type="file"
                                      accept={DOCUMENT_UPLOAD_ACCEPT}
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          setCertForm({ ...certForm, document: e.target.files[0] });
                                        }
                                      }}
                                    />
                                    {certForm.document ? (
                                      <div className="d-flex align-items-center justify-content-between py-1 px-2">
                                        <div className="d-flex align-items-center gap-2 text-truncate" style={{ minWidth: 0 }}>
                                          <span className="text-success font-weight-bold">✓</span>
                                          <span className="font-weight-bold text-dark small text-truncate">
                                            {certForm.document.name}
                                          </span>
                                          <span className="badge badge-light border text-muted small">
                                            {formatFileSize(certForm.document.size)}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-danger py-0 px-2 ml-2 font-weight-bold"
                                          style={{ fontSize: '11px', borderRadius: '6px' }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setCertForm({ ...certForm, document: null });
                                          }}
                                        >
                                          ✕ Remove
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="d-flex align-items-center justify-content-center gap-2 py-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                          <polyline points="17 8 12 3 7 8" />
                                          <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <span className="font-weight-bold text-dark small">
                                          Click to upload certificate completion proof or badge (PDF, JPG, JPEG, PNG)
                                        </span>
                                      </div>
                                    )}
                                  </label>
                                </div>
                              </div>

                              <div className="d-flex gap-2 justify-content-end mt-3 pt-2 border-top">
                                <button
                                  type="button"
                                  className="btn font-weight-bold px-3 py-1.5"
                                  style={{
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    border: '1px solid #CBD5E1',
                                    color: '#475569',
                                    background: '#FFFFFF',
                                  }}
                                  onClick={() => {
                                    setShowCertForm(false);
                                    setCertForm({ title: '', issuer: '', year: '', credentialId: '', credentialUrl: '', document: null });
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn font-weight-bold px-4 py-1.5 text-white"
                                  style={{
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    background: 'linear-gradient(135deg, #00D294 0%, #00B880 100%)',
                                    border: 'none',
                                    boxShadow: '0 3px 10px rgba(0, 210, 148, 0.25)',
                                  }}
                                  disabled={certFormLoading}
                                >
                                  {certFormLoading ? <ButtonSpinner text="Saving..." /> : 'Save Certification'}
                                </button>
                              </div>
                            </form>
                          )}

                          {certifications.length === 0 && !showCertForm && (
                            <div
                              className="text-center py-4 px-3 rounded-lg"
                              style={{
                                background: '#F8FAFC',
                                border: '1.5px dashed #CBD5E1',
                                borderRadius: '14px',
                              }}
                            >
                              <h6 className="font-weight-bold text-dark mb-1" style={{ fontSize: '14px' }}>
                                No Professional Certifications Added Yet
                              </h6>
                              <p className="text-muted small mb-0" style={{ fontSize: '12.5px', maxWidth: '460px', margin: '0 auto' }}>
                                Add your tech certifications, licenses, and verified skill badges to showcase your domain expertise.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 7: Driving License (DL) Verification (OCR Document Scan) */}
            <div className="row justify-content-center mb-5" id="step-dl">
              <div className="col-lg-10">
                <div className="auth-card">
                  <div className="auth-card-header d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 7</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Driving License (DL) Verification</h3>
                        <p className="auth-card-sub small mb-0">Government MoRTH Driving License OCR Document Scan</p>
                      </div>
                    </div>

                    {dlVerified ? (
                      <span className="badge badge-success px-3 py-2 font-weight-bold">
                        &#10003; DRIVING LICENSE VERIFIED
                      </span>
                    ) : (
                      <span className="badge badge-warning px-3 py-2 font-weight-bold">
                        PENDING STEP 7
                      </span>
                    )}
                  </div>

                  <div className="auth-card-body p-4 p-md-5">

                  {dlVerified ? (
                    <div className="kyc-verified-result-card">
                      <div className="d-flex align-items-center justify-content-between flex-wrap pb-3 mb-3 border-bottom">
                        <div className="d-flex align-items-center mb-2 mb-sm-0">
                          <div className="stat-icon-light bg-teal-light mr-3" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-white h4 mb-0 font-weight-bold">&#10003;</span>
                          </div>
                          <div>
                            <h6 className="font-weight-bold text-dark mb-0">
                              Driving License Verified Successfully
                            </h6>
                            <span className="text-success small font-weight-bold">
                              Official Ministry of Road Transport &amp; Highways (MoRTH) Record Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complete Extracted DL Details */}
                      <div className="row g-3 mt-1">
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Licensee Name</span>
                          <strong className="text-dark">{dlResult?.name || fullName || 'Verified Licensee'}</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Driving License Number</span>
                          <strong className="text-dark">{dlResult?.maskedDocumentNumber || 'DL04******2345'}</strong>
                        </div>
                        {dlResult?.dateOfExpiry && (
                          <div className="col-sm-6 col-md-4 mb-2">
                            <span className="text-muted small d-block">DL Validity / Expiry</span>
                            <strong className="text-dark">{new Date(dlResult.dateOfExpiry).toLocaleDateString()}</strong>
                          </div>
                        )}
                        {dlResult?.vehicleTypes && (
                          <div className="col-sm-6 col-md-4 mb-2">
                            <span className="text-muted small d-block">Authorized Vehicle Types</span>
                            <strong className="text-dark">
                              {Array.isArray(dlResult.vehicleTypes) ? dlResult.vehicleTypes.join(', ') : dlResult.vehicleTypes}
                            </strong>
                          </div>
                        )}
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Verification Method</span>
                          <strong className="text-teal">MoRTH / RTO Document OCR</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Status</span>
                          <span className="badge badge-success px-2 py-1">Verified</span>
                        </div>
                        {(() => {
                          const displayAddr =
                            dlResult?.address?.fullAddress ||
                            (typeof dlResult?.address === 'string' && dlResult.address.trim()) ||
                            null;
                          if (!displayAddr) return null;
                          return (
                            <div className="col-12 mt-2 pt-2 border-top">
                              <span className="text-muted small d-block">Driving License Registered Address</span>
                              <span className="text-dark font-weight-bold small">{displayAddr}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyDlOcr}>
                      {/* Document Guidelines & Security Notice */}
                      <div className="p-3 mb-4 rounded-lg border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                          <div
                            className="kyc-banner-icon-box"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="16" rx="2" />
                              <circle cx="9" cy="10" r="2" />
                              <path d="M15 8h2" />
                              <path d="M15 12h2" />
                              <path d="M7 16h10" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h6 className="font-weight-bold mb-0 text-dark kyc-banner-heading">
                              Driving License OCR Verification
                            </h6>
                            <p className="text-muted small mb-0 kyc-banner-subtext">
                              Upload front &amp; back images of your Driving License for instant verification.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dual Upload Cards: Front and Back */}
                      <div className="row g-4 mb-4">
                        {/* FRONT SIDE CARD */}
                        <div className="col-md-6 mb-3 mb-md-0">
                          <div className="kyc-doc-card">
                            <div className="kyc-doc-card-header">
                              <div>
                                <span className="kyc-tag-pill kyc-badge-front mr-2">FRONT SIDE</span>
                                <span className="font-weight-bold text-dark small">Driving License Front *</span>
                              </div>
                              <span className="text-muted small kyc-text-xs">Photo, DL No. &amp; DOB</span>
                            </div>

                            <div className="kyc-doc-card-body">
                              <input
                                ref={dlFrontInputRef}
                                type="file"
                                className="d-none"
                                accept={DOCUMENT_UPLOAD_ACCEPT}
                                onChange={(e) => {
                                  const f = e.target.files[0];
                                  if (f) {
                                    handleDlFrontChange(f, e.target);
                                  }
                                }}
                              />

                              {!dlFront ? (
                                <div
                                  className={`kyc-modern-dropzone ${dragActiveDlFront ? 'drag-active' : ''}`}
                                  onClick={() => dlFrontInputRef.current?.click()}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActiveDlFront(true);
                                  }}
                                  onDragLeave={() => setDragActiveDlFront(false)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDragActiveDlFront(false);
                                    const f = e.dataTransfer.files[0];
                                    if (f) handleDlFrontChange(f, dlFrontInputRef.current);
                                  }}
                                >
                                  <div className="kyc-upload-icon-wrapper">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                  </div>
                                  <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>
                                    Upload Front Side
                                  </div>
                                  <div className="text-muted small mb-3">
                                    Drag &amp; drop or <span className="text-teal font-weight-bold">Browse file</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="badge badge-light border text-muted px-2 py-1 small">JPG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PNG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PDF</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">&lt; 5MB</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="kyc-preview-container">
                                    {dlFrontPreview === 'pdf' ? (
                                      <div className="kyc-preview-pdf">
                                        <div className="kyc-pdf-icon">
                                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                          </svg>
                                        </div>
                                        <strong className="text-white small text-center kyc-pdf-filename">
                                          {dlFront.name}
                                        </strong>
                                        <span className="badge badge-teal px-2 py-1 mt-2 text-dark font-weight-bold small">PDF Document</span>
                                      </div>
                                    ) : (
                                      <img src={dlFrontPreview} alt="DL Front Preview" className="kyc-preview-image" />
                                    )}
                                  </div>

                                  <div className="kyc-file-meta-bar">
                                    <div className="d-flex align-items-center overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                                      <span className="text-teal mr-2 font-weight-bold">✓</span>
                                      <div className="text-truncate" style={{ minWidth: 0 }}>
                                        <span className="text-dark font-weight-bold small d-block text-truncate" title={dlFront.name}>
                                          {dlFront.name}
                                        </span>
                                        <span className="text-muted small kyc-text-xs">
                                          {formatFileSize(dlFront.size)} • Ready
                                        </span>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border py-1 px-2 text-dark small"
                                        onClick={() => dlFrontInputRef.current?.click()}
                                        title="Change Front Document"
                                      >
                                        Change
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger py-1 px-2 small"
                                        onClick={handleRemoveDlFront}
                                        title="Remove Front Document"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="text-muted small text-center mt-2 kyc-text-subtle">
                                Ensure Photo, Name &amp; DL number are clearly visible
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BACK SIDE CARD */}
                        <div className="col-md-6">
                          <div className="kyc-doc-card">
                            <div className="kyc-doc-card-header">
                              <div>
                                <span className="kyc-tag-pill kyc-badge-back mr-2">BACK SIDE</span>
                                <span className="font-weight-bold text-dark small">Driving License Back *</span>
                              </div>
                              <span className="text-muted small kyc-text-xs">Address &amp; Vehicle Classes</span>
                            </div>

                            <div className="kyc-doc-card-body">
                              <input
                                ref={dlBackInputRef}
                                type="file"
                                className="d-none"
                                accept={DOCUMENT_UPLOAD_ACCEPT}
                                onChange={(e) => {
                                  const f = e.target.files[0];
                                  if (f) {
                                    handleDlBackChange(f, e.target);
                                  }
                                }}
                              />

                              {!dlBack ? (
                                <div
                                  className={`kyc-modern-dropzone ${dragActiveDlBack ? 'drag-active' : ''}`}
                                  onClick={() => dlBackInputRef.current?.click()}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActiveDlBack(true);
                                  }}
                                  onDragLeave={() => setDragActiveDlBack(false)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDragActiveDlBack(false);
                                    const f = e.dataTransfer.files[0];
                                    if (f) handleDlBackChange(f, dlBackInputRef.current);
                                  }}
                                >
                                  <div className="kyc-upload-icon-wrapper">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                  </div>
                                  <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>
                                    Upload Back Side
                                  </div>
                                  <div className="text-muted small mb-3">
                                    Drag &amp; drop or <span className="text-teal font-weight-bold">Browse file</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="badge badge-light border text-muted px-2 py-1 small">JPG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PNG</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">PDF</span>
                                    <span className="badge badge-light border text-muted px-2 py-1 small">&lt; 5MB</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="kyc-preview-container">
                                    {dlBackPreview === 'pdf' ? (
                                      <div className="kyc-preview-pdf">
                                        <div className="kyc-pdf-icon">
                                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                          </svg>
                                        </div>
                                        <strong className="text-white small text-center kyc-pdf-filename">
                                          {dlBack.name}
                                        </strong>
                                        <span className="badge badge-teal px-2 py-1 mt-2 text-dark font-weight-bold small">PDF Document</span>
                                      </div>
                                    ) : (
                                      <img src={dlBackPreview} alt="DL Back Preview" className="kyc-preview-image" />
                                    )}
                                  </div>

                                  <div className="kyc-file-meta-bar">
                                    <div className="d-flex align-items-center overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                                      <span className="text-teal mr-2 font-weight-bold">✓</span>
                                      <div className="text-truncate" style={{ minWidth: 0 }}>
                                        <span className="text-dark font-weight-bold small d-block text-truncate" title={dlBack.name}>
                                          {dlBack.name}
                                        </span>
                                        <span className="text-muted small kyc-text-xs">
                                          {formatFileSize(dlBack.size)} • Ready
                                        </span>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border py-1 px-2 text-dark small"
                                        onClick={() => dlBackInputRef.current?.click()}
                                        title="Change Back Document"
                                      >
                                        Change
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger py-1 px-2 small"
                                        onClick={handleRemoveDlBack}
                                        title="Remove Back Document"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="text-muted small text-center mt-2 kyc-text-subtle">
                                Ensure Address &amp; Vehicle classes are clearly visible
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Short & Clean Consent Card */}
                      <div
                        className={`kyc-consent-card-modern mb-4 ${dlConsent ? 'consented' : ''}`}
                        
                      >
                        <div className="form-check d-flex align-items-center m-0">
                          <input
                            type="checkbox"
                            id="dlOcrConsent"
                            checked={dlConsent}
                            onChange={(e) => setDlConsent(e.target.checked)}
                            className="form-check-input mr-3 kyc-consent-input"
                          />
                          <label
                            htmlFor="dlOcrConsent"
                            className="form-check-label mb-0 text-dark kyc-consent-label"
                          >
                            I authorize Employix to securely verify my identity and vehicle licensing details from my Driving License for KYC verification.
                          </label>
                        </div>
                      </div>

                      {/* Submit Action Button */}
                      <button
                        type="submit"
                        className="btn btn-primary-teal btn-block py-3 font-weight-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                        disabled={dlLoading || !dlConsent || !dlFront || !dlBack}
                        style={{ fontSize: '1rem', letterSpacing: '0.02em', borderRadius: '10px' }}
                      >
                        {dlLoading ? (
                          <ButtonSpinner text="Scanning &amp; Extracting Driving License Details (AI OCR)..." />
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 7V4h3" />
                              <path d="M20 7V4h-3" />
                              <path d="M4 17v3h3" />
                              <path d="M20 17v3h-3" />
                              <line x1="4" y1="12" x2="20" y2="12" />
                            </svg>
                            <span>Scan &amp; Verify Driving License (OCR)</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Combined Summary & Actions Bar */}
            <div className="row justify-content-center mt-3" id="step-finish">
              <div className="col-lg-10">
                <div className="kyc-summary-footer p-4 rounded-lg d-flex flex-column flex-md-row align-items-center justify-content-between text-center text-md-left gap-3">
                  <div>
                    <h5 className="font-weight-bold text-white mb-0">
                      {allStepsDone || isSetupCompleted
                        ? 'All Verification Steps Completed! Click to Access Your Dashboard'
                        : !profileSaved
                        ? 'Pending: Save Profile Details to continue'
                        : !aadhaarVerified
                        ? 'Pending: Complete Aadhaar Verification'
                        : !employmentVerified
                        ? 'Pending: Complete Employment Verification'
                        : !voterVerified
                        ? 'Pending: Complete Voter ID Verification'
                        : !isRefDone
                        ? 'Pending: Behavioral Reference verification (Referee feedback required)'
                        : !isEduDone
                        ? 'Pending: Add & verify Degree or Certification'
                        : !dlVerified
                        ? 'Pending: Complete Driving License OCR Verification'
                        : 'Please complete all verification steps to unlock your Dashboard'}
                    </h5>
                  </div>
                  <div className="d-flex flex-column flex-xl-row align-items-center gap-3">
                    {/* Circular Score Gauge at the End */}
                    <KycScoreGauge score={score} />

                    <button
                      type="button"
                      onClick={handleFinish}
                      className={`btn px-4 py-3 font-weight-bold ${
                        allStepsDone || isSetupCompleted ? 'btn-primary-teal' : 'btn-secondary'
                      }`}
                      style={{
                        cursor: (allStepsDone || isSetupCompleted) ? 'pointer' : 'not-allowed',
                        opacity: (allStepsDone || isSetupCompleted) ? 1 : 0.45,
                        background: (allStepsDone || isSetupCompleted)
                          ? 'linear-gradient(135deg, #00D294 0%, #059669 100%)'
                          : '#475569',
                        border: 'none',
                        color: (allStepsDone || isSetupCompleted) ? '#FFFFFF' : '#CBD5E1',
                        boxShadow: (allStepsDone || isSetupCompleted)
                          ? '0 4px 14px rgba(0, 210, 148, 0.4)'
                          : 'none',
                        transition: 'all 0.3s ease',
                      }}
                      disabled={!allStepsDone && !isSetupCompleted}
                      title={!allStepsDone && !isSetupCompleted ? `Complete all 7 KYC verification steps to proceed (Completed: ${completedStepsCount}/7)` : 'Setup complete — click to access profile dashboard'}
                    >
                      Continue to Profile Dashboard →
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
      <AadhaarSuccessModal
        isOpen={kycSuccessModal.isOpen}
        onClose={() => setKycSuccessModal((prev) => ({ ...prev, isOpen: false }))}
        title={kycSuccessModal.title}
        pointsEarned={kycSuccessModal.pointsEarned}
        badgeText={kycSuccessModal.badgeText}
        description={kycSuccessModal.description}
        buttonText={kycSuccessModal.buttonText || 'Proceed to Next Step'}
        onContinue={handleModalProceed}
      />
          </div>
  );
};

export default KYCVerification;
