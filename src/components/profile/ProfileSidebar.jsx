import React from 'react';
import { useSelector } from 'react-redux';
import { calculateTrustScore } from '../../utils/profileUtils';

const ProfileSidebar = ({ user: propUser }) => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const user = propUser || reduxUser;

  const {
    score: totalScore,
    aadhaarScore,
    voterScore,
    dlScore,
    empScore,
    eduScore,
    isAadhaarDone,
    isVoterDone,
    isDlDone,
    isEmpDone,
    isEduVerified
  } = calculateTrustScore(user);

  return (
    <div className="col-lg-4">
      {/* Score Breakdown Card */}
      <div className="profile-main-card p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="font-weight-bold text-dark mb-0">Score Breakdown</h4>
          <span className="badge badge-success px-2 py-1 font-weight-bold">
            {totalScore} / 100 Pts
          </span>
        </div>

        {/* Item 1: Aadhaar Identity */}
        <div className="mb-3">
          <div className="d-flex justify-content-between small font-weight-bold mb-1">
            <span>Aadhaar Identity Verification</span>
            <span className={isAadhaarDone ? 'text-teal' : 'text-danger'}>{aadhaarScore} / 20 Pts</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${isAadhaarDone ? 'bg-success' : 'bg-danger'}`}
              style={{ width: `${isAadhaarDone ? 100 : 100}%`, opacity: isAadhaarDone ? 1 : 0.35 }}
            ></div>
          </div>
        </div>

        {/* Item 2: Voter Address Proof */}
        <div className="mb-3">
          <div className="d-flex justify-content-between small font-weight-bold mb-1">
            <span>Voter Address Proof</span>
            <span className={isVoterDone ? 'text-teal' : 'text-danger'}>{voterScore} / 20 Pts</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${isVoterDone ? 'bg-success' : 'bg-danger'}`}
              style={{ width: `${isVoterDone ? 100 : 100}%`, opacity: isVoterDone ? 1 : 0.35 }}
            ></div>
          </div>
        </div>

        {/* Item 3: Driving License OCR */}
        <div className="mb-3">
          <div className="d-flex justify-content-between small font-weight-bold mb-1">
            <span>Driving License OCR</span>
            <span className={isDlDone ? 'text-teal' : 'text-danger'}>{dlScore} / 5 Pts</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${isDlDone ? 'bg-success' : 'bg-danger'}`}
              style={{ width: `${isDlDone ? 100 : 100}%`, opacity: isDlDone ? 1 : 0.35 }}
            ></div>
          </div>
        </div>

        {/* Item 4: Employment History (EPFO) */}
        <div className="mb-3">
          <div className="d-flex justify-content-between small font-weight-bold mb-1">
            <span>Employment Record (EPFO)</span>
            <span className={isEmpDone ? 'text-teal' : 'text-danger'}>{empScore} / 35 Pts</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${isEmpDone ? 'bg-success' : 'bg-danger'}`}
              style={{ width: `${isEmpDone ? 100 : 100}%`, opacity: isEmpDone ? 1 : 0.35 }}
            ></div>
          </div>
        </div>

        {/* Item 5: Academic Qualifications & Certifications */}
        <div className="mb-2">
          <div className="d-flex justify-content-between small font-weight-bold mb-1">
            <span>Qualifications &amp; Certs</span>
            <span className={isEduVerified ? 'text-teal' : 'text-danger'}>{eduScore} / 20 Pts</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${isEduVerified ? 'bg-success' : 'bg-danger'}`}
              style={{ width: `${isEduVerified ? 100 : 100}%`, opacity: isEduVerified ? 1 : 0.35 }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
