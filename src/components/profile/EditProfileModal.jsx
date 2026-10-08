import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import ButtonSpinner from '../common/Loader';
import { updateProfileApi } from '../../api/authApi';
import { updateUserKycStatus, updateProfileSuccess } from '../../redux/slices/authSlice';
import { formatEmployixId } from '../../utils/profileUtils';

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  // Read-only values from user
  const phone = user?.phoneNumber || user?.phone || '';
  const email = user?.email || '';
  const formattedId = formatEmployixId(user?.employixId, user?._id);

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('/images/identity.jpg');
  const [saving, setSaving] = useState(false);
  const [designationError, setDesignationError] = useState('');
  const [photoError, setPhotoError] = useState('');

  // Helper for image url resolution
  const resolveImageUrl = (imgPath) => {
    if (!imgPath) return '/images/identity.jpg';
    if (imgPath.startsWith('blob:') || imgPath.startsWith('data:')) {
      return imgPath;
    }
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
    if (isLocal && imgPath.includes('13.232.68.44:3000/uploads/')) {
      return imgPath.replace(/http:\/\/13\.232\.68\.44:3000/, 'http://localhost:5000');
    }
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const cleanPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
    if (cleanPath.startsWith('/uploads/')) {
      const base = isLocal ? 'http://localhost:5000' : 'http://13.232.68.44:3000';
      return `${base}${cleanPath}`;
    }
    return cleanPath;
  };

  // Populate fields when modal opens or user prop changes
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.name || '');
      setDesignation((user.designation || '').trim());

      // Gender: user.gender, with fallback to UIDAI / Voter
      const initialGender = user.gender || user.aadhaarData?.gender || user.voterData?.gender || '';
      setGender(initialGender);

      // Address: user.currentAddress or user.address
      const addrObj = user.currentAddress || user.address;
      let initialAddress = '';
      if (addrObj) {
        if (typeof addrObj === 'object') {
          initialAddress = addrObj.fullAddress || [addrObj.street, addrObj.city, addrObj.state, addrObj.pincode].filter(Boolean).join(', ') || addrObj.address || '';
        } else if (typeof addrObj === 'string') {
          initialAddress = addrObj;
        }
      } else if (user.aadhaarData?.address) {
        initialAddress = typeof user.aadhaarData.address === 'string' ? user.aadhaarData.address : (user.aadhaarData.address?.fullAddress || '');
      } else if (user.voterData?.address) {
        initialAddress = typeof user.voterData.address === 'string' ? user.voterData.address : (user.voterData.address?.fullAddress || '');
      }
      setAddress(initialAddress || '');

      const currentImg = user.profileImage;
      if (currentImg) {
        setPhotoPreview(resolveImageUrl(currentImg));
      } else {
        setPhotoPreview('/images/identity.jpg');
      }
      setPhotoFile(null);
    }
  }, [user, isOpen]);

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Handle Photo file selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedTypes.includes(file.type) || !allowedExts.includes(fileExt)) {
      setPhotoError('Only JPG, PNG and WEBP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size must be less than 5MB.');
      return;
    }

    setPhotoError('');
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Full Name is required.');
      return;
    }

    if (!designation.trim()) {
      setDesignationError('Professional Designation / Role is required.');
      return;
    }
    setDesignationError('');

    setSaving(true);
    try {
      const formData = new FormData();
      if (user?.prefix) formData.append('prefix', user.prefix.trim());
      formData.append('name', fullName.trim());
      formData.append('designation', designation.trim());
      formData.append('gender', gender.trim());
      formData.append('currentAddress', address.trim());
      formData.append('address', address.trim());

      if (photoFile) {
        formData.append('profileImage', photoFile);
      }

      const res = await updateProfileApi(formData);
      const data = res.data || res;

      // Update Redux state
      dispatch(updateProfileSuccess(data));
      dispatch(updateUserKycStatus(data));

      toast.success('Profile updated successfully.');

      // Notify parent to refetch latest profile data
      if (typeof onUpdate === 'function') {
        await onUpdate();
      }

      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalElement = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(2, 12, 31, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          position: 'relative',
          animation: 'fadeInModal 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editProfileModalHeading"
      >
        {/* Pinned Top Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #020C1F 0%, #07152E 100%)',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0, 210, 148, 0.16)',
                border: '1px solid rgba(0, 210, 148, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D294',
                boxShadow: '0 0 12px rgba(0, 210, 148, 0.25)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div>
              <h4
                id="editProfileModalHeading"
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                }}
              >
                Edit Profile
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            disabled={saving}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#00D294';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          noValidate
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            {/* Top Identity Banner */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Avatar with Camera Icon */}
                <div
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload profile photo"
                >
                  <img
                    src={photoPreview}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/identity.jpg';
                    }}
                    alt="Profile Avatar"
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #00D294',
                      boxShadow: '0 4px 14px rgba(0, 210, 148, 0.25)',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#00D294',
                      border: '2px solid #FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    {fullName.trim() || 'Candidate Name'}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#00A876',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      Change Picture
                    </button>
                    {photoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(resolveImageUrl(user?.profileImage));
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          marginLeft: '12px',
                          color: '#EF4444',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reset
                      </button>
                    )}
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                      JPG, PNG or WEBP (Max 5MB)
                    </span>
                    {photoError && (
                      <span style={{ display: 'block', fontSize: '0.78rem', color: '#EF4444', fontWeight: 600, marginTop: '3px' }}>
                        {photoError}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Employix ID Pill */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: '#64748B', fontWeight: 500 }}>ID:</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{formattedId}</span>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="row g-3 text-left">
              {/* Full Name */}
              <div className="col-md-6 mb-3">
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Full Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.94rem',
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#00D294';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 210, 148, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Gender */}
              <div className="col-md-6 mb-3">
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.94rem',
                    color: '#0F172A',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#00D294';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 210, 148, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Professional Designation / Role */}
              <div className="col-12 mb-3">
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Professional Designation / Role <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => {
                    setDesignation(e.target.value);
                    if (designationError) setDesignationError('');
                  }}
                  placeholder="e.g. Senior Software Engineer"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: designationError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                    fontSize: '0.94rem',
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = designationError ? '#EF4444' : '#00D294';
                    e.target.style.boxShadow = designationError ? '0 0 0 3px rgba(239, 68, 68, 0.18)' : '0 0 0 3px rgba(0, 210, 148, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = designationError ? '#EF4444' : '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {designationError && (
                  <small style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.84rem', marginTop: '6px', display: 'flex', alignItems: 'center' }}>
                    {designationError}
                  </small>
                )}
              </div>

              {/* Current Residential Address */}
              <div className="col-12 mb-3">
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Current Residential Address
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete current residential address (House No, Street, City, State, PIN)"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.92rem',
                    color: '#0F172A',
                    lineHeight: '1.55',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    minHeight: '85px',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#00D294';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 210, 148, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Registered Mobile Number (Disabled) */}
              <div className="col-md-6 mb-2">
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#64748B',
                    marginBottom: '6px',
                  }}
                >
                  Registered Mobile
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#F1F5F9',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      padding: '10px 14px',
                      background: '#E2E8F0',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      borderRight: '1px solid #CBD5E1',
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    readOnly
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      color: '#64748B',
                      fontSize: '0.94rem',
                      cursor: 'not-allowed',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Registered Email (Disabled) */}
              <div className="col-md-6 mb-2">
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#64748B',
                    marginBottom: '6px',
                  }}
                >
                  Registered Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: '0.94rem',
                    cursor: 'not-allowed',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1.5px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F8FAFC';
                e.currentTarget.style.borderColor = '#94A3B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 28px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #00D294 0%, #00a876 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 210, 148, 0.35)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {saving ? <ButtonSpinner text="Saving Changes..." /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};

export default EditProfileModal;
