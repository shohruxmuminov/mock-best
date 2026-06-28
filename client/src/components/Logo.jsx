// Clean IELTS brand identity used across the platform (logo mark + wordmark).
export function LogoMark({ size = 40 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3b4e" />
          <stop offset="1" stopColor="#d11226" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#lm)" />
      <text x="32" y="41" fontFamily="Inter, Arial, sans-serif" fontSize="22" fontWeight="800"
        fill="#fff" textAnchor="middle">IE</text>
      <rect x="16" y="46" width="32" height="4" rx="2" fill="#fff" opacity="0.85" />
    </svg>
  );
}

export default function Logo({ size = 40, compact = false }) {
  return (
    <span className="brand">
      <LogoMark size={size} />
      {!compact && (
        <span>
          <span className="b-red">IELTS</span> <span className="b-ink">Mock Test</span>
        </span>
      )}
    </span>
  );
}
