import axiosInstance from './axiosInstance';

/**
 * Register a new user
 * @param {Object} userData - { name, email, phone, password, role }
 */
export const registerApi = async (userData) => {
  return await axiosInstance.post('/auth/register', userData);
};

/**
 * Request login OTP for an email
 * @param {Object} credentials - { email }
 */
export const loginApi = async (credentials) => {
  return await axiosInstance.post('/auth/login', credentials);
};

/**
 * Verify 6-digit OTP
 * @param {Object} otpData - { email, otp }
 */
export const verifyOtpApi = async (otpData) => {
  return await axiosInstance.post('/auth/verifyOtp', otpData);
};

/**
 * Resend OTP to user's email
 * @param {Object} data - { email }
 */
export const resendOtpApi = async (data) => {
  return await axiosInstance.post('/auth/resendOtp', data);
};

/**
 * Logout current authenticated user
 */
export const logoutApi = async () => {
  return await axiosInstance.post('/auth/logout');
};

/**
 * Fetch current authenticated user profile
 */
export const getProfileApi = async () => {
  return await axiosInstance.get('/users/me');
};

/**
 * Update user profile details (prefix, name, designation, photo, address)
 */
export const updateProfileApi = async (formDataOrData) => {
  return await axiosInstance.put('/users/updateMe', formDataOrData);
};


