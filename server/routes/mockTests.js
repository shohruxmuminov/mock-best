import express from 'express';
import { query, one } from '../db.js';
import { requireCandidate } from '../auth.js';

const router = express.Router();
router.use(requireCandidate);

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

router.get('/', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM mock_tests ORDER BY order_index ASC, id ASC');
    res.json(rows.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const test = await one('SELECT * FROM mock_tests WHERE id = $1', [Number(req.params.id)]);
    if (!test) return res.status(404).json({ error: 'Mock test not found.' });
    res.json(serialize(test));
  } catch (err) {
    next(err);
  }
});

export default router;
