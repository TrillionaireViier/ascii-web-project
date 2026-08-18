import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, '../public');
const ARCHIVE_DIR = path.join(PUBLIC_DIR, 'archive');
const LIBRARY_FILE = path.join(ARCHIVE_DIR, 'library.json');

// Ensure archive directory and library.json exist
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}
if (!fs.existsSync(LIBRARY_FILE)) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify([]));
}

// Helper to run shell commands as promises
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout ? stdout : stderr);
    });
  });
};

// GET /api/library - Returns all generated videos
app.get('/api/library', (req, res) => {
  try {
    const data = fs.readFileSync(LIBRARY_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read library' });
  }
});

// POST /api/generate - Takes a prompt, generates clips, stitches them
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const videoId = uuidv4();
  const outputFileName = `gen_${videoId}.mp4`;
  const outputPath = path.join(ARCHIVE_DIR, outputFileName);
  
  try {
    // ---------------------------------------------------------
    // STEP 1: MOCK AI GENERATION 
    // In a real app, you would call OpenAI / Replicate here.
    // For this prototype, we'll use the existing matrix-coffee.mp4 
    // as our "generated 3-second clip".
    // ---------------------------------------------------------
    const sourceVideo = path.join(PUBLIC_DIR, 'matrix-coffee.mp4');
    
    // ---------------------------------------------------------
    // STEP 2: STITCHING WITH FFMPEG
    // We will concatenate the same 3-second clip 3 times 
    // to simulate a 9-second stitched video.
    // ---------------------------------------------------------
    const listFile = path.join(__dirname, `list_${videoId}.txt`);
    const listContent = `file '${sourceVideo}'\nfile '${sourceVideo}'\nfile '${sourceVideo}'`;
    fs.writeFileSync(listFile, listContent);

    // Run ffmpeg concat
    const ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${outputPath}`;
    await runCommand(ffmpegCommand);

    // Clean up temp list file
    fs.unlinkSync(listFile);

    // ---------------------------------------------------------
    // STEP 3: SAVE TO LIBRARY
    // ---------------------------------------------------------
    const newEntry = {
      id: videoId,
      prompt: prompt,
      url: `/archive/${outputFileName}`,
      createdAt: new Date().toISOString()
    };

    const libraryData = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
    libraryData.unshift(newEntry);
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(libraryData, null, 2));

    res.json({ success: true, video: newEntry });

  } catch (err) {
    console.error("Generation Error:", err);
    res.status(500).json({ error: 'Failed to generate video pipeline' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend Generation Server running on http://localhost:${PORT}`);
});
