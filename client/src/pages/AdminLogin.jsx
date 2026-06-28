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
  const [code, setCode] = useState('');
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

  const submitCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, admin } = await api.post('/auth/admin/code', { code });
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
        <p className="sub">Enter the admin access code to open the Admin Panel.</p>

        {error && <div className="alert alert-err">{error}</div>}

        {/* Google Sign-In (shown only if configured) */}
        {cfg?.googleEnabled && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div ref={btnRef} />
            </div>
            <div style={{ textAlign: 'center', color: 'var(--muted)', margin: '6px 0 16px', fontSize: 13 }}>
              — or —
            </div>
          </>
        )}

        {/* Admin access code */}
        <form onSubmit={submitCode}>
          <div className="field">
            <label>Admin Code</label>
            <input
              className="input code-input"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter admin code"
              autoFocus
              inputMode="numeric"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading || !code}>
            {loading ? 'Signing in…' : 'Enter Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
