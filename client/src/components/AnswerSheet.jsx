/**
 * 40-question transfer answer sheet. One editable row per question. Answers are
 * controlled by the parent so nothing is lost before submission.
 */
export default function AnswerSheet({ answers, onChange, title }) {
  return (
    <>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
        <strong>{title}</strong>
        <div className="muted" style={{ fontSize: 13 }}>
          Transfer your answers below. All 40 questions must be reviewed before submitting.
        </div>
      </div>
      <div className="sheet-scroll">
        {Array.from({ length: 40 }, (_, i) => (
          <div className="sheet-row" key={i}>
            <span className="qn">{i + 1}</span>
            <input
              className="input"
              value={answers[i] || ''}
              onChange={(e) => {
                const next = answers.slice();
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={`Answer ${i + 1}`}
              aria-label={`Answer ${i + 1}`}
            />
          </div>
        ))}
      </div>
    </>
  );
}
