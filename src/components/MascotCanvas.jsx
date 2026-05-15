import React from 'react';

/**
 * Ultra Premium AI Mascot - Nova
 * Minimalist, cinematographic, glossy white body with rose accents
 * Apple/OpenAI aesthetic with technological feel
 */
export default function MascotCanvas({ width = 115, height = 115, style = {} }) {
  const viewBox = '0 0 200 240';
  
  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={height}
      style={{
        filter: 'drop-shadow(0 0 0 transparent)',
        ...style,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Deep charcoal/dark background */}
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#2a2a3a" />
          <stop offset="100%" stopColor="#1a1a24" />
        </radialGradient>

        {/* Ultra glossy white body */}
        <radialGradient id="bodyGloss" cx="45%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.98" />
          <stop offset="70%" stopColor="#eef2f7" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e8ecf1" stopOpacity="0.92" />
        </radialGradient>

        {/* Subtle rose inner glow */}
        <radialGradient id="roseGlow" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#c21875" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#c21875" stopOpacity="0" />
        </radialGradient>

        {/* Eye gradient - technological minimalist */}
        <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="50%" stopColor="#0f0f18" />
          <stop offset="100%" stopColor="#0a0a12" />
        </linearGradient>

        {/* Eye shine - glass reflection */}
        <radialGradient id="eyeShine" cx="35%" cy="35%" r="45%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Subtle rose accent rim */}
        <linearGradient id="accentRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c21875" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#c21875" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#c21875" stopOpacity="0" />
        </linearGradient>

        {/* Filter for glow effect - soft halo around mascot */}
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2.5" />
          <feColorMatrix type="saturate" values="1.2" />
        </filter>

        {/* Filter for crisp edges */}
        <filter id="crisp">
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
      </defs>

      {/* Dark elegant background circle */}
      <circle cx="100" cy="100" r="95" fill="url(#bgGrad)" />

      {/* Subtle outer glow - very soft */}
      <circle
        cx="100"
        cy="100"
        r="93"
        fill="none"
        stroke="#c21875"
        strokeWidth="0.8"
        opacity="0.12"
      />

      {/* Main body - ultra glossy sphere */}
      <ellipse cx="100" cy="95" rx="58" ry="62" fill="url(#bodyGloss)" />

      {/* Subtle rose inner glow */}
      <ellipse cx="100" cy="95" rx="58" ry="62" fill="url(#roseGlow)" />

      {/* Glass-like rim accent top */}
      <ellipse
        cx="100"
        cy="65"
        rx="58"
        ry="15"
        fill="url(#accentRim)"
        opacity="0.6"
      />

      {/* High-gloss reflection spot - left-top */}
      <ellipse
        cx="75"
        cy="65"
        rx="18"
        ry="22"
        fill="#ffffff"
        opacity="0.18"
        filter="url(#softGlow)"
      />

      {/* LEFT EYE */}
      <g>
        {/* Eye background circle */}
        <circle cx="75" cy="85" r="14" fill="url(#eyeGrad)" />
        
        {/* Eye white inner */}
        <circle cx="75" cy="87" r="8" fill="#f5f5f7" />
        
        {/* Pupil - minimalist tech look */}
        <circle cx="76" cy="88" r="5.5" fill="#0f0f18" />
        
        {/* Pupil shine - glass reflection */}
        <circle cx="77.5" cy="86" r="2" fill="#ffffff" opacity="0.9" />
        
        {/* Secondary shine */}
        <circle cx="75" cy="90" r="1" fill="#ffffff" opacity="0.5" />
      </g>

      {/* RIGHT EYE */}
      <g>
        {/* Eye background circle */}
        <circle cx="125" cy="85" r="14" fill="url(#eyeGrad)" />
        
        {/* Eye white inner */}
        <circle cx="125" cy="87" r="8" fill="#f5f5f7" />
        
        {/* Pupil - minimalist tech look */}
        <circle cx="126" cy="88" r="5.5" fill="#0f0f18" />
        
        {/* Pupil shine - glass reflection */}
        <circle cx="127.5" cy="86" r="2" fill="#ffffff" opacity="0.9" />
        
        {/* Secondary shine */}
        <circle cx="125" cy="90" r="1" fill="#ffffff" opacity="0.5" />
      </g>

      {/* Minimalist mouth - single thin line */}
      <path
        d="M 85 115 Q 100 122 115 115"
        stroke="#c21875"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Subtle rose cheek - left */}
      <ellipse
        cx="58"
        cy="105"
        rx="8"
        ry="5"
        fill="#c21875"
        opacity="0.08"
      />

      {/* Subtle rose cheek - right */}
      <ellipse
        cx="142"
        cy="105"
        rx="8"
        ry="5"
        fill="#c21875"
        opacity="0.08"
      />

      {/* Bottom accent - softer gradient fade */}
      <ellipse
        cx="100"
        cy="155"
        rx="55"
        ry="12"
        fill="url(#roseGlow)"
        opacity="0.5"
      />

      {/* Technological line detail - bottom center */}
      <line
        x1="100"
        y1="145"
        x2="100"
        y2="160"
        stroke="#c21875"
        strokeWidth="0.6"
        opacity="0.15"
      />

      {/* Side accent lines - ultra minimal */}
      <line
        x1="55"
        y1="95"
        x2="65"
        y2="100"
        stroke="#c21875"
        strokeWidth="0.5"
        opacity="0.1"
      />
      <line
        x1="145"
        y1="95"
        x2="135"
        y2="100"
        stroke="#c21875"
        strokeWidth="0.5"
        opacity="0.1"
      />
    </svg>
  );
}