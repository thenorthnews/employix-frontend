import React, { useState, useEffect } from 'react';

const CATEGORIZED_ROLES = [
  {
    category: 'Technology & Engineering',
    roles: [
      'Software Engineer',
      'Senior Software Engineer',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'DevOps Engineer',
      'Cloud Solutions Architect',
      'QA / Test Engineer',
      'System Administrator',
      'IT Support / Network Engineer',
    ],
  },
  {
    category: 'Product, Management & Design',
    roles: [
      'Product Manager',
      'Associate Product Manager',
      'Project Manager / Scrum Master',
      'UI/UX Designer',
      'Product Designer',
      'Business Analyst',
      'Strategy Consultant',
    ],
  },
  {
    category: 'Data & Artificial Intelligence',
    roles: [
      'Data Analyst',
      'Data Scientist',
      'AI / Machine Learning Engineer',
      'Business Intelligence Analyst',
      'Data Engineer',
    ],
  },
  {
    category: 'Human Resources & Operations',
    roles: [
      'Human Resources (HR) Executive',
      'HR Manager',
      'Talent Acquisition Specialist',
      'Technical Recruiter',
      'Operations Manager',
      'Operations Executive',
      'Executive Assistant',
      'Supply Chain & Logistics Specialist',
    ],
  },
  {
    category: 'Sales, Marketing & Growth',
    roles: [
      'Business Development Manager',
      'Sales Executive',
      'Account Manager / Client Relations',
      'Marketing Manager',
      'Digital Marketing Specialist',
      'Content Strategist / Copywriter',
      'Customer Success Specialist',
    ],
  },
  {
    category: 'Defense & Security',
    roles: [
      'Defense Veteran',
      'Security Officer / Executive',
      'Risk & Safety Officer',
    ],
  },
  {
    category: 'Finance, Healthcare & Specialized',
    roles: [
      'Financial Analyst',
      'Chartered Accountant',
      'Finance Executive / Accountant',
      'Civil / Mechanical / Electrical Engineer',
      'Legal & Compliance Specialist',
      'Healthcare Professional / Doctor',
      'Fresher / Graduate Trainee',
      'Freelancer / Consultant',
    ],
  },
];

const ALL_ROLES_FLAT = CATEGORIZED_ROLES.flatMap((c) => c.roles);

const DesignationSelect = ({
  value = '',
  onChange,
  error = '',
  placeholder = 'Select your Professional Designation / Role...',
  disabled = false,
  maxLength = 60,
  id = 'designation-select',
}) => {
  const [selectedDropdown, setSelectedDropdown] = useState('');
  const [customText, setCustomText] = useState('');

  // Sync state from incoming value
  useEffect(() => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      setSelectedDropdown('');
      setCustomText('');
      return;
    }

    const matchedRole = ALL_ROLES_FLAT.find(
      (r) => r.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchedRole) {
      setSelectedDropdown(matchedRole);
      setCustomText('');
    } else {
      setSelectedDropdown('Other');
      setCustomText(trimmed);
    }
  }, [value]);

  const handleDropdownChange = (e) => {
    const selected = e.target.value;
    setSelectedDropdown(selected);

    if (selected === 'Other') {
      if (typeof onChange === 'function') {
        onChange(customText || '');
      }
    } else if (selected) {
      setCustomText('');
      if (typeof onChange === 'function') {
        onChange(selected);
      }
    } else {
      setCustomText('');
      if (typeof onChange === 'function') {
        onChange('');
      }
    }
  };

  const handleCustomTextChange = (e) => {
    const text = e.target.value.slice(0, maxLength);
    setCustomText(text);
    if (typeof onChange === 'function') {
      onChange(text);
    }
  };

  const isOtherSelected = selectedDropdown === 'Other';

  return (
    <div style={{ width: '100%' }}>
      {/* Native Clean Dropdown Select */}
      <div style={{ position: 'relative', width: '100%' }}>
        <select
          id={id}
          disabled={disabled}
          value={selectedDropdown}
          onChange={handleDropdownChange}
          style={{
            width: '100%',
            padding: '11px 40px 11px 14px',
            borderRadius: '12px',
            border: error ? '1.5px solid #EF4444' : selectedDropdown ? '1.5px solid #00D294' : '1.5px solid #CBD5E1',
            background: disabled ? '#F8FAFC' : '#FFFFFF',
            fontSize: '0.94rem',
            fontWeight: selectedDropdown ? 600 : 400,
            color: selectedDropdown ? '#0F172A' : '#64748B',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            boxShadow: error
              ? '0 0 0 3px rgba(239, 68, 68, 0.12)'
              : selectedDropdown
              ? '0 0 0 3px rgba(0, 210, 148, 0.12)'
              : '0 1px 2px rgba(0, 0, 0, 0.04)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <option value="" disabled style={{ color: '#94A3B8' }}>
            {placeholder}
          </option>

          {CATEGORIZED_ROLES.map((cat, catIdx) => (
            <optgroup key={catIdx} label={`── ${cat.category} ──`} style={{ fontWeight: 700, color: '#0F172A' }}>
              {cat.roles.map((role, roleIdx) => (
                <option key={roleIdx} value={role} style={{ fontWeight: 500, color: '#1E293B', padding: '6px 0' }}>
                  {role}
                </option>
              ))}
            </optgroup>
          ))}

          <optgroup label="── Custom Option ──" style={{ fontWeight: 700, color: '#0F172A' }}>
            <option value="Other" style={{ fontWeight: 700, color: '#00A876' }}>
              Other (Specify Your Custom Role)
            </option>
          </optgroup>
        </select>

        {/* Custom Chevron Arrow Icon */}
        <div
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: selectedDropdown ? '#00A876' : '#64748B',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* When "Other" is selected, show custom role input field */}
      {isOtherSelected && (
        <div style={{ marginTop: '10px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '5px',
            }}
          >
            Specify Your Custom Designation / Role <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              maxLength={maxLength}
              value={customText}
              onChange={handleCustomTextChange}
              placeholder="e.g. Chief Marketing Officer, Flutter Developer, Cyber Security Analyst"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: error && !customText.trim() ? '1.5px solid #EF4444' : '1.5px solid #00D294',
                fontSize: '0.92rem',
                color: '#0F172A',
                outline: 'none',
                background: '#FFFFFF',
                boxShadow: '0 0 0 3px rgba(0, 210, 148, 0.12)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationSelect;
