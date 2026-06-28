import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { examState } from '../lib/examState.js';
import HtmlFrame from '../components/HtmlFrame.jsx';
import AnswerSheet from '../components/AnswerSheet.jsx';

const SHEET_SECONDS = 300; // 5 minutes per answer sheet

function monitorSection(step) {
  if (step?.startsWith('listening')) return 'listening';
  if (step?.startsWith('reading')) return 'reading';
  if (step?.startsWith('writing')) return 'writing';
  return 'idle';
}

function fmt(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function TestRunner() {
  const { id } = useParams();
  const { session } = useAuth();
  const nav = useNavigate();

  const [test, setTest] = useState(null);
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(-1); // -1 = intro
  const [listeningAnswers, setListeningAnswers] = useState(() => Array(40).fill(''));
  const [readingAnswers, setReadingAnswers] = useState(() => Array(40).fill(''));
  const [seconds, setSeconds] = useState(SHEET_SECONDS);
  const [showReenter, setShowReenter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [essayFile, setEssayFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');

  const audioRef = useRef(null);
  const audioStarted = useRef(false);

  useEffect(() => {
    api.get(`/mock-tests/${id}`).then(setTest).catch((e) => setError(e.message));
  }, [id]);

  const flow = useMemo(() => {
    if (!test) return [];
    const s = [];
    if (test.listening.html) s.push('listening', 'listening-sheet');
    if (test.reading.html) s.push('reading', 'reading-sheet');
    if (test.writing.html) s.push('writing');
    return s;
  }, [test]);

  const step = stepIndex >= 0 ? flow[stepIndex] : 'intro';
  const running = stepIndex >= 0;

  // Report the candidate's current section to the admin monitor (via heartbeat).
  useEffect(() => {
    examState.set(running ? monitorSection(step) : 'idle');
  }, [step, running]);

  // Reset section when leaving the runner.
  useEffect(() => () => examState.set('idle'), []);

  const requestFs = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setShowReenter(false);
    } catch {
      /* user denied / unsupported — test still runs */
    }
  }, []);

  const exitFs = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  // Detect leaving full screen during an active test → alert the admin.
  useEffect(() => {
    const onFsChange = () => {
      if (running && !document.fullscreenElement) {
        setShowReenter(true);
        api.post('/monitor/fullscreen-exit', { section: monitorSection(step) }).catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [running, step]);

  // Make sure we leave full screen if the runner unmounts for any reason.
  useEffect(() => () => { exitFs(); }, [exitFs]);

  const startTest = async () => {
    await requestFs();
    setStepIndex(0);
    if (test.listening.audio && audioRef.current && !audioStarted.current) {
      audioStarted.current = true;
      audioRef.current.play().catch(() => {});
    }
  };

  const finish = useCallback(async () => {
    await exitFs();
    nav('/done', { replace: true });
  }, [exitFs, nav]);

  const advance = useCallback(() => {
    setSeconds(SHEET_SECONDS);
    setStepIndex((i) => {
      const nextI = i + 1;
      if (nextI >= flow.length) {
        finish();
        return i;
      }
      return nextI;
    });
  }, [flow.length, finish]);

  const submitSheet = useCallback(
    async (section) => {
      if (busy) return;
      setBusy(true);
      try {
        const answers = section === 'listening' ? listeningAnswers : readingAnswers;
        await api.post('/submissions/answer-sheet', {
          mockTestId: test.id,
          section,
          answers,
        });
        advance();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    },
    [busy, listeningAnswers, readingAnswers, test, advance]
  );

  // Answer-sheet countdown timer (auto-submits at zero).
  const isSheet = step === 'listening-sheet' || step === 'reading-sheet';
  useEffect(() => {
    if (!isSheet) return;
    if (seconds <= 0) {
      submitSheet(step === 'listening-sheet' ? 'listening' : 'reading');
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isSheet, seconds, step, submitSheet]);

  const submitWriting = async () => {
    if (!essayFile) {
      setUploadMsg('Please choose your essay PDF first.');
      return;
    }
    setBusy(true);
    setUploadMsg('');
    try {
      const form = new FormData();
      form.append('pdf', essayFile);
      form.append('mockTestId', String(test.id));
      await api.postForm('/submissions/writing', form);
      finish();
    } catch (e) {
      setUploadMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="page auth-wrap">
        <div className="card auth-card">
          <div className="alert alert-err">{error}</div>
          <button className="btn btn-ghost btn-block" onClick={() => nav('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }
  if (!test) return <div className="spinner" />;

  const sectionOrder = ['listening', 'reading', 'writing'];
  const curSec = monitorSection(step);

  return (
    <div className="runner">
      {test.listening.audio && (
        <audio ref={audioRef} src={test.listening.audio} preload="auto" />
      )}

      {/* Top bar */}
      <div className="runner-bar">
        <div className="step-dots">
          {sectionOrder
            .filter((s) => test[s]?.html)
            .map((s) => {
              const done = sectionOrder.indexOf(s) < sectionOrder.indexOf(curSec);
              const active = s === curSec;
              return (
                <span key={s} className={`step-dot ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                  <span className="d" /> {s[0].toUpperCase() + s.slice(1)}
                </span>
              );
            })}
        </div>
        <div style={{ fontWeight: 700 }}>{test.title}</div>
        <div>
          {isSheet ? (
            <span className={`timer ${seconds <= 30 ? 'warning' : ''}`}>⏱ {fmt(seconds)}</span>
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>{session?.fullName}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="runner-body">
        {step === 'intro' && (
          <div style={{ margin: 'auto', textAlign: 'center', padding: 30, maxWidth: 560 }}>
            <h1 style={{ fontSize: 40 }}>{test.title}</h1>
            <p className="muted" style={{ fontSize: 17 }}>{test.testName}</p>
            <div className="card" style={{ padding: 26, textAlign: 'left', margin: '24px 0' }}>
              <p style={{ marginTop: 0 }}><strong>Before you begin:</strong></p>
              <ul style={{ lineHeight: 1.8, color: 'var(--ink-2)' }}>
                <li>The test opens in <strong>Full Screen</strong> mode.</li>
                <li>Do <strong>not</strong> exit full screen — the administrator is notified instantly.</li>
                <li>Sections are completed in order: Listening → Reading → Writing.</li>
                {test.listening.audio && <li>Listening audio starts automatically and plays once.</li>}
              </ul>
            </div>
            <button className="btn btn-primary" style={{ fontSize: 17, padding: '16px 34px' }} onClick={startTest}>
              Start Test →
            </button>
          </div>
        )}

        {step === 'listening' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <HtmlFrame src={test.listening.html} title="Listening Test" />
            <div className="runner-bar" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
              <span className="muted">Complete the listening section, then continue to the answer sheet.</span>
              <button className="btn btn-primary btn-sm" onClick={advance}>Submit Listening →</button>
            </div>
          </div>
        )}

        {step === 'listening-sheet' && (
          <div className="sheet-split">
            <HtmlFrame src={test.listening.html} title="Listening Test" className="runner-frame" />
            <div className="sheet-panel">
              <AnswerSheet title="Listening Answer Sheet" answers={listeningAnswers} onChange={setListeningAnswers} />
              <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-primary btn-block" disabled={busy} onClick={() => submitSheet('listening')}>
                  {busy ? 'Submitting…' : 'Submit Answer Sheet →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'reading' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <HtmlFrame src={test.reading.html} title="Reading Test" />
            <div className="runner-bar" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
              <span className="muted">Complete the reading section, then continue to the answer sheet.</span>
              <button className="btn btn-primary btn-sm" onClick={advance}>Submit Reading →</button>
            </div>
          </div>
        )}

        {step === 'reading-sheet' && (
          <div className="sheet-split">
            <HtmlFrame src={test.reading.html} title="Reading Test" className="runner-frame" />
            <div className="sheet-panel">
              <AnswerSheet title="Reading Answer Sheet" answers={readingAnswers} onChange={setReadingAnswers} />
              <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-primary btn-block" disabled={busy} onClick={() => submitSheet('reading')}>
                  {busy ? 'Submitting…' : 'Submit Answer Sheet →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'writing' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <HtmlFrame src={test.writing.html} title="Writing Test" />
            <div className="card" style={{ margin: 16, padding: 22 }}>
              <h3 style={{ marginTop: 0 }}>Send Essay to Admin</h3>
              <p className="muted" style={{ marginTop: 0 }}>Upload your completed essay as a PDF file. Large files are accepted.</p>
              {uploadMsg && <div className="alert alert-err">{uploadMsg}</div>}
              <label className={`drop ${essayFile ? 'has' : ''}`}>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setEssayFile(e.target.files?.[0] || null)}
                />
                {essayFile ? <strong>📄 {essayFile.name}</strong> : <strong>Click to choose your essay PDF</strong>}
                <small>PDF format · uploaded securely to the administrator</small>
              </label>
              <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy} onClick={submitWriting}>
                {busy ? 'Uploading…' : 'Submit Essay & Finish →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Re-enter full screen prompt */}
      {showReenter && running && (
        <div className="overlay">
          <div className="modal warn">
            <h3 style={{ color: 'var(--red)' }}>Full Screen Required</h3>
            <p>You have exited full screen. The administrator has been notified. Please return to full screen to continue your examination.</p>
            <button className="btn btn-primary btn-block" onClick={requestFs}>Return to Full Screen</button>
          </div>
        </div>
      )}
    </div>
  );
}
