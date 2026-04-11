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

export default function ProjectDashboard({ treeNodes, addRootProject, addChildNode, deleteNode, updateNodeFields, toggleDayAssignment, moveNode }) {
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
    <div className="project-dashboard glass-panel" style={{ overflow: 'hidden' }}>
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
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newChildTitle, setNewChildTitle] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showMemo, setShowMemo] = useState(false);

  const submitAddChild = () => {
    if (newChildTitle.trim()) {
      addChildNode(node.id, node.depth, newChildTitle.trim());
      setNewChildTitle('');
      // Do not setIsAdding(false) so the user can continuously add multiple children
    } else {
      setIsAdding(false);
    }
  };

  const handleAddChildKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'NumpadEnter') {
      e.preventDefault();
      submitAddChild();
    }
  };

  const handleCancelAddChild = (e) => {
    e.preventDefault();
    setIsAdding(false);
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
  const getDropPosition = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const ratio = y / rect.height;
    if (ratio < 0.28) return 'before';
    if (ratio > 0.72) return 'after';
    return 'inside';
  };

  return (
    <div className={`mindmap-group depth-${node.depth} ${hasChildren && node.isExpanded ? 'has-children' : ''}`} style={customStyles}>

      <div className="mindmap-node-anchor">
        <div
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

          {/* Expand/Collapse Toggle Button (floating at bottom of card, or right side) */}
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children Col & Add Child Drawer */}
      {(hasChildren && node.isExpanded) || isAdding ? (
        <div className="mindmap-children-col">
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


