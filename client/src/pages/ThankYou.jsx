import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Logo.jsx';

export default function ThankYou() {
  return (
    <div className="page auth-wrap">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LogoMark size={64} />
        </div>
        <h2 style={{ marginBottom: 8 }}>Thank You! 🎉</h2>
        <p className="sub" style={{ marginBottom: 24 }}>
          You have successfully completed your IELTS Mock Test. Your answers and
          essay have been submitted to the administrator for review.
        </p>
        <div className="card" style={{ background: 'var(--bg)', padding: 18, marginBottom: 24 }}>
          <p style={{ margin: 0, color: 'var(--ink-2)' }}>
            We appreciate your dedication to preparing smart. Best of luck on your
            official IELTS examination!
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-primary btn-block">Back to My Tests</Link>
      </div>
    </div>
  );
}
