import { useEffect, useRef } from 'react';

export type CharsetType = 'classic' | 'binary' | 'blocks';

interface AsciiRendererProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  resolution: number;
  colorMode: boolean;
  charset: CharsetType;
}

const CHARSETS = {
  classic: ' .:-=+*#%@',
  binary: '01',
  blocks: ' ░▒▓█',
};

export function AsciiRenderer({ videoRef, isReady, resolution, colorMode, charset }: AsciiRendererProps) {
  // We use two canvases:
  // 1. A hidden offscreen canvas to extract pixel data from the video
  // 2. A visible output canvas to render the text
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    const offCanvas = offscreenCanvasRef.current;
    const outCanvas = outputCanvasRef.current;
    if (!offCanvas || !outCanvas) return;
    
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    const outCtx = outCanvas.getContext('2d', { alpha: false });
    if (!offCtx || !outCtx) return;

    const asciiChars = CHARSETS[charset];
    let animationFrameId: number;

    const renderAscii = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(renderAscii);
        return;
      }

      // 1. Calculate dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Determine how many characters fit based on resolution
      const cols = Math.floor(videoWidth / resolution);
      const rows = Math.floor(videoHeight / resolution);

      // Set offscreen canvas to low resolution for pixel reading
      offCanvas.width = cols;
      offCanvas.height = rows;

      // Set output canvas to true CSS size to keep text crisp
      outCanvas.width = videoWidth;
      outCanvas.height = videoHeight;

      // 2. Draw current video frame scaled down to offscreen canvas
      offCtx.drawImage(video, 0, 0, cols, rows);

      // 3. Read pixel data
      const imageData = offCtx.getImageData(0, 0, cols, rows);
      const data = imageData.data;

      // 4. Setup output canvas styling
      outCtx.fillStyle = '#050505'; // Background color
      outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
      
      // Font size needs to match resolution
      outCtx.font = `${resolution}px "Fira Code", monospace`;
      outCtx.textBaseline = 'top';

      // 5. Map pixels to text and render
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const offset = (y * cols + x) * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          
          // Calculate perceived brightness (luminance)
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
          
          // Select character based on brightness
          const charIndex = Math.floor((brightness / 255) * (asciiChars.length - 1));
          const char = asciiChars[charIndex];

          // Determine color
          if (colorMode) {
            outCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          } else {
            // Matrix Green
            outCtx.fillStyle = '#00ff41';
          }

          // Draw the character
          outCtx.fillText(char, x * resolution, y * resolution);
        }
      }

      animationFrameId = requestAnimationFrame(renderAscii);
    };

    renderAscii();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReady, videoRef, resolution, colorMode, charset]);

  return (
    <div className="ascii-container">
      <canvas ref={offscreenCanvasRef} style={{ display: 'none' }} />
      {/* 
        We use object-fit to ensure the canvas scales correctly 
        within the wrapper while maintaining its aspect ratio. 
      */}
      <canvas 
        ref={outputCanvasRef} 
        className="ascii-output-canvas" 
        style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
      />
    </div>
  );
}
