import { useWebcam } from './hooks/useWebcam';
import { AsciiRenderer } from './components/AsciiRenderer';

function App() {
  const { videoRef, isReady, error, handleVideoUpload, switchToWebcam, mode } = useWebcam();

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="glitch" data-text="ASCII VISION">ASCII VISION</h1>
        <p className="subtitle">Real-time webcam & video to ASCII art converter</p>
        
        <div className="controls">
          <button 
            className={`btn ${mode === 'webcam' ? 'active' : ''}`}
            onClick={switchToWebcam}
          >
            Live Camera
          </button>
          
          <label className={`btn ${mode === 'video' ? 'active' : ''}`}>
            Upload Video
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleVideoUpload} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </header>

      <main className="main-content">
        {error ? (
          <div className="error-box">
            <h2>Access Denied</h2>
            <p>{error}</p>
            <p>Please allow camera permissions or upload a video instead.</p>
          </div>
        ) : (
          <div className="ascii-wrapper">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ display: 'none' }} 
            />
            {!isReady && !error && <div className="loading">Initializing...</div>}
            <AsciiRenderer videoRef={videoRef} isReady={isReady} />
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built for the open web.</p>
      </footer>
    </div>
  );
}

export default App;
