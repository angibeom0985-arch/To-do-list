import { useRef, useState } from 'react';

const CANVAS_WIDTH = 2200;
const CANVAS_HEIGHT = 1400;
const NODE_WIDTH = 220;
const NODE_HEIGHT = 230;

export default function VisionBoard({ items, setItems }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileData, setImageFileData] = useState('');
  const [lastPoint, setLastPoint] = useState({ x: 100, y: 100 });
  const [draggingId, setDraggingId] = useState(null);

  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const normalizePoint = (x, y) => {
    const clampedX = Math.max(10, Math.min(x, CANVAS_WIDTH - NODE_WIDTH - 10));
    const clampedY = Math.max(10, Math.min(y, CANVAS_HEIGHT - NODE_HEIGHT - 10));
    return { x: clampedX, y: clampedY };
  };

  const getItemPoint = (item, index) => {
    if (Number.isFinite(item.x) && Number.isFinite(item.y)) {
      return normalizePoint(item.x, item.y);
    }
    const fallbackX = 40 + (index % 6) * 260;
    const fallbackY = 40 + Math.floor(index / 6) * 260;
    return normalizePoint(fallbackX, fallbackY);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = normalizePoint(e.clientX - rect.left, e.clientY - rect.top);
    setLastPoint(p);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFileData('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImageFileData(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const resolvedImage = imageFileData || imageUrl.trim();
    if (!title.trim() && !note.trim() && !resolvedImage) return;

    const p = normalizePoint(lastPoint.x, lastPoint.y);
    const newItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      note: note.trim(),
      imageUrl: resolvedImage,
      x: p.x,
      y: p.y,
      createdAt: new Date().toISOString(),
    };

    setItems([...(items || []), newItem]);
    setTitle('');
    setNote('');
    setImageUrl('');
    setImageFileData('');
  };

  const removeItem = (id) => {
    setItems((items || []).filter((item) => item.id !== id));
  };

  const startDrag = (e, item, index) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const point = getItemPoint(item, index);

    dragRef.current = {
      id: item.id,
      offsetX: e.clientX - rect.left - point.x,
      offsetY: e.clientY - rect.top - point.y,
    };

    setDraggingId(item.id);

    const onMove = (moveEvent) => {
      const current = dragRef.current;
      if (!current || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const next = normalizePoint(
        moveEvent.clientX - canvasRect.left - current.offsetX,
        moveEvent.clientY - canvasRect.top - current.offsetY,
      );

      setItems((prev) =>
        (prev || []).map((node) =>
          node.id === current.id
            ? { ...node, x: next.x, y: next.y }
            : node,
        ),
      );
    };

    const onUp = () => {
      dragRef.current = null;
      setDraggingId(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="glass-panel vision-board-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <div className="vision-topbar">
        <form onSubmit={handleAdd} className="vision-form">
          <input
            type="text"
            className="project-input"
            placeholder="노드 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            className="project-input"
            placeholder="텍스트 메모"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <input
            type="url"
            className="project-input"
            placeholder="이미지 URL (선택)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="project-input"
            onChange={handleFileChange}
          />
          <button type="submit" className="add-btn mini-btn">노드 추가</button>
        </form>
        <p className="vision-help">캔버스를 클릭한 위치를 기준으로 노드가 추가됩니다. 추가 후 자유롭게 드래그해서 360도 배치할 수 있습니다.</p>
      </div>

      <div className="vision-canvas-wrap">
        <div
          ref={canvasRef}
          className="vision-canvas"
          onMouseDown={handleCanvasMouseDown}
          style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
        >
          {(items || []).map((item, index) => {
            const point = getItemPoint(item, index);
            return (
              <article
                key={item.id}
                className={`vision-node ${draggingId === item.id ? 'dragging' : ''}`}
                style={{ left: `${point.x}px`, top: `${point.y}px` }}
                onMouseDown={(e) => startDrag(e, item, index)}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title || 'vision'} className="vision-node-image" draggable={false} />
                ) : (
                  <div className="vision-node-image fallback">이미지 없음</div>
                )}
                <h3 className="vision-node-title">{item.title || '제목 없음'}</h3>
                {item.note && <p className="vision-node-note">{item.note}</p>}
                <button
                  type="button"
                  className="vision-node-delete"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => removeItem(item.id)}
                >
                  ×
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
