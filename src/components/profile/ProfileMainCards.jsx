import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getKycVerificationFlags, formatCandidateAddress, isCandidateSetupCompleted } from '../../utils/profileUtils';

const ProfileMainCards = ({ user: propUser }) => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const user = propUser || reduxUser;

  const { isAadhaarDone, isVoterDone: isAddressDone, isDlDone } = getKycVerificationFlags(user);
  const voterAddress = formatCandidateAddress(user?.address || user?.voterData?.address) || 'Address not provided';

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
              className="p-3 border rounded bg-light d-flex flex-column justify-content-between h-100"
              style={{ borderLeft: isAadhaarDone ? '4px solid #00D294' : '4px solid #ef4444' }}
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

      {/* Card 2: Verified Employment History Timeline */}
      <div className="profile-main-card p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="profile-sec-heading mb-0 d-flex align-items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Verified Employment History
          </h3>
          <span className={`badge ${hasEmploymentRecords ? 'badge-success' : 'badge-danger text-white'} px-2 py-1 font-weight-bold small`}>
            {hasEmploymentRecords ? `${manualJobs.length + epfoJobs.length} Record(s) (Verified)` : 'Not Verified'}
          </span>
        </div>

        <div className="timeline-container pl-2">
          {hasEmploymentRecords ? (
            <>
              {/* EPFO / UAN Verified Records */}
              {epfoJobs.map((rec, idx) => (
                <div key={`epfo-${idx}`} className="timeline-verified-item position-relative mb-4 pb-3">
                  <span className="timeline-verified-node">&#10003;</span>
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-1">
                    <h5 className="font-weight-bold text-dark mb-0">{user?.designation || 'Verified Role'}</h5>
                    <span className="small text-muted font-weight-bold">
                      {rec.joiningDate || 'Joined'} &ndash; {rec.exitDate || 'Present'}
                    </span>
                  </div>
                  <p className="text-teal font-weight-bold mb-2">{rec.employerName}</p>
                  {rec.memberId && (
                    <p className="small text-secondary mb-2">
                      EPFO Member ID: <code>{rec.memberId}</code> &middot; Authenticated Employee Record
                    </p>
                  )}
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="verified-source-tag tag-teal mr-2">&#10003; EPFO Authenticated</span>
                    <span className="verified-source-tag tag-teal">&#10003; UAN Synced</span>
                  </div>
                </div>
              ))}

              {/* Manual Verified Records */}
              {manualJobs.map((job, idx) => (
                <div key={`manual-${idx}`} className="timeline-verified-item position-relative mb-4 pb-3">
                  <span className="timeline-verified-node">&#10003;</span>
                  <div className="d-flex flex-wrap align-items-center justify-content-between mb-1">
                    <h5 className="font-weight-bold text-dark mb-0">{job.designation || 'Specialist'}</h5>
                    <span className="small text-muted font-weight-bold">
                      {job.joiningDate || 'Past'} &ndash; {job.currentlyWorking ? 'Present' : (job.exitDate || 'Completed')}
                    </span>
                  </div>
                  <p className="text-teal font-weight-bold mb-2">{job.companyName}</p>
                  {job.workEmail && (
                    <p className="small text-secondary mb-2">
                      Work Email: {job.workEmail} &middot; Verified Candidate Entry
                    </p>
                  )}
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="verified-source-tag tag-teal mr-2">&#10003; Manually Added &amp; Verified</span>
                    <span className="verified-source-tag tag-teal">&#10003; Candidate Declared</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 text-center rounded border bg-light">
              <p className="text-danger mb-2 font-weight-bold">&#128188; No employment history verified yet</p>
              <p className="small text-secondary mb-3">Add employment history in KYC verification to boost your Trust Score.</p>
              <Link to="/kyc-verification" className="btn btn-sm btn-primary-teal px-3 py-2 font-weight-bold">
                Add Employment in KYC &rarr;
              </Link>
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
          <div className="d-flex align-items-center gap-2">
            <span className={`badge ${qualifications.some(q => q.isVerified && q.verificationStatus === 'verified') ? 'badge-success' : qualifications.length > 0 ? 'badge-danger text-white' : 'badge-light text-muted border'} px-2 py-1 font-weight-bold small`}>
              {qualifications.length > 0
                ? `${qualifications.filter(q => q.isVerified && q.verificationStatus === 'verified').length} / ${qualifications.length} Verified`
                : 'Not Added'}
            </span>
            {isSetupCompleted ? (
              <button
                type="button"
                disabled
                className="btn btn-sm btn-secondary font-weight-bold px-3 py-1"
                style={{ fontSize: '0.82rem', borderRadius: '50px', opacity: 0.6, cursor: 'not-allowed' }}
                title="Setup completed. Adding qualifications is locked."
              >
                + Add Qualification
              </button>
            ) : (
              <Link
                to="/kyc-verification#step-education"
                className="btn btn-sm btn-outline-teal font-weight-bold px-3 py-1"
                style={{ fontSize: '0.82rem', borderRadius: '50px' }}
              >
                + Add Qualification
              </Link>
            )}
          </div>
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
                          href={qual.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-view-btn"
                        >
                          📄 View Certificate &nearr;
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
              🎓 No educational qualifications added yet
            </p>
            <p className="small text-secondary mb-3">
              Add academic degrees, colleges, and diploma records in KYC verification to boost your Trust Score.
            </p>
            {isSetupCompleted ? (
              <button
                type="button"
                disabled
                className="btn btn-sm btn-secondary px-3 py-2 font-weight-bold"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                title="Setup completed. Adding qualifications is locked."
              >
                + Add Qualification in KYC (Setup Completed)
              </button>
            ) : (
              <Link to="/kyc-verification#step-education" className="btn btn-sm btn-primary-teal px-3 py-2 font-weight-bold">
                + Add Qualification in KYC &rarr;
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Card 4: Professional Certifications & Credentials */}
      <div className="profile-main-card p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <h3 className="profile-sec-heading mb-0 d-flex align-items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
            Professional Certifications &amp; Credentials
          </h3>
          <div className="d-flex align-items-center gap-2">
            <span className={`badge ${certifications.some(c => c.isVerified && c.verificationStatus === 'verified') ? 'badge-success' : certifications.length > 0 ? 'badge-danger text-white' : 'badge-light text-muted border'} px-2 py-1 font-weight-bold small`}>
              {certifications.length > 0
                ? `${certifications.filter(c => c.isVerified && c.verificationStatus === 'verified').length} / ${certifications.length} Verified`
                : 'Not Added'}
            </span>
            {isSetupCompleted ? (
              <button
                type="button"
                disabled
                className="btn btn-sm btn-secondary font-weight-bold px-3 py-1"
                style={{ fontSize: '0.82rem', borderRadius: '50px', opacity: 0.6, cursor: 'not-allowed' }}
                title="Setup completed. Adding certifications is locked."
              >
                + Add Certification
              </button>
            ) : (
              <Link
                to="/kyc-verification#step-education"
                className="btn btn-sm btn-outline-teal font-weight-bold px-3 py-1"
                style={{ fontSize: '0.82rem', borderRadius: '50px' }}
              >
                + Add Certification
              </Link>
            )}
          </div>
        </div>

        {certifications.length > 0 ? (
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
                          🔗 Verify Link &nearr;
                        </a>
                      )}
                      {cert.documentUrl && (
                        <a
                          href={cert.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-view-btn"
                        >
                          📄 View Certificate &nearr;
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
        ) : (
          <div className="p-4 text-center rounded border bg-light">
            <p className="mb-2 font-weight-bold" style={{ color: '#0f172a' }}>
              🏆 No professional certifications added yet
            </p>
            <p className="small text-secondary mb-3">
              Add vendor credentials (AWS, Google, Microsoft, Scrum, etc.) to showcase verified technical skills.
            </p>
            {isSetupCompleted ? (
              <button
                type="button"
                disabled
                className="btn btn-sm btn-secondary px-3 py-2 font-weight-bold"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                title="Setup completed. Adding certifications is locked."
              >
                + Add Certification (Setup Completed)
              </button>
            ) : (
              <Link to="/kyc-verification#step-education" className="btn btn-sm btn-primary-teal px-3 py-2 font-weight-bold">
                + Add Certification in KYC &rarr;
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileMainCards;
