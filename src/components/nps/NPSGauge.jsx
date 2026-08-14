import React from 'react';

// Thresholds NPS: 6-9 bueno, 5-6 estable, <5 malo
export function getNPSStatus(score) {
  const s = Number(score) || 0;
  if (s >= 6) return { label: 'Bueno', color: '#00B894', face: '😀', textColor: '#00B894' };
  if (s >= 5) return { label: 'Estable', color: '#FDCB6E', face: '🙂', textColor: '#B7791F' };
  return { label: 'Malo', color: '#FF7675', face: '😟', textColor: '#E53E3E' };
}

// Gauge semicircular con needle + carita. score 0-10.
export default function NPSGauge({ score = 0, size = 220, showScore = true, showBadge = true, label }) {
  const s = Math.max(0, Math.min(10, Number(score) || 0));
  const status = getNPSStatus(s);

  const cx = 100, cy = 110, r = 78, needleLen = 62;
  const angleDeg = 180 - (s / 10) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const nx = cx + needleLen * Math.cos(angleRad);
  const ny = cy - needleLen * Math.sin(angleRad);
  const scoreStr = s > 0 ? s.toFixed(1).replace('.', ',') : '—';
  const gid = 'npsGrad';
  const fid = 'npsFace';

  return (
    <div className="flex flex-col items-center w-full">
      {label && <p className="label-premium mb-1">{label}</p>}
      <svg width={size} height={size * 0.62} viewBox="0 0 200 128" className="overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF7675" />
            <stop offset="50%" stopColor="#FDCB6E" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
          <radialGradient id={fid} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
        {/* track */}
        <path d="M 22 110 A 78 78 0 0 1 178 110" fill="none" stroke="#f1f5f9" strokeWidth="16" strokeLinecap="round" />
        {/* gradient arc */}
        <path d="M 22 110 A 78 78 0 0 1 178 110" fill="none" stroke={`url(#${gid})`} strokeWidth="16" strokeLinecap="round" />
        {/* ticks sutiles */}
        {[0, 2.5, 5, 7.5, 10].map((v) => {
          const a = (180 - (v / 10) * 180) * Math.PI / 180;
          const x1 = cx + (r - 10) * Math.cos(a);
          const y1 = cy - (r - 10) * Math.sin(a);
          const x2 = cx + (r - 2) * Math.cos(a);
          const y2 = cy - (r - 2) * Math.sin(a);
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2" opacity="0.6" />;
        })}
        {/* carita dentro del arco */}
        <circle cx={cx} cy={cy - 34} r="17" fill={`url(#${fid})`} stroke="#fff" strokeWidth="1.5" />
        <text x={cx} y={cy - 27} textAnchor="middle" fontSize="20">{status.face}</text>
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#2D3436" />
        <circle cx={cx} cy={cy} r="2.5" fill="#fff" />
      </svg>

      {showScore && (
        <div className="flex items-baseline gap-1 -mt-1">
          <span className="text-3xl font-black tabular-nums" style={{ color: status.textColor }}>{scoreStr}</span>
          <span className="text-sm font-semibold text-slate-400">/10</span>
        </div>
      )}

      {showBadge && (
        <span
          className="mt-2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide text-white shadow-sm"
          style={{ background: status.color }}
        >
          {status.label}
        </span>
      )}
    </div>
  );
}