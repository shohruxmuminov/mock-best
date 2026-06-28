import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function Navbar({ theme, onToggleTheme }) {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const isCandidate = session?.type === 'candidate';
  const isAdmin = session?.type === 'admin';

  const doLogout = () => {
    logout();
    nav('/');
  };

  return (
    <nav className="nav container">
      <Link to="/" aria-label="IELTS Mock Test home">
        <Logo />
      </Link>

      <div className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
        <Link className={loc.pathname === '/' ? 'active' : ''} to="/">Home</Link>
        {isCandidate && <Link to="/dashboard">Mock Tests</Link>}
        {isAdmin && <Link to="/admin">Admin Panel</Link>}
        {!session && <a href="#features">Practice</a>}
        {!session && <a href="#about">About</a>}
      </div>

      <div className="nav-right">
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isCandidate && (
          <>
            <span className="chip on" title="Logged in candidate">👤 {session.fullName}</span>
            <button className="btn btn-ghost btn-sm" onClick={doLogout}>Exit</button>
          </>
        )}
        {isAdmin && (
          <>
            <span className="chip on">🛡️ {session.name || 'Admin'}</span>
            <button className="btn btn-ghost btn-sm" onClick={doLogout}>Sign out</button>
          </>
        )}
        {!session && (
          <>
            <Link to="/admin/login" className="btn btn-ghost btn-sm">🛡️ Admin</Link>
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          </>
        )}

        <button
          className="icon-btn menu-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
    </nav>
  );
}
