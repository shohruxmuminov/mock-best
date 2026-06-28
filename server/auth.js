import express from 'express';
import { one } from '../db.js';
import config from '../config.js';
import { signToken, verifyGoogleAdmin } from '../auth.js';

const router = express.Router();

router.get('/config', (req, res) => {
  res.json({
    googleClientId: config.googleClientId || null,
    googleEnabled: Boolean(config.googleClientId),
    passwordEnabled: Boolean(config.adminPassword),
    codeEnabled: Boolean(config.adminCode),
    adminEmail: config.adminEmail,
  });
});

router.post('/admin/google', async (req, res, next) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });
  try {
    const admin = await verifyGoogleAdmin(credential);
    const token = signToken({ role: 'admin', email: admin.email });
    res.json({ token, admin });
  } catch (err) {
    const status = err.code === 'FORBIDDEN' ? 403 : 401;
    res.status(status).json({ error: err.message });
  }
});

router.post('/admin/password', (req, res) => {
  const { password } = req.body || {};
  if (!config.adminPassword) return res.status(404).json({ error: 'Password login is disabled.' });
  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }
  const token = signToken({ role: 'admin', email: config.adminEmail });
  res.json({ token, admin: { email: config.adminEmail, name: 'Administrator' } });
});

// Admin login via a simple access code (default 2010).
router.post('/admin/code', (req, res) => {
  const code = (req.body?.code ?? '').toString().trim();
  if (!config.adminCode) return res.status(404).json({ error: 'Code login is disabled.' });
  if (!code || code !== config.adminCode) {
    return res.status(401).json({ error: 'Incorrect admin code.' });
  }
  const token = signToken({ role: 'admin', email: config.adminEmail });
  res.json({ token, admin: { email: config.adminEmail, name: 'Administrator' } });
});

router.post('/candidate', async (req, res, next) => {
  try {
    const raw = (req.body?.code || '').toString().replace(/\D/g, '');
    if (raw.length !== 14) {
      return res.status(400).json({ error: 'Candidate code must be exactly 14 digits.' });
    }
    const candidate = await one(
      'SELECT id, full_name, code, banned FROM candidates WHERE code = $1',
      [raw]
    );
    if (!candidate) {
      return res.status(404).json({ error: 'Invalid candidate code. Please check and try again.' });
    }
    if (candidate.banned) {
      return res.status(403).json({ error: 'This candidate has been banned from the examination.' });
    }
    const token = signToken({ role: 'candidate', id: candidate.id, code: candidate.code });
    res.json({
      token,
      candidate: { id: candidate.id, fullName: candidate.full_name, code: candidate.code },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
