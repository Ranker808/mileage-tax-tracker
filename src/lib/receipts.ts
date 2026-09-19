import { File } from 'expo-file-system';
import { supabase } from './supabase';

const RECEIPTS_BUCKET = 'receipts';

function extensionFromUri(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(uri.split('?')[0]);
  return match ? match[1].toLowerCase() : 'jpg';
}

/** Uploads a locally-picked receipt photo and returns its storage path (not a public URL, since the bucket is private). */
export async function uploadReceiptPhoto(localUri: string, userId: string): Promise<string> {
  const localFile = new File(localUri);
  const bytes = await localFile.arrayBuffer();
  const ext = extensionFromUri(localUri);
  const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, bytes, {
    contentType,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getReceiptSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteReceiptPhoto(path: string): Promise<void> {
  await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
}
