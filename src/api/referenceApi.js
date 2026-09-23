import axiosInstance from './axiosInstance';

/**
 * Add a new professional reference & send email invitation (Candidate)
 * @param {Object} data - { refereeName, refereeEmail, refereeRole }
 */
export const addReferenceApi = async (data) => {
  return await axiosInstance.post('/user-portal/references', data);
};

/**
 * Get all references and reward points balance for candidate (Candidate)
 */
export const getReferencesApi = async () => {
  return await axiosInstance.get('/user-portal/references');
};

/**
 * Resend email invitation to referee (Candidate)
 * @param {string} id - Referral ObjectId
 */
export const resendReferenceApi = async (id) => {
  return await axiosInstance.post(`/user-portal/references/${id}/resend`);
};

/**
 * Get shareable verification link for reference (Candidate)
 * @param {string} id - Referral ObjectId
 */
export const getReferenceShareLinkApi = async (id) => {
  return await axiosInstance.get(`/user-portal/references/${id}/share-link`);
};

/**
 * Validate token on public referee verification landing page (Public)
 * @param {string} token
 */
export const validateReferenceTokenApi = async (token) => {
  return await axiosInstance.get(`/user-portal/references/verify-token?token=${encodeURIComponent(token)}`);
};

/**
 * Send 6-digit OTP to referee's email (Public)
 * @param {string} token
 */
export const sendReferenceOtpApi = async (token) => {
  return await axiosInstance.post('/user-portal/references/send-otp', { token });
};

/**
 * Verify 6-digit OTP (Public)
 * @param {string} token
 * @param {string} otp
 */
export const verifyReferenceOtpApi = async (token, otp) => {
  return await axiosInstance.post('/user-portal/references/verify-otp', { token, otp });
};

/**
 * Submit professional reference feedback (Public)
 * @param {Object} data - { token, relationship, rating, feedback, recommendation }
 */
export const submitReferenceFeedbackApi = async (data) => {
  return await axiosInstance.post('/user-portal/references/submit-feedback', data);
};
