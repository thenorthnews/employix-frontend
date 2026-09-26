import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Footer from '../components/common/Footer';
import ButtonSpinner from '../components/common/Loader';
import ProfileNavbar from '../components/common/ProfileNavbar';
import ProfessionalReferenceSection from '../components/profile/ProfessionalReferenceSection';
import { updateUserKycStatus, updateProfileSuccess } from '../redux/slices/authSlice';
import {
  verifyPanApi,
  extractPanOcrApi,
  verifyAadhaarApi,
  verifyVoterApi,
  verifyVoterOcrApi,
  getKycStatusApi,
  fetchEmploymentHistoryApi,
  fetchEmploymentByUanApi,
  addManualEmploymentApi,
  getEmploymentRecordsApi,
  deleteManualEmploymentApi,
  getQualificationsApi,
  addQualificationApi,
  deleteQualificationApi,
  getCertificationsApi,
  addCertificationApi,
  deleteCertificationApi,
  verifyDlOcrApi,
  completeKycSetupApi,
} from '../api/kycApi';
import { updateProfileApi, getProfileApi } from '../api/authApi';

const KycVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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
  const [score, setScore] = useState(0);
  const [scoreTier, setScoreTier] = useState('Base Profile · Not Verified');

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
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(user?.image || user?.profileImage || null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(initialDesignation.length > 0);

  // STEP 2: Aadhaar State (OCR Scan & Verification)
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(null);
  // Default disabled (false) as required
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarResult, setAadhaarResult] = useState(null);

  // STEP 3: Employment Verification State
  const [empMethod, setEmpMethod] = useState('uan'); // 'uan' | 'manual'
  const [uanNumber, setUanNumber] = useState('');     // 12-digit UAN
  const [empMobile, setEmpMobile] = useState('');     // Mobile fallback
  // Default disabled (false) as required
  const [empConsent, setEmpConsent] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [employmentVerified, setEmploymentVerified] = useState(false);
  const [epfoRecords, setEpfoRecords] = useState([]);
  const [manualJobs, setManualJobs] = useState([]);
  // Manual job form
  const [jobForm, setJobForm] = useState({ companyName: '', designation: '', startDate: '', endDate: '', isCurrent: false, description: '' });
  const [jobFormLoading, setJobFormLoading] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  // STEP 4: Address Proof via Voter ID State (Dual Option: Option 1 = EPIC Number, Option 2 = OCR)
  const [voterMethod, setVoterMethod] = useState('number'); // 'number' | 'ocr'
  const [voterNumber, setVoterNumber] = useState('');
  const [voterFront, setVoterFront] = useState(null);
  const [voterFrontPreview, setVoterFrontPreview] = useState(null);
  const [voterBack, setVoterBack] = useState(null);
  const [voterBackPreview, setVoterBackPreview] = useState(null);
  // Default disabled (false) as required
  const [voterConsent, setVoterConsent] = useState(false);
  const [voterLoading, setVoterLoading] = useState(false);
  const [voterVerified, setVoterVerified] = useState(false);
  const [voterResult, setVoterResult] = useState(null);
  const [addressText, setAddressText] = useState('Flat 402, Green Valley Apartments, Outer Ring Road, Bengaluru, Karnataka - 560103');

  // STEP 5: Driving License (DL) State (OCR Scan)
  const [dlFront, setDlFront] = useState(null);
  const [dlFrontPreview, setDlFrontPreview] = useState(null);
  const [dlBack, setDlBack] = useState(null);
  const [dlBackPreview, setDlBackPreview] = useState(null);
  // Default disabled (false) as required
  const [dlConsent, setDlConsent] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlVerified, setDlVerified] = useState(false);
  const [dlResult, setDlResult] = useState(null);

  // STEP 6: Educational Qualifications & Professional Certifications
  const [qualifications, setQualifications] = useState([]);
  const [certifications, setCertifications] = useState([]);
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

  const calculateDynamicScore = (isAadhaarDone, isEmpDone, isVoterDone, isDlDone, isEduDone, isEduVerified = false, refCount = 0) => {
    const aadhaarPts = isAadhaarDone ? 20 : 0;
    const voterPts = isVoterDone ? 20 : 0;
    const eduPts = isEduVerified ? 20 : 0;
    const empPts = isEmpDone ? 30 : 0;
    const validRefs = Math.min(2, Math.max(0, refCount));
    const refPts = validRefs * 5;

    const earned = aadhaarPts + voterPts + eduPts + empPts + refPts;
    const applicable = 100;
    const finalScore = Math.min(100, Math.round((earned / applicable) * 100));
    setScore(finalScore);

    if (finalScore >= 80) {
      setScoreTier('Platinum Tier · Highly Trusted');
    } else if (finalScore >= 60) {
      setScoreTier('Gold Tier · Verified Candidate');
    } else if (finalScore >= 20) {
      setScoreTier('Silver Tier · Partially Verified');
    } else {
      setScoreTier('Base Profile · Not Verified');
    }
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

  // Load existing profile & KYC verification status on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetchingStatus(true);

        // Fetch User Profile from /users/me
        try {
          const profileRes = await getProfileApi();
          const pData = profileRes.data || profileRes;
          if (pData) {
            if (pData.name) setFullName(pData.name);
            if (pData.email) setEmail(pData.email);
            if (pData.phoneNumber) setPhone(pData.phoneNumber);
            const fetchedDesignation = (pData.designation || '').trim();
            setDesignation(fetchedDesignation);
            if (pData.address) setAddressText(pData.address);
            if (pData.profileImage || pData.profileImage) {
              setProfilePhotoPreview(pData.image || pData.profileImage);
            }
            if (pData.voterStatus === 1) setVoterVerified(true);
  
            if (fetchedDesignation.length > 0) {
              setProfileSaved(true);
            } else {
              setProfileSaved(false);
            }
          }
        } catch (pErr) {
          console.warn('Could not fetch user profile:', pErr.message);
        }

        // Fetch Qualifications & Certifications
        let loadedQuals = [];
        let loadedCerts = [];
        try {
          const qualRes = await getQualificationsApi();
          const qualData = qualRes.data?.data || qualRes.data || qualRes;
          if (Array.isArray(qualData)) {
            loadedQuals = qualData;
            setQualifications(qualData);
          }
        } catch (qErr) {
          console.warn('Could not fetch qualifications:', qErr.message);
        }

        try {
          const certRes = await getCertificationsApi();
          const certData = certRes.data?.data || certRes.data || certRes;
          if (Array.isArray(certData)) {
            loadedCerts = certData;
            setCertifications(certData);
          }
        } catch (cErr) {
          console.warn('Could not fetch certifications:', cErr.message);
        }

        // Fetch KYC Status from /user-portal/kyc/status
        const kycRes = await getKycStatusApi();
        const kData = kycRes.data || kycRes;

        const isAadhaarDone = kData.aadhaarStatus === 1;
        const isEmpDone = kData.employmentStatus === 1;
        const isVoterDone = kData.voterStatus === 1;
        const isDlDone = kData.dlStatus === 1 || Boolean(kData.dlData);
        const isEduDone = loadedQuals.length > 0 || loadedCerts.length > 0 || kData.educationStatus === 1;

        if (isAadhaarDone) {
          setAadhaarVerified(true);
          setAadhaarResult(
            kData.aadhaarData || {
              maskedDocumentNumber: 'XXXX-XXXX-8921',
              name: user?.name || fullName,
              scoreEarned: 20,
            }
          );
        }

        if (isVoterDone) {
          setVoterVerified(true);
          setVoterResult(kData.voterData || null);
          if (kData.voterData?.address?.fullAddress) {
            setAddressText(kData.voterData.address.fullAddress);
          }
        }

        if (isDlDone) {
          setDlVerified(true);
          setDlResult(kData.dlData || null);
        }

        // Load existing employment records
        if (isEmpDone) {
          setEmploymentVerified(true);
          try {
            const empRes = await getEmploymentRecordsApi();
            const empData = empRes.data || empRes;
            if (empData.manualRecords) setManualJobs(empData.manualRecords);
            if (empData.epfoRecords) setEpfoRecords(empData.epfoRecords);
          } catch (e) { /* silent */ }
        }

        if (kData.employixScore !== undefined && kData.employixScore !== null) {
          setScore(parseFloat(kData.employixScore.toFixed(1)));
          if (kData.employixScore >= 80) setScoreTier('Platinum Tier · Highly Trusted');
          else if (kData.employixScore >= 60) setScoreTier('Gold Tier · Verified Candidate');
          else if (kData.employixScore >= 20) setScoreTier('Silver Tier · Partially Verified');
          else setScoreTier('Base Profile · Not Verified');
        } else {
          const hasVerifiedEdu = loadedQuals.some(q => q.isVerified && q.verificationStatus === 'verified') || loadedCerts.some(c => c.isVerified && c.verificationStatus === 'verified');
          calculateDynamicScore(isAadhaarDone, isEmpDone, isVoterDone, isDlDone, isEduDone, hasVerifiedEdu);
        }

        // Restore kycStatus (preserve status 8 if completed)
        const isStatus8 = kData.kycStatus === 8 || user?.kycStatus === 8 || localStorage.getItem(`employix_setup_completed_${currentUserId}`) === 'true';
        if (isStatus8) {
          setKycStatus(8);
          setProfileSaved(true);
        } else if (kData.kycStatus) {
          setKycStatus(kData.kycStatus);
        }
        // If all steps done mark profile saved and status 7 (unless already 8)
        if (isAadhaarDone && isEmpDone && isVoterDone && isDlDone && isEduDone) {
          setProfileSaved(true);
          if (!isStatus8) {
            setKycStatus(7);
          }
        }
      } catch (err) {
        console.warn('Could not fetch DB KYC status:', err.message);
        calculateDynamicScore(false, false, false, false, false);
      } finally {
        setFetchingStatus(false);
      }
    };

    fetchInitialData();
  }, [user]);

  // Handle Photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
      setProfileSaved(false);
    }
  };

  // Handle Step 1 Save (Personal Profile & Designation)
  const handleSaveProfile = async (e, isSilent = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (profileSaved) return;
    if (!designation.trim()) {
      if (!isSilent) toast.error('Please enter your Current Role / Professional Designation.');
      return;
    }

    setProfileSaving(true);
    try {
      const formData = new FormData();
      if (fullName) formData.append('name', fullName.trim());
      if (phone) formData.append('phoneNumber', phone.trim());
      formData.append('designation', designation.trim());
      if (addressText) formData.append('address', addressText.trim());
      if (profilePhotoFile) formData.append('image', profilePhotoFile);
      const res = await updateProfileApi(formData);
      const updated = res?.data || res;

      dispatch(
        updateProfileSuccess({
          name: updated?.name || fullName,
          designation: updated?.designation || designation,
          phoneNumber: updated?.phoneNumber || phone,
          address: addressText,
          profileImage: updated?.image || updated?.profileImage || profilePhotoPreview,
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
        toast.success('Profile details saved successfully.');
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

  // Validate document file helper (JPEG, JPG, PNG, PDF <= 5MB)
  const validateDocFile = (file) => {
    if (!file) return false;
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      toast.error('Invalid file format. Supported formats: JPEG, JPG, PNG, PDF.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit. Maximum file size: 5MB.');
      return false;
    }
    return true;
  };

  // Submit Aadhaar Verification - Option 2: OCR Upload
  const handleVerifyAadhaarOcr = async (e) => {
    e.preventDefault();
    if (!aadhaarConsent) {
      toast.error('Please give consent to scan Aadhaar.');
      return;
    }
    if (!aadhaarFront || !aadhaarBack) {
      toast.error('Aadhaar Card ka Front aur Back dono photos upload karna compulsory hai.');
      return;
    }

    setAadhaarLoading(true);
    try {
      const formData = new FormData();
      formData.append('documentFront', aadhaarFront);
      formData.append('documentBack', aadhaarBack);
      formData.append('consent', aadhaarConsent ? 'true' : 'false');
      formData.append('consentPurpose', 'UIDAI Aadhaar OCR scan for Employix Trust Profile');

      const res = await verifyAadhaarApi(formData);
      const data = res.data?.data || res.data || res;

      setAadhaarVerified(true);
      setAadhaarResult(data);
      if (data.address?.fullAddress) {
        setAddressText(data.address.fullAddress);
      }
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      calculateDynamicScore(true, employmentVerified, voterVerified, dlVerified, hasEdu);

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
          employixScore: data.newScore || score + 20,
          kycStatus: nextKyc,
        })
      );
      toast.success('Aadhaar verified successfully (+20 points).');
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Aadhaar verification failed.';
      const lower = String(msg).toLowerCase();
      if (
        lower.includes('non compliant') ||
        lower.includes('quality standard') ||
        lower.includes('not compliant') ||
        lower.includes('document_quality')
      ) {
        msg = 'Uploaded document is not a valid Aadhaar card. Please upload a clear photo of your original Aadhaar card (Front & Back).';
      }
      toast.error(msg);
    } finally {
      setAadhaarLoading(false);
    }
  };

  // Submit Voter ID Address Verification - Option 1: EPIC Number
  const handleVerifyVoterNumber = async (e) => {
    e.preventDefault();
    if (!voterConsent) {
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
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      calculateDynamicScore(aadhaarVerified, employmentVerified, true, dlVerified, hasEdu);

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
          address: data.address?.fullAddress || addressText,
          employixScore: data.newScore || score + 20,
          kycStatus: newKycSt,
        })
      );
      toast.success('Voter ID and address verified successfully (+20 points).');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Voter ID verification failed.');
    } finally {
      setVoterLoading(false);
    }
  };

  // Submit Voter ID Address Verification - Option 2: OCR Document Upload
  const handleVerifyVoterOcr = async (e) => {
    e.preventDefault();
    if (!voterConsent) {
      toast.error('Please give consent to scan Voter ID.');
      return;
    }
    if (!voterFront || !voterBack) {
      toast.error('Voter ID ka Front aur Back dono photos upload karna compulsory hai.');
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
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      calculateDynamicScore(aadhaarVerified, employmentVerified, true, dlVerified, hasEdu);

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
          address: data.address?.fullAddress || addressText,
          employixScore: data.newScore || score + 20,
          kycStatus: ocrKycSt,
        })
      );
      toast.success('Voter ID and address verified successfully (+20 points).');
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

      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      calculateDynamicScore(aadhaarVerified, employmentVerified, voterVerified, true, hasEdu);

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
          employixScore: data.newScore || Math.min(100, score + 5),
          kycStatus: dlNextKyc,
        })
      );
      toast.success('Driving License verified successfully (+5 points).');
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
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      calculateDynamicScore(aadhaarVerified, true, voterVerified, dlVerified, hasEdu);

      const nextStatus = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: true,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextStatus);
      dispatch(updateUserKycStatus({ employmentStatus: 1, kycStatus: nextStatus }));
      toast.success('Employment records verified successfully (+35 points).');
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
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      calculateDynamicScore(aadhaarVerified, true, voterVerified, dlVerified, hasEdu);

      const nextStatus = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: true,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextStatus);
      dispatch(updateUserKycStatus({ employmentStatus: 1, kycStatus: nextStatus }));
      toast.success('Employment records verified successfully (+35 points).');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'EPFO fetch failed. Try adding manually.');
    } finally {
      setEmpLoading(false);
    }
  };

  // Option B: Add Manual Job
  const handleAddManualJob = async (e) => {
    e.preventDefault();
    if (!jobForm.companyName || !jobForm.designation || !jobForm.startDate) {
      toast.error('Company name, designation, and start date are required.');
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
      const hasEdu = qualifications.length > 0 || certifications.length > 0;
      calculateDynamicScore(aadhaarVerified, true, voterVerified, dlVerified, hasEdu);

      const nextStatus = data.kycStatus || recomputeKyc({
        isAadhaar: aadhaarVerified,
        isEmp: true,
        isVoter: voterVerified,
        isDl: dlVerified,
        hasEdu,
        isProfile: profileSaved,
      });
      setKycStatus(nextStatus);
      dispatch(updateUserKycStatus({ employmentStatus: 1, kycStatus: nextStatus }));
      toast.success('Employment record added successfully (+35 points).');
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
      setManualJobs(prev => prev.filter(j => j._id !== id));
      if (data.employmentStatus === 0) {
        setEmploymentVerified(false);
        const hasEdu = qualifications.length > 0 || certifications.length > 0;
        const nextStatus = recomputeKyc({
          isAadhaar: aadhaarVerified,
          isEmp: false,
          isVoter: voterVerified,
          isDl: dlVerified,
          hasEdu,
          isProfile: profileSaved,
        });
        setKycStatus(nextStatus);
        dispatch(updateUserKycStatus({ employmentStatus: 0, kycStatus: nextStatus }));
        calculateDynamicScore(aadhaarVerified, false, voterVerified, dlVerified, hasEdu);
      }
      toast.success('Employment record removed.');
    } catch (err) {
      toast.error('Failed to delete record.');
    }
  };

  // Helper to recompute overall KYC status for education
  const updateEducationKycStatus = (qualsList, certsList) => {
    const hasEdu = (qualsList && qualsList.length > 0) || (certsList && certsList.length > 0);
    const computedStatus = recomputeKyc({
      isAadhaar: aadhaarVerified,
      isEmp: employmentVerified,
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
      calculateDynamicScore(aadhaarVerified, employmentVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu);
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
      calculateDynamicScore(aadhaarVerified, employmentVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu);
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
      calculateDynamicScore(aadhaarVerified, employmentVerified, voterVerified, dlVerified, hasEdu, hasVerifiedEdu);
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
      const hasEdu = qualifications.length > 0 || updatedCerts.length > 0;
      calculateDynamicScore(aadhaarVerified, employmentVerified, voterVerified, dlVerified, hasEdu);
      toast.success('Certification record deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete certification.');
    }
  };

  const handleFinish = async () => {
    if (kycStatus === 8 || isSetupCompleted) {
      navigate('/profile');
      return;
    }

    const hasEdu = qualifications.length > 0 || certifications.length > 0;
    if (kycStatus < 7) {
      if (!profileSaved) {
        toast.error('Step 1 incomplete: Please click "Save Profile Details" first.');
      } else if (!aadhaarVerified) {
        toast.error('Step 2 incomplete: Aadhaar verification is required.');
      } else if (!employmentVerified) {
        toast.error('Step 3 incomplete: Employment verification is required.');
      } else if (!voterVerified) {
        toast.error('Step 4 incomplete: Voter ID verification is required.');
      } else if (!dlVerified) {
        toast.error('Step 5 incomplete: Driving License verification is required.');
      } else if (!hasEdu) {
        toast.error('Step 6 incomplete: At least 1 Degree or Certification is required.');
      } else {
        toast.error(`Please complete all 6 KYC verification steps (Current Status: ${kycStatus}/7).`);
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
    toast.success('KYC setup complete! Status updated to 8. Welcome to your Profile Dashboard.');
    navigate('/profile');
  };

  return (
    <>
      <ProfileNavbar />
      <main className="flex-grow-1" style={{ overflowX: 'hidden' }}>
        {/* Top Hero Banner */}
        <div className="auth-top-banner text-center position-relative overflow-hidden py-4">
          <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
          <div className="hero-glow-orb orb-teal" aria-hidden="true"></div>
          <div className="hero-glow-orb orb-blue" aria-hidden="true"></div>
          <div className="container position-relative py-2" style={{ zIndex: 2 }}>
            <h1 className="page-banner-title mb-1" style={{ fontSize: '1.9rem', fontWeight: 700 }}>
              Candidate Profile &amp; <span className="text-teal">KYC Verification</span>
            </h1>
            <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
              Complete your candidate details and official verifications to activate your Employix Trust Profile.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <section className="auth-section py-5 position-relative overflow-hidden" style={{ overflowX: 'hidden' }}>
          <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
          <div className="container position-relative" style={{ zIndex: 3 }}>
            
            {/* STEP 1: Personal Profile, Designation & Photo Setup */}
            <div className="row justify-content-center mb-5">
              <div className="col-lg-10">
                <div className="auth-card p-4 p-md-5">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 1</span>
                      <h3 className="auth-card-heading mb-0">Candidate Profile &amp; Professional Designation</h3>
                    </div>
                    {profileSaved && (
                      <span className="badge badge-success px-3 py-2 font-weight-bold">
                        &#10003; PROFILE SAVED
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveProfile}>
                    <div className="row align-items-center mb-4">
                      {/* Profile Photo Uploader */}
                      <div className="col-md-3 text-center mb-4 mb-md-0">
                        <div className="setup-photo-wrap mb-2">
                          {profilePhotoPreview ? (
                            <img
                              src={profilePhotoPreview}
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
                          {!profileSaved && (
                            <>
                              <label htmlFor="photoUploadInput" className="setup-photo-badge" title="Change Photo">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                              </label>
                              <input
                                type="file"
                                id="photoUploadInput"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                style={{ display: 'none' }}
                              />
                            </>
                          )}
                        </div>
                        <span className="small text-muted font-weight-bold d-block">
                          {profileSaved ? 'Verified Profile Photo' : 'Upload Profile Photo'}
                        </span>
                      </div>

                      {/* Full Name & Details */}
                      <div className="col-md-9">
                        <div className="row g-3">
                          {/* Full Name (Full width, Prefix removed) */}
                          <div className="col-12 mb-3">
                            <label className="auth-label">Full Name</label>
                            <input
                              type="text"
                              className={`form-control auth-input-group px-3 py-2 ${profileSaved ? 'bg-light text-muted' : ''}`}
                              value={fullName}
                              disabled={profileSaved}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g. Full Name"
                              required
                            />
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
                            <label className="auth-label">Mobile Number</label>
                            <div className="input-group">
                              <div className="input-group-prepend">
                                <span className="input-group-text bg-light font-weight-bold text-dark border-right-0" style={{ borderRadius: '30px 0 0 30px' }}>
                                  +91
                                </span>
                              </div>
                              <input
                                type="tel"
                                className={`form-control auth-input-group px-3 ${profileSaved ? 'bg-light text-muted' : ''}`}
                                style={{ borderRadius: '0 30px 30px 0' }}
                                value={phone}
                                disabled={profileSaved}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="9876543210"
                              />
                            </div>
                          </div>

                          {/* Designation */}
                          <div className="col-12 mb-3">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <label className="auth-label mb-0">
                                Professional Designation / Role <span className="text-danger">*</span>
                              </label>
                              {profileSaved && (
                                <span className="badge badge-success px-2 py-1 small">
                                  ✓ Saved &amp; Locked
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              className={`form-control auth-input-group px-3 py-2 ${profileSaved ? 'bg-light text-muted' : ''}`}
                              value={designation}
                              disabled={profileSaved}
                              onChange={(e) => setDesignation(e.target.value)}
                              placeholder="e.g. Senior Full Stack Engineer · TechCorp Solutions"
                              required
                            />
                            {profileSaved && (
                              <small className="text-success font-weight-bold mt-1 d-block">
                                ✓ Designation details saved and locked.
                              </small>
                            )}
                          </div>
                        </div>

                        <div className="text-right mt-2">
                          <button
                            type="submit"
                            className={`btn px-4 py-2 font-weight-bold ${
                              profileSaved ? 'btn-secondary text-white' : 'btn-primary-teal'
                            }`}
                            disabled={profileSaving || profileSaved}
                            style={{ cursor: profileSaved ? 'not-allowed' : 'pointer' }}
                          >
                            {profileSaving ? (
                              <ButtonSpinner text="Saving Profile..." />
                            ) : profileSaved ? (
                              '✓ Profile Details Saved'
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

            {/* STEP 2: Aadhaar Identity Verification (Number OR OCR) */}
            <div className="row justify-content-center mb-5">
              <div className="col-lg-10">
                <div className="auth-card p-4 p-md-5">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 2</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Aadhaar Identity Verification</h3>
                        <p className="small text-muted mb-0">Official UIDAI Identity Verification (+20 Points Boost)</p>
                      </div>
                    </div>

                    {aadhaarVerified ? (
                      <span className="badge badge-success px-3 py-2 font-weight-bold">
                        &#10003; AADHAAR VERIFIED
                      </span>
                    ) : (
                      <span className="badge badge-light text-muted px-3 py-2 font-weight-bold border">
                        📷 Aadhaar Document OCR Upload
                      </span>
                    )}
                  </div>

                  {aadhaarVerified ? (
                    <div className="p-4 rounded-lg bg-light border border-success">
                      <div className="d-flex align-items-center justify-content-between flex-wrap pb-3 mb-3 border-bottom">
                        <div className="d-flex align-items-center mb-2 mb-sm-0">
                          <div className="stat-icon-light bg-teal-light mr-3" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-teal h4 mb-0 font-weight-bold">&#10003;</span>
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
                        <span className="badge badge-success px-3 py-2 font-weight-bold">+20 Points Secured</span>
                      </div>

                      {/* Complete Extracted Aadhaar Details */}
                      <div className="row g-3 mt-1">
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Full Name</span>
                          <strong className="text-dark">{aadhaarResult?.name || fullName || 'Mohmmed Saif Faruqi'}</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Aadhaar Number</span>
                          <strong className="text-dark">{aadhaarResult?.maskedDocumentNumber || 'XXXX-XXXX-1992'}</strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Date of Birth (DOB)</span>
                          <strong className="text-dark">
                            {aadhaarResult?.dob
                              ? (typeof aadhaarResult.dob === 'string' && aadhaarResult.dob.includes('T')
                                  ? new Date(aadhaarResult.dob).toLocaleDateString('en-GB')
                                  : aadhaarResult.dob)
                              : '31/07/2000'}
                          </strong>
                        </div>
                        <div className="col-sm-6 col-md-4 mb-2">
                          <span className="text-muted small d-block">Gender</span>
                          <strong className="text-dark" style={{ textTransform: 'capitalize' }}>
                            {aadhaarResult?.gender || 'Male'}
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
                        {(aadhaarResult?.address?.fullAddress || typeof aadhaarResult?.address === 'string' || addressText) && (
                          <div className="col-12 mt-2 pt-2 border-top">
                            <span className="text-muted small d-block">Registered Address</span>
                            <span className="text-dark font-weight-bold small">
                              {aadhaarResult?.address?.fullAddress || (typeof aadhaarResult?.address === 'string' ? aadhaarResult.address : addressText)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyAadhaarOcr}>
                          <div className="row g-3 mb-4">
                            <div className="col-md-6 mb-3">
                              <label className="auth-label">Aadhaar Card Front Document *</label>
                              <div className="kyc-upload-dropzone p-4 text-center border rounded">
                                {aadhaarFrontPreview ? (
                                  aadhaarFrontPreview === 'pdf' ? (
                                    <div className="p-3 bg-light rounded text-teal font-weight-bold mb-2 small">
                                      📄 {aadhaarFront?.name || 'Aadhaar Front (PDF)'}
                                    </div>
                                  ) : (
                                    <img src={aadhaarFrontPreview} alt="Aadhaar Front" className="kyc-preview-thumb mb-2" />
                                  )
                                ) : (
                                  <div className="kyc-upload-icon">&#128247;</div>
                                )}
                                <input
                                  type="file"
                                  className="form-control-file mt-2"
                                  accept=".jpeg,.jpg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    if (f && validateDocFile(f)) {
                                      setAadhaarFront(f);
                                      setAadhaarFrontPreview(f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : URL.createObjectURL(f));
                                    }
                                  }}
                                  required
                                />
                                <small className="text-muted d-block mt-1">
                                  Supported formats: JPEG, JPG, PNG, PDF. Mandatory. Maximum file size: 5MB.
                                </small>
                              </div>
                            </div>

                            <div className="col-md-6 mb-3">
                              <label className="auth-label">Aadhaar Card Back Document * (Mandatory with Address)</label>
                              <div className="kyc-upload-dropzone p-4 text-center border rounded">
                                {aadhaarBackPreview ? (
                                  aadhaarBackPreview === 'pdf' ? (
                                    <div className="p-3 bg-light rounded text-teal font-weight-bold mb-2 small">
                                      📄 {aadhaarBack?.name || 'Aadhaar Back (PDF)'}
                                    </div>
                                  ) : (
                                    <img src={aadhaarBackPreview} alt="Aadhaar Back" className="kyc-preview-thumb mb-2" />
                                  )
                                ) : (
                                  <div className="kyc-upload-icon">&#128247;</div>
                                )}
                                <input
                                  type="file"
                                  className="form-control-file mt-2"
                                  accept=".jpeg,.jpg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    if (f && validateDocFile(f)) {
                                      setAadhaarBack(f);
                                      setAadhaarBackPreview(f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : URL.createObjectURL(f));
                                    }
                                  }}
                                  required
                                />
                                <small className="text-muted d-block mt-1">
                                  Supported formats: JPEG, JPG, PNG, PDF. Mandatory. Maximum file size: 5MB.
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="kyc-consent-box p-3 rounded mb-4">
                            <div className="form-check d-flex align-items-start">
                              <input
                                className="form-check-input mt-1 mr-3"
                                type="checkbox"
                                id="aadhaarOcrConsent"
                                checked={aadhaarConsent}
                                onChange={(e) => setAadhaarConsent(e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor="aadhaarOcrConsent">
                                <div className="kyc-consent-title">Mandatory UIDAI OCR Consent:</div>
                                <div className="kyc-consent-desc">
                                  I grant explicit consent to extract and verify details from my uploaded Aadhaar card document under UIDAI regulations.
                                </div>
                              </label>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary-teal btn-block py-3 font-weight-bold"
                            disabled={aadhaarLoading || !aadhaarConsent || !aadhaarFront || !aadhaarBack}
                          >
                            {aadhaarLoading ? <ButtonSpinner text="Scanning Aadhaar Card..." /> : 'Scan & Verify Aadhaar (OCR) (+20 Points)'}
                          </button>
                        </form>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: Employment Verification */}
            <div className="row justify-content-center mb-5">
              <div className="col-lg-10">
                <div className="auth-card p-4 p-md-5">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 3</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Employment Verification</h3>
                        <p className="small text-muted mb-0">Add employment history via UAN Number, EPFO Mobile, or manually (+35 Points)</p>
                      </div>
                    </div>
                    {employmentVerified ? (
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-success px-3 py-2 font-weight-bold">
                          &#10003; EMPLOYMENT VERIFIED
                        </span>
                        <span className="badge badge-success px-2 py-1 ml-2 font-weight-bold">
                          +35 Points Secured
                        </span>
                      </div>
                    ) : (
                      <div className="kyc-method-tabs d-flex">
                        <button type="button" className={`kyc-method-btn ${empMethod === 'uan' ? 'active' : ''}`} onClick={() => setEmpMethod('uan')}>
                          🆔 UAN Lookup
                        </button>
                        {/* <button type="button" className={`kyc-method-btn ${empMethod === 'mobile' ? 'active' : ''}`} onClick={() => setEmpMethod('mobile')}>
                          📱 Mobile Lookup
                        </button> */}
                        <button type="button" className={`kyc-method-btn ${empMethod === 'manual' ? 'active' : ''}`} onClick={() => setEmpMethod('manual')}>
                          ✏️ Add Manually
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Verified Employment Job Cards */}
                  {(manualJobs.length > 0 || epfoRecords.length > 0) && (
                    <div className="mb-4">
                      <h6 className="font-weight-bold text-dark mb-3">&#128188; Verified Employment History</h6>
                      <div style={{ borderLeft: '3px solid #00D294', paddingLeft: '1rem' }}>
                        {/* EPFO Records */}
                        {epfoRecords.map((epfo, i) =>
                          epfo.records?.map((rec, j) => (
                            <div key={`epfo-${i}-${j}`} className="p-3 mb-3 rounded border" style={{ background: 'rgba(0,210,148,0.04)' }}>
                              <div className="d-flex align-items-start justify-content-between">
                                <div className="d-flex align-items-start">
                                  <div className="stat-icon-light bg-teal-light mr-3 mt-1" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                                    <span className="text-teal" style={{ fontSize: '14px' }}>&#10003;</span>
                                  </div>
                                  <div>
                                    <h6 className="font-weight-bold text-dark mb-0">{rec.employerName}</h6>
                                    <small className="text-muted">{rec.joiningDate} &mdash; {rec.exitDate || 'Present'}</small>
                                    <div className="mt-1">
                                      <span className="badge badge-success px-2 py-1 mr-1" style={{ fontSize: '10px' }}>&#10003; EPFO Authenticated</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {/* Manual Records */}
                        {manualJobs.map((job) => (
                          <div key={job._id} className="p-3 mb-3 rounded border" style={{ background: 'rgba(0,210,148,0.04)' }}>
                            <div className="d-flex align-items-start justify-content-between">
                              <div className="d-flex align-items-start">
                                <div className="stat-icon-light bg-teal-light mr-3 mt-1" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                                  <span className="text-teal" style={{ fontSize: '14px' }}>&#10003;</span>
                                </div>
                                <div>
                                  <h6 className="font-weight-bold text-dark mb-0">{job.designation}</h6>
                                  <div className="text-teal font-weight-bold small">{job.companyName}</div>
                                  <small className="text-muted">{job.startDate} &mdash; {job.isCurrent ? 'Present' : (job.endDate || '—')}</small>
                                  {job.description && <p className="small text-muted mt-1 mb-1">{job.description}</p>}
                                  <div className="mt-1">
                                    <span className="badge badge-secondary px-2 py-1 mr-1" style={{ fontSize: '10px' }}>&#10003; Manually Added</span>
                                  </div>
                                </div>
                              </div>
                              {!isSetupCompleted && kycStatus !== 8 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger ml-2"
                                  onClick={() => handleDeleteJob(job._id)}
                                  title="Remove record"
                                  style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0, lineHeight: 1 }}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option A1: UAN Number Lookup */}
                  {!employmentVerified && empMethod === 'uan' && (
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
                        {empLoading ? <ButtonSpinner text="Fetching UAN Records..." /> : '📊 Fetch Employment History via UAN (+35 Points)'}
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
                        {empLoading ? <ButtonSpinner text="Fetching EPFO Records..." /> : '&#128202; Fetch EPFO Employment History (+35 Points)'}
                      </button>
                    </form>
                  )}

                  {/* Manual Option */}
                  {empMethod === 'manual' && (
                    <div>
                      {!showJobForm ? (
                        <div className="text-center py-3">
                          <p className="text-muted mb-3">
                            {manualJobs.length > 0 ? `${manualJobs.length} employment record(s) added.` : 'No employment records added yet.'}
                          </p>
                          <button type="button" className="btn btn-primary-teal px-4 py-2 font-weight-bold" onClick={() => setShowJobForm(true)}>
                            + Add Employment Record
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleAddManualJob} className="mt-2">
                          <div className="row g-3">
                            <div className="col-md-6 mb-3">
                              <label className="auth-label">Company / Organization Name *</label>
                              <input type="text" className="form-control auth-input-group px-3 py-2" placeholder="e.g. TechCorp Solutions Pvt Ltd" value={jobForm.companyName} onChange={e => setJobForm(p => ({...p, companyName: e.target.value}))} required />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="auth-label">Designation / Role *</label>
                              <input type="text" className="form-control auth-input-group px-3 py-2" placeholder="e.g. Senior Full Stack Engineer" value={jobForm.designation} onChange={e => setJobForm(p => ({...p, designation: e.target.value}))} required />
                            </div>
                            <div className="col-md-5 mb-3">
                              <label className="auth-label">Start Date *</label>
                              <input type="month" className="form-control auth-input-group px-3 py-2" value={jobForm.startDate} onChange={e => setJobForm(p => ({...p, startDate: e.target.value}))} required />
                            </div>
                            <div className="col-md-5 mb-3">
                              <label className="auth-label">End Date</label>
                              <input type="month" className="form-control auth-input-group px-3 py-2" value={jobForm.endDate} onChange={e => setJobForm(p => ({...p, endDate: e.target.value}))} disabled={jobForm.isCurrent} />
                            </div>
                            <div className="col-md-2 mb-3 d-flex align-items-end">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="isCurrentJob" checked={jobForm.isCurrent} onChange={e => setJobForm(p => ({...p, isCurrent: e.target.checked, endDate: ''}))} />
                                <label className="form-check-label small" htmlFor="isCurrentJob">Current Job</label>
                              </div>
                            </div>
                            <div className="col-12 mb-3">
                              <label className="auth-label">Job Description (optional)</label>
                              <textarea className="form-control auth-input-group px-3 py-2" rows={2} placeholder="Brief description of your role and responsibilities" value={jobForm.description} onChange={e => setJobForm(p => ({...p, description: e.target.value}))} />
                            </div>
                          </div>
                          <div className="d-flex gap-2 justify-content-end">
                            <button type="button" className="btn btn-outline-dark-custom px-4 py-2" onClick={() => setShowJobForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary-teal px-4 py-2 font-weight-bold" disabled={jobFormLoading}>
                              {jobFormLoading ? <ButtonSpinner text="Saving..." /> : 'Save Employment Record'}
                            </button>
                          </div>
                        </form>
                      )}
                      {manualJobs.length > 0 && !showJobForm && !isSetupCompleted && kycStatus !== 8 && (
                        <div className="text-center mt-2">
                          <button type="button" className="btn btn-sm btn-outline-dark-custom px-3" onClick={() => setShowJobForm(true)}>+ Add Another Job</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 4: Address Proof via Voter ID Card */}
            <div className="row justify-content-center mb-5">
              <div className="col-lg-10">
                <div className="auth-card p-4 p-md-5">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 4</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Address Verification via Voter ID Card</h3>
                        <p className="small text-muted mb-0">Election Commission of India (ECI) Residential Address Proof (+20 Points)</p>
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
                          onClick={() => setVoterMethod('number')}
                        >
                          🔢 Voter ID Number
                        </button>
                        <button
                          type="button"
                          className={`kyc-method-btn ${voterMethod === 'ocr' ? 'active' : ''}`}
                          onClick={() => setVoterMethod('ocr')}
                        >
                          📷 Voter Card OCR Upload
                        </button>
                      </div>
                    )}
                  </div>

                  {voterVerified ? (
                    <div className="p-4 rounded-lg bg-light border border-success">
                      <div className="d-flex align-items-center justify-content-between flex-wrap pb-3 mb-3 border-bottom">
                        <div className="d-flex align-items-center mb-2 mb-sm-0">
                          <div className="stat-icon-light bg-teal-light mr-3" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-teal h4 mb-0 font-weight-bold">&#10003;</span>
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
                        <span className="badge badge-success px-3 py-2 font-weight-bold">+20 Points Secured</span>
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
                            {voterResult?.gender || 'Male'}
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
                        {(voterResult?.address?.fullAddress || typeof voterResult?.address === 'string' || addressText) && (
                          <div className="col-12 mt-2 pt-2 border-top">
                            <span className="text-muted small d-block">Verified Residential Address</span>
                            <span className="text-dark font-weight-bold small">
                              {voterResult?.address?.fullAddress || (typeof voterResult?.address === 'string' ? voterResult.address : addressText)}
                            </span>
                          </div>
                        )}
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
                              maxLength={12}
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
                                checked={voterConsent}
                                onChange={(e) => setVoterConsent(e.target.checked)}
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
                            disabled={voterLoading || !voterConsent || !voterNumber.trim()}
                          >
                            {voterLoading ? <ButtonSpinner text="Verifying Voter ID & Address..." /> : 'Verify Voter ID Address (+20 Points)'}
                          </button>
                        </form>
                      )}

                      {/* Voter Option 2: OCR Upload */}
                      {voterMethod === 'ocr' && (
                        <form onSubmit={handleVerifyVoterOcr}>
                          <div className="row g-3 mb-4">
                            <div className="col-md-6 mb-3">
                              <label className="auth-label">Voter Card Front Document *</label>
                              <div className="kyc-upload-dropzone p-4 text-center border rounded">
                                {voterFrontPreview ? (
                                  voterFrontPreview === 'pdf' ? (
                                    <div className="p-3 bg-light rounded text-teal font-weight-bold mb-2 small">
                                      📄 {voterFront?.name || 'Voter Front (PDF)'}
                                    </div>
                                  ) : (
                                    <img src={voterFrontPreview} alt="Voter Front" className="kyc-preview-thumb mb-2" />
                                  )
                                ) : (
                                  <div className="kyc-upload-icon">&#128247;</div>
                                )}
                                <input
                                  type="file"
                                  className="form-control-file mt-2"
                                  accept=".jpeg,.jpg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    if (f && validateDocFile(f)) {
                                      setVoterFront(f);
                                      setVoterFrontPreview(f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : URL.createObjectURL(f));
                                    }
                                  }}
                                  required
                                />
                                <small className="text-muted d-block mt-1">
                                  Supported formats: JPEG, JPG, PNG, PDF. Mandatory. Maximum file size: 5MB.
                                </small>
                              </div>
                            </div>

                            <div className="col-md-6 mb-3">
                              <label className="auth-label">Voter Card Back Document * (Mandatory with Address)</label>
                              <div className="kyc-upload-dropzone p-4 text-center border rounded">
                                {voterBackPreview ? (
                                  voterBackPreview === 'pdf' ? (
                                    <div className="p-3 bg-light rounded text-teal font-weight-bold mb-2 small">
                                      📄 {voterBack?.name || 'Voter Back (PDF)'}
                                    </div>
                                  ) : (
                                    <img src={voterBackPreview} alt="Voter Back" className="kyc-preview-thumb mb-2" />
                                  )
                                ) : (
                                  <div className="kyc-upload-icon">&#128247;</div>
                                )}
                                <input
                                  type="file"
                                  className="form-control-file mt-2"
                                  accept=".jpeg,.jpg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    if (f && validateDocFile(f)) {
                                      setVoterBack(f);
                                      setVoterBackPreview(f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : URL.createObjectURL(f));
                                    }
                                  }}
                                  required
                                />
                                <small className="text-muted d-block mt-1">
                                  Supported formats: JPEG, JPG, PNG, PDF. Mandatory. Maximum file size: 5MB.
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="kyc-consent-box p-3 rounded mb-4">
                            <div className="form-check d-flex align-items-start">
                              <input
                                className="form-check-input mt-1 mr-3"
                                type="checkbox"
                                id="voterOcrConsent"
                                checked={voterConsent}
                                onChange={(e) => setVoterConsent(e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor="voterOcrConsent">
                                <div className="kyc-consent-title">Address Extraction Consent:</div>
                                <div className="kyc-consent-desc">
                                  I grant explicit consent to extract and verify my residential address from my uploaded Voter Card document.
                                </div>
                              </label>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary-teal btn-block py-3 font-weight-bold"
                            disabled={voterLoading || !voterConsent || !voterFront || !voterBack}
                          >
                            {voterLoading ? <ButtonSpinner text="Scanning Voter Card Address..." /> : 'Scan & Extract Address (OCR) (+20 Points)'}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 5: Driving License (DL) Verification (OCR Document Scan) */}
            <div className="row justify-content-center mb-5">
              <div className="col-lg-10">
                <div className="auth-card p-4 p-md-5">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 5</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Driving License (DL) Verification</h3>
                        <p className="small text-muted mb-0">Government MoRTH Driving License OCR Document Scan (+5 Points)</p>
                      </div>
                    </div>

                    {dlVerified ? (
                      <span className="badge badge-success px-3 py-2 font-weight-bold">
                        &#10003; DRIVING LICENSE VERIFIED
                      </span>
                    ) : (
                      <span className="badge badge-warning px-3 py-2 font-weight-bold">
                        PENDING STEP 5
                      </span>
                    )}
                  </div>

                  {dlVerified ? (
                    <div className="setup-address-box">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="font-weight-bold text-success">&#10003; Official MoRTH Driving License Verified</span>
                        <span className="badge badge-success px-2 py-1">+5 Points Secured</span>
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-md-6 mb-2">
                          <span className="small text-muted d-block">Masked DL Number:</span>
                          <strong className="text-dark h6">{dlResult?.maskedDocumentNumber || 'DL04******2345'}</strong>
                        </div>
                        <div className="col-md-6 mb-2">
                          <span className="small text-muted d-block">Licensee Name:</span>
                          <strong className="text-dark h6">{dlResult?.name || fullName}</strong>
                        </div>
                        {dlResult?.vehicleTypes && (
                          <div className="col-md-6 mb-2">
                            <span className="small text-muted d-block">Authorized Vehicle Types:</span>
                            <span className="badge badge-info px-2 py-1">
                              {Array.isArray(dlResult.vehicleTypes) ? dlResult.vehicleTypes.join(', ') : dlResult.vehicleTypes}
                            </span>
                          </div>
                        )}
                        {dlResult?.dateOfExpiry && (
                          <div className="col-md-6 mb-2">
                            <span className="small text-muted d-block">DL Validity / Expiry:</span>
                            <strong className="text-dark">{new Date(dlResult.dateOfExpiry).toLocaleDateString()}</strong>
                          </div>
                        )}
                        {dlResult?.address?.fullAddress && (
                          <div className="col-12 mt-1">
                            <span className="small text-muted d-block">Registered Address:</span>
                            <span className="small text-dark font-weight-bold">{dlResult.address.fullAddress}</span>
                          </div>
                        )}
                      </div>
                      <span className="small text-muted d-block mt-2">
                        Verified via Ministry of Road Transport and Highways (MoRTH) / State RTO OCR records.
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyDlOcr}>
                      <div className="row g-3 mb-4">
                        <div className="col-md-6 mb-3">
                          <label className="auth-label">Driving License Front Side Document *</label>
                          <div className="kyc-upload-dropzone p-4 text-center border rounded">
                            {dlFrontPreview ? (
                              dlFrontPreview === 'pdf' ? (
                                <div className="p-3 bg-light rounded text-teal font-weight-bold mb-2 small">
                                  📄 {dlFront?.name || 'DL Front (PDF)'}
                                </div>
                              ) : (
                                <img src={dlFrontPreview} alt="DL Front" className="kyc-preview-thumb mb-2" style={{ maxHeight: '110px' }} />
                              )
                            ) : (
                              <div className="kyc-upload-icon">&#128247;</div>
                            )}
                            <input
                              type="file"
                              className="form-control-file mt-2"
                              accept=".jpeg,.jpg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
                              onChange={(e) => {
                                const f = e.target.files[0];
                                if (f && validateDocFile(f)) {
                                  setDlFront(f);
                                  setDlFrontPreview(f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : URL.createObjectURL(f));
                                }
                              }}
                              required
                            />
                            <small className="text-muted d-block mt-1">
                              Supported formats: JPEG, JPG, PNG, PDF. Maximum file size: 5MB.
                            </small>
                          </div>
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="auth-label">Driving License Back Side Document *</label>
                          <div className="kyc-upload-dropzone p-4 text-center border rounded">
                            {dlBackPreview ? (
                              dlBackPreview === 'pdf' ? (
                                <div className="p-3 bg-light rounded text-teal font-weight-bold mb-2 small">
                                  📄 {dlBack?.name || 'DL Back (PDF)'}
                                </div>
                              ) : (
                                <img src={dlBackPreview} alt="DL Back" className="kyc-preview-thumb mb-2" style={{ maxHeight: '110px' }} />
                              )
                            ) : (
                              <div className="kyc-upload-icon">&#128247;</div>
                            )}
                            <input
                              type="file"
                              className="form-control-file mt-2"
                              accept=".jpeg,.jpg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
                              onChange={(e) => {
                                const f = e.target.files[0];
                                if (f && validateDocFile(f)) {
                                  setDlBack(f);
                                  setDlBackPreview(f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : URL.createObjectURL(f));
                                }
                              }}
                              required
                            />
                            <small className="text-muted d-block mt-1">
                              Supported formats: JPEG, JPG, PNG, PDF. Maximum file size: 5MB.
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* Consent Box - Disabled by default (checked=false) */}
                      <div className="kyc-consent-box p-3 rounded mb-4">
                        <div className="form-check d-flex align-items-start">
                          <input
                            className="form-check-input mt-1 mr-3"
                            type="checkbox"
                            id="dlOcrConsent"
                            checked={dlConsent}
                            onChange={(e) => setDlConsent(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="dlOcrConsent">
                            <div className="kyc-consent-title">Mandatory MoRTH / RTO DL Verification Consent:</div>
                            <div className="kyc-consent-desc">
                              I grant explicit consent to extract and verify details from my uploaded Driving License document through MoRTH/RTO records for EMPLOYIX credential verification.
                            </div>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary-teal btn-block py-3 font-weight-bold"
                        disabled={dlLoading || !dlConsent || !dlFront || !dlBack}
                      >
                        {dlLoading ? <ButtonSpinner text="Scanning Driving License OCR..." /> : 'Scan & Extract Driving License (OCR) (+5 Points)'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 6: Educational Qualifications & Professional Certifications */}
            <div className="row justify-content-center mb-5" id="step-education">
              <div className="col-lg-10">
                <div className="auth-card p-4 p-md-5">
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <span className="setup-step-badge mr-2">Step 6</span>
                      <div>
                        <h3 className="auth-card-heading mb-0">Educational Qualifications &amp; Professional Certifications</h3>
                        <p className="small text-muted mb-0">Add academic degrees and vendor certifications with document proof (+20 Points)</p>
                      </div>
                    </div>

                    {(qualifications.length > 0 || certifications.length > 0) ? (
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge badge-info px-3 py-2 font-weight-bold">
                          &#10003; {qualifications.length} Degree(s) &middot; {certifications.length} Cert(s) Added
                        </span>
                        {(qualifications.some(q => q.isVerified && q.verificationStatus === 'verified') || certifications.some(c => c.isVerified && c.verificationStatus === 'verified')) && (
                          <span className="badge badge-success px-2 py-1 ml-2 font-weight-bold">
                            +20 Points Secured
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-warning px-3 py-2 font-weight-bold">
                        PENDING STEP 6
                      </span>
                    )}
                  </div>

                  {/* SECTION 6A: Academic Qualifications (Degrees / Diplomas) */}
                  <div className="mb-5 pb-4 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <div>
                        <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
                          <span className="mr-2" style={{ fontSize: '1.25rem' }}>🎓</span>
                          Academic Qualifications (Degrees / Diplomas)
                        </h5>
                        <small className="text-muted">Universities, colleges, graduation degrees &amp; diploma certificates</small>
                      </div>
                      {!showQualForm && (
                        <button
                          type="button"
                          className={`btn btn-sm ${isSetupCompleted ? 'btn-secondary text-white' : 'btn-primary-teal'} px-3 py-2 font-weight-bold`}
                          onClick={() => !isSetupCompleted && setShowQualForm(true)}
                          disabled={isSetupCompleted}
                          style={isSetupCompleted ? { opacity: 0.65, cursor: 'not-allowed', borderRadius: '50px' } : {}}
                          title={isSetupCompleted ? 'Setup is complete. Adding qualifications is locked.' : 'Add academic degree'}
                        >
                          + Add Qualification
                        </button>
                      )}
                    </div>

                    {/* Qualifications Existing List */}
                    {qualifications.length > 0 && (
                      <div className="mb-3">
                        {qualifications.map((qual, idx) => (
                          <div
                            key={qual._id || `q-${idx}`}
                            className="p-3 mb-2 rounded border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2"
                            style={{ borderLeft: '4px solid #ef4444' }}
                          >
                            <div style={{ flex: '1 1 280px' }}>
                              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                <h6 className="font-weight-bold text-dark mb-0">{qual.degree}</h6>
                                {qual.grade && (
                                  <span className="badge badge-light border text-dark font-weight-bold small">
                                    {qual.grade}
                                  </span>
                                )}
                                <span className="badge badge-danger text-white px-2 py-1 small font-weight-bold" style={{ fontSize: '10px' }}>
                                  Not Verified
                                </span>
                              </div>
                              <span className="small text-muted d-block">
                                {qual.institution} {qual.fieldOfStudy ? `· ${qual.fieldOfStudy}` : ''} {qual.year ? `· Class of ${qual.year}` : ''}
                              </span>
                              {qual.documentUrl && (
                                <a
                                  href={qual.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="small text-teal font-weight-bold mt-1 d-inline-block"
                                >
                                  📄 View Certificate / Document &nearr;
                                </a>
                              )}
                            </div>

                            {!isSetupCompleted && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteQualification(qual._id)}
                                title="Delete qualification"
                                style={{ borderRadius: '50%', width: '30px', height: '30px', padding: 0, lineHeight: 1 }}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Qualification Form */}
                    {showQualForm && !isSetupCompleted && (
                      <form onSubmit={handleAddQualification} className="p-4 rounded border bg-light mt-3">
                        <h6 className="font-weight-bold text-dark mb-3">Add New Educational Qualification</h6>
                        <div className="row g-3">
                          <div className="col-md-6 mb-3">
                            <label className="auth-label">Degree / Diploma Name *</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. Bachelor of Technology (B.Tech)"
                              value={qualForm.degree}
                              onChange={(e) => setQualForm({ ...qualForm, degree: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="auth-label">College / University *</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. Delhi University / IIT Delhi"
                              value={qualForm.institution}
                              onChange={(e) => setQualForm({ ...qualForm, institution: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-5 mb-3">
                            <label className="auth-label">Field of Study / Branch</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. Computer Science & Engineering"
                              value={qualForm.fieldOfStudy}
                              onChange={(e) => setQualForm({ ...qualForm, fieldOfStudy: e.target.value })}
                            />
                          </div>
                          <div className="col-md-3 mb-3">
                            <label className="auth-label">Graduation Year</label>
                            <input
                              type="number"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. 2022"
                              min="1970"
                              max="2035"
                              value={qualForm.year}
                              onChange={(e) => setQualForm({ ...qualForm, year: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="auth-label">Grade / CGPA / %</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. 8.4 CGPA or 85%"
                              value={qualForm.grade}
                              onChange={(e) => setQualForm({ ...qualForm, grade: e.target.value })}
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <label className="auth-label">Degree Certificate / Marksheet Proof (PDF or Image)</label>
                            <input
                              type="file"
                              className="form-control-file border p-2 rounded bg-white w-100"
                              accept=".pdf,image/*"
                              onChange={(e) => setQualForm({ ...qualForm, document: e.target.files[0] })}
                            />
                            <small className="text-muted">Optional: Upload scanned copy or DigiLocker PDF proof for instant verification.</small>
                          </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end mt-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary px-4 py-2"
                            onClick={() => {
                              setShowQualForm(false);
                              setQualForm({ degree: '', institution: '', fieldOfStudy: '', year: '', grade: '', document: null });
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary-teal px-4 py-2 font-weight-bold"
                            disabled={qualFormLoading}
                          >
                            {qualFormLoading ? <ButtonSpinner text="Saving Degree..." /> : 'Save Qualification'}
                          </button>
                        </div>
                      </form>
                    )}

                    {qualifications.length === 0 && !showQualForm && (
                      <p className="text-muted small mb-0">No academic degrees added yet. Click "+ Add Qualification" above.</p>
                    )}
                  </div>

                  {/* SECTION 6B: Professional Certifications */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <div>
                        <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
                          <span className="mr-2" style={{ fontSize: '1.25rem' }}>🏆</span>
                          Professional Certifications &amp; Credentials
                        </h5>
                        <small className="text-muted">Cloud, security, coding, vendor credentials (AWS, Google, Microsoft, Scrum, etc.)</small>
                      </div>
                      {!showCertForm && (
                        <button
                          type="button"
                          className={`btn btn-sm ${isSetupCompleted ? 'btn-secondary text-white' : 'btn-primary-teal'} px-3 py-2 font-weight-bold`}
                          onClick={() => !isSetupCompleted && setShowCertForm(true)}
                          disabled={isSetupCompleted}
                          style={isSetupCompleted ? { opacity: 0.65, cursor: 'not-allowed', borderRadius: '50px' } : {}}
                          title={isSetupCompleted ? 'Setup is complete. Adding certifications is locked.' : 'Add professional certification'}
                        >
                          + Add Certification
                        </button>
                      )}
                    </div>

                    {/* Certifications Existing List */}
                    {certifications.length > 0 && (
                      <div className="mb-3">
                        {certifications.map((cert, idx) => (
                          <div
                            key={cert._id || `c-${idx}`}
                            className="p-3 mb-2 rounded border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2"
                            style={{ borderLeft: '4px solid #ef4444' }}
                          >
                            <div style={{ flex: '1 1 280px' }}>
                              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                <h6 className="font-weight-bold text-dark mb-0">{cert.title}</h6>
                                {cert.credentialId && (
                                  <span className="badge badge-light border text-muted small font-weight-bold">
                                    ID: {cert.credentialId}
                                  </span>
                                )}
                                <span className="badge badge-danger text-white px-2 py-1 small font-weight-bold" style={{ fontSize: '10px' }}>
                                  Not Verified
                                </span>
                              </div>
                              <span className="small text-muted d-block">
                                {cert.issuer} {cert.year ? `· Issued ${cert.year}` : ''}
                              </span>
                              <div className="d-flex align-items-center gap-3 mt-1 flex-wrap">
                                {cert.credentialUrl && (
                                  <a
                                    href={cert.credentialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="small text-teal font-weight-bold"
                                  >
                                    🔗 Verification Link &nearr;
                                  </a>
                                )}
                                {cert.documentUrl && (
                                  <a
                                    href={cert.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="small text-teal font-weight-bold"
                                  >
                                    📄 Certificate Document &nearr;
                                  </a>
                                )}
                              </div>
                            </div>

                            {!isSetupCompleted && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteCertification(cert._id)}
                                title="Delete certification"
                                style={{ borderRadius: '50%', width: '30px', height: '30px', padding: 0, lineHeight: 1 }}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Certification Form */}
                    {showCertForm && !isSetupCompleted && (
                      <form onSubmit={handleAddCertification} className="p-4 rounded border bg-light mt-3">
                        <h6 className="font-weight-bold text-dark mb-3">Add New Professional Certification</h6>
                        <div className="row g-3">
                          <div className="col-md-6 mb-3">
                            <label className="auth-label">Certification Title *</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. AWS Certified Solutions Architect - Associate"
                              value={certForm.title}
                              onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="auth-label">Issuing Organization / Vendor *</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. Amazon Web Services (AWS) / Google / Microsoft"
                              value={certForm.issuer}
                              onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="auth-label">Issue Year</label>
                            <input
                              type="number"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. 2023"
                              min="1970"
                              max="2035"
                              value={certForm.year}
                              onChange={(e) => setCertForm({ ...certForm, year: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="auth-label">Credential ID (Optional)</label>
                            <input
                              type="text"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="e.g. AWS-SEC-984210"
                              value={certForm.credentialId}
                              onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="auth-label">Credential URL / Verification Link</label>
                            <input
                              type="url"
                              className="form-control auth-input-group px-3 py-2"
                              placeholder="https://..."
                              value={certForm.credentialUrl}
                              onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <label className="auth-label">Certificate Document Proof (PDF or Image)</label>
                            <input
                              type="file"
                              className="form-control-file border p-2 rounded bg-white w-100"
                              accept=".pdf,image/*"
                              onChange={(e) => setCertForm({ ...certForm, document: e.target.files[0] })}
                            />
                            <small className="text-muted">Upload digital certificate badge or completion certificate PDF/image.</small>
                          </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end mt-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary px-4 py-2"
                            onClick={() => {
                              setShowCertForm(false);
                              setCertForm({ title: '', issuer: '', year: '', credentialId: '', credentialUrl: '', document: null });
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary-teal px-4 py-2 font-weight-bold"
                            disabled={certFormLoading}
                          >
                            {certFormLoading ? <ButtonSpinner text="Saving Certification..." /> : 'Save Certification'}
                          </button>
                        </div>
                      </form>
                    )}

                    {certifications.length === 0 && !showCertForm && (
                      <p className="text-muted small mb-0">
                        {isSetupCompleted
                          ? 'Setup completed. No certifications were added.'
                          : 'No certifications added yet. Click "+ Add Certification" above.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Reference Verification Section */}
            <div className="row justify-content-center mt-4">
              <div className="col-lg-10">
                <ProfessionalReferenceSection isSetupCompleted={isSetupCompleted} />
              </div>
            </div>

            {/* Bottom Combined Summary & Actions Bar */}
            <div className="row justify-content-center mt-3">
              <div className="col-lg-10">
                <div className="kyc-summary-footer p-4 rounded-lg d-flex flex-column flex-md-row align-items-center justify-content-between text-center text-md-left gap-3">
                  <div>
                    <span className="small text-uppercase font-weight-bold letter-spacing-1 text-teal">
                      EMPLOYIX TRUST PROFILE SETUP STATUS
                    </span>
                    <h5 className="font-weight-bold text-white mb-0 mt-1">
                      {kycStatus === 7
                        ? (isSetupCompleted ? 'Setup Complete & Locked — Access Your Dashboard' : 'All Verification Steps Complete! Status: 7 / 7 — Click to Access Dashboard')
                        : !profileSaved
                        ? 'Step 1 Pending: Click "Save Profile Details" to save your profile'
                        : !aadhaarVerified
                        ? 'Step 2 Pending: Complete Aadhaar verification'
                        : !employmentVerified
                        ? 'Step 3 Pending: Complete Employment verification (UAN or Manual)'
                        : !voterVerified
                        ? 'Step 4 Pending: Complete Voter ID verification'
                        : !dlVerified
                        ? 'Step 5 Pending: Complete Driving License OCR verification'
                        : !(qualifications.length > 0 || certifications.length > 0)
                        ? 'Step 6 Pending: Add at least one Degree or Certification'
                        : 'Complete all steps to reach Status 7 / 7'}
                    </h5>
                  </div>
                  <div className="d-flex flex-column flex-sm-row gap-2">
                    {/* Step completion checklist pills */}
                    <div className="d-flex gap-2 align-items-center mr-3 flex-wrap justify-content-center">
                      <span className={`badge px-2 py-1 ${profileSaved ? 'badge-success' : 'badge-secondary'}`}>
                        {profileSaved ? '✓' : '1'} Profile
                      </span>
                      <span className={`badge px-2 py-1 ${aadhaarVerified ? 'badge-success' : 'badge-secondary'}`}>
                        {aadhaarVerified ? '✓' : '2'} Aadhaar
                      </span>
                      <span className={`badge px-2 py-1 ${employmentVerified ? 'badge-success' : 'badge-secondary'}`}>
                        {employmentVerified ? '✓' : '3'} Employment
                      </span>
                      <span className={`badge px-2 py-1 ${voterVerified ? 'badge-success' : 'badge-secondary'}`}>
                        {voterVerified ? '✓' : '4'} Voter ID
                      </span>
                      <span className={`badge px-2 py-1 ${dlVerified ? 'badge-success' : 'badge-secondary'}`}>
                        {dlVerified ? '✓' : '5'} Driving License
                      </span>
                      <span className={`badge px-2 py-1 ${(qualifications.length > 0 || certifications.length > 0) ? 'badge-success' : 'badge-secondary'}`}>
                        {(qualifications.length > 0 || certifications.length > 0) ? '✓' : '6'} Education &amp; Certs
                      </span>
                      <span className={`badge px-2 py-1 ${kycStatus >= 7 ? 'badge-success' : 'badge-info'}`}>
                        {kycStatus === 8 ? 'Status: 8/8 (Complete)' : `Status: ${kycStatus}/7`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFinish}
                      className={`btn px-4 py-3 font-weight-bold ${
                        kycStatus >= 7 ? 'btn-primary-teal' : 'btn-secondary text-white-50'
                      }`}
                      style={{
                        cursor: kycStatus >= 7 ? 'pointer' : 'not-allowed',
                        opacity: kycStatus >= 7 ? 1 : 0.55,
                        transition: 'all 0.3s ease',
                      }}
                      disabled={kycStatus < 7}
                      title={kycStatus < 7 ? `Complete all KYC steps to reach Status 7 to proceed (Current Status: ${kycStatus}/7)` : 'Setup complete (Status 8) — click to access profile dashboard'}
                    >
                      {kycStatus === 8 || isSetupCompleted
                        ? 'Setup Completed (Status 8) · Access Profile Dashboard →'
                        : 'Complete Setup & Access Profile Dashboard →'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default KycVerificationPage;
