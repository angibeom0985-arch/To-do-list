import React, { useState } from 'react';

const COLOR_PALETTE = {
  default: { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)' },
  blue: { main: '#3b82f6', light: 'rgba(59, 130, 246, 0.2)' },
  green: { main: '#10b981', light: 'rgba(16, 185, 129, 0.2)' },
  amber: { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.2)' },
  rose: { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.2)' }
};

const DAY_LETTERS = ['월', '화', '수', '목', '금', '토', '일'];

// Recursively calculates completion based on depth >= 2
const calculateProgress = (node) => {
  let tasks = 0;
  let completed = 0;

  const traverse = (n) => {
    if (n.depth > 1) {
      tasks++;
      if (n.completed) completed++;
    }
    if (n.children && n.children.length > 0) {
      n.children.forEach(traverse);
    }
  };
  traverse(node);

  if (tasks === 0) return 0;
  return Math.round((completed / tasks) * 100);
};

const childCardsFromNode = (children, refsMap) => {
  if (!Array.isArray(children)) return [];
  return children
    .map((child) => refsMap[child.id])
    .filter(Boolean);
};

export default function ProjectDashboard({
  treeNodes,
  addRootProject,
  addChildNode,
  deleteNode,
  updateNodeFields,
  toggleDayAssignment,
  moveNode,
  densityScale = 1,
}) {
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState('after');

  const handleAddRoot = (e) => {
    e.preventDefault();
    if (newProjectTitle.trim()) {
      addRootProject(newProjectTitle.trim());
      setNewProjectTitle('');
    }
  };

  const handleNodeDragStart = (nodeId) => {
    setDraggedNodeId(nodeId);
  };

  const handleNodeDragOver = (nodeId, position) => {
    if (draggedNodeId && draggedNodeId !== nodeId) {
      setDragOverNodeId(nodeId);
      setDragOverPosition(position);
    }
  };

  const handleNodeDrop = (targetId, position) => {
    if (draggedNodeId && draggedNodeId !== targetId) {
      moveNode(draggedNodeId, targetId, position);
    }
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    setDragOverPosition('after');
  };

  const handleNodeDragEnd = () => {
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    setDragOverPosition('after');
  };

  const handleRootDrop = () => {
    if (draggedNodeId) {
      moveNode(draggedNodeId, null, 'root');
    }
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    setDragOverPosition('after');
  };

  return (
    <div className="project-dashboard glass-panel" style={{ overflow: 'hidden', '--project-density-scale': densityScale }}>
      <div className="dashboard-header" style={{ marginBottom: '0' }}>
        <h2>📁 프로젝트</h2>
        <form onSubmit={handleAddRoot} className="project-add-form">
          <input
            type="text"
            placeholder="상위 프로젝트 생성..."
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            className="project-input"
          />
          <button type="submit" className="add-btn mini-btn">저장</button>
        </form>
      </div>

      <div className="mindmap-canvas">
        {treeNodes.length === 0 ? (
          <p className="empty-projects" style={{ color: 'var(--text-muted)' }}>기획된 프로젝트가 없습니다. 우측 메뉴로 새 마인드맵을 시작하세요!</p>
        ) : (
          treeNodes.map(node => (
            <TreeItem
              key={node.id}
              node={node}
              addChildNode={addChildNode}
              deleteNode={deleteNode}
              updateNodeFields={updateNodeFields}
              toggleDayAssignment={toggleDayAssignment}
              draggedNodeId={draggedNodeId}
              dragOverNodeId={dragOverNodeId}
              dragOverPosition={dragOverPosition}
              onNodeDragStart={handleNodeDragStart}
              onNodeDragOver={handleNodeDragOver}
              onNodeDrop={handleNodeDrop}
              onNodeDragEnd={handleNodeDragEnd}
            />
          ))
        )}
        {draggedNodeId && (
          <div
            className="root-drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleRootDrop();
            }}
          >
            여기에 놓으면 루트 맨 아래로 이동
          </div>
        )}
      </div>
    </div>
  );
}

