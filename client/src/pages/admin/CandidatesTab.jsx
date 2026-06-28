import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function CandidatesTab() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [fullName, setFullName] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = (q = '') => {
    setLoading(true);
    api
      .get(`/admin/candidates${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then(setCandidates)
      .catch((e) => setMsg({ type: 'err', text: e.message }))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const create = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!fullName.trim()) {
      setMsg({ type: 'err', text: 'Enter the candidate full name.' });
      return;
    }
    setCreating(true);
    try {
      const c = await api.post('/admin/candidates', { fullName: fullName.trim() });
      setMsg({ type: 'ok', text: `Created ${c.fullName} — code ${c.code}` });
      setFullName('');
      load(search.trim());
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const copy = (code) => navigator.clipboard?.writeText(code);

  const toggleBan = async (c) => {
    try {
      await api.post(`/admin/candidates/${c.id}/ban`, { banned: !c.banned });
      load(search.trim());
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete candidate ${c.fullName}? All their submissions will be removed.`)) return;
    try {
      await api.del(`/admin/candidates/${c.id}`);
      load(search.trim());
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  return (
    <div style={{ display: 'grid', gap: 26 }}>
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ marginTop: 0 }}>Generate Candidate</h3>
        {msg && <div className={`alert ${msg.type === 'ok' ? 'alert-ok' : 'alert-err'}`}>{msg.text}</div>}
        <form onSubmit={create} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '1 1 280px', marginBottom: 0 }}>
            <label>Candidate Full Name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Smith" />
          </div>
          <button className="btn btn-primary" disabled={creating}>
            {creating ? 'Generating…' : 'Generate 14-digit Code'}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div className="section-head" style={{ margin: '0 0 16px' }}>
          <h3 style={{ margin: 0 }}>All Candidates ({candidates.length})</h3>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search by name or 14-digit code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <div className="spinner" />}
        {!loading && candidates.length === 0 && <div className="empty">No candidates found.</div>}
        {!loading && candidates.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Candidate Code</th><th>Status</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.fullName}</strong></td>
                    <td>
                      <span className="code-badge" onClick={() => copy(c.code)} title="Click to copy" style={{ cursor: 'pointer' }}>{c.code}</span>
                    </td>
                    <td>{c.banned ? <span style={{ color: 'var(--red)' }}>● Banned</span> : <span style={{ color: '#1aa251' }}>● Active</span>}</td>
                    <td className="muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleBan(c)}>{c.banned ? 'Unban' : 'Ban'}</button>{' '}
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
