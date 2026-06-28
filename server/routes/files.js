import express from 'express';
import { query, one } from '../db.js';

const router = express.Router();

// Helper used by other routes to persist an uploaded file and return its URL.
export async function storeFile(file) {
  if (!file) return null;
  const row = await one(
    'INSERT INTO files (mime, name, data) VALUES ($1, $2, $3) RETURNING id',
    [file.mimetype || 'application/octet-stream', file.originalname || 'file', file.buffer]
  );
  return `/api/files/${row.id}`;
}

// Serve a stored file (HTML / audio / PDF). Public so it can load inside the
// candidate's iframe / audio / PDF viewer. HTML renders exactly like a browser.
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid file id.' });
    const file = await one('SELECT mime, name, data FROM files WHERE id = $1', [id]);
    if (!file) return res.status(404).json({ error: 'File not found.' });
    res.setHeader('Content-Type', file.mime || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.removeHeader('X-Frame-Options');
    res.send(file.data); // Buffer
  } catch (err) {
    next(err);
  }
});

export default router;
