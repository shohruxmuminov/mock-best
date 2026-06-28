import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import config from './config.js';
import { one } from './db.js';

const googleClient = config.googleClientId
  ? new OAuth2Client(config.googleClientId)
  : null;

export function signToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

export function requireAdmin(req, res, next) {
  const decoded = verifyToken(extractToken(req));
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }
  req.admin = decoded;
  next();
}

export async function requireCandidate(req, res, next) {
  try {
    const decoded = verifyToken(extractToken(req));
    if (!decoded || decoded.role !== 'candidate') {
      return res.status(401).json({ error: 'Candidate authentication required.' });
    }
    const candidate = await one(
      'SELECT id, full_name, code, banned FROM candidates WHERE id = $1',
      [decoded.id]
    );
    if (!candidate) return res.status(401).json({ error: 'Candidate not found.' });
    if (candidate.banned) return res.status(403).json({ error: 'This candidate has been banned.' });
    req.candidate = candidate;
    next();
  } catch (err) {
    next(err);
  }
}

export async function verifyGoogleAdmin(credential) {
  if (!googleClient) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server.');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  const email = (payload?.email || '').toLowerCase();
  if (!payload?.email_verified) throw new Error('Google account email is not verified.');
  if (email !== config.adminEmail) {
    const err = new Error('This Google account is not authorized for admin access.');
    err.code = 'FORBIDDEN';
    throw err;
  }
  return { email, name: payload.name, picture: payload.picture };
}

/** Generate a guaranteed-unique 14-digit candidate code. */
export async function generateCandidateCode() {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 14; i++) code += Math.floor(Math.random() * 10).toString();
    if (code[0] === '0') code = '1' + code.slice(1);
    const exists = await one('SELECT 1 FROM candidates WHERE code = $1', [code]);
    if (!exists) return code;
  }
  throw new Error('Failed to generate a unique candidate code.');
}
