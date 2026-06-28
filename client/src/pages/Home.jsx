import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Home() {
  const { session } = useAuth();
  const nav = useNavigate();

  const startTarget = () => {
    if (session?.type === 'candidate') nav('/dashboard');
    else if (session?.type === 'admin') nav('/admin');
    else nav('/login');
  };

  return (
    <div className="page">
      <section className="hero container">
        <div className="bg-watermark">IELTS</div>
        <div className="hero-grid">
          <div>
            <span className="pill"><span className="dot" /> The Best IELTS Mock Test Platform</span>
            <h1>
              Prepare Smart.<br />
              <span className="accent">Score High.</span>
            </h1>
            <p className="lead">
              Experience real IELTS practice with our high-quality mock tests and
              detailed feedback.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={startTarget}>
                Start Mock Test →
              </button>
              <Link to="/login" className="btn btn-ghost">Enter Candidate Code ▦</Link>
            </div>
            <div className="stats">
              <div className="stat"><div className="num">15K+</div><div className="lbl">Tests Taken</div></div>
              <div className="stat"><div className="num">4.9/5</div><div className="lbl">Average Score</div></div>
              <div className="stat"><div className="num">98%</div><div className="lbl">Success Rate</div></div>
            </div>
          </div>

          <div className="hero-cards">
            <div className="profile-card">
              <div className="ava">MS</div>
              <div>
                <div className="name">Muminov Shohrukh</div>
                <div className="role">Website Developer</div>
              </div>
            </div>
            <div className="profile-card">
              <div className="ava">BO</div>
              <div>
                <div className="name">Barkayev Otabek</div>
                <div className="role">IELTS Teacher</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container" id="features" style={{ paddingBottom: 40 }}>
        <div className="test-grid">
          {[
            ['🎧', 'Listening', 'Authentic audio tests that auto-play in sync with the question paper.'],
            ['📖', 'Reading', 'Full passages with realistic question types and a transfer answer sheet.'],
            ['✍️', 'Writing', 'Complete both tasks and submit your essay as a PDF for review.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="card test-card">
              <div className="idx">{icon}</div>
              <h3>{title}</h3>
              <p className="tname">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer" id="about">
        © {new Date().getFullYear()} IELTS Mock Test Platform · Prepare Smart. Score High.
      </footer>
    </div>
  );
}
