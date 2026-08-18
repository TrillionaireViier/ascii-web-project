import { useState, useEffect, useRef } from 'react';

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<'webcam' | 'video'>('webcam');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      if (mode !== 'webcam') return;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsReady(true);
            videoRef.current?.play();
          };
        }
      } catch (err: any) {
        setError(err.message || 'Failed to access webcam');
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mode]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    playVideoFromUrl(url);
  };

  const playVideoFromUrl = (url: string) => {
    if (videoRef.current) {
      setMode('video');
      videoRef.current.srcObject = null; // Clear webcam stream
      videoRef.current.loop = true;
      
      videoRef.current.onloadedmetadata = () => {
        setIsReady(true);
      };

      videoRef.current.src = url;
      
      // On iOS, play() must be called synchronously inside the user interaction event
      videoRef.current.play().catch(e => console.error('Play failed:', e));
    }
  };

  const switchToWebcam = () => {
    setMode('webcam');
    setIsReady(false);
  };

  return { videoRef, isReady, error, handleVideoUpload, playVideoFromUrl, switchToWebcam, mode };
}
