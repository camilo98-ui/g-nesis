import { motion } from 'framer-motion';

/**
 * Nova — Premium AI Copilot
 * Aesthetic: Apple / Nothing / Figure AI
 * Minimal, clean, technological. Small body, elegant proportions.
 */
export default function NovaMascot({ isOpen, onClick, size = 80 }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="relative focus:outline-none select-none"
      style={{ width: size, height: size * 1.55 }}
      aria-label="Nova AI"
    >
      {/* Ground shadow */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: size * 0.65,
          height: size * 0.1,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(194,24,117,0.22) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
        animate={{ opacity: [0.4, 0.7, 0.4], scaleX: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.svg
        viewBox="0 0 80 124"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 4px 14px rgba(194,24,117,0.2)) drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
        }}
        // Gentle idle breathing
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          {/* Main body/head fill — white pearl */}
          <linearGradient id="n_body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FAF0F6" />
          </linearGradient>

          {/* Pink accent gradient */}
          <linearGradient id="n_pink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E91E8C" />
            <stop offset="100%" stopColor="#C21875" />
          </linearGradient>

          {/* Subtle gloss on head */}
          <radialGradient id="n_gloss" cx="35%" cy="22%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Face screen */}
          <radialGradient id="n_face" cx="40%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#FFF5FA" />
            <stop offset="100%" stopColor="#FAE0EF" />
          </radialGradient>

          {/* Leg/arm subtle gradient */}
          <linearGradient id="n_limb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDEEF6" />
            <stop offset="100%" stopColor="#F0C4DA" />
          </linearGradient>

          {/* Inner shadow for depth */}
          <filter id="n_inset">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* ── LEGS — short, rounded pillars ── */}
        <rect x="26" y="88" width="10" height="20" rx="5"
          fill="url(#n_limb)" stroke="rgba(194,24,117,0.18)" strokeWidth="0.5" />
        <rect x="44" y="88" width="10" height="20" rx="5"
          fill="url(#n_limb)" stroke="rgba(194,24,117,0.18)" strokeWidth="0.5" />

        {/* Feet — flat, minimal */}
        <rect x="22" y="104" width="17" height="8" rx="4"
          fill="#F2C0D8" stroke="rgba(194,24,117,0.2)" strokeWidth="0.4" />
        <rect x="41" y="104" width="17" height="8" rx="4"
          fill="#F2C0D8" stroke="rgba(194,24,117,0.2)" strokeWidth="0.4" />

        {/* ── ARMS — thin, elegant ── */}
        {/* Left arm */}
        <motion.g
          animate={{ rotate: [0, 3, 0, -1.5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '14px 62px' }}
        >
          <rect x="10" y="58" width="9" height="22" rx="4.5"
            fill="url(#n_limb)" stroke="rgba(194,24,117,0.18)" strokeWidth="0.5" />
          {/* Hand dot */}
          <circle cx="14.5" cy="81.5" r="4"
            fill="#F2C0D8" stroke="rgba(194,24,117,0.2)" strokeWidth="0.4" />
        </motion.g>

        {/* Right arm */}
        <motion.g
          animate={{ rotate: [0, -3, 0, 1.5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          style={{ transformOrigin: '66px 62px' }}
        >
          <rect x="61" y="58" width="9" height="22" rx="4.5"
            fill="url(#n_limb)" stroke="rgba(194,24,117,0.18)" strokeWidth="0.5" />
          <circle cx="65.5" cy="81.5" r="4"
            fill="#F2C0D8" stroke="rgba(194,24,117,0.2)" strokeWidth="0.4" />
        </motion.g>

        {/* ── BODY — compact, rounded rectangle ── */}
        <rect x="18" y="54" width="44" height="38" rx="14"
          fill="url(#n_body)" stroke="rgba(194,24,117,0.15)" strokeWidth="0.7" />

        {/* Body top highlight */}
        <ellipse cx="36" cy="59" rx="14" ry="4.5" fill="rgba(255,255,255,0.6)" />

        {/* Minimal chest panel */}
        <rect x="27" y="65" width="26" height="16" rx="7"
          fill="rgba(253,238,246,0.8)" stroke="rgba(194,24,117,0.12)" strokeWidth="0.5" />

        {/* Status bar — single thin line */}
        <motion.rect x="32" y="70" width="16" height="2.5" rx="1.25"
          fill="url(#n_pink)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Three minimal indicator dots */}
        <motion.circle cx="33" cy="76.5" r="1.2" fill="rgba(194,24,117,0.55)"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
        <motion.circle cx="40" cy="76.5" r="1.2" fill="rgba(194,24,117,0.45)"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
        <motion.circle cx="47" cy="76.5" r="1.2" fill="rgba(168,85,247,0.45)"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} />

        {/* ── NECK — thin connector ── */}
        <rect x="35" y="46" width="10" height="11" rx="4"
          fill="url(#n_limb)" stroke="rgba(194,24,117,0.15)" strokeWidth="0.5" />

        {/* ── HEAD — main rounded square, premium ── */}
        {/* Subtle outer glow behind head */}
        <motion.rect x="11" y="4" width="58" height="46" rx="20"
          fill="rgba(194,24,117,0)"
          stroke="rgba(194,24,117,0.12)"
          strokeWidth="3"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Head shape */}
        <rect x="13" y="6" width="54" height="43" rx="18"
          fill="url(#n_body)" stroke="rgba(194,24,117,0.2)" strokeWidth="0.7" />

        {/* Head gloss */}
        <ellipse cx="34" cy="14" rx="18" ry="7" fill="url(#n_gloss)" />

        {/* ── FACE SCREEN — recessed panel ── */}
        <rect x="20" y="12" width="40" height="30" rx="12"
          fill="url(#n_face)" stroke="rgba(194,24,117,0.15)" strokeWidth="0.5" />

        {/* ── EYES — refined, not oversized ── */}
        {/* Eye whites */}
        <ellipse cx="32" cy="25" rx="6.5" ry="7" fill="white" />
        <ellipse cx="48" cy="25" rx="6.5" ry="7" fill="white" />

        {/* Iris */}
        <ellipse cx="32" cy="25" rx="4" ry="4.5" fill="#C21875" />
        <ellipse cx="48" cy="25" rx="4" ry="4.5" fill="#C21875" />

        {/* Pupil */}
        <ellipse cx="32.5" cy="24.5" rx="2" ry="2.5" fill="#3d0620" />
        <ellipse cx="48.5" cy="24.5" rx="2" ry="2.5" fill="#3d0620" />

        {/* Specular highlights */}
        <ellipse cx="31.2" cy="22.5" rx="1" ry="1.3" fill="white" opacity="0.9" />
        <ellipse cx="47.2" cy="22.5" rx="1" ry="1.3" fill="white" opacity="0.9" />

        {/* Subtle blink */}
        <motion.rect x="25.5" y="18" width="13" height="7" rx="3.5" fill="#FFF5FA"
          animate={{ scaleY: [0, 0, 0, 1, 0] }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.8, 0.88, 0.94, 1] }}
          style={{ transformOrigin: '32px 25px' }}
        />
        <motion.rect x="41.5" y="18" width="13" height="7" rx="3.5" fill="#FFF5FA"
          animate={{ scaleY: [0, 0, 0, 1, 0] }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.8, 0.88, 0.94, 1] }}
          style={{ transformOrigin: '48px 25px' }}
        />

        {/* Minimal mouth — simple curve */}
        <path d="M 28 35 Q 40 41 52 35"
          stroke="rgba(194,24,117,0.55)" strokeWidth="1.4" strokeLinecap="round" fill="none" />

        {/* Soft cheek blush */}
        <ellipse cx="21" cy="30" rx="4" ry="2.5" fill="rgba(233,30,99,0.08)" />
        <ellipse cx="59" cy="30" rx="4" ry="2.5" fill="rgba(233,30,99,0.08)" />

        {/* ── ANTENNA — minimal, single dot ── */}
        <rect x="37.5" y="0" width="5" height="9" rx="2.5"
          fill="#F0C4DA" stroke="rgba(194,24,117,0.25)" strokeWidth="0.5" />
        <motion.circle cx="40" cy="0.5" r="3"
          fill="#C21875"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Antenna pulse ring */}
        <motion.circle cx="40" cy="0.5" r="3"
          fill="none" stroke="rgba(194,24,117,0.45)" strokeWidth="1"
          animate={{ r: [3, 6.5, 3], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />

        {/* ── SHOULDER JOINTS — subtle rounded nubs ── */}
        <circle cx="19" cy="62" r="4"
          fill="#F2C0D8" stroke="rgba(194,24,117,0.18)" strokeWidth="0.4" />
        <circle cx="61" cy="62" r="4"
          fill="#F2C0D8" stroke="rgba(194,24,117,0.18)" strokeWidth="0.4" />

      </motion.svg>
    </motion.button>
  );
}