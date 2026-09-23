import React, { useState, useEffect, useRef } from 'react';

const tiersData = [
  {
    tierClass: 'tier-platinum',
    bulletClass: 'bullet-platinum',
    nameClass: 'name-platinum',
    name: 'Platinum',
    desc: 'Highly Trusted',
    range: '90-100',
    barClass: 'bar-platinum',
    width: '90%'
  },
  {
    tierClass: 'tier-gold',
    bulletClass: 'bullet-gold',
    nameClass: 'name-gold',
    name: 'Gold',
    desc: 'Trusted',
    range: '70-89',
    barClass: 'bar-gold',
    width: '78%'
  },
  {
    tierClass: 'tier-silver',
    bulletClass: 'bullet-silver',
    nameClass: 'name-silver',
    name: 'Silver',
    desc: 'Verified',
    range: '55-69',
    barClass: 'bar-silver',
    width: '60%'
  },
  {
    tierClass: 'tier-bronze',
    bulletClass: 'bullet-bronze',
    nameClass: 'name-bronze',
    name: 'Bronze',
    desc: 'Partially Verified',
    range: '40-54',
    barClass: 'bar-bronze',
    width: '45%'
  },
  {
    tierClass: 'tier-building',
    bulletClass: 'bullet-building',
    nameClass: 'name-building',
    name: 'Building',
    desc: 'In Progress',
    range: '0-39',
    barClass: 'bar-building',
    width: '25%'
  }
];

const ScoreSection = () => {
  const [score, setScore] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          // Counter animation 0 -> 87
          const targetScore = 87;
          const duration = 1400; // ms
          const startTime = performance.now();

          const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeOut * targetScore);

            setScore(currentVal);

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              setScore(targetScore);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section className="employix-score-section position-relative overflow-hidden" id="employix-score" ref={sectionRef}>
      {/* Ambient Background Orbs */}
      <div className="score-glow-orb orb-teal-glow" aria-hidden="true"></div>
      <div className="score-glow-orb orb-blue-glow" aria-hidden="true"></div>

      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center">
          {/* Left Content Column */}
          <div className="col-lg-5 mb-5 mb-lg-0">
            {/* EMPLOYIX SCORE Pill Badge */}
            <span className="hero-badge mb-4">EMPLOYIX SCORE</span>

            {/* Headline */}
            <h2 className="score-main-title section-heading mb-4">
              Your career.<br />
              <span className="text-teal">Measured <br /> by trust.</span>
            </h2>

            {/* Subtitle */}
            <p className="score-main-desc section-desc mb-5">
              A 0–100 score built entirely from verified data &mdash; not self-declared claims.
            </p>

            {/* Big Score Number Display */}
            <div className={`score-number-display d-flex align-items-center gap-3 ${hasAnimated ? 'animate-in' : ''}`}>
              <div className="big-score-val">{score}</div>
              <div className="score-denom-badge-wrap d-flex flex-column justify-content-center ml-3">
                <span className="score-denom-text">/100</span>
                <span className="platinum-pill-tag mt-1">PLATINUM</span>
              </div>
            </div>
          </div>

          {/* Right Tiers Column */}
          <div className="col-lg-7">
            <div className="score-tiers-container d-flex flex-column gap-3">
              {tiersData.map((tier, index) => (
                <div
                  key={tier.name}
                  className={`tier-card ${tier.tierClass} ${hasAnimated ? 'animate-in' : ''}`}
                  style={{
                    transitionDelay: `${index * 120}ms`
                  }}
                >
                  <div className="tier-card-header d-flex justify-content-between align-items-center mb-2">
                    <div className="tier-title-group d-flex align-items-center">
                      <span className={`tier-bullet ${tier.bulletClass}`}></span>
                      <span className={`tier-name ${tier.nameClass}`}>{tier.name}</span>
                      <span className="tier-desc ml-2">{tier.desc}</span>
                    </div>
                    <span className="tier-range">{tier.range}</span>
                  </div>
                  <div className="tier-progress-track">
                    <div
                      className={`tier-progress-bar ${tier.barClass}`}
                      style={{
                        width: hasAnimated ? tier.width : '0%',
                        transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScoreSection;
