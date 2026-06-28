import { upload } from '@vercel/blob/client';
import { getToken } from './api.js';

/**
 * Upload a file directly from the browser to Vercel Blob (bypassing serverless
 * body limits), authorized by the user's JWT. Returns the public file URL.
 */
export async function uploadToBlob(file, prefix = '') {
  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = await upload(`${prefix}${Date.now()}-${safeName}`, file, {
    access: 'public',
    handleUploadUrl: '/api/blob/upload',
    clientPayload: getToken(),
    contentType: file.type || undefined,
  });
  return blob.url;
}
