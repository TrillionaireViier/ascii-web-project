import { useState, useRef, useEffect } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { AsciiRenderer, CharsetType, AsciiRendererRef } from './components/AsciiRenderer';

function App() {
  const { videoRef, isReady, error, handleVideoUpload, playVideoFromUrl, switchToWebcam, mode } = useWebcam();
  
  // Advanced Generator Settings
  const [resolution, setResolution] = useState<number>(10);
  const [colorMode, setColorMode] = useState<boolean>(false);
  const [charset, setCharset] = useState<CharsetType>('classic');

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const rendererRef = useRef<AsciiRendererRef>(null);

  // AI Pipeline State
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [library, setLibrary] = useState<any[]>([]);

  // Fetch library on load
  const fetchLibrary = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/library');
      if (res.ok) {
        const data = await res.json();
        setLibrary(data);
      }
    } catch (e) {
      console.warn("Backend server not running", e);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary([data.video, ...library]);
        playVideoFromUrl(data.video.url);
      }
    } catch (e) {
      console.error("Generation failed", e);
      alert("Failed to connect to backend server. Is it running?");
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      rendererRef.current?.stopRecording();
      setIsRecording(false);
    } else {
      rendererRef.current?.startRecording();
      setIsRecording(true);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="glitch" data-text="ASCII VISION">ASCII VISION</h1>
        <p className="subtitle">Advanced webcam, video & AI to ASCII art generator</p>
        
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

        {/* AI Generation Pipeline */}
        <div className="ai-generator-panel">
          <h3 style={{fontFamily: 'Orbitron', marginBottom: '10px', color: '#fff'}}>🤖 AI Video Generator Pipeline</h3>
          <div className="ai-input-group">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Введіть ТЗ для відео (напр: Hacker at home...)" 
              className="ai-input"
              disabled={isGenerating}
            />
            <button 
              className="btn ai-btn" 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? 'Generating 3-sec clips...' : 'Generate 2-min Video'}
            </button>
          </div>
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

          <div className="setting-group">
            <label>Export</label>
            <button 
              className="btn" 
              style={{ borderColor: isRecording ? '#ff3333' : '#00ff41', color: isRecording ? '#ff3333' : '#00ff41' }}
              onClick={toggleRecording}
            >
              {isRecording ? '⏹ Stop & Save' : '⏺ Record Video'}
            </button>
          </div>
        </div>
      </header>

      <main className="main-layout">
        {/* Left Side: Renderer */}
        <div className="renderer-section">
          {error ? (
            <div className="error-box">
              <h2>Access Denied</h2>
              <p>{error}</p>
              <p>Please allow camera permissions or test a video scenario.</p>
            </div>
          ) : (
            <div className="ascii-wrapper">
              {isRecording && <div className="recording-indicator">⏺ REC</div>}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ display: 'none' }} 
              />
              {!isReady && !error && <div className="loading">Initializing...</div>}
              <AsciiRenderer 
                ref={rendererRef}
                videoRef={videoRef} 
                isReady={isReady} 
                resolution={resolution}
                colorMode={colorMode}
                charset={charset}
              />
            </div>
          )}
        </div>

        {/* Right Side: Library Archive */}
        <div className="library-section">
          <h3 className="library-title">📁 Generated Archive</h3>
          <div className="library-grid">
            {library.length === 0 ? (
              <p style={{opacity: 0.5, fontSize: '0.9rem', textAlign: 'center'}}>No videos generated yet.</p>
            ) : (
              library.map((video) => (
                <div key={video.id} className="library-item" onClick={() => playVideoFromUrl(video.url)}>
                  <div className="library-item-icon">🎬</div>
                  <div className="library-item-info">
                    <strong>{video.prompt}</strong>
                    <span>{new Date(video.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Built for the open web.</p>
      </footer>
    </div>
  );
}

export default App;
