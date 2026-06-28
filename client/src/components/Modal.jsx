export default function Modal({ children, onClose, closeable = true, variant = '' }) {
  return (
    <div className="overlay" onClick={closeable ? onClose : undefined}>
      <div className={`modal ${variant}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
