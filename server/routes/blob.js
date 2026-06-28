import express from 'express';
import { handleUpload } from '@vercel/blob/client';
import config from '../config.js';
import { verifyToken } from '../auth.js';

const router = express.Router();

// Issues short-lived client tokens so the browser can upload large files
// (HTML / audio / PDF) directly to Vercel Blob, bypassing serverless body
// limits. The candidate or admin JWT is passed as the clientPayload.
router.post('/upload', async (req, res) => {
  try {
    const json = await handleUpload({
      request: req,
      body: req.body,
      token: config.blobToken || undefined,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const decoded = verifyToken(clientPayload);
        if (!decoded) throw new Error('Unauthorized upload.');
        return {
          allowedContentTypes: [
            'text/html',
            'text/plain',
            'application/pdf',
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/ogg',
            'audio/x-m4a',
            'audio/mp4',
            'application/octet-stream',
          ],
          maximumSizeInBytes: config.maxUploadBytes,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        /* nothing to persist here — the URL is saved by the calling endpoint */
      },
    });
    res.json(json);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Upload failed.' });
  }
});

export default router;
