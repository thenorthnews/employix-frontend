/**
 * Authentication and Token Utilities
 */

/**
 * Checks if a JWT token is structurally valid and not expired.
 * @param {string|null} token - JWT token string
 * @returns {boolean}
 */
export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string') return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode base64 payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    // Check expiration if exp field exists (exp is in seconds)
    if (payload.exp && typeof payload.exp === 'number') {
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp <= currentTimeInSeconds) {
        return false; // Token expired
      }
    }

    return true;
  } catch (err) {
    console.warn('⚠️ Token validation failed:', err);
    return false;
  }
};

/**
 * Retrieves token from localStorage safely
 * @returns {string|null}
 */
export const getStoredToken = () => {
  return localStorage.getItem('employix_token') || null;
};

/**
 * Retrieves user profile from localStorage safely
 * @returns {Object|null}
 */
export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('employix_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Clears all auth items from localStorage
 */
export const clearStoredAuth = () => {
  localStorage.removeItem('employix_token');
  localStorage.removeItem('employix_user');
  localStorage.removeItem('employix_pending_email');
};
