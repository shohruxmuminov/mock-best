/**
 * Renders an uploaded HTML test file exactly as a browser would. The file is
 * served from the API and loaded via the iframe `src`, so its CSS, JavaScript
 * and relative assets all execute — the candidate never sees raw source code.
 */
export default function HtmlFrame({ src, title = 'Test', className = 'runner-frame' }) {
  if (!src) {
    return <div className="empty">No content uploaded for this section.</div>;
  }
  return (
    <iframe
      src={src}
      title={title}
      className={className}
      // Allow scripts/forms so interactive tests work; allow-same-origin lets
      // same-origin assets and storage load correctly.
      sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
    />
  );
}
