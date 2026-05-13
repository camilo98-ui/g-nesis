import React from 'react';

function generatePath(points, width = 80, height = 28) {
  if (!points || points.length < 2) return { line: '', area: '' };
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const pts = points.map((p, i) => ({
    x: i * step,
    y: height - ((p - min) / range) * (height - 4) - 2,
  }));

  // Smooth bezier curve
  let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * 0.5;
    const cp2x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * 0.5;
    line += ` C ${cp1x.toFixed(1)} ${pts[i - 1].y.toFixed(1)}, ${cp2x.toFixed(1)} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }

  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${height} L 0 ${height} Z`;
  return { line, area };
}

export default function PremiumSparkline({ data, color = '#C21875', width = 80, height = 28 }) {
  const { line, area } = generatePath(data, width, height);
  const id = `spark-${color.replace('#', '')}-${width}`;

  return (
    <svg width={width} height={height} className="overflow-visible" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Terminal dot */}
      {data && data.length > 0 && (() => {
        const pts2 = data.map((p, i) => ({
          x: i * (width / (data.length - 1)),
          y: height - ((p - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 4) - 2,
        }));
        const last = pts2[pts2.length - 1];
        return (
          <>
            <circle cx={last.x} cy={last.y} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
          </>
        );
      })()}
    </svg>
  );
}