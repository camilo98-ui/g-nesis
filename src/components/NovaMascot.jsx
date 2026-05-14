import { motion } from 'framer-motion';

// Nova — Premium AI Robot Mascot
// Full body: big head, small body, arms, legs. Same pink/white face. Apple/Disney aesthetic.

export default function NovaMascot({ isOpen, onClick, size = 80 }) {
  const s = size;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.93 }}
      className="relative focus:outline-none"
      style={{ width: s * 1.15, height: s * 1.6 }}
      aria-label="Abrir Nova"
    >
      {/* Ambient glow below Nova (ground reflection) */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: s * 0.85,
          height: s * 0.18,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(194,24,117,0.35) 0%, transparent 70%)',
          filter: 'blur(6px)',
        }}
        animate={{ opacity: [0.5, 0.85, 0.5], scaleX: [0.9, 1.05, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Full Nova SVG */}
      <motion.svg
        viewBox="0 0 100 145"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 6px 18px rgba(194,24,117,0.28))' }}
        // Idle breathing
        animate={{ y: [0, -3.5, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          {/* Head gradient — white/pink glossy */}
          <radialGradient id="headGrad" cx="42%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#FDE8F2" />
            <stop offset="100%" stopColor="#F7C5DC" />
          </radialGradient>

          {/* Body gradient */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#FDE8F2" />
            <stop offset="100%" stopColor="#F2B8D4" />
          </linearGradient>

          {/* Arm gradient */}
          <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDEEF6" />
            <stop offset="100%" stopColor="#F0AECF" />
          </linearGradient>

          {/* Leg gradient */}
          <linearGradient id="legGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F9D5E8" />
            <stop offset="100%" stopColor="#E898C0" />
          </linearGradient>

          {/* Glossy highlight overlay */}
          <radialGradient id="gloss" cx="38%" cy="22%" r="45%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Neck gradient */}
          <linearGradient id="neckGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5C8DE" />
            <stop offset="50%" stopColor="#FDEEF6" />
            <stop offset="100%" stopColor="#F5C8DE" />
          </linearGradient>

          {/* Visor/face screen gradient */}
          <radialGradient id="faceGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF0F8" />
            <stop offset="100%" stopColor="#FCDCEE" />
          </radialGradient>

          {/* Foot gradient */}
          <linearGradient id="footGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5C8DE" />
            <stop offset="100%" stopColor="#E07FB0" />
          </linearGradient>

          {/* Chest panel gradient */}
          <linearGradient id="chestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(194,24,117,0.12)" />
            <stop offset="100%" stopColor="rgba(233,30,99,0.06)" />
          </linearGradient>
        </defs>

        {/* ═══ LEGS ═══ */}
        {/* Left leg */}
        <motion.rect
          x="35" y="107" width="11" height="20" rx="5.5"
          fill="url(#legGrad)"
          stroke="rgba(194,24,117,0.25)" strokeWidth="0.6"
          animate={{ rotate: [0, 1, 0, -1, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          style={{ transformOrigin: '40px 107px' }}
        />
        {/* Right leg */}
        <motion.rect
          x="54" y="107" width="11" height="20" rx="5.5"
          fill="url(#legGrad)"
          stroke="rgba(194,24,117,0.25)" strokeWidth="0.6"
          animate={{ rotate: [0, -1, 0, 1, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ transformOrigin: '60px 107px' }}
        />

        {/* Left foot */}
        <ellipse cx="39.5" cy="127.5" rx="8" ry="5" fill="url(#footGrad)" stroke="rgba(194,24,117,0.3)" strokeWidth="0.6" />
        {/* Right foot */}
        <ellipse cx="60.5" cy="127.5" rx="8" ry="5" fill="url(#footGrad)" stroke="rgba(194,24,117,0.3)" strokeWidth="0.6" />

        {/* ═══ ARMS ═══ */}
        {/* Left arm */}
        <motion.g
          animate={{ rotate: [0, 6, 0, -2, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '26px 78px' }}
        >
          <rect x="17" y="73" width="12" height="26" rx="6"
            fill="url(#armGrad)" stroke="rgba(194,24,117,0.25)" strokeWidth="0.6" />
          {/* Left hand */}
          <ellipse cx="23" cy="100.5" rx="6" ry="4.5"
            fill="#FDEEF6" stroke="rgba(194,24,117,0.3)" strokeWidth="0.6" />
        </motion.g>

        {/* Right arm */}
        <motion.g
          animate={{ rotate: [0, -6, 0, 2, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          style={{ transformOrigin: '74px 78px' }}
        >
          <rect x="71" y="73" width="12" height="26" rx="6"
            fill="url(#armGrad)" stroke="rgba(194,24,117,0.25)" strokeWidth="0.6" />
          {/* Right hand */}
          <ellipse cx="77" cy="100.5" rx="6" ry="4.5"
            fill="#FDEEF6" stroke="rgba(194,24,117,0.3)" strokeWidth="0.6" />
        </motion.g>

        {/* ═══ BODY ═══ */}
        <rect x="27" y="68" width="46" height="42" rx="14"
          fill="url(#bodyGrad)"
          stroke="rgba(194,24,117,0.22)" strokeWidth="0.8" />

        {/* Body gloss highlight */}
        <ellipse cx="42" cy="74" rx="12" ry="5" fill="rgba(255,255,255,0.5)" />

        {/* Chest panel (subtle UI detail) */}
        <rect x="35" y="79" width="30" height="20" rx="7"
          fill="url(#chestGrad)"
          stroke="rgba(194,24,117,0.18)" strokeWidth="0.5" />

        {/* Chest LED strip */}
        <motion.rect x="40" y="85" width="20" height="3" rx="1.5"
          fill="rgba(194,24,117,0.5)"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Small indicator dots */}
        <motion.circle cx="40" cy="91" r="1.5" fill="rgba(194,24,117,0.6)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }} />
        <motion.circle cx="44" cy="91" r="1.5" fill="rgba(233,30,99,0.5)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }} />
        <motion.circle cx="48" cy="91" r="1.5" fill="rgba(168,85,247,0.55)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }} />

        {/* ═══ NECK ═══ */}
        <rect x="43" y="57" width="14" height="14" rx="4"
          fill="url(#neckGrad)" stroke="rgba(194,24,117,0.2)" strokeWidth="0.6" />

        {/* ═══ HEAD (big, round, premium) ═══ */}
        {/* Head shadow underneath */}
        <ellipse cx="50" cy="60" rx="32" ry="8" fill="rgba(194,24,117,0.08)" />

        {/* Main head shape */}
        <rect x="16" y="8" width="68" height="54" rx="22"
          fill="url(#headGrad)"
          stroke="rgba(194,24,117,0.28)" strokeWidth="1" />

        {/* Head glossy top highlight */}
        <ellipse cx="45" cy="17" rx="22" ry="9" fill="url(#gloss)" />

        {/* ── FACE VISOR (recessed face panel) ── */}
        <rect x="24" y="16" width="52" height="38" rx="16"
          fill="url(#faceGrad)"
          stroke="rgba(194,24,117,0.2)" strokeWidth="0.6" />

        {/* ── EYES ── */}
        {/* Left eye white */}
        <ellipse cx="37" cy="32" rx="8.5" ry="9.5" fill="white" />
        {/* Right eye white */}
        <ellipse cx="63" cy="32" rx="8.5" ry="9.5" fill="white" />

        {/* Left iris */}
        <ellipse cx="37" cy="32" rx="5.5" ry="6.5" fill="#C21875" />
        {/* Right iris */}
        <ellipse cx="63" cy="32" rx="5.5" ry="6.5" fill="#C21875" />

        {/* Left pupil */}
        <ellipse cx="37.8" cy="31.5" rx="2.8" ry="3.5" fill="#5a0e38" />
        {/* Right pupil */}
        <ellipse cx="63.8" cy="31.5" rx="2.8" ry="3.5" fill="#5a0e38" />

        {/* Eye reflections (gloss) */}
        <ellipse cx="36" cy="28.5" rx="1.5" ry="2" fill="white" opacity="0.85" />
        <ellipse cx="62" cy="28.5" rx="1.5" ry="2" fill="white" opacity="0.85" />
        <ellipse cx="38.5" cy="34" rx="0.7" ry="0.9" fill="white" opacity="0.5" />
        <ellipse cx="64.5" cy="34" rx="0.7" ry="0.9" fill="white" opacity="0.5" />

        {/* Eyelid blink animation */}
        <motion.rect
          x="28.5" y="22.5" width="17" height="10" rx="5" fill="#FDE8F2"
          animate={{ scaleY: [0, 0, 0, 1, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeIn', times: [0, 0.85, 0.9, 0.95, 1] }}
          style={{ transformOrigin: '37px 32px' }}
        />
        <motion.rect
          x="54.5" y="22.5" width="17" height="10" rx="5" fill="#FDE8F2"
          animate={{ scaleY: [0, 0, 0, 1, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeIn', times: [0, 0.85, 0.9, 0.95, 1] }}
          style={{ transformOrigin: '63px 32px' }}
        />

        {/* ── NOSE (tiny dot) ── */}
        <ellipse cx="50" cy="42" rx="1.8" ry="1.2" fill="rgba(194,24,117,0.4)" />

        {/* ── MOUTH (cute arc) ── */}
        <path d="M 42 47 Q 50 53 58 47"
          stroke="rgba(194,24,117,0.7)" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Cheek blushes */}
        <ellipse cx="27" cy="38" rx="5" ry="3" fill="rgba(233,30,99,0.12)" />
        <ellipse cx="73" cy="38" rx="5" ry="3" fill="rgba(233,30,99,0.12)" />

        {/* ── HEAD EARS / ANTENNA nubs ── */}
        {/* Left ear nub */}
        <rect x="10" y="22" width="8" height="16" rx="4"
          fill="#F5C8DE" stroke="rgba(194,24,117,0.25)" strokeWidth="0.6" />
        <ellipse cx="14" cy="22" rx="3" ry="3" fill="#FDEEF6" />
        {/* Right ear nub */}
        <rect x="82" y="22" width="8" height="16" rx="4"
          fill="#F5C8DE" stroke="rgba(194,24,117,0.25)" strokeWidth="0.6" />
        <ellipse cx="86" cy="22" rx="3" ry="3" fill="#FDEEF6" />

        {/* ── TOP ANTENNA ── */}
        <rect x="47" y="1" width="6" height="10" rx="3"
          fill="#F0AECF" stroke="rgba(194,24,117,0.3)" strokeWidth="0.5" />
        <motion.circle cx="50" cy="1.5" r="3.5" fill="#C21875"
          animate={{ opacity: [0.7, 1, 0.7], r: [3, 3.8, 3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Antenna glow */}
        <motion.circle cx="50" cy="1.5" r="6"
          fill="rgba(194,24,117,0)"
          stroke="rgba(194,24,117,0.4)"
          strokeWidth="1"
          animate={{ r: [5, 8, 5], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ─ Shoulder joints ─ */}
        <circle cx="29" cy="72" r="5"
          fill="#F5C8DE" stroke="rgba(194,24,117,0.3)" strokeWidth="0.6" />
        <circle cx="71" cy="72" r="5"
          fill="#F5C8DE" stroke="rgba(194,24,117,0.3)" strokeWidth="0.6" />

        {/* ─ Hip joints ─ */}
        <circle cx="40.5" cy="108" r="4.5"
          fill="#F0AECF" stroke="rgba(194,24,117,0.3)" strokeWidth="0.5" />
        <circle cx="59.5" cy="108" r="4.5"
          fill="#F0AECF" stroke="rgba(194,24,117,0.3)" strokeWidth="0.5" />

      </motion.svg>

      {/* Active/open indicator: ring around mascot */}
      {isOpen && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(194,24,117,0.18) 0%, transparent 70%)',
          }}
        />
      )}
    </motion.button>
  );
}