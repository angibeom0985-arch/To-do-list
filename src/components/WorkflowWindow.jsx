import { useRef, useState } from 'react';

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 1100;
const CARD_WIDTH = 220;
const CARD_HEIGHT = 120;

export default function WorkflowWindow({ targetNode, updateNodeFields }) {
  const [draftTitle, setDraftTitle] = useState('');
  const [draggingId, setDraggingId] = useState(null);

  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  if (!targetNode) {
    return (
      <div className="glass-panel" style={{ marginTop: '1rem' }}>
        <h2 style={{ margin: 0 }}>워크플로우 대상을 찾을 수 없습니다.</h2>
      </div>
    );
  }

  const workflowNodes = Array.isArray(targetNode.workflowNodes) ? targetNode.workflowNodes : [];

  const normalizePoint = (x, y) => {
    const nx = Math.max(10, Math.min(x, CANVAS_WIDTH - CARD_WIDTH - 10));
    const ny = Math.max(10, Math.min(y, CANVAS_HEIGHT - CARD_HEIGHT - 10));
    return { x: nx, y: ny };
  };

  const updateWorkflowNodes = (nextNodes) => {
    updateNodeFields(targetNode.id, { workflowNodes: nextNodes });
  };

  const addWorkflowNode = () => {
    const title = draftTitle.trim() || `노드 ${workflowNodes.length + 1}`;
    const offset = workflowNodes.length * 24;
    const point = normalizePoint(120 + offset, 120 + offset);
    const newNode = {
      id: crypto.randomUUID(),
      title,
      x: point.x,
      y: point.y,
    };
    updateWorkflowNodes([...workflowNodes, newNode]);
    setDraftTitle('');
  };

  const updateWorkflowNodeTitle = (id, title) => {
    updateWorkflowNodes(workflowNodes.map((node) => (node.id === id ? { ...node, title } : node)));
  };

  const deleteWorkflowNode = (id) => {
    updateWorkflowNodes(workflowNodes.filter((node) => node.id !== id));
  };

  const startDrag = (e, node) => {
    if (e.button !== 0 || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      id: node.id,
      offsetX: e.clientX - rect.left - (node.x || 0),
      offsetY: e.clientY - rect.top - (node.y || 0),
    };
    setDraggingId(node.id);

    const onMove = (moveEvent) => {
      if (!dragRef.current || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const point = normalizePoint(
        moveEvent.clientX - canvasRect.left - dragRef.current.offsetX,
        moveEvent.clientY - canvasRect.top - dragRef.current.offsetY,
      );

      updateWorkflowNodes(
        workflowNodes.map((item) =>
          item.id === dragRef.current.id ? { ...item, x: point.x, y: point.y } : item,
        ),
      );
    };

    const onUp = () => {
      setDraggingId(null);
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="glass-panel workflow-panel animate-fade-in" style={{ marginTop: '1rem' }}>
      <div className="workflow-header">
        <h2 style={{ margin: 0 }}>워크플로우: {targetNode.title}</h2>
        <div className="workflow-controls">
          <input
            type="text"
            className="project-input"
            placeholder="새 노드 제목..."
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addWorkflowNode();
              }
            }}
          />
          <button type="button" className="add-btn mini-btn" onClick={addWorkflowNode}>
            노드 추가
          </button>
        </div>
      </div>

      <div className="workflow-canvas-wrap">
        <div ref={canvasRef} className="workflow-canvas" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}>
          {workflowNodes.map((node) => (
            <div
              key={node.id}
              className={`workflow-node ${draggingId === node.id ? 'dragging' : ''}`}
              style={{ left: `${node.x || 40}px`, top: `${node.y || 40}px` }}
              onMouseDown={(e) => startDrag(e, node)}
            >
              <input
                type="text"
                className="transparent-input"
                value={node.title}
                onChange={(e) => updateWorkflowNodeTitle(node.id, e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ width: '100%', fontWeight: 600 }}
              />
              <button
                type="button"
                className="delete-btn workflow-delete"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => deleteWorkflowNode(node.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

