import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { getKycVerificationFlags, formatCandidateAddress, isCandidateSetupCompleted, resolveImageUrl } from '../../utils/profileUtils';
import AadhaarSuccessModal from '../kyc/AadhaarSuccessModal';

const ProfileMainCards = ({ user: propUser }) => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const user = propUser || reduxUser;
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);

  const { isAadhaarDone, isVoterDone: isAddressDone, isDlDone } = getKycVerificationFlags(user);
  const voterAddress = formatCandidateAddress(user?.currentAddress || user?.address || user?.voterData?.address || user?.aadhaarData?.address) || 'Address not provided';

  // Dynamic Employment Records (EPFO + Manual)
  const manualJobs = Array.isArray(user?.manualEmployment) ? user.manualEmployment : [];

  const rawEpfo = user?.epfoEmployment;
  const epfoJobs = (() => {
    if (!rawEpfo) return [];
    if (Array.isArray(rawEpfo)) {
      return rawEpfo.flatMap((item) => {
        if (!item) return [];
        if (Array.isArray(item.records)) return item.records;
        if (item.employerName) return [item];
        return [];
      });
    }
    if (rawEpfo.records && Array.isArray(rawEpfo.records)) {
      return rawEpfo.records;
    }
    if (rawEpfo.employerName) {
      return [rawEpfo];
    }
    return [];
  })();
  const hasEmploymentRecords = manualJobs.length > 0 || epfoJobs.length > 0;

  // Dynamic Qualifications from Database (Separate Collection)
  const qualifications = Array.isArray(user?.qualifications) && user.qualifications.length > 0
    ? user.qualifications
    : [];

  // Dynamic Certifications from Database (Separate Collection)
  const certifications = Array.isArray(user?.certifications) && user.certifications.length > 0
    ? user.certifications
    : [];

  // Check if candidate has completed setup (Status 8)
  const isSetupCompleted = isCandidateSetupCompleted(user);

  return (
    <div className="col-lg-8 mb-4 mb-lg-0">
      {/* Card 1: Verified Identity & KYC Credentials */}
      <div className="profile-main-card p-4 mb-4">
        <h3 className="profile-sec-heading mb-4 d-flex align-items-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Identity &amp; KYC Verification
        </h3>

        <div className="row g-3">
          {/* Aadhaar Item */}
          <div className="col-sm-6 col-md-4 mb-3">
            <div
              className={`p-3 border rounded bg-light d-flex flex-column justify-content-between h-100 ${
                isAadhaarDone ? 'cursor-pointer hover-shadow transition-all' : ''
              }`}
              style={{
                borderLeft: isAadhaarDone ? '4px solid #00D294' : '4px solid #ef4444',
                cursor: isAadhaarDone ? 'pointer' : 'default',
              }}
              onClick={() => isAadhaarDone && setShowAadhaarModal(true)}
              title={isAadhaarDone ? 'Click to view verified Aadhaar identity and +20 points' : 'Aadhaar not verified'}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <span className="d-block font-weight-bold text-dark mb-1">Aadhaar Identity</span>
                  <span className={`verified-source-tag ${isAadhaarDone ? 'tag-teal' : 'tag-danger'}`}>
                    <i className={`chip-icon ${isAadhaarDone ? 'check' : 'cross'} mr-1`}>{isAadhaarDone ? '✓' : '✗'}</i> UIDAI Sync
                  </span>
                </div>
                <span className={`badge ${isAadhaarDone ? 'badge-success' : 'badge-danger text-white'} px-3 py-2 font-weight-bold`}>
                  {isAadhaarDone ? 'VERIFIED' : 'NOT VERIFIED'}
                </span>
              </div>
              <div className="mt-2 pt-2 border-top small text-muted">
                <span>Doc: </span>
                <strong className="text-dark">
                  {user?.aadhaarData?.maskedDocumentNumber || (isAadhaarDone ? 'XXXX-XXXX-8921' : 'Not Verified')}
                </strong>
              </div>
            </div>
          </div>

          {/* Voter Address Item */}
          <div className="col-sm-6 col-md-4 mb-3">
            <div
              className="p-3 border rounded bg-light d-flex flex-column justify-content-between h-100"
              style={{ borderLeft: isAddressDone ? '4px solid #00D294' : '4px solid #ef4444' }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <span className="d-block font-weight-bold text-dark mb-1">Residential Address</span>
                  <span className={`verified-source-tag ${isAddressDone ? 'tag-teal' : 'tag-danger'}`}>
                    <i className={`chip-icon ${isAddressDone ? 'check' : 'cross'} mr-1`}>{isAddressDone ? '✓' : '✗'}</i> Voter ID
                  </span>
                </div>
                <span className={`badge ${isAddressDone ? 'badge-success' : 'badge-danger text-white'} px-3 py-2 font-weight-bold`}>
                  {isAddressDone ? 'VERIFIED' : 'NOT VERIFIED'}
                </span>
              </div>
              <div className="mt-2 pt-2 border-top small text-muted">
                <span>EPIC: </span>
                <strong className="text-dark">{user?.voterData?.maskedDocumentNumber || (isAddressDone ? 'WXD1****92' : 'Not Verified')}</strong>
              </div>
            </div>
          </div>

          {/* Driving License Item */}
          <div className="col-sm-6 col-md-4 mb-3">
            <div
              className="p-3 border rounded bg-light d-flex flex-column justify-content-between h-100"
              style={{ borderLeft: isDlDone ? '4px solid #00D294' : '4px solid #ef4444' }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <span className="d-block font-weight-bold text-dark mb-1">Driving License</span>
                  <span className={`verified-source-tag ${isDlDone ? 'tag-teal' : 'tag-danger'}`}>
                    <i className={`chip-icon ${isDlDone ? 'check' : 'cross'} mr-1`}>{isDlDone ? '✓' : '✗'}</i> Parivahan
                  </span>
                </div>
                <span className={`badge ${isDlDone ? 'badge-success' : 'badge-danger text-white'} px-3 py-2 font-weight-bold`}>
                  {isDlDone ? 'VERIFIED' : 'NOT VERIFIED'}
                </span>
              </div>
              <div className="mt-2 pt-2 border-top small text-muted">
                <span>License: </span>
                <strong className="text-dark">{user?.dlData?.maskedDocumentNumber || (isDlDone ? 'DL04******2345' : 'Not Verified')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Employment History Timeline */}
      <div className="profile-main-card p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <h3 className="profile-sec-heading mb-0 d-flex align-items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Employment History
          </h3>
          <span className={`badge ${epfoJobs.length > 0 ? 'badge-success' : 'badge-danger text-white'} px-2 py-1 font-weight-bold small`}>
            {epfoJobs.length > 0 ? `${epfoJobs.length} Verified via EPFO${manualJobs.length > 0 ? ` · ${manualJobs.length} Self-Reported` : ''}` : 'Not Verified'}
          </span>
        </div>

        <div className="timeline-container pl-2">
          {hasEmploymentRecords ? (
            <>
              {/* EPFO / UAN Verified Records */}
              {epfoJobs.map((rec, idx) => (
                <div key={`epfo-${idx}`} className="timeline-verified-item position-relative mb-4 pb-3">
                  <span className="timeline-verified-node">&#10003;</span>
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-1 gap-2">
                    <h5 className="font-weight-bold text-dark mb-0">{user?.designation || 'Software Engineer'}</h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted font-weight-bold">
                        {rec.joiningDate || 'Joined'} &ndash; {rec.exitDate || 'Present'}
                      </span>
                      <span className="badge badge-success px-2 py-1 font-weight-bold small">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                  <p className="text-teal font-weight-bold mb-2">{rec.employerName}</p>
                  <div className="small text-secondary mb-2 d-flex flex-wrap align-items-center">
                    {rec.memberId && (
                      <span>
                        EPFO Member ID: <code>{rec.memberId}</code> &middot; Authenticated Employee Record
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="verified-source-tag tag-teal mr-2">&#10003; EPFO Authenticated</span>
                    <span className="verified-source-tag tag-teal">&#10003; UAN Synced</span>
                  </div>
                </div>
              ))}

              {/* Manual Records (Not Verified) */}
              {manualJobs.map((job, idx) => (
                <div key={`manual-${idx}`} className="timeline-verified-item position-relative mb-4 pb-3">
                  <span
                    className="timeline-verified-node"
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    &#10007;
                  </span>
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-1 gap-2">
                    <h5 className="font-weight-bold text-dark mb-0">{job.designation || 'Specialist'}</h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted font-weight-bold">
                        {job.joiningDate || 'Past'} &ndash; {job.currentlyWorking ? 'Present' : (job.exitDate || 'Completed')}
                      </span>
                      <span className="badge badge-danger text-white px-2 py-1 font-weight-bold small">
                        NOT VERIFIED
                      </span>
                    </div>
                  </div>
                  <p className="text-teal font-weight-bold mb-2">{job.companyName}</p>
                  {job.workEmail && (
                    <p className="small text-secondary mb-2">
                      Work Email: {job.workEmail} &middot; Candidate Entry
                    </p>
                  )}
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="verified-source-tag tag-danger mr-2">&#10007; Not Verified (Self-Reported)</span>
                    <span className="verified-source-tag text-muted bg-light border">&#9888; Candidate Declared</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 text-center rounded border bg-light">
              <p className="text-danger mb-2 font-weight-bold">&#128188; No employment history verified yet</p>
              <p className="small text-secondary mb-0">No employment records verified yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Educational Qualifications */}
      <div className="profile-main-card p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <h3 className="profile-sec-heading mb-0 d-flex align-items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
            Educational Qualifications
          </h3>
        </div>

        {qualifications.length > 0 ? (
          <div>
            {qualifications.map((qual, idx) => {
              const isItemVerified = Boolean(qual.isVerified && qual.verificationStatus === 'verified');
              return (
                <div
                  key={qual._id || `qual-${idx}`}
                  className="p-3 border rounded bg-light mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3"
                  style={{ borderLeft: isItemVerified ? '4px solid #00D294' : '4px solid #ef4444' }}
                >
                  <div style={{ flex: '1 1 280px' }}>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <h6 className="font-weight-bold text-dark mb-0">{qual.degree}</h6>
                      {qual.grade && (
                        <span className="badge badge-light border text-dark font-weight-bold small">
                          {qual.grade}
                        </span>
                      )}
                    </div>
                    <span className="small text-muted d-block mb-2">
                      {qual.institution} {qual.fieldOfStudy ? `· ${qual.fieldOfStudy}` : ''} {qual.year ? `· Class of ${qual.year}` : ''}
                    </span>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`verified-source-tag ${isItemVerified ? 'tag-teal' : 'tag-danger'} mr-2`}>
                        {isItemVerified ? '✓ ' : '✗ '} {isItemVerified ? (qual.badge || 'Verified Degree') : 'Self-Reported / Not Verified'}
                      </span>
                      {qual.documentUrl && (
                        <a
                          href={resolveImageUrl(qual.documentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-view-btn"
                        >
                          View Certificate
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`badge ${isItemVerified ? 'badge-success' : 'badge-danger text-white'} px-3 py-2 font-weight-bold`}>
                      {isItemVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center rounded border bg-light">
            <p className="mb-2 font-weight-bold" style={{ color: '#0f172a' }}>
              No educational qualifications added yet
            </p>
            <p className="small text-secondary mb-0">
              No academic degrees or diploma records added yet.
            </p>
          </div>
        )}
      </div>

      {/* Card 4: Professional Certifications & Credentials (Only show if available) */}
      {certifications.length > 0 && (
        <div className="profile-main-card p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <h3 className="profile-sec-heading mb-0 d-flex align-items-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              Professional Certifications &amp; Credentials
            </h3>
            <span className="badge badge-success px-2 py-1 font-weight-bold small">
              {certifications.length} Credential(s)
            </span>
          </div>

          <div>
            {certifications.map((cert, idx) => {
              const isCertVerified = Boolean(cert.isVerified && cert.verificationStatus === 'verified');
              return (
                <div
                  key={cert._id || `cert-${idx}`}
                  className="p-3 border rounded bg-light d-flex flex-wrap align-items-center justify-content-between mb-3 gap-3"
                  style={{ borderLeft: isCertVerified ? '4px solid #00D294' : '4px solid #ef4444' }}
                >
                  <div style={{ flex: '1 1 280px' }}>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <h6 className="font-weight-bold text-dark mb-0">{cert.title}</h6>
                      {cert.credentialId && (
                        <span className="badge badge-light border text-muted small font-weight-bold">
                          ID: {cert.credentialId}
                        </span>
                      )}
                    </div>
                    <span className="small text-muted d-block mb-2">
                      {cert.issuer} {cert.year ? `· Issued ${cert.year}` : ''}
                    </span>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`verified-source-tag ${isCertVerified ? 'tag-teal' : 'tag-danger'} mr-2`}>
                        {isCertVerified ? '✓ ' : '✗ '} {isCertVerified ? (cert.badge || 'Digital Badge Credential') : 'Self-Reported / Not Verified'}
                      </span>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-view-btn mr-1"
                        >
                          Verify Link
                        </a>
                      )}
                      {cert.documentUrl && (
                        <a
                          href={resolveImageUrl(cert.documentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-view-btn"
                        >
                          View Certificate
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`badge ${isCertVerified ? 'badge-success' : 'badge-danger text-white'} px-3 py-2 font-weight-bold`}>
                      {isCertVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card 5: Professional Conduct & References */}
      {Array.isArray(user?.references) && user.references.length > 0 && (
        <div className="profile-main-card p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <h3 className="profile-sec-heading mb-0 d-flex align-items-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Professional Conduct &amp; References
            </h3>
            <span className="badge badge-success px-2 py-1 font-weight-bold small">
              {user.references.filter((r) => r.status === 'completed' || r.isFeedbackSubmitted).length}/{user.references.length} Verified
            </span>
          </div>

          <div>
            {user.references.map((ref, idx) => {
              const isRefVerified = Boolean(ref.status === 'completed' || ref.isFeedbackSubmitted);
              const feedback = ref.feedback;
              return (
                <div
                  key={ref._id || `ref-${idx}`}
                  className="p-3 border rounded bg-light mb-3 d-flex flex-wrap align-items-start justify-content-between gap-3"
                  style={{ borderLeft: isRefVerified ? '4px solid #00D294' : '4px solid #ef4444' }}
                >
                  <div style={{ flex: '1 1 280px' }}>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <h6 className="font-weight-bold text-dark mb-0">{ref.refereeName}</h6>
                      {feedback?.relationship && (
                        <span className="badge badge-light border text-muted small font-weight-bold">
                          {feedback.relationship}
                        </span>
                      )}
                    </div>
                    <span className="small text-muted d-block mb-2">
                      {ref.refereeRole} &middot; <span className="font-monospace">{ref.refereeEmail}</span>
                    </span>

                    {isRefVerified && (
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge badge-success px-2 py-1 font-weight-bold small">
                          +5 Pts Earned
                        </span>
                      </div>
                    )}

                    {feedback?.comments && (
                      <div className="p-2 rounded bg-white border mt-2 small text-dark" style={{ fontStyle: 'italic' }}>
                        &ldquo;{feedback.comments}&rdquo;
                      </div>
                    )}
                  </div>

                  <div>
                    <span className={`badge ${isRefVerified ? 'badge-success' : 'badge-warning text-dark'} px-3 py-2 font-weight-bold`}>
                      {isRefVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aadhaar Verified Celebration / Points Modal */}
      <AadhaarSuccessModal
        isOpen={showAadhaarModal}
        onClose={() => setShowAadhaarModal(false)}
        pointsEarned={20}
        aadhaarData={user?.aadhaarData}
        totalScore={user?.employixScore}
        userName={user?.name}
      />
    </div>
  );
};

export default ProfileMainCards;
