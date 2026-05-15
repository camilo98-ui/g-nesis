import React, { useEffect, useRef } from 'react';

const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

export default function MascotCanvas({ width = 64, height = 64 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Load and draw mascot image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = MASCOT_IMG;
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: '50%',
        display: 'block',
      }}
    />
  );
}