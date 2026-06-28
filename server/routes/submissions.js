import express from 'express';
import { query, one } from '../db.js';
import { requireCandidate } from '../auth.js';

const router = express.Router();
router.use(requireCandidate);

// Save a Listening or Reading answer sheet (40 answers).
router.post('/answer-sheet', async (req, res, next) => {
  try {
    const { mockTestId, section } = req.body || {};
    let { answers } = req.body || {};
    if (!['listening', 'reading'].includes(section)) {
      return res.status(400).json({ error: 'Invalid section.' });
    }
    const testId = Number(mockTestId);
    if (!testId || !(await one('SELECT 1 FROM mock_tests WHERE id = $1', [testId]))) {
      return res.status(400).json({ error: 'Invalid mock test.' });
    }
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'Answers must be an array.' });
    answers = Array.from({ length: 40 }, (_, i) => (answers[i] ?? '').toString());

    await query(
      `INSERT INTO answer_sheets (candidate_id, mock_test_id, section, answers)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (candidate_id, mock_test_id, section)
       DO UPDATE SET answers = EXCLUDED.answers, submitted_at = now()`,
      [req.candidate.id, testId, section, JSON.stringify(answers)]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Record the uploaded Writing essay PDF (uploaded to Blob from the browser).
router.post('/writing', async (req, res, next) => {
  try {
    const testId = Number(req.body?.mockTestId);
    const fileUrl = (req.body?.fileUrl || '').toString();
    const originalName = (req.body?.originalName || 'essay.pdf').toString();
    if (!fileUrl) return res.status(400).json({ error: 'No uploaded file URL received.' });
    if (!testId || !(await one('SELECT 1 FROM mock_tests WHERE id = $1', [testId]))) {
      return res.status(400).json({ error: 'Invalid mock test.' });
    }
    await query(
      `INSERT INTO writing_uploads (candidate_id, mock_test_id, file_url, original_name)
       VALUES ($1, $2, $3, $4)`,
      [req.candidate.id, testId, fileUrl, originalName]
    );
    res.status(201).json({ ok: true, file: fileUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
