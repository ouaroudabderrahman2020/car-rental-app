import { supabase } from './supabase';

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteChars = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNums = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNums[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNums));
  }
  return new Blob(byteArrays, { type: contentType });
}

export async function uploadFile(
  bucket: string,
  base64: string,
  fileName: string,
  contentType: string,
  folderPath: string,
): Promise<string | null> {
  try {
    const blob = base64ToBlob(base64, contentType);
    const storagePath = `${folderPath}/${fileName}`;
    const { error } = await supabase.storage.from(bucket).upload(storagePath, blob, {
      contentType,
      upsert: true,
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return publicUrl;
  } catch (err) {
    console.error('Supabase upload failed:', err);
    return null;
  }
}

export async function deleteFiles(bucket: string, paths: string[]) {
  try {
    await supabase.storage.from(bucket).remove(paths);
  } catch (err) {
    console.error('Supabase delete failed:', err);
  }
}

export async function listFolderFiles(bucket: string, folderPath: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folderPath);
    if (error) throw error;
    return data.map(f => `${folderPath}/${f.name}`);
  } catch {
    return [];
  }
}
