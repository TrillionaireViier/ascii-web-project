import { useWebcam } from './hooks/useWebcam';
import { AsciiRenderer } from './components/AsciiRenderer';

function App() {
  const { videoRef, isReady, error } = useWebcam();

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="glitch" data-text="ASCII VISION">ASCII VISION</h1>
        <p className="subtitle">Real-time webcam to ASCII art converter</p>
      </header>

      <main className="main-content">
        {error ? (
          <div className="error-box">
            <h2>Access Denied</h2>
            <p>{error}</p>
            <p>Please allow camera permissions to use this app.</p>
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
            {!isReady && !error && <div className="loading">Initializing Camera...</div>}
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
