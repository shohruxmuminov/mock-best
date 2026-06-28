import { useState } from 'react';
import { api } from '../../lib/api.js';

function SheetTable({ title, sheets }) {
  if (!sheets || sheets.length === 0) {
    return (
      <div className="card" style={{ padding: 22 }}>
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <div className="empty">No submission.</div>
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 22 }}>
      {sheets.map((s) => (
        <div key={s.id} style={{ marginBottom: 18 }}>
          <h4 style={{ marginTop: 0 }}>{title} — {s.testName} <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>({new Date(s.submittedAt).toLocaleString()})</span></h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {s.answers.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: 14, padding: '5px 8px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--red)', fontWeight: 700, minWidth: 22 }}>{i + 1}.</span>
                <span style={{ wordBreak: 'break-word' }}>{a || <span className="muted">—</span>}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReviewTab() {
  const [code, setCode] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setError('');
    setData(null);
    const clean = code.replace(/\D/g, '');
    if (clean.length !== 14) {
      setError('Enter a full 14-digit candidate code.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.get(`/admin/review/${clean}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="card" style={{ padding: 26 }}>
        <h3 style={{ marginTop: 0 }}>Review Candidate Submissions</h3>
        <form onSubmit={search} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: '1 1 260px' }}
            placeholder="Enter 14-digit candidate code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 14))}
          />
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
        </form>
        {error && <div className="alert alert-err" style={{ marginTop: 14 }}>{error}</div>}
      </div>

      {data && (
        <>
          <div className="card" style={{ padding: 26 }}>
            <h3 style={{ marginTop: 0 }}>{data.candidate.fullName}</h3>
            <p className="muted" style={{ margin: 0 }}>
              Code <span className="code-badge">{data.candidate.code}</span> ·{' '}
              {data.candidate.banned ? <span style={{ color: 'var(--red)' }}>Banned</span> : <span style={{ color: '#1aa251' }}>Active</span>}
            </p>
          </div>

          <SheetTable title="Listening Answer Sheet" sheets={data.answerSheets.listening} />
          <SheetTable title="Reading Answer Sheet" sheets={data.answerSheets.reading} />

          <div className="card" style={{ padding: 26 }}>
            <h4 style={{ marginTop: 0 }}>Writing — Uploaded Essays</h4>
            {data.writing.length === 0 ? (
              <div className="empty">No essay uploaded.</div>
            ) : (
              <table className="table">
                <thead><tr><th>Test</th><th>File</th><th>Submitted</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                <tbody>
                  {data.writing.map((w) => (
                    <tr key={w.id}>
                      <td>{w.testName}</td>
                      <td>{w.originalName}</td>
                      <td className="muted">{new Date(w.submittedAt).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <a className="btn btn-ghost btn-sm" href={w.file} target="_blank" rel="noreferrer">Open</a>{' '}
                        <a className="btn btn-primary btn-sm" href={w.file} download={w.originalName}>Download</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {data.events?.length > 0 && (
            <div className="card" style={{ padding: 26 }}>
              <h4 style={{ marginTop: 0 }}>Monitoring History</h4>
              <table className="table">
                <thead><tr><th>Event</th><th>Section</th><th>Detail</th><th>Time</th></tr></thead>
                <tbody>
                  {data.events.map((ev) => (
                    <tr key={ev.id}>
                      <td>{ev.type.replace('_', ' ')}</td>
                      <td>{ev.section || '—'}</td>
                      <td className="muted">{ev.detail}</td>
                      <td className="muted">{new Date(ev.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
