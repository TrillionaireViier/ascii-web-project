import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const initFFmpeg = async (onProgress?: (progress: number) => void) => {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  
  if (onProgress) {
    ffmpeg.on('progress', ({ progress, time }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  // Use the multi-threaded core if possible, or fallback to single threaded.
  // We'll use the remote unpkg URLs for the wasm files.
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export const generateVideoFromPrompt = async (
  prompt: string, 
  onProgress?: (msg: string, percent: number) => void
): Promise<Blob> => {
  if (onProgress) onProgress("Initializing AI Engine...", 10);
  
  const ffmpegInstance = await initFFmpeg((p) => {
    if (onProgress) onProgress("Stitching Video...", 50 + Math.floor(p / 2));
  });

  if (onProgress) onProgress("Generating AI Image...", 20);
  
  // 1. Fetch free image from pollinations.ai
  // Added a random seed so same prompt gives different images
  const seed = Math.floor(Math.random() * 100000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=640&height=480&nologo=true&seed=${seed}`;
  
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  if (onProgress) onProgress("Loading into WebAssembly...", 40);

  // 2. Write image to FFmpeg virtual FS
  const imageName = 'input.jpg';
  const outputName = 'output.mp4';
  
  await ffmpegInstance.writeFile(imageName, new Uint8Array(imageBuffer));

  // 3. Run FFmpeg command to turn static image into a 3-second zooming video
  // -loop 1: Loop the single input image
  // -t 3: Duration 3 seconds
  // filter_complex: scale to 800x600, then zoompan from 1x to 1.2x over 90 frames (3 seconds at 30fps)
  await ffmpegInstance.exec([
    '-loop', '1',
    '-i', imageName,
    '-t', '3',
    '-vf', "scale=800:600,zoompan=z='min(zoom+0.002,1.2)':d=90:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'",
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    outputName
  ]);

  if (onProgress) onProgress("Finalizing...", 95);

  // 4. Read output
  const data = await ffmpegInstance.readFile(outputName);
  
  // Clean up memory
  await ffmpegInstance.deleteFile(imageName);
  await ffmpegInstance.deleteFile(outputName);

  if (onProgress) onProgress("Done!", 100);

  // Return the video as a Blob
  return new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
};
