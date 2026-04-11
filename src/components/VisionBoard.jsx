import { useState } from 'react';

export default function VisionBoard({ items, setItems }) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setItems([newItem, ...(items || [])]);
    setTitle('');
    setImageUrl('');
    setNote('');
  };

  const removeItem = (id) => {
    setItems((items || []).filter((item) => item.id !== id));
  };

  return (
    <div className="glass-panel vision-board-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <form onSubmit={handleAdd} className="vision-form">
        <input
          type="text"
          className="project-input"
          placeholder="목표 제목..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="url"
          className="project-input"
          placeholder="이미지 URL (선택)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <input
          type="text"
          className="project-input"
          placeholder="한 줄 메모 (선택)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" className="add-btn mini-btn">추가</button>
      </form>

      {(!items || items.length === 0) ? (
        <p className="task-list-empty">비전 보드 항목이 없습니다. 목표 이미지를 추가해보세요.</p>
      ) : (
        <div className="vision-grid">
          {items.map((item) => (
            <article key={item.id} className="vision-card">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="vision-image" />
              ) : (
                <div className="vision-image fallback">No Image</div>
              )}
              <h3>{item.title}</h3>
              {item.note && <p>{item.note}</p>}
              <button type="button" className="delete-btn" onClick={() => removeItem(item.id)}>×</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

