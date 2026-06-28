import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

export default function CandidateDashboard() {
  const { session } = useAuth();
  const [tests, setTests] = useState(null);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api
      .get('/mock-tests')
      .then(setTests)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page container" style={{ paddingBottom: 60 }}>
      <div className="section-head">
        <div>
          <h2>Welcome, {session?.fullName} 👋</h2>
          <p className="muted">Select a mock test below to begin. Sections must be completed in order: Listening → Reading → Writing.</p>
        </div>
      </div>

      {error && <div className="alert alert-err">{error}</div>}
      {!tests && !error && <div className="spinner" />}

      {tests && tests.length === 0 && (
        <div className="card empty">
          <h3>No mock tests available yet</h3>
          <p>Your administrator has not published any mock tests. Please check back soon.</p>
        </div>
      )}

      {tests && tests.length > 0 && (
        <div className="test-grid">
          {tests.map((t, i) => (
            <div key={t.id} className="card test-card">
              <div className="idx">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h3>{t.title}</h3>
                <div className="tname">{t.testName}</div>
              </div>
              <div className="chips">
                <span className={`chip ${t.listening.html ? 'on' : ''}`}>🎧 Listening{t.listening.hasAudio ? ' + Audio' : ''}</span>
                <span className={`chip ${t.reading.html ? 'on' : ''}`}>📖 Reading</span>
                <span className={`chip ${t.writing.html ? 'on' : ''}`}>✍️ Writing</span>
              </div>
              <button className="btn btn-primary btn-block" onClick={() => nav(`/test/${t.id}`)}>
                Start Mock Test →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
