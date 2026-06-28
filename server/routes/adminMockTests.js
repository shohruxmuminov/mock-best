import express from 'express';
import { del } from '@vercel/blob';
import { query, one } from '../db.js';
import config from '../config.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();
router.use(requireAdmin);

function serialize(t) {
  return {
    id: t.id,
    title: t.title,
    testName: t.test_name,
    orderIndex: t.order_index,
    createdAt: t.created_at,
    listening: { html: t.listening_html || null, audio: t.listening_audio || null, hasAudio: Boolean(t.listening_audio) },
    reading: { html: t.reading_html || null },
    writing: { html: t.writing_html || null },
  };
}

// Files are uploaded directly to Vercel Blob from the browser; here we just
// persist their URLs. Listening audio is optional.
router.post('/', async (req, res, next) => {
  try {
    const title = (req.body?.title || '').toString().trim();
    const testName = (req.body?.testName || '').toString().trim();
    if (!title || !testName) return res.status(400).json({ error: 'Title and Test Name are required.' });

    const listeningHtml = req.body?.listeningHtml || null;
    const listeningAudio = req.body?.listeningAudio || null; // optional
    const readingHtml = req.body?.readingHtml || null;
    const writingHtml = req.body?.writingHtml || null;

    if (!listeningHtml && !readingHtml && !writingHtml) {
      return res.status(400).json({ error: 'Upload at least one section HTML file (Listening, Reading or Writing).' });
    }

    const maxRow = await one('SELECT COALESCE(MAX(order_index), 0) AS m FROM mock_tests');
    const order = (maxRow?.m || 0) + 1;

    const test = await one(
      `INSERT INTO mock_tests
        (title, test_name, listening_html, listening_audio, reading_html, writing_html, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, testName, listeningHtml, listeningAudio, readingHtml, writingHtml, order]
    );
    res.status(201).json(serialize(test));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM mock_tests ORDER BY order_index ASC, id ASC');
    res.json(rows.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const test = await one('SELECT * FROM mock_tests WHERE id = $1', [Number(req.params.id)]);
    if (!test) return res.status(404).json({ error: 'Mock test not found.' });

    // Best-effort removal of the uploaded blobs.
    const urls = [test.listening_html, test.listening_audio, test.reading_html, test.writing_html].filter(Boolean);
    if (config.blobToken && urls.length) {
      del(urls, { token: config.blobToken }).catch(() => {});
    }
    await query('DELETE FROM mock_tests WHERE id = $1', [test.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
