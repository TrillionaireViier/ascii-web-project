import { useEffect, useRef, useState } from 'react';

// A good ASCII density string, from darkest to lightest
const ASCII_CHARS = ' .:-=+*#%@';

interface AsciiRendererProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;
}

export function AsciiRenderer({ videoRef, isReady }: AsciiRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [asciiArt, setAsciiArt] = useState<string>('');
  
  // Resolution control: lower number means higher resolution (smaller chunks)
  const resolution = 8; 

  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;

    const renderAscii = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(renderAscii);
        return;
      }

      // Match canvas size to video size
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      // Calculate how many characters we'll have
      const cols = Math.floor(width / resolution);
      const rows = Math.floor(height / (resolution * 2)); // Text is usually taller than it is wide

      // Set canvas size for drawing the downscaled video
      canvas.width = cols;
      canvas.height = rows;

      // Draw the current video frame to the canvas (downscaled)
      ctx.drawImage(video, 0, 0, cols, rows);

      // Get the pixel data
      const imageData = ctx.getImageData(0, 0, cols, rows);
      const data = imageData.data;

      let asciiStr = '';

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const offset = (y * cols + x) * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          
          // Calculate perceived brightness (luminance)
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
          
          // Map brightness (0-255) to an index in the ASCII_CHARS string
          const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
          asciiStr += ASCII_CHARS[charIndex];
        }
        asciiStr += '\n';
      }

      setAsciiArt(asciiStr);
      animationFrameId = requestAnimationFrame(renderAscii);
    };

    renderAscii();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReady, videoRef]);

  return (
    <div className="ascii-container">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* The visible ASCII output */}
      <pre className="ascii-output">{asciiArt}</pre>
    </div>
  );
}
