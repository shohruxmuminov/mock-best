import express from 'express';
import { query, one } from '../db.js';
import { requireCandidate } from '../auth.js';
import { upload } from '../upload.js';
import { storeFile } from './files.js';

const router = express.Router();

// Save a Listening or Reading answer sheet (40 answers).
router.post('/answer-sheet', requireCandidate, async (req, res, next) => {
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

// Upload the Writing essay PDF (stored in Postgres).
router.post('/writing', requireCandidate, upload.single('pdf'), async (req, res, next) => {
  try {
    const testId = Number(req.body?.mockTestId);
    if (!req.file) return res.status(400).json({ error: 'No PDF file received.' });
    if (!testId || !(await one('SELECT 1 FROM mock_tests WHERE id = $1', [testId]))) {
      return res.status(400).json({ error: 'Invalid mock test.' });
    }
    const fileUrl = await storeFile(req.file);
    await query(
      `INSERT INTO writing_uploads (candidate_id, mock_test_id, file_url, original_name)
       VALUES ($1, $2, $3, $4)`,
      [req.candidate.id, testId, fileUrl, req.file.originalname || 'essay.pdf']
    );
    res.status(201).json({ ok: true, file: fileUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
