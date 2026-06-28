import express from 'express';
import { query, one } from '../db.js';
import { requireAdmin } from '../auth.js';
import { upload } from '../upload.js';
import { storeFile } from './files.js';

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

const uploadFields = upload.fields([
  { name: 'listeningHtml', maxCount: 1 },
  { name: 'listeningAudio', maxCount: 1 },
  { name: 'readingHtml', maxCount: 1 },
  { name: 'writingHtml', maxCount: 1 },
]);

// Create a mock test. Listening audio is OPTIONAL; files are stored in Postgres.
router.post('/', uploadFields, async (req, res, next) => {
  try {
    const files = req.files || {};
    const title = (req.body?.title || '').toString().trim();
    const testName = (req.body?.testName || '').toString().trim();
    if (!title || !testName) return res.status(400).json({ error: 'Title and Test Name are required.' });

    if (!files.listeningHtml && !files.readingHtml && !files.writingHtml) {
      return res.status(400).json({ error: 'Upload at least one section HTML file (Listening, Reading or Writing).' });
    }

    const listeningHtml = await storeFile(files.listeningHtml?.[0]);
    const listeningAudio = await storeFile(files.listeningAudio?.[0]); // optional
    const readingHtml = await storeFile(files.readingHtml?.[0]);
    const writingHtml = await storeFile(files.writingHtml?.[0]);

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
    const rows = await query('DELETE FROM mock_tests WHERE id = $1 RETURNING id', [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: 'Mock test not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
