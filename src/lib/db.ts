import { get, set, del, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

export interface GeneratedVideo {
  id: string;
  prompt: string;
  blob: Blob;
  createdAt: string;
}

export const saveVideoToDB = async (prompt: string, blob: Blob): Promise<GeneratedVideo> => {
  const id = uuidv4();
  const video: GeneratedVideo = {
    id,
    prompt,
    blob,
    createdAt: new Date().toISOString()
  };
  
  await set(`video_${id}`, video);
  return video;
};

export const getAllVideosFromDB = async (): Promise<GeneratedVideo[]> => {
  const dbKeys = await keys();
  const videoKeys = dbKeys.filter(k => typeof k === 'string' && k.startsWith('video_'));
  
  const videos: GeneratedVideo[] = [];
  for (const key of videoKeys) {
    const val = await get<GeneratedVideo>(key);
    if (val) videos.push(val);
  }
  
  // Sort newest first
  return videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const deleteVideoFromDB = async (id: string): Promise<void> => {
  await del(`video_${id}`);
};
