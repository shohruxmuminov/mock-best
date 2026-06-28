export default function MonitoringTab({ online, alerts, onWarn, onBan, onClearAlerts }) {
  const confirmBan = (id, name) => {
    if (confirm(`Ban ${name || 'this candidate'}? They will be removed from the test immediately.`)) {
      onBan(id);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 26 }}>
      {/* Live full-screen exit alerts */}
      <div className="card" style={{ padding: 26 }}>
        <div className="section-head" style={{ margin: '0 0 16px' }}>
          <h3 style={{ margin: 0 }}><span className="live-dot" />Live Full-Screen Alerts</h3>
          {alerts.length > 0 && <button className="btn btn-ghost btn-sm" onClick={onClearAlerts}>Clear</button>}
        </div>
        {alerts.length === 0 ? (
          <div className="empty">No alerts. Candidates who leave full screen during a test will appear here instantly.</div>
        ) : (
          <div className="alert-feed">
            {alerts.map((a) => (
              <div className="alert-item" key={a.id}>
                <div>
                  <div className="who">⚠ {a.fullName} <span className="muted">left full screen</span></div>
                  <div className="meta">
                    Code <span className="code-badge">{a.code}</span> · Section <strong>{a.section}</strong> · {new Date(a.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => onWarn(a.candidateId)}>Send Warning</button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => confirmBan(a.candidateId, a.fullName)}>Ban</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Currently online candidates */}
      <div className="card" style={{ padding: 26 }}>
        <h3 style={{ marginTop: 0 }}>Candidates Online ({online.length})</h3>
        {online.length === 0 ? (
          <div className="empty">No candidates are currently connected.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Code</th><th>Current Section</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {online.map((c) => (
                  <tr key={c.candidateId}>
                    <td><strong>{c.fullName}</strong></td>
                    <td><span className="code-badge">{c.code}</span></td>
                    <td><span className="chip on">{c.section}</span></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onWarn(c.candidateId)}>Warn</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => confirmBan(c.candidateId, c.fullName)}>Ban</button>
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