function TreeItem({
  node,
  addChildNode,
  deleteNode,
  updateNodeFields,
  toggleDayAssignment,
  draggedNodeId,
  dragOverNodeId,
  dragOverPosition,
  onNodeDragStart,
  onNodeDragOver,
  onNodeDrop,
  onNodeDragEnd,
  parentChildCardRef,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newChildTitle, setNewChildTitle] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const cancelAddChild = React.useCallback(() => {
    setNewChildTitle('');
    setIsAdding(false);
  }, []);

  const parentCardRef = React.useRef(null);
  const childrenColRef = React.useRef(null);
  const childCardRefs = React.useRef({});

  // Connector line refs (direct DOM manipulation to avoid re-render loops)
  const hOutRef = React.useRef(null);
  const vSpineRef = React.useRef(null);
  const hInRefs = React.useRef([]);

  const hideConnectors = React.useCallback(() => {
    if (hOutRef.current) hOutRef.current.style.display = 'none';
    if (vSpineRef.current) vSpineRef.current.style.display = 'none';
    hInRefs.current.forEach((lineEl) => {
      if (lineEl) lineEl.style.display = 'none';
    });
  }, []);

  const updateConnectors = React.useCallback(() => {
    const parentCard = parentCardRef.current;
    const childrenCol = childrenColRef.current;
    if (!parentCard || !childrenCol) {
      hideConnectors();
      return;
    }

    const orderedChildren = Array.isArray(node.children) ? node.children : [];
    const childCards = orderedChildren
      .map((child) => childCardRefs.current[child.id])
      .filter(Boolean);
    if (childCards.length === 0) {
      hideConnectors();
      return;
    }

    const colRect = childrenCol.getBoundingClientRect();
    const parentRect = parentCard.getBoundingClientRect();

    const parentCenterY = parentRect.top + parentRect.height / 2 - colRect.top;
    const hOutRight = colRect.left - parentRect.right;

    const computedStyle = getComputedStyle(childrenCol);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

    // Horizontal line out of parent
    if (hOutRef.current) {
      const s = hOutRef.current.style;
      s.top = `${parentCenterY - 1}px`;
      s.left = `${-Math.abs(hOutRight)}px`;
      s.width = `${Math.abs(hOutRight)}px`;
      s.height = '2px';
      s.display = '';
    }

    // Compute child centers
    const childCenters = childCards.map(card => {
      const r = card.getBoundingClientRect();
      return r.top + r.height / 2 - colRect.top;
    });

    const spineStart = Math.min(parentCenterY, ...childCenters);
    const spineEnd = Math.max(parentCenterY, ...childCenters);

    // Vertical spine
    if (vSpineRef.current) {
      const spineHeight = spineEnd - spineStart;
      if (spineHeight > 0.5) {
        const s = vSpineRef.current.style;
        s.top = `${spineStart}px`;
        s.left = '0px';
        s.height = `${spineHeight}px`;
        s.width = '2px';
        s.display = '';
      } else {
        vSpineRef.current.style.display = 'none';
      }
    }

    // Horizontal lines into children
    childCenters.forEach((cy, idx) => {
      const el = hInRefs.current[idx];
      if (el) {
        const s = el.style;
        s.top = `${cy - 1}px`;
        s.left = '0px';
        s.width = `${paddingLeft}px`;
        s.height = '2px';
        s.display = '';
      }
    });

    // Hide extra refs
    for (let i = childCenters.length; i < hInRefs.current.length; i++) {
      if (hInRefs.current[i]) {
        hInRefs.current[i].style.display = 'none';
      }
    }
  }, [hideConnectors, node.children]);

  React.useEffect(() => {
    const childrenCol = childrenColRef.current;
    const parentCard = parentCardRef.current;
    if (!childrenCol || !parentCard) return;

    // Initial update after a frame so layout is computed
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateConnectors);
    });

    // Observe for size changes
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateConnectors);
    });
    ro.observe(childrenCol);
    ro.observe(parentCard);
    childCardsFromNode(node.children, childCardRefs.current).forEach((cardEl) => ro.observe(cardEl));

    const mo = new MutationObserver(() => {
      requestAnimationFrame(updateConnectors);
    });
    mo.observe(childrenCol, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      mo.disconnect();
      ro.disconnect();
    };
  }, [updateConnectors, node.children, node.isExpanded, isAdding, draggedNodeId]);

  React.useLayoutEffect(() => {
    if (!showChildrenCol) {
      hideConnectors();
      return;
    }
    updateConnectors();
  });

  React.useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateConnectors);
    });
    return () => cancelAnimationFrame(rafId);
  }, [updateConnectors, node.children, draggedNodeId]);

  React.useEffect(() => {
    if (!isAdding) return undefined;

    const handleGlobalEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      cancelAddChild();
    };

    window.addEventListener('keydown', handleGlobalEscape);
    return () => window.removeEventListener('keydown', handleGlobalEscape);
  }, [cancelAddChild, isAdding]);

  const submitAddChild = () => {
    if (newChildTitle.trim()) {
      addChildNode(node.id, node.depth, newChildTitle.trim());
      setNewChildTitle('');
    } else {
      setIsAdding(false);
    }
  };

  const handleAddChildKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'NumpadEnter') {
      e.preventDefault();
      submitAddChild();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelAddChild();
    }
  };

  const handleCancelAddChild = (e) => {
    e.preventDefault();
    cancelAddChild();
  };

  const getNodeMemos = () => {
    if (Array.isArray(node.memos)) return node.memos;
    if (node.memo?.trim()) return [node.memo];
    return [];
  };

  const updateMemos = (memos) => {
    updateNodeFields(node.id, { memos, memo: '' });
  };

  const addMemoItem = () => {
    updateMemos([...getNodeMemos(), '']);
  };

  const updateMemoItem = (index, value) => {
    const next = [...getNodeMemos()];
    next[index] = value;
    updateMemos(next);
  };

  const removeMemoItem = (index) => {
    updateMemos(getNodeMemos().filter((_, i) => i !== index));
  };

  const renderLinkedText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return String(text).split(urlRegex).map((part, idx) => {
      if (/^https?:\/\/[^\s]+$/i.test(part)) {
        return (
          <a
            key={`memo-link-${idx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <React.Fragment key={`memo-text-${idx}`}>{part}</React.Fragment>;
    });
  };

  const getPlaceholder = () => {
    if (node.depth === 1) return '세부 추가...';
    if (node.depth === 2) return '세부 추가...';
    if (node.depth === 3) return '세부 추가...';
    return '세부 추가...';
  };

  const isTaskNode = node.depth >= 2;
  const projectColor = node.color || 'default';
  const customStyles = node.depth === 1 ? {
    '--primary': COLOR_PALETTE[projectColor].main,
    '--primary-light': COLOR_PALETTE[projectColor].light
  } : {};

  const hasChildren = node.children && node.children.length > 0;
  const childCount = hasChildren ? node.children.length : 0;
  const getDropPosition = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const ratio = y / rect.height;
    if (ratio < 0.28) return 'before';
    if (ratio > 0.72) return 'after';
    return 'inside';
  };

  const showChildrenCol = (hasChildren && node.isExpanded) || isAdding;

  // Ensure hInRefs array has enough slots
  if (hInRefs.current.length < childCount) {
    hInRefs.current.length = childCount;
  }

  return (
    <div className={`mindmap-group depth-${node.depth} ${hasChildren && node.isExpanded ? 'has-children' : ''}`} style={customStyles}>

      <div className="mindmap-node-anchor">
        <div
          ref={(el) => {
            parentCardRef.current = el;
            if (parentChildCardRef) parentChildCardRef(el);
          }}
          className={`mindmap-node-card ${isTaskNode && node.completed ? 'completed' : ''} ${draggedNodeId === node.id ? 'dragging' : ''} ${dragOverNodeId === node.id ? `drag-over drop-${dragOverPosition}` : ''}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            onNodeDragStart(node.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            onNodeDragOver(node.id, getDropPosition(e));
          }}
          onDrop={(e) => {
            e.preventDefault();
            onNodeDrop(node.id, getDropPosition(e));
          }}
          onDragEnd={onNodeDragEnd}
        >

          {/* Header Row: Title, Checkbox, Actions */}
          <div className="mm-header">
            {showDetails && isTaskNode && (
              <label className="task-checkbox-wrapper mini-box leaf-checkbox" style={{ marginRight: '0.4rem' }}>
                <input type="checkbox" checked={node.completed || false} onChange={() => updateNodeFields(node.id, { completed: !node.completed })} />
                <span className="task-checkbox-custom mini-box"></span>
              </label>
            )}

            <span className="tree-title">
              {node.title}
              {` (${calculateProgress(node)}%)`}
            </span>

            <div className="mm-actions">
              <button
                className="add-child-btn detail-toggle-btn"
                onClick={() => setShowDetails(!showDetails)}
                title="세부 조정"
              >
                {showDetails ? '닫기' : '세부'}
              </button>
              <button className="add-child-btn" onClick={() => setIsAdding(!isAdding)} title="하위 항목 추가">+</button>
              <button className="delete-node-btn" onClick={() => deleteNode(node.id)} title="삭제">×</button>
            </div>
          </div>

          {getNodeMemos().length > 0 && (
            <div className="node-memo-list-preview">
              {getNodeMemos().map((memoText, index) => (
                <p key={`${node.id}-memo-preview-${index}`} className="node-memo-preview">
                  {renderLinkedText(memoText)}
                </p>
              ))}
            </div>
          )}

          {/* Body: Depth 1 specific UI */}
          {showDetails && node.depth === 1 && (
            <div className="mm-depth1-extras">
              <div className="color-picker-mini">
                {Object.keys(COLOR_PALETTE).map(c => (
                  <div
                    key={c}
                    onClick={() => updateNodeFields(node.id, { color: c })}
                    style={{ backgroundColor: COLOR_PALETTE[c].main }}
                    className={`color-dot ${projectColor === c ? 'active' : ''}`}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Body: Priority and Day Assignment */}
          {showDetails && isTaskNode && (
            <div className="mm-assignments">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                {node.priority && node.priority !== 'normal' && (
                  <span className={`priority-badge ${node.priority}`}>
                    {node.priority === 'urgent' && '⏰ 급함'}
                    {node.priority === 'important' && '💰 중요'}
                    {node.priority === 'both' && '🔥 집중'}
                  </span>
                )}
                <select
                  value={node.priority || 'normal'}
                  onChange={(e) => updateNodeFields(node.id, { priority: e.target.value })}
                  className="mini-select"
                >
                  <option value="normal">우선순위</option>
                  <option value="urgent">⏰ 급함</option>
                  <option value="important">💰 중요</option>
                  <option value="both">🔥 집중</option>
                </select>
              </div>

              <div className="day-toggles">
                {[1, 2, 3, 4, 5, 6, 0].map(d => {
                  const isActive = (node.assignedDays || []).includes(d);
                  return (
                    <button
                      key={d}
                      className={`day-pill ${isActive ? 'active' : ''}`}
                      onClick={() => toggleDayAssignment(node.id, d)}
                      title={`${DAY_LETTERS[d]}요일에 복사 배정`}
                    >
                      {DAY_LETTERS[d]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showDetails && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                className="expand-btn"
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?workflowNode=${node.id}`;
                  window.open(url, '_blank', 'width=1280,height=860');
                }}
                title="워크플로우"
                style={{ marginRight: '0.45rem' }}
              >
                워크플로우
              </button>
              <button className="expand-btn" onClick={() => setShowMemo(!showMemo)} title="메모">
                {showMemo ? '메모 닫기' : '메모'}
              </button>
            </div>
          )}

          {/* Expand/Collapse Toggle Button */}
          {showDetails && hasChildren && (
            <button
              className={`mm-expand-btn ${node.isExpanded ? 'expanded' : ''}`}
              onClick={() => updateNodeFields(node.id, { isExpanded: !node.isExpanded })}
            >
              {node.isExpanded ? '➖ 접기' : `➕ 펴기 (${node.children.length})`}
            </button>
          )}
        </div>

        {/* Memo Drawer stays under the parent card */}
        <div className="mm-drawer-container">
          {showDetails && showMemo && (
            <div className="tree-add-drawer mm-drawer">
              <div className="memo-link-editor">
                {getNodeMemos().map((memoText, index) => (
                  <div key={`${node.id}-memo-edit-${index}`} className="memo-item-editor">
                    <textarea
                      className="memo-textarea tree-add-input"
                      placeholder="메모를 입력하세요. URL은 자동으로 하이퍼링크로 표시됩니다."
                      value={memoText}
                      onChange={(e) => updateMemoItem(index, e.target.value)}
                      style={{ minHeight: '80px', width: '100%', resize: 'vertical', marginTop: '0.5rem' }}
                    />
                    <button type="button" className="memo-item-remove-btn" onClick={() => removeMemoItem(index)}>
                      메모 삭제
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="save-child-btn memo-link-add-btn"
                  onClick={addMemoItem}
                >
                  메모 추가
                </button>
                <button
                  type="button"
                  className="memo-close-btn"
                  onClick={() => setShowMemo(false)}
                >
                  메모 닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children Col & Add Child Drawer */}
      {showChildrenCol ? (
        <div className="mindmap-children-col" ref={childrenColRef}>
          {/* Connector line elements (positioned via direct DOM manipulation) */}
          <div ref={hOutRef} className="connector-line horizontal-out" style={{ position: 'absolute', display: 'none' }} />
          <div ref={vSpineRef} className="connector-line vertical-spine" style={{ position: 'absolute', display: 'none' }} />
          {Array.from({ length: childCount }).map((_, idx) => (
            <div
              key={`h-in-${idx}`}
              ref={(el) => { hInRefs.current[idx] = el; }}
              className="connector-line horizontal-in"
              style={{ position: 'absolute', display: 'none' }}
            />
          ))}

          {hasChildren && node.isExpanded && node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              addChildNode={addChildNode}
              deleteNode={deleteNode}
              updateNodeFields={updateNodeFields}
              toggleDayAssignment={toggleDayAssignment}
              draggedNodeId={draggedNodeId}
              dragOverNodeId={dragOverNodeId}
              dragOverPosition={dragOverPosition}
              onNodeDragStart={onNodeDragStart}
              onNodeDragOver={onNodeDragOver}
              onNodeDrop={onNodeDrop}
              onNodeDragEnd={onNodeDragEnd}
              parentChildCardRef={(el) => { childCardRefs.current[child.id] = el; }}
            />
          ))}

          {/* Add Drawer acts as a temporary child node to the right! */}
          {isAdding && (
            <div className="mindmap-group">
              <div className="mindmap-node-anchor">
                <div className="mindmap-node-card" style={{ padding: '0.6rem 1rem', minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <input
                      autoFocus
                      type="text"
                      className="tree-add-input"
                      placeholder={getPlaceholder()}
                      value={newChildTitle}
                      onChange={(e) => setNewChildTitle(e.target.value)}
                      onKeyDown={handleAddChildKeyDown}
                      style={{ flex: 1, padding: '0.4rem', border: 'none', borderBottom: '1px solid var(--primary)', background: 'transparent', color: 'var(--text-main)', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={submitAddChild}
                      className="save-child-btn mini-btn"
                      style={{ padding: '0.3rem 0.6rem' }}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddChild}
                      className="save-child-btn mini-btn"
                      style={{ padding: '0.3rem 0.6rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
