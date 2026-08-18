import { useState } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { AsciiRenderer } from './components/AsciiRenderer';
import type { CharsetType } from './components/AsciiRenderer';

function App() {
  const { videoRef, isReady, error, handleVideoUpload, playVideoFromUrl, switchToWebcam, mode } = useWebcam();
  
  // Advanced Generator Settings
  const [resolution, setResolution] = useState<number>(10);
  const [colorMode, setColorMode] = useState<boolean>(false);
  const [charset, setCharset] = useState<CharsetType>('classic');

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="glitch" data-text="ASCII VISION">ASCII VISION</h1>
        <p className="subtitle">Advanced webcam & video to ASCII art generator</p>
        
        {/* Source Controls */}
        <div className="controls">
          <button 
            className={`btn ${mode === 'webcam' ? 'active' : ''}`}
            onClick={switchToWebcam}
          >
            Live Camera
          </button>
          
          <button 
            className="btn"
            onClick={() => playVideoFromUrl('/matrix-coffee.mp4')}
            style={{ borderColor: '#00ff41', color: '#00ff41', boxShadow: '0 0 10px rgba(0, 255, 65, 0.2)' }}
          >
            ☕️ Matrix Coffee
          </button>

          <label className="btn">
            Upload Custom
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleVideoUpload} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* Generator Settings Panel */}
        <div className="settings-panel">
          <div className="setting-group">
            <label>Color Mode</label>
            <button 
              className={`toggle-btn ${colorMode ? 'active' : ''}`}
              onClick={() => setColorMode(!colorMode)}
            >
              {colorMode ? '🌈 Full Color' : '🟩 Matrix Green'}
            </button>
          </div>

          <div className="setting-group">
            <label>Character Set</label>
            <select 
              value={charset} 
              onChange={(e) => setCharset(e.target.value as CharsetType)}
              className="styled-select"
            >
              <option value="classic">Classic (.:-=+*#%@)</option>
              <option value="binary">Binary (01)</option>
              <option value="blocks">Blocks (░▒▓█)</option>
            </select>
          </div>

          <div className="setting-group slider-group">
            <label>Resolution: {resolution}px</label>
            <input 
              type="range" 
              min="4" 
              max="24" 
              step="1" 
              value={resolution} 
              onChange={(e) => setResolution(parseInt(e.target.value))}
              className="styled-slider"
            />
          </div>
        </div>
      </header>

      <main className="main-content">
        {error ? (
          <div className="error-box">
            <h2>Access Denied</h2>
            <p>{error}</p>
            <p>Please allow camera permissions or test a video scenario.</p>
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
            <AsciiRenderer 
              videoRef={videoRef} 
              isReady={isReady} 
              resolution={resolution}
              colorMode={colorMode}
              charset={charset}
            />
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
