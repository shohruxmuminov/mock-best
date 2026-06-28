import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import MockTestsTab from './MockTestsTab.jsx';
import CandidatesTab from './CandidatesTab.jsx';
import MonitoringTab from './MonitoringTab.jsx';
import ReviewTab from './ReviewTab.jsx';

const TABS = [
  ['monitor', '📡 Monitoring'],
  ['tests', '🎧 Mock Tests'],
  ['candidates', '👥 Candidates'],
  ['review', '🔍 Review'],
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('monitor');
  const [online, setOnline] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());
  const inFlight = useRef(false);

  // Poll the monitor endpoint so alerts keep arriving on every tab.
  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      if (inFlight.current || stopped) return;
      inFlight.current = true;
      try {
        const r = await api.get('/monitor/admin');
        if (stopped) return;
        setOnline(r.online || []);
        setAlerts(r.alerts || []);
      } catch {
        /* ignore transient errors */
      } finally {
        inFlight.current = false;
      }
    };
    poll();
    const idt = setInterval(poll, 3000);
    return () => {
      stopped = true;
      clearInterval(idt);
    };
  }, []);

  const sendWarning = async (candidateId) => {
    try {
      await api.post('/monitor/warn', { candidateId });
    } catch (e) {
      alert(e.message);
    }
  };
  const banCandidate = async (candidateId) => {
    try {
      await api.post('/monitor/ban', { candidateId });
      setOnline((prev) => prev.filter((p) => p.candidateId !== candidateId));
    } catch (e) {
      alert(e.message);
    }
  };

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  const clearAlerts = () => setDismissed(new Set(alerts.map((a) => a.id)));

  return (
    <div className="page container" style={{ paddingBottom: 60 }}>
      <div className="section-head">
        <div>
          <h2>Admin Panel</h2>
          <p className="muted">Manage mock tests, candidates and monitor live examinations.</p>
        </div>
        {visibleAlerts.length > 0 && (
          <span className="chip on"><span className="live-dot" />{visibleAlerts.length} live alert(s)</span>
        )}
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
            {key === 'monitor' && online.length > 0 ? ` (${online.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'monitor' && (
        <MonitoringTab
          online={online}
          alerts={visibleAlerts}
          onWarn={sendWarning}
          onBan={banCandidate}
          onClearAlerts={clearAlerts}
        />
      )}
      {tab === 'tests' && <MockTestsTab />}
      {tab === 'candidates' && <CandidatesTab />}
      {tab === 'review' && <ReviewTab />}
    </div>
  );
}
