import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';

function FileField({ label, hint, accept, file, onPick, required }) {
  const ref = useRef(null);
  return (
    <div className="field">
      <label>{label} {required ? <span style={{ color: 'var(--red)' }}>*</span> : <span className="muted">(optional)</span>}</label>
      <div className={`drop ${file ? 'has' : ''}`} onClick={() => ref.current?.click()}>
        <input
          ref={ref}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => onPick(e.target.files?.[0] || null)}
        />
        {file ? <strong>✓ {file.name}</strong> : <strong>Click to upload</strong>}
        <small>{hint}</small>
      </div>
    </div>
  );
}

export default function MockTestsTab() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [testName, setTestName] = useState('');
  const [listeningHtml, setListeningHtml] = useState(null);
  const [listeningAudio, setListeningAudio] = useState(null);
  const [readingHtml, setReadingHtml] = useState(null);
  const [writingHtml, setWritingHtml] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/mock-tests').then(setTests).catch((e) => setMsg({ type: 'err', text: e.message })).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const reset = () => {
    setTitle('');
    setTestName('');
    setListeningHtml(null);
    setListeningAudio(null);
    setReadingHtml(null);
    setWritingHtml(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!title.trim() || !testName.trim()) {
      setMsg({ type: 'err', text: 'Title and Test Name are required.' });
      return;
    }
    if (!listeningHtml && !readingHtml && !writingHtml) {
      setMsg({ type: 'err', text: 'Upload at least one section HTML file.' });
      return;
    }
    setSubmitting(true);
    try {
      setMsg({ type: 'ok', text: 'Uploading… please wait.' });
      const form = new FormData();
      form.append('title', title);
      form.append('testName', testName);
      if (listeningHtml) form.append('listeningHtml', listeningHtml);
      if (listeningAudio) form.append('listeningAudio', listeningAudio);
      if (readingHtml) form.append('readingHtml', readingHtml);
      if (writingHtml) form.append('writingHtml', writingHtml);
      await api.postForm('/admin/mock-tests', form);
      setMsg({ type: 'ok', text: 'Mock test uploaded successfully.' });
      reset();
      load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this mock test? This cannot be undone.')) return;
    try {
      await api.del(`/admin/mock-tests/${id}`);
      load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 26 }}>
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ marginTop: 0 }}>Create Mock Test</h3>
        {msg && <div className={`alert ${msg.type === 'ok' ? 'alert-ok' : 'alert-err'}`}>{msg.text}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label>Title <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. IELTS Academic — Mock 01" />
            </div>
            <div className="field">
              <label>Test Name <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="input" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g. Cambridge 18 Test 1" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <FileField label="Listening HTML" hint="HTML file (required for Listening)" accept=".html,.htm,text/html" file={listeningHtml} onPick={setListeningHtml} />
            <FileField label="Listening Audio" hint="MP3 / audio — optional" accept="audio/*" file={listeningAudio} onPick={setListeningAudio} />
            <FileField label="Reading HTML" hint="HTML file only" accept=".html,.htm,text/html" file={readingHtml} onPick={setReadingHtml} />
            <FileField label="Writing HTML" hint="HTML file only" accept=".html,.htm,text/html" file={writingHtml} onPick={setWritingHtml} />
          </div>

          <button className="btn btn-primary" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? 'Uploading…' : 'Upload Mock Test'}
          </button>
        </form>
      </div>

      <div>
        <div className="section-head" style={{ margin: '0 0 16px' }}>
          <h3 style={{ margin: 0 }}>Published Mock Tests ({tests.length})</h3>
        </div>
        {loading && <div className="spinner" />}
        {!loading && tests.length === 0 && <div className="card empty">No mock tests uploaded yet.</div>}
        <div className="test-grid">
          {tests.map((t, i) => (
            <div key={t.id} className="card test-card">
              <div className="idx">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h3>{t.title}</h3>
                <div className="tname">{t.testName}</div>
              </div>
              <div className="chips">
                <span className={`chip ${t.listening.html ? 'on' : ''}`}>🎧 Listening</span>
                {t.listening.audio && <span className="chip on">🔊 Audio</span>}
                <span className={`chip ${t.reading.html ? 'on' : ''}`}>📖 Reading</span>
                <span className={`chip ${t.writing.html ? 'on' : ''}`}>✍️ Writing</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => remove(t.id)}>🗑 Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
