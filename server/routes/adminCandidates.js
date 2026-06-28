import express from 'express';
import { query, one } from '../db.js';
import { requireAdmin, generateCandidateCode } from '../auth.js';

const router = express.Router();
router.use(requireAdmin);

function serialize(c) {
  return {
    id: c.id,
    fullName: c.full_name,
    code: c.code,
    banned: Boolean(c.banned),
    createdAt: c.created_at,
  };
}

router.post('/', async (req, res, next) => {
  try {
    const fullName = (req.body?.fullName || '').toString().trim();
    if (!fullName) return res.status(400).json({ error: 'Candidate full name is required.' });
    const code = await generateCandidateCode();
    const candidate = await one(
      'INSERT INTO candidates (full_name, code) VALUES ($1, $2) RETURNING *',
      [fullName, code]
    );
    res.status(201).json(serialize(candidate));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const search = (req.query.search || '').toString().trim();
    let rows;
    if (search) {
      rows = await query(
        `SELECT * FROM candidates
         WHERE full_name ILIKE $1 OR code ILIKE $1
         ORDER BY created_at DESC, id DESC`,
        [`%${search}%`]
      );
    } else {
      rows = await query('SELECT * FROM candidates ORDER BY created_at DESC, id DESC');
    }
    res.json(rows.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/ban', async (req, res, next) => {
  try {
    const banned = req.body?.banned === false ? false : true;
    const candidate = await one(
      'UPDATE candidates SET banned = $1 WHERE id = $2 RETURNING *',
      [banned, Number(req.params.id)]
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });
    res.json(serialize(candidate));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const rows = await query('DELETE FROM candidates WHERE id = $1 RETURNING id', [Number(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: 'Candidate not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
