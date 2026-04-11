import { useState, useRef } from 'react';

export default function MemoPad({ memos, setMemos }) {
  const dragItem = useRef();
  const dragOverItem = useRef();
  // 기본 날짜는 오늘로 세팅
  const todayDate = new Date().toISOString().split('T')[0];
  const [dateInput, setDateInput] = useState(todayDate);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');

  const handleAddMemo = (e) => {
    e.preventDefault();
    if (!titleInput.trim() || !contentInput.trim()) return;

    const newMemo = {
      id: crypto.randomUUID(),
      date: dateInput || todayDate,
      title: titleInput.trim(),
      content: contentInput.trim(),
    };

    setMemos([newMemo, ...(memos || [])]);
    setTitleInput('');
    setContentInput('');
    // 날짜는 유지
  };

  const deleteMemo = (id) => {
    setMemos((memos || []).filter(memo => memo.id !== id));
  };

  const handleSort = () => {
    if (dragItem.current !== undefined && dragOverItem.current !== undefined) {
      const _memos = [...(memos || [])];
      const [draggedItem] = _memos.splice(dragItem.current, 1);
      _memos.splice(dragOverItem.current, 0, draggedItem);
      setMemos(_memos);
    }
    dragItem.current = undefined;
    dragOverItem.current = undefined;
  };

  return (
    <div className="glass-panel memo-pad-container animate-fade-in" style={{ animationDelay: '0.2s', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="memo-header" style={{ marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>💡 아이디어 보드 (Brain Dump)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>머릿속에 떠오르는 것들을 기록으로 남겨보세요.</p>
      </div>
      
      <form onSubmit={handleAddMemo} className="memo-form-grid">
        <div className="memo-input-group">
          <label>Date</label>
          <input 
            type="date" 
            className="memo-input date-input"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </div>
        
        <div className="memo-input-group title-group">
          <label>Title</label>
          <input 
            type="text" 
            className="memo-input box-input" 
            placeholder="메모의 제목을 입력하세요..." 
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
          />
        </div>
        
        <div className="memo-input-group full-width">
          <label>Content</label>
          <textarea
            className="memo-textarea"
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="상세 내용을 자유롭게 적어보세요..."
            spellCheck="false"
          />
        </div>

        <div className="memo-submit-row full-width">
          <button type="submit" className="add-btn memo-add-btn">기록 남기기 📝</button>
        </div>
      </form>

      <hr className="memo-divider" />

      <div className="memo-list">
        {!memos || memos.length === 0 ? (
          <p className="task-list-empty">아직 기록된 메모가 없습니다.</p>
        ) : (
          memos.map((memo, index) => (
            <div 
              key={memo.id} 
              className="memo-card animate-fade-in"
              draggable
              onDragStart={() => (dragItem.current = index)}
              onDragEnter={() => (dragOverItem.current = index)}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="memo-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="drag-handle memo-drag-handle" title="드래그해서 순서 변경">≡</div>
                  <span className="memo-card-date">{memo.date}</span>
                </div>
                <button onClick={() => deleteMemo(memo.id)} className="delete-btn memo-delete" title="메모 삭제">×</button>
              </div>
              <h3 className="memo-card-title">{memo.title}</h3>
              <p className="memo-card-content">{memo.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
