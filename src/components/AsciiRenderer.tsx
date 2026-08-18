import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export type CharsetType = 'classic' | 'binary' | 'blocks';

interface AsciiRendererProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  resolution: number;
  colorMode: boolean;
  charset: CharsetType;
}

export interface AsciiRendererRef {
  startRecording: () => void;
  stopRecording: () => void;
}

const CHARSETS = {
  classic: ' .:-=+*#%@',
  binary: '01',
  blocks: ' ░▒▓█',
};

export const AsciiRenderer = forwardRef<AsciiRendererRef, AsciiRendererProps>(
  ({ videoRef, isReady, resolution, colorMode, charset }, ref) => {
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    useImperativeHandle(ref, () => ({
      startRecording: () => {
        const canvas = outputCanvasRef.current;
        if (!canvas) return;
        
        recordedChunksRef.current = [];
        const stream = canvas.captureStream(30); // 30 FPS
        
        try {
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `ascii-vision-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
          };

          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;
        } catch (e) {
          console.error("Recording not supported", e);
          alert("Your browser does not support recording this canvas.");
        }
      },
      stopRecording: () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }
    }));

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

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        const cols = Math.floor(videoWidth / resolution);
        const rows = Math.floor(videoHeight / resolution);

        offCanvas.width = cols;
        offCanvas.height = rows;

        outCanvas.width = videoWidth;
        outCanvas.height = videoHeight;

        offCtx.drawImage(video, 0, 0, cols, rows);

        const imageData = offCtx.getImageData(0, 0, cols, rows);
        const data = imageData.data;

        outCtx.fillStyle = '#050505'; 
        outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
        
        outCtx.font = `${resolution}px "Fira Code", monospace`;
        outCtx.textBaseline = 'top';

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const offset = (y * cols + x) * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            const charIndex = Math.floor((brightness / 255) * (asciiChars.length - 1));
            const char = asciiChars[charIndex];

            if (colorMode) {
              outCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            } else {
              outCtx.fillStyle = '#00ff41';
            }

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
        <canvas 
          ref={outputCanvasRef} 
          className="ascii-output-canvas" 
          style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
        />
      </div>
    );
  }
);
