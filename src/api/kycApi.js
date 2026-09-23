import axiosInstance from './axiosInstance';

/**
 * Verify PAN Document using Setu / ITD verification
 * @param {Object} data - { pan, name, dob, consent }
 */
export const verifyPanApi = async (data) => {
  return await axiosInstance.post('/user-portal/kyc/pan', data);
};

/**
 * Verify Aadhaar Document using Setu OCR / DigiLocker
 * @param {FormData} formData - Multipart data containing documentFront, documentBack
 */
export const verifyAadhaarApi = async (formData) => {
  return await axiosInstance.post('/user-portal/kyc/aadhaar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Extract PAN Document via OCR
 * @param {FormData} formData - Multipart data containing panImage
 */
export const extractPanOcrApi = async (formData) => {
  return await axiosInstance.post('/user-portal/kyc/pan/ocr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Verify Direct 12-Digit Aadhaar Number
 * @param {Object} data - { aadhaarNumber, consent, consentPurpose }
 */
export const verifyAadhaarNumberApi = async (data) => {
  return await axiosInstance.post('/user-portal/kyc/aadhaar/number', data);
};

/**
 * Verify Voter ID Number for Address Proof
 * @param {Object} data - { number, consent, consentPurpose }
 */
export const verifyVoterApi = async (data) => {
  return await axiosInstance.post('/user-portal/kyc/voter', data);
};

/**
 * Verify Voter ID Card Document via OCR for Address Proof
 * @param {FormData} formData - Multipart data containing documentFront, documentBack
 */
export const verifyVoterOcrApi = async (formData) => {
  return await axiosInstance.post('/user-portal/kyc/voter/ocr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Fetch current user KYC Verification Status from Database
 */
export const getKycStatusApi = async () => {
  return await axiosInstance.get('/user-portal/kyc/status');
};

/**
 * Fetch EPFO Employment History via Mobile Number (Setu API)
 * @param {Object} data - { mobileNumber, consent }
 */
export const fetchEmploymentHistoryApi = async (data) => {
  return await axiosInstance.post('/user-portal/kyc/employment-history', data);
};

/**
 * Fetch Employment History via UAN Number (12-digit)
 * Setu API: POST /api/sync/uan-to-employment-history
 * @param {Object} data - { uan, groupId? }
 */
export const fetchEmploymentByUanApi = async (data) => {
  return await axiosInstance.post('/user-portal/kyc/employment-history/uan', data);
};

/**
 * Add Manual Employment Record
 * @param {Object} data - { companyName, designation, startDate, endDate, isCurrent, description }
 */
export const addManualEmploymentApi = async (data) => {
  return await axiosInstance.post('/user-portal/kyc/employment/manual', data);
};

/**
 * Get all employment records (manual + EPFO) for user
 */
export const getEmploymentRecordsApi = async () => {
  return await axiosInstance.get('/user-portal/kyc/employment-records');
};

/**
 * Delete a manual employment record by ID
 * @param {string} id
 */
export const deleteManualEmploymentApi = async (id) => {
  return await axiosInstance.delete(`/user-portal/kyc/employment/manual/${id}`);
};

/**
 * Fetch all qualifications for current user
 */
export const getQualificationsApi = async () => {
  return await axiosInstance.get('/user-portal/qualifications');
};

/**
 * Add a new qualification (degree / diploma) with optional document
 * @param {FormData} formData
 */
export const addQualificationApi = async (formData) => {
  return await axiosInstance.post('/user-portal/qualifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Delete a qualification by ID
 * @param {string} id
 */
export const deleteQualificationApi = async (id) => {
  return await axiosInstance.delete(`/user-portal/qualifications/${id}`);
};

/**
 * Fetch all certifications for current user
 */
export const getCertificationsApi = async () => {
  return await axiosInstance.get('/user-portal/certifications');
};

/**
 * Add a new professional certification with optional document
 * @param {FormData} formData
 */
export const addCertificationApi = async (formData) => {
  return await axiosInstance.post('/user-portal/certifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Delete a certification by ID
 * @param {string} id
 */
export const deleteCertificationApi = async (id) => {
  return await axiosInstance.delete(`/user-portal/certifications/${id}`);
};

/**
 * Verify Driving License Card Document via OCR
 * @param {FormData} formData - Multipart data containing documentFront, documentBack
 */
export const verifyDlOcrApi = async (formData) => {
  return await axiosInstance.post('/user-portal/kyc/dl/ocr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Complete KYC Setup and mark kycStatus = 8
 */
export const completeKycSetupApi = async () => {
  return await axiosInstance.post('/user-portal/kyc/complete-setup');
};


