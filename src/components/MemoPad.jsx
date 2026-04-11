export default function MemoPad({ memo, setMemo }) {
  return (
    <div className="glass-panel memo-pad-container animate-fade-in" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', padding: '0' }}>
      <div className="memo-header" style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 500 }}>머릿속 아이디어 덤프 ✨</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>언제든 기록해두세요. 실시간으로 계속 저장됩니다.</p>
      </div>
      <textarea
        className="memo-textarea"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="자유롭게 아이디어, 생각, 혹은 일상을 메모하세요..."
        spellCheck="false"
      />
    </div>
  );
}
