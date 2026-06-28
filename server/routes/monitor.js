import express from 'express';
import { query, one } from '../db.js';
import { requireAdmin, requireCandidate } from '../auth.js';

const router = express.Router();

// ---- Candidate side (polled every few seconds) ----

// Heartbeat: refresh presence and return any pending warning / ban so the
// candidate UI can react instantly without a websocket.
router.post('/heartbeat', requireCandidate, async (req, res, next) => {
  try {
    const c = req.candidate;
    const section = (req.body?.section || 'idle').toString();
    await query(
      `INSERT INTO presence (candidate_id, full_name, code, section, last_seen)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (candidate_id)
       DO UPDATE SET section = EXCLUDED.section, last_seen = now()`,
      [c.id, c.full_name, c.code, section]
    );

    // Undelivered warnings → deliver once.
    const warnings = await query(
      'SELECT id FROM signals WHERE candidate_id = $1 AND type = $2 AND delivered = FALSE',
      [c.id, 'warning']
    );
    if (warnings.length) {
      await query('UPDATE signals SET delivered = TRUE WHERE candidate_id = $1 AND type = $2 AND delivered = FALSE', [c.id, 'warning']);
    }

    res.json({ banned: Boolean(c.banned), warning: warnings.length > 0, fullName: c.full_name });
  } catch (err) {
    next(err);
  }
});

// Candidate left full screen during the exam.
router.post('/fullscreen-exit', requireCandidate, async (req, res, next) => {
  try {
    const section = (req.body?.section || null);
    await query(
      'INSERT INTO monitoring_events (candidate_id, type, section, detail) VALUES ($1, $2, $3, $4)',
      [req.candidate.id, 'fullscreen_exit', section, 'Candidate exited full screen']
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---- Admin side (polled every few seconds) ----

router.get('/admin', requireAdmin, async (req, res, next) => {
  try {
    const online = await query(
      `SELECT candidate_id, full_name, code, section, last_seen
       FROM presence
       WHERE last_seen > now() - interval '15 seconds'
       ORDER BY last_seen DESC`
    );
    const alerts = await query(
      `SELECT e.id, e.candidate_id, e.section, e.created_at, c.full_name, c.code
       FROM monitoring_events e
       JOIN candidates c ON c.id = e.candidate_id
       WHERE e.type = 'fullscreen_exit' AND e.created_at > now() - interval '15 minutes'
       ORDER BY e.created_at DESC
       LIMIT 50`
    );
    res.json({
      online: online.map((o) => ({
        candidateId: o.candidate_id,
        fullName: o.full_name,
        code: o.code,
        section: o.section,
        since: o.last_seen,
      })),
      alerts: alerts.map((a) => ({
        id: a.id,
        candidateId: a.candidate_id,
        fullName: a.full_name,
        code: a.code,
        section: a.section || 'unknown',
        timestamp: a.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/warn', requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.body?.candidateId);
    const c = await one('SELECT id FROM candidates WHERE id = $1', [id]);
    if (!c) return res.status(404).json({ error: 'Candidate not found.' });
    await query('INSERT INTO signals (candidate_id, type) VALUES ($1, $2)', [id, 'warning']);
    await query(
      'INSERT INTO monitoring_events (candidate_id, type, detail) VALUES ($1, $2, $3)',
      [id, 'warning', 'Admin sent full-screen warning']
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/ban', requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.body?.candidateId);
    const c = await one('UPDATE candidates SET banned = TRUE WHERE id = $1 RETURNING id', [id]);
    if (!c) return res.status(404).json({ error: 'Candidate not found.' });
    await query(
      'INSERT INTO monitoring_events (candidate_id, type, detail) VALUES ($1, $2, $3)',
      [id, 'ban', 'Admin banned candidate during exam']
    );
    await query('DELETE FROM presence WHERE candidate_id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
