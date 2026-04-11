import { useEffect, useMemo, useRef, useState } from 'react';

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1500;
const NODE_WIDTH = 240;
const NODE_HEIGHT_TEXT = 110;
const NODE_HEIGHT_IMAGE = 220;

const normalizePoint = (x, y) => {
  const nx = Math.max(10, Math.min(x, CANVAS_WIDTH - NODE_WIDTH - 10));
  const ny = Math.max(10, Math.min(y, CANVAS_HEIGHT - NODE_HEIGHT_IMAGE - 10));
  return { x: nx, y: ny };
};

const normalizeNode = (item, index) => {
  const fallbackX = 60 + (index % 6) * 270;
  const fallbackY = 70 + Math.floor(index / 6) * 220;
  const p = normalizePoint(Number.isFinite(item.x) ? item.x : fallbackX, Number.isFinite(item.y) ? item.y : fallbackY);

  return {
    id: item.id,
    title: item.title || '',
    note: item.note || '',
    imageUrl: item.imageUrl || '',
    parentId: item.parentId || null,
    x: p.x,
    y: p.y,
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

const getNodeHeight = (node) => (node.imageUrl ? NODE_HEIGHT_IMAGE : NODE_HEIGHT_TEXT);

const getNodeCenter = (node) => ({
  x: node.x + NODE_WIDTH / 2,
  y: node.y + getNodeHeight(node) / 2,
});

const projectToNodeBorder = (from, to, targetNode) => {
  const cx = targetNode.x + NODE_WIDTH / 2;
  const cy = targetNode.y + getNodeHeight(targetNode) / 2;
  const hw = NODE_WIDTH / 2;
  const hh = getNodeHeight(targetNode) / 2;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const tx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const ty = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty);

  return {
    x: cx + dx * t,
    y: cy + dy * t,
  };
};

export default function VisionBoard({ items, setItems }) {
  const [mode, setMode] = useState('view');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileData, setImageFileData] = useState('');
  const [lastPoint, setLastPoint] = useState({ x: 120, y: 120 });

  const [draggingId, setDraggingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', note: '', imageUrl: '' });

  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const nodes = useMemo(() => (items || []).map((item, index) => normalizeNode(item, index)), [items]);
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const setNodes = (updater) => {
    setItems((prev) => {
      const normalized = (prev || []).map((item, index) => normalizeNode(item, index));
      const next = updater(normalized);
      return next;
    });
  };

  const isEditMode = mode === 'edit';

  const handleCanvasMouseDown = (e) => {
    if (!isEditMode) return;
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = normalizePoint(e.clientX - rect.left, e.clientY - rect.top);
    setLastPoint(p);
  };

  const handleNewFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFileData('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImageFileData(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };

  const addRootNode = (e) => {
    e.preventDefault();
    const resolvedImage = imageFileData || imageUrl.trim();
    if (!title.trim() && !note.trim() && !resolvedImage) return;

    const p = normalizePoint(lastPoint.x, lastPoint.y);
    const newNode = {
      id: crypto.randomUUID(),
      title: title.trim(),
      note: note.trim(),
      imageUrl: resolvedImage,
      parentId: null,
      x: p.x,
      y: p.y,
      createdAt: new Date().toISOString(),
    };

    setNodes((prev) => [...prev, newNode]);
    setTitle('');
    setNote('');
    setImageUrl('');
    setImageFileData('');
  };

  const addChildNode = (parentId) => {
    const parent = nodeMap.get(parentId);
    if (!parent) return;

    const childCount = nodes.filter((n) => n.parentId === parentId).length;
    const base = normalizePoint(parent.x + 300, parent.y + childCount * 130 - 65);

    const newNode = {
      id: crypto.randomUUID(),
      title: '새 노드',
      note: '',
      imageUrl: '',
      parentId,
      x: base.x,
      y: base.y,
      createdAt: new Date().toISOString(),
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const deleteNodeAndDescendants = (targetId) => {
    const idsToDelete = new Set([targetId]);
    let expanded = true;

    while (expanded) {
      expanded = false;
      for (const n of nodes) {
        if (n.parentId && idsToDelete.has(n.parentId) && !idsToDelete.has(n.id)) {
          idsToDelete.add(n.id);
          expanded = true;
        }
      }
    }

    setNodes((prev) => prev.filter((n) => !idsToDelete.has(n.id)));
    if (editingId && idsToDelete.has(editingId)) {
      setEditingId(null);
    }
  };

  const startDrag = (e, node) => {
    if (!isEditMode) return;
    if (e.button !== 0 || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      id: node.id,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top - node.y,
    };
    setDraggingId(node.id);

    const onMove = (moveEvent) => {
      if (!dragRef.current || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const p = normalizePoint(
        moveEvent.clientX - canvasRect.left - dragRef.current.offsetX,
        moveEvent.clientY - canvasRect.top - dragRef.current.offsetY,
      );

      setNodes((prev) => prev.map((item) => (item.id === dragRef.current.id ? { ...item, x: p.x, y: p.y } : item)));
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

  const openEditor = (node) => {
    setEditingId(node.id);
    setEditDraft({
      title: node.title || '',
      note: node.note || '',
      imageUrl: node.imageUrl || '',
    });
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditDraft((prev) => ({ ...prev, imageUrl: typeof reader.result === 'string' ? reader.result : prev.imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === editingId
          ? { ...n, title: editDraft.title.trim(), note: editDraft.note.trim(), imageUrl: editDraft.imageUrl.trim() }
          : n,
      ),
    );
    setEditingId(null);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode !== 'edit') {
      setEditingId(null);
      setDraggingId(null);
      dragRef.current = null;
    }
  };

  useEffect(() => {
    if (!isEditMode) return undefined;

    const onPaste = (event) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) return;
      }

      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems || clipboardItems.length === 0) return;

      const imageItem = Array.from(clipboardItems).find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      event.preventDefault();
      const reader = new FileReader();
      reader.onload = () => {
        const pastedImageUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!pastedImageUrl) return;

        const p = normalizePoint(lastPoint.x, lastPoint.y);
        const newNode = {
          id: crypto.randomUUID(),
          title: 'Pasted Image',
          note: '',
          imageUrl: pastedImageUrl,
          parentId: null,
          x: p.x,
          y: p.y,
          createdAt: new Date().toISOString(),
        };
        setNodes((prev) => [...prev, newNode]);
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isEditMode, lastPoint.x, lastPoint.y]);

  const connectionLines = nodes
    .filter((child) => child.parentId && nodeMap.has(child.parentId))
    .map((child) => {
      const parent = nodeMap.get(child.parentId);
      const parentCenter = getNodeCenter(parent);
      const childCenter = getNodeCenter(child);
      const start = projectToNodeBorder(parentCenter, childCenter, parent);
      const end = projectToNodeBorder(childCenter, parentCenter, child);

      return {
        key: `${parent.id}-${child.id}`,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
      };
    });

  return (
    <div className="glass-panel vision-board-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <div className="vision-topbar">
        <div className="vision-mode-switch">
          <button
            type="button"
            className={`view-tab ${mode === 'view' ? 'active' : ''}`}
            onClick={() => switchMode('view')}
          >
            보기 모드
          </button>
          <button
            type="button"
            className={`view-tab ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => switchMode('edit')}
          >
            편집 모드
          </button>
        </div>

        {isEditMode ? (
          <>
            <form onSubmit={addRootNode} className="vision-form">
              <input type="text" className="project-input" placeholder="노드 제목" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input type="text" className="project-input" placeholder="텍스트 메모" value={note} onChange={(e) => setNote(e.target.value)} />
              <input type="url" className="project-input" placeholder="이미지 URL (선택)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <input type="file" accept="image/*" className="project-input" onChange={handleNewFileChange} />
              <button type="submit" className="add-btn mini-btn">노드 추가</button>
            </form>
            <p className="vision-help">캔버스를 클릭한 위치에 노드가 생성됩니다. 각 노드의 + 버튼으로 하위 노드를 여러 개 연결할 수 있고, Ctrl+V로 클립보드 이미지도 바로 추가됩니다.</p>
          </>
        ) : (
          <p className="vision-help">보기 모드에서는 설정한 텍스트와 이미지만 표시됩니다.</p>
        )}
      </div>

      <div className="vision-canvas-wrap">
        <div
          ref={canvasRef}
          className={`vision-canvas ${isEditMode ? 'is-edit-mode' : 'is-view-mode'}`}
          onMouseDown={handleCanvasMouseDown}
          style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
        >
          <svg className="vision-links" width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
            {connectionLines.map((line) => (
              <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
            ))}
          </svg>

          {nodes.map((node) => (
            <article
              key={node.id}
              className={`vision-node ${draggingId === node.id ? 'dragging' : ''} ${!node.imageUrl ? 'text-only' : ''}`}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              onMouseDown={(e) => startDrag(e, node)}
            >
              {node.imageUrl && <img src={node.imageUrl} alt={node.title || 'vision node'} className="vision-node-image" draggable={false} />}
              <h3 className="vision-node-title">{node.title || '제목 없음'}</h3>
              {node.note && <p className="vision-node-note">{node.note}</p>}

              {isEditMode && (
                <div className="vision-node-actions">
                  <button type="button" className="vision-node-action" onMouseDown={(e) => e.stopPropagation()} onClick={() => addChildNode(node.id)}>
                    +
                  </button>
                  <button type="button" className="vision-node-action" onMouseDown={(e) => e.stopPropagation()} onClick={() => openEditor(node)}>
                    ✎
                  </button>
                  <button type="button" className="vision-node-action" onMouseDown={(e) => e.stopPropagation()} onClick={() => deleteNodeAndDescendants(node.id)}>
                    -
                  </button>
                </div>
              )}

              {isEditMode && editingId === node.id && (
                <div className="vision-node-editor" onMouseDown={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    className="project-input"
                    placeholder="제목"
                    value={editDraft.title}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="project-input"
                    placeholder="메모"
                    value={editDraft.note}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, note: e.target.value }))}
                  />
                  <input
                    type="url"
                    className="project-input"
                    placeholder="이미지 URL"
                    value={editDraft.imageUrl}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  />
                  <input type="file" accept="image/*" className="project-input" onChange={handleEditFileChange} />
                  <div className="vision-editor-actions">
                    <button type="button" className="save-child-btn" onClick={saveEdit}>저장</button>
                    <button type="button" className="save-child-btn" onClick={() => setEditingId(null)}>닫기</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

