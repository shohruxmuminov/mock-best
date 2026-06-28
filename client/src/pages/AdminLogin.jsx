import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LogoMark } from '../components/Logo.jsx';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Sign-In.'));
    document.head.appendChild(s);
  });
}

export default function AdminLogin() {
  const [cfg, setCfg] = useState(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, login } = useAuth();
  const nav = useNavigate();
  const btnRef = useRef(null);

  useEffect(() => {
    if (session?.type === 'admin') nav('/admin', { replace: true });
  }, [session, nav]);

  useEffect(() => {
    api.get('/auth/config').then(setCfg).catch((e) => setError(e.message));
  }, []);

  const handleGoogle = async (response) => {
    setError('');
    setLoading(true);
    try {
      const { token, admin } = await api.post('/auth/admin/google', {
        credential: response.credential,
      });
      login(token, { type: 'admin', ...admin });
      nav('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cfg?.googleEnabled || !cfg.googleClientId) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback: handleGoogle,
        });
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'pill',
          });
        }
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, admin } = await api.post('/auth/admin/password', { password });
      login(token, { type: 'admin', ...admin });
      nav('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-wrap">
      <div className="card auth-card">
        <LogoMark size={52} />
        <h2>Admin Sign In</h2>
        <p className="sub">
          Restricted access. Only the authorized administrator account
          {cfg?.adminEmail ? <> (<strong>{cfg.adminEmail}</strong>)</> : ''} may sign in.
        </p>

        {error && <div className="alert alert-err">{error}</div>}

        {cfg?.googleEnabled && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <div ref={btnRef} />
          </div>
        )}

        {!cfg?.googleEnabled && (
          <div className="alert" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}>
            Google Sign-In is not configured on this server. Set <code>GOOGLE_CLIENT_ID</code> to enable it.
          </div>
        )}

        {cfg?.passwordEnabled && (
          <form onSubmit={submitPassword} style={{ marginTop: 12 }}>
            <div className="field">
              <label>Administrator Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading || !password}>
              {loading ? 'Signing in…' : 'Sign in as Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
