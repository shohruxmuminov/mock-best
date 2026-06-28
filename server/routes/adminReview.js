import express from 'express';
import { query, one } from '../db.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();
router.use(requireAdmin);

router.get('/:code', async (req, res, next) => {
  try {
    const code = (req.params.code || '').replace(/\D/g, '');
    const candidate = await one('SELECT * FROM candidates WHERE code = $1', [code]);
    if (!candidate) return res.status(404).json({ error: 'No candidate found for that code.' });

    const sheetRows = await query(
      `SELECT s.*, m.test_name FROM answer_sheets s
       LEFT JOIN mock_tests m ON m.id = s.mock_test_id
       WHERE s.candidate_id = $1 ORDER BY s.submitted_at`,
      [candidate.id]
    );
    const sheets = sheetRows.map((s) => ({
      id: s.id,
      mockTestId: s.mock_test_id,
      section: s.section,
      answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers,
      submittedAt: s.submitted_at,
      testName: s.test_name || '—',
    }));

    const writingRows = await query(
      `SELECT w.*, m.test_name FROM writing_uploads w
       LEFT JOIN mock_tests m ON m.id = w.mock_test_id
       WHERE w.candidate_id = $1 ORDER BY w.submitted_at DESC`,
      [candidate.id]
    );
    const writing = writingRows.map((w) => ({
      id: w.id,
      mockTestId: w.mock_test_id,
      file: w.file_url,
      originalName: w.original_name,
      submittedAt: w.submitted_at,
      testName: w.test_name || '—',
    }));

    const events = await query(
      'SELECT * FROM monitoring_events WHERE candidate_id = $1 ORDER BY created_at DESC LIMIT 100',
      [candidate.id]
    );

    res.json({
      candidate: {
        id: candidate.id,
        fullName: candidate.full_name,
        code: candidate.code,
        banned: Boolean(candidate.banned),
        createdAt: candidate.created_at,
      },
      answerSheets: {
        listening: sheets.filter((s) => s.section === 'listening'),
        reading: sheets.filter((s) => s.section === 'reading'),
      },
      writing,
      events,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
