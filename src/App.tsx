import { useState, useRef, useEffect } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { AsciiRenderer } from './components/AsciiRenderer';
import type { CharsetType, AsciiRendererRef } from './components/AsciiRenderer';
import { saveVideoToDB, getAllVideosFromDB, deleteVideoFromDB } from './lib/db';
import type { GeneratedVideo } from './lib/db';
import { generateVideoFromPrompt } from './lib/generator';

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
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [library, setLibrary] = useState<GeneratedVideo[]>([]);

  // Load library from IndexedDB on startup
  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const videos = await getAllVideosFromDB();
      setLibrary(videos);
    } catch (e) {
      console.error("Failed to load library from IndexedDB", e);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setProgressMsg('Starting Generation Pipeline...');
    setProgressPct(0);
    
    try {
      // 1. Run the WebAssembly generator
      const videoBlob = await generateVideoFromPrompt(prompt, (msg, pct) => {
        setProgressMsg(msg);
        setProgressPct(pct);
      });

      setProgressMsg('Saving to Browser Archive...');
      
      // 2. Save to IndexedDB
      const savedVideo = await saveVideoToDB(prompt, videoBlob);
      
      // 3. Update UI
      setLibrary([savedVideo, ...library]);
      
      // 4. Play the new video immediately
      const url = URL.createObjectURL(savedVideo.blob);
      playVideoFromUrl(url);

    } catch (e: any) {
      console.error("Generation failed", e);
      alert("Failed to generate video: " + e.message);
    } finally {
      setIsGenerating(false);
      setProgressMsg('');
      setProgressPct(0);
      setPrompt('');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteVideoFromDB(id);
    await loadLibrary();
  };

  const handlePlayLibraryVideo = (video: GeneratedVideo) => {
    const url = URL.createObjectURL(video.blob);
    playVideoFromUrl(url);
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
        <p className="subtitle">100% Free WebAssembly AI Video Generator</p>
        
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

        {/* Browser AI Generation Pipeline */}
        <div className="ai-generator-panel">
          <h3 style={{fontFamily: 'Orbitron', marginBottom: '10px', color: '#fff'}}>🤖 Free In-Browser AI Generator</h3>
          <div className="ai-input-group">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Введіть ТЗ для відео (напр: cyberpunk hacker)..." 
              className="ai-input"
              disabled={isGenerating}
            />
            <button 
              className="btn ai-btn" 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? 'Generating...' : 'Generate Video'}
            </button>
          </div>
          {isGenerating && (
            <div className="progress-container" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#00ff41' }}>
                <span>{progressMsg}</span>
                <span>{progressPct}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(0,255,65,0.2)', borderRadius: '2px' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: '#00ff41', borderRadius: '2px', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          )}
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
                loop
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
          <h3 className="library-title">📁 IndexedDB Archive</h3>
          <div className="library-grid">
            {library.length === 0 ? (
              <p style={{opacity: 0.5, fontSize: '0.9rem', textAlign: 'center'}}>No videos generated yet. Type a prompt above!</p>
            ) : (
              library.map((video) => (
                <div key={video.id} className="library-item" onClick={() => handlePlayLibraryVideo(video)}>
                  <div className="library-item-icon">🎬</div>
                  <div className="library-item-info">
                    <strong>{video.prompt}</strong>
                    <span>{new Date(video.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={(e) => handleDelete(e, video.id)}
                    title="Delete from archive"
                  >
                    ×
                  </button>
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
