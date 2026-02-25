import React, { useEffect, useRef } from 'react';

export const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters (binary + some katakana for authenticity)
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');

    // Column settings
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Drops array - one per column
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Start above screen randomly
    }

    // Animation loop
    let animationId: number;
    
    const draw = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'Courier New', monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Varying green shades for depth
        const greenIntensity = Math.random();
        if (greenIntensity > 0.95) {
          ctx.fillStyle = '#FFFFFF'; // Occasional white flash
        } else if (greenIntensity > 0.8) {
          ctx.fillStyle = '#00FF41'; // Bright green
        } else if (greenIntensity > 0.5) {
          ctx.fillStyle = '#008F11'; // Medium green
        } else {
          ctx.fillStyle = '#003B00'; // Dark green
        }

        // Draw character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Reset drop when it reaches bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="matrix-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.12,
        pointerEvents: 'none',
      }}
    />
  );
};
