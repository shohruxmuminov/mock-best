import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { examState } from '../lib/examState.js';

async function exitFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}

/**
 * Mounted for the whole candidate session. Sends a heartbeat every few seconds
 * (keeping the candidate visible on the admin monitor) and reacts to admin
 * warnings / bans returned in the heartbeat response — shown as centered modal
 * dialogs that appear even mid-test in full screen.
 */
export default function CandidateRealtime() {
  const { session, logout } = useAuth();
  const [warning, setWarning] = useState(null);
  const [banned, setBanned] = useState(false);
  const nav = useNavigate();
  const inFlight = useRef(false);

  useEffect(() => {
    let stopped = false;

    const beat = async () => {
      if (inFlight.current || stopped) return;
      inFlight.current = true;
      try {
        const r = await api.post('/monitor/heartbeat', { section: examState.get() });
        if (stopped) return;
        if (r.warning) setWarning(r.fullName || session?.fullName || 'Candidate');
        if (r.banned) {
          setWarning(null);
          setBanned(true);
          exitFullscreen();
        }
      } catch (e) {
        // A 403 on the heartbeat means the candidate was banned mid-exam.
        if (!stopped && e.status === 403) {
          setWarning(null);
          setBanned(true);
          exitFullscreen();
        }
      } finally {
        inFlight.current = false;
      }
    };

    beat();
    const id = setInterval(beat, 3000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [session]);

  const acknowledgeBan = () => {
    logout();
    nav('/', { replace: true });
  };

  return (
    <>
      {warning && (
        <Modal variant="warn" closeable={false}>
          <h3 style={{ color: 'var(--red)' }}>⚠ Examination Warning</h3>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            <strong>Dear {warning},</strong>
            <br />
            <br />
            Leaving Full Screen during the examination is strictly prohibited.
            <br />
            <br />
            Please continue your examination in Full Screen mode.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => setWarning(null)}>
            I Understand
          </button>
        </Modal>
      )}

      {banned && (
        <Modal variant="warn" closeable={false}>
          <h3 style={{ color: 'var(--red)' }}>Examination Terminated</h3>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            Your examination session has been ended by the administrator. You can
            no longer continue this test.
          </p>
          <button className="btn btn-danger btn-block" onClick={acknowledgeBan}>
            Exit
          </button>
        </Modal>
      )}
    </>
  );
}
