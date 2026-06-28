import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LogoMark } from '../components/Logo.jsx';

export default function CandidateLogin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (session?.type === 'candidate') nav('/dashboard', { replace: true });
  }, [session, nav]);

  const onChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
    setCode(digits);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (code.length !== 14) {
      setError('Please enter your full 14-digit candidate code.');
      return;
    }
    setLoading(true);
    try {
      const { token, candidate } = await api.post('/auth/candidate', { code });
      login(token, { type: 'candidate', ...candidate });
      nav('/dashboard', { replace: true });
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
        <h2>Candidate Access</h2>
        <p className="sub">Enter your unique 14-digit candidate code to begin your assigned mock tests.</p>

        {error && <div className="alert alert-err">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Candidate Code</label>
            <input
              className="input code-input"
              value={code}
              onChange={onChange}
              placeholder="••••••••••••••"
              inputMode="numeric"
              autoFocus
            />
            <small className="muted">{code.length}/14 digits</small>
          </div>
          <button className="btn btn-primary btn-block" disabled={loading || code.length !== 14}>
            {loading ? 'Verifying…' : 'Enter Examination →'}
          </button>
        </form>
      </div>
    </div>
  );
}
