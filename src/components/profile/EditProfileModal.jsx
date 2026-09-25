import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import ButtonSpinner from '../common/Loader';
import { updateProfileApi } from '../../api/authApi';
import { updateUserKycStatus, updateProfileSuccess } from '../../redux/slices/authSlice';

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bio, setBio] = useState('');

  // Read-only values from user
  const phone = user?.phoneNumber || user?.phone || '';
  const email = user?.email || '';
  const formattedId = user?.employixId || (user?._id ? `#EMP-${user._id.slice(-4).toUpperCase()}-IN` : '#EMP-5178-IN');

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('/images/identity.jpg');
  const [saving, setSaving] = useState(false);

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
      setBio(user.bio || '');

      const currentImg = user.image || user.profileImage;
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

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
      toast.error('Professional Designation / Role is required.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (user?.prefix) formData.append('prefix', user.prefix.trim());
      formData.append('name', fullName.trim());
      formData.append('designation', designation.trim());
      if (bio.trim()) formData.append('bio', bio.trim());

      if (photoFile) {
        formData.append('image', photoFile);
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
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editProfileTitle"
        style={{ maxWidth: '640px' }}
      >
        {/* Modal Header */}
        <div className="profile-modal-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="profile-modal-icon-badge mr-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D294" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div>
              <h4 id="editProfileTitle" className="font-weight-bold text-dark mb-0" style={{ fontSize: '1.25rem' }}>
                Edit Candidate Profile
              </h4>
              <p className="small text-muted mb-0">
                Update your profile picture, personal identity, and professional role
              </p>
            </div>
          </div>
          <button
            type="button"
            className="profile-modal-close-btn"
            onClick={onClose}
            title="Close"
            disabled={saving}
          >
            &times;
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden">
          <div className="profile-modal-body p-4 overflow-auto">
            {/* Top Photo & ID Card */}
            <div className="profile-edit-avatar-section p-3 rounded-lg bg-light border mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="position-relative d-inline-block"
                  style={{ cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change profile photo"
                >
                  <img
                    src={photoPreview}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/identity.jpg';
                    }}
                    alt="Avatar Preview"
                    style={{
                      width: '82px',
                      height: '82px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #00D294',
                      boxShadow: '0 4px 14px rgba(0, 210, 148, 0.28)',
                      display: 'block',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  {/* Premium Camera Overlay Badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    title="Change Profile Photo"
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00D294 0%, #00986b 100%)',
                      border: '2.5px solid #ffffff',
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 210, 148, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.28)';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div>
                  <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>
                    {fullName || 'Candidate Photo'}
                  </div>
                  {photoFile ? (
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge badge-success px-2 py-1 small font-weight-bold">
                        ✓ New photo chosen
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 small font-weight-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoFile(null);
                          setPhotoPreview(resolveImageUrl(user?.image || user?.profileImage));
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <span className="small text-muted d-block">
                      Click the camera icon to upload a new picture
                    </span>
                  )}
                </div>
              </div>

              {/* Employix ID Pill */}
              <div className="text-right">
                <span className="small text-muted d-block mb-1">Employix ID</span>
                <span className="profile-id-code d-inline-flex align-items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {formattedId}
                </span>
              </div>
            </div>

            {/* Personal & Professional Details */}
            <div className="mb-4">
              <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center gap-2">
                <span className="text-teal">&#9679;</span> Personal &amp; Professional Details
              </h6>
              <div className="row g-3">
                {/* Full Name (Full width, prefix removed) */}
                <div className="col-12 mb-3">
                  <label className="auth-label font-weight-bold small text-muted">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control profile-modal-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Full Name"
                    required
                  />
                </div>

                {/* Designation / Job Role (Always Editable - Never Disabled) */}
                <div className="col-12 mb-3">
                  <label className="auth-label font-weight-bold small text-muted mb-1">
                    Professional Designation / Role <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control profile-modal-input"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Lead Full Stack Architect"
                    required
                  />
                  <small className="text-muted d-block mt-1">
                    Update your current job title or primary technical role.
                  </small>
                </div>

                {/* Disabled Mobile Number */}
                <div className="col-md-6 mb-3">
                  <label className="auth-label font-weight-bold small text-muted">Mobile Number</label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text bg-light font-weight-bold text-muted border-right-0" style={{ borderRadius: '8px 0 0 8px' }}>
                        +91
                      </span>
                    </div>
                    <input
                      type="tel"
                      className="form-control profile-modal-input bg-light text-muted"
                      style={{ borderRadius: '0 8px 8px 0', cursor: 'not-allowed' }}
                      value={phone}
                      readOnly
                      disabled
                      title="Registered mobile number cannot be edited here"
                    />
                  </div>
                </div>

                {/* Disabled Registered Email Address */}
                <div className="col-md-6 mb-3">
                  <label className="auth-label font-weight-bold small text-muted">Registered Email Address</label>
                  <input
                    type="email"
                    className="form-control profile-modal-input bg-light text-muted"
                    value={email}
                    readOnly
                    disabled
                    style={{ cursor: 'not-allowed' }}
                    title="Account email address cannot be edited here"
                  />
                </div>
              </div>
            </div>

            {/* Professional Bio / Headline (Optional) */}
            <div className="mb-2">
              <h6 className="font-weight-bold text-dark mb-2 d-flex align-items-center gap-2">
                <span className="text-teal">&#9679;</span> Professional Summary / Bio (Optional)
              </h6>
              <textarea
                rows={3}
                className="form-control profile-modal-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief professional summary about your background and core expertise..."
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="profile-modal-footer d-flex align-items-center justify-content-between p-3 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2 font-weight-bold"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary-teal px-5 py-2 font-weight-bold"
              disabled={saving}
            >
              {saving ? (
                <ButtonSpinner text="Saving Profile..." />
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};

export default EditProfileModal;
