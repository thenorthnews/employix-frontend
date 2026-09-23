import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  registerApi,
  loginApi,
  verifyOtpApi,
  resendOtpApi,
  logoutApi
} from '../../api/authApi';

import { isTokenValid, clearStoredAuth } from '../../utils/auth';

// Initial state reading from localStorage with expiration/validity check
let rawToken = localStorage.getItem('employix_token') || null;
let rawUser = localStorage.getItem('employix_user')
  ? JSON.parse(localStorage.getItem('employix_user'))
  : null;

// Validate stored token immediately
if (rawToken && !isTokenValid(rawToken)) {
  clearStoredAuth();
  rawToken = null;
  rawUser = null;
}

const storedToken = rawToken;
const storedUser = rawUser;

// Thunk 1: Register User
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await registerApi(userData);
      return { response, email: userData.email };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Thunk 2: Login User (request OTP)
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);
      return { response, email: credentials.email };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Thunk 3: Verify OTP
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await verifyOtpApi({ email, otp });
      // response.data contains the verified user and JWT token
      const data = response.data || response;
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Thunk 4: Resend OTP
export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await resendOtpApi({ email });
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Thunk 5: Logout User
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
      return true;
    } catch (err) {
      // Even if network fails, proceed with local logout
      return true;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: storedToken,
    isAuthenticated: Boolean(storedToken),
    loading: false,
    resendLoading: false,
    error: null,
    pendingEmail: localStorage.getItem('employix_pending_email') || '',
    otpSent: false,
  },
  reducers: {
    setPendingEmail: (state, action) => {
      state.pendingEmail = action.payload;
      localStorage.setItem('employix_pending_email', action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.pendingEmail = '';
      state.otpSent = false;
      state.error = null;
      localStorage.removeItem('employix_token');
      localStorage.removeItem('employix_user');
      localStorage.removeItem('employix_pending_email');
    },
    updateUserKycStatus: (state, action) => {
      if (action.payload) {
        state.user = state.user ? { ...state.user, ...action.payload } : action.payload;
        localStorage.setItem('employix_user', JSON.stringify(state.user));
      }
    },
    updateProfileSuccess: (state, action) => {
      if (action.payload) {
        state.user = state.user ? { ...state.user, ...action.payload } : action.payload;
        localStorage.setItem('employix_user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.pendingEmail = action.payload.email;
        localStorage.setItem('employix_pending_email', action.payload.email);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.pendingEmail = action.payload.email;
        localStorage.setItem('employix_pending_email', action.payload.email);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload;
        state.otpSent = false;

        // Persist session
        if (action.payload.token) {
          localStorage.setItem('employix_token', action.payload.token);
        }
        localStorage.setItem('employix_user', JSON.stringify(action.payload));
        localStorage.removeItem('employix_pending_email');
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.resendLoading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.resendLoading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.resendLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.pendingEmail = '';
        state.error = null;
        localStorage.removeItem('employix_token');
        localStorage.removeItem('employix_user');
        localStorage.removeItem('employix_pending_email');
      });
  },
});

export const { setPendingEmail, clearError, logout, updateUserKycStatus, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
