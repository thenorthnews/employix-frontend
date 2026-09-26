import React from 'react';
import { resolveImageUrl, formatEmployixId, calculateTrustScore } from '../../utils/profileUtils';

const CandidateScoreCard = ({ user, onEdit }) => {
  // 1. Resolve Avatar URL
  const avatarSrc = resolveImageUrl(user?.profileImage);

  // 2. Candidate Name
  const candidateName = user?.name || 'Aarav Sharma';

  // 3. Designation & Location
  const designation = user?.designation || 'Professional';
  const locationCity =
    user?.city ||
    (user?.address ? user.address.split(',').slice(-2, -1)[0]?.trim() : null) ||
    'Bangalore';
  const roleAndLocation = `${designation} · ${locationCity}`;

  // 4. Formatted Employix ID
  const formattedId = formatEmployixId(user?.employixId, user?._id);

  // 5. Dynamic Trust Score & Tier
  const { displayScore, tierText, totalEarnedScore, totalApplicableScore } = calculateTrustScore(user);

  // 7. Dynamic Skill Tags
  const defaultSkills = [
    'Product Strategy',
    'Roadmapping',
    'Analytics',
    'Stakeholder Management',
    'Agile',
    'GTM',
  ];

  const derivedSkills = [];
  if (Array.isArray(user?.skills) && user.skills.length > 0) {
    derivedSkills.push(...user.skills);
  }
  if (Array.isArray(user?.certifications) && user.certifications.length > 0) {
    user.certifications.forEach((c) => {
      if (c.title) derivedSkills.push(c.title.split(' ')[0]);
    });
  }
  if (Array.isArray(user?.qualifications) && user.qualifications.length > 0) {
    user.qualifications.forEach((q) => {
      if (q.degree) derivedSkills.push(q.degree);
    });
  }

  const skillsToShow =
    derivedSkills.length >= 3 ? Array.from(new Set(derivedSkills)).slice(0, 6) : defaultSkills;

  // 8. Gauge Arc Math (260° arc from 140° to 40°, Radius = 72, center = 100, 95)
  const ARC_LENGTH = 326.72;
  const clampedScore = Math.max(0, Math.min(100, displayScore));
  const strokeOffset = ARC_LENGTH - (ARC_LENGTH * clampedScore) / 100;

  return (
    <div className="candidate-card-container">
      {/* Top Candidate Avatar */}
      <div className="candidate-avatar-wrapper position-relative">
        <img
          src={avatarSrc}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/identity.jpg';
          }}
          alt={candidateName}
          className="candidate-card-avatar"
        />
        {onEdit && (
          <button
            type="button"
            className="candidate-avatar-edit-icon"
            onClick={onEdit}
            title="Edit Profile"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Semi-Circular SVG Progress Gauge */}
      <div className="candidate-gauge-box">
        <svg
          viewBox="0 0 200 160"
          className="candidate-gauge-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="candidateScoreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D294" />
              <stop offset="100%" stopColor="#00E5A3" />
            </linearGradient>
          </defs>

          {/* Background Arc Track */}
          <path
            d="M 44.8 141.3 A 72 72 0 1 1 155.2 141.3"
            fill="none"
            stroke="#162740"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Score Progress Arc */}
          <path
            d="M 44.8 141.3 A 72 72 0 1 1 155.2 141.3"
            fill="none"
            stroke="url(#candidateScoreGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={strokeOffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        {/* Center Score Value */}
        <div className="candidate-gauge-center-content">
          <div className="candidate-score-number">{displayScore}%</div>
          <div className="candidate-score-sublabel">
            {totalEarnedScore ? `${totalEarnedScore}/${totalApplicableScore} Pts` : 'Base 100%'}
          </div>
        </div>
      </div>

      {/* Tier Badge Pill */}
      <div className="mt-2 mb-3">
        <span className="candidate-tier-pill">{tierText}</span>
      </div>

      {/* Candidate Name */}
      <h3 className="candidate-fullname">{candidateName}</h3>

      {/* Role & City */}
      <p className="candidate-role-text">{roleAndLocation}</p>

      {/* Employix ID */}
      <div className="candidate-id-code">{formattedId}</div>

      {/* Skill Pills */}
      {/* <div className="candidate-skills-row">
        {skillsToShow.map((skill, index) => (
          <span key={index} className="candidate-skill-tag">
            {skill}
          </span>
        ))}
      </div> */}
    </div>
  );
};

export default CandidateScoreCard;
