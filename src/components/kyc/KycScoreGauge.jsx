import React from 'react';

const KycScoreGauge = ({ score = 0 }) => {
  const numericScore = Math.min(100, Math.max(0, Number(score) || 0));

  // User Color Rules with Rich Gradients:
  // - 20 se below (<= 20): Red color gradient effect (#FB7185 -> #EF4444 -> #DC2626)
  // - 20 se upper aur 70 se niche (> 20 && <= 70): Amber gradient effect (#FDE047 -> #F59E0B -> #EA580C)
  // - 70 se upper (> 70): Green color gradient effect (#00F5A0 -> #00D294 -> #059669)
  let tier = {
    gradientId: 'scoreGradRed',
    gradientCss: 'linear-gradient(135deg, #FB7185 0%, #EF4444 50%, #DC2626 100%)',
    color: '#EF4444',
    scoreColor: '#EF4444',
    textColor: '#DC2626',
    scoreBgLight: '#FEF2F2',
    scoreBorderLight: 'rgba(239, 68, 68, 0.35)',
    glowLight: 'rgba(239, 68, 68, 0.35)',
    scoreLabel: 'Basic Trust',
    knobColor: '#DC2626',
  };

  if (numericScore > 70) {
    tier = {
      gradientId: 'scoreGradGreen',
      gradientCss: 'linear-gradient(135deg, #00F5A0 0%, #00D294 50%, #059669 100%)',
      color: '#00D294',
      scoreColor: '#00D294',
      textColor: '#047857',
      scoreBgLight: 'rgba(0, 210, 148, 0.12)',
      scoreBorderLight: 'rgba(0, 210, 148, 0.4)',
      glowLight: 'rgba(0, 210, 148, 0.35)',
      scoreLabel: 'High Trust',
      knobColor: '#059669',
    };
  } else if (numericScore > 20) {
    tier = {
      gradientId: 'scoreGradAmber',
      gradientCss: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 50%, #EA580C 100%)',
      color: '#EE740D',
      scoreColor: '#F59E0B',
      textColor: '#B45309',
      scoreBgLight: '#FFFBEB',
      scoreBorderLight: 'rgba(245, 158, 11, 0.4)',
      glowLight: 'rgba(245, 158, 11, 0.35)',
      scoreLabel: 'Moderate Trust',
      knobColor: '#EA580C',
    };
  }

  // Increased size for high prominence and readability (from 136px to 174px)
  const size = 174;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  // Knob position calculation at the end of the arc
  const angleDeg = -90 + (numericScore / 100) * 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  const knobX = cx + radius * Math.cos(angleRad);
  const knobY = cy + radius * Math.sin(angleRad);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="kyc-score-gauge-widget"
      style={{
        borderRadius: '24px',
        padding: '16px 18px',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        flexShrink: 0,
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
      }}
    >
      <div style={{ width: size, height: size, position: 'relative' }}>
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          <defs>
            {/* Red Gradient (<= 20) */}
            <linearGradient id="scoreGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>

            {/* Amber Gradient (21 - 70) */}
            <linearGradient id="scoreGradAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            {/* Green Gradient (> 70) */}
            <linearGradient id="scoreGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F5A0" />
              <stop offset="50%" stopColor="#00D294" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Luminous Soft Glow Filter */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor={tier.glowLight} floodOpacity="0.65" />
            </filter>
          </defs>

          {/* Background grey track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Dynamic gradient-filled progress arc with soft luminous glow */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke={`url(#${tier.gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              transition: 'stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
            }}
          />

          {/* Glowing Knob at the tip of the arc */}
          {numericScore > 0 && (
            <g>
              <circle
                cx={knobX}
                cy={knobY}
                r={strokeWidth / 2 + 5}
                fill={tier.knobColor}
                opacity="0.22"
                style={{
                  transition:
                    'cx 0.85s cubic-bezier(0.16, 1, 0.3, 1), cy 0.85s cubic-bezier(0.16, 1, 0.3, 1), fill 0.4s ease',
                }}
              />
              <circle
                cx={knobX}
                cy={knobY}
                r={strokeWidth / 2 + 2}
                fill={tier.knobColor}
                stroke="#FFFFFF"
                strokeWidth="3.5"
                style={{
                  filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.28))',
                  transition:
                    'cx 0.85s cubic-bezier(0.16, 1, 0.3, 1), cy 0.85s cubic-bezier(0.16, 1, 0.3, 1), fill 0.4s ease',
                }}
              />
            </g>
          )}
        </svg>

        {/* Center Content */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Top Label Pill */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: tier.scoreBgLight,
              color: tier.textColor,
              border: `1px solid ${tier.scoreBorderLight}`,
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.2px',
              lineHeight: 1.2,
              marginBottom: '2px',
              boxShadow: `0 2px 6px ${tier.glowLight}`,
              transition: 'all 0.35s ease',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: tier.knobColor,
                boxShadow: `0 0 6px ${tier.knobColor}`,
              }}
            />
            {tier.scoreLabel}
          </span>

          {/* Adaptive Gradient Score Number */}
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              backgroundImage: tier.gradientCss,
              WebkitBackgroundImage: tier.gradientCss,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: tier.color,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              marginTop: '1px',
              marginBottom: '1px',
              display: 'inline-block',
              transition: 'all 0.4s ease',
            }}
          >
            {numericScore}
          </div>

          {/* 'Your Score' Subtitle */}
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#334155',
              letterSpacing: '0.2px',
              marginTop: '2px',
              lineHeight: 1.1,
            }}
          >
            Your Score
          </div>

          {/* Subtext Date */}
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              color: '#94A3B8',
              marginTop: '2px',
              lineHeight: 1,
              letterSpacing: '0.2px',
            }}
          >
            as on {formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycScoreGauge;
