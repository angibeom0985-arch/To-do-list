import React, { useState } from 'react';

const COLOR_PALETTE = {
  default: { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)' },
  blue: { main: '#3b82f6', light: 'rgba(59, 130, 246, 0.2)' },
  green: { main: '#10b981', light: 'rgba(16, 185, 129, 0.2)' },
  amber: { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.2)' },
  rose: { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.2)' }
};

const DAY_LETTERS = ['일', '월', '화', '수', '목', '금', '토'];

// Recursively calculates completion based on depth-4 children
const calculateProgress = (node) => {
  let leaves = 0;
  let completed = 0;

  const traverse = (n) => {
    if (n.depth === 4) {
      leaves++;
      if (n.completed) completed++;
    } else if (n.children && n.children.length > 0) {
      n.children.forEach(traverse);
    }
  };
  traverse(node);

  if (leaves === 0) return 0;
  return Math.round((completed / leaves) * 100);
};

export default function ProjectDashboard({ treeNodes, addRootProject, addChildNode, deleteNode, updateNodeFields, toggleDayAssignment }) {
  const [newProjectTitle, setNewProjectTitle] = useState('');

  const handleAddRoot = (e) => {
    e.preventDefault();
    if (newProjectTitle.trim()) {
      addRootProject(newProjectTitle.trim());
      setNewProjectTitle('');
    }
  };

  return (
    <div className="project-dashboard glass-panel">
      <div className="dashboard-header">
        <h2>📁 프로젝트 아웃라이너</h2>
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

      <div className="tree-container">
        {treeNodes.length === 0 ? (
          <p className="empty-projects">기획된 프로젝트가 없습니다. 4단계 아웃라이너로 체계적으로 기획해보세요!</p>
        ) : (
          treeNodes.map(node => (
            <TreeItem 
              key={node.id} 
              node={node} 
              addChildNode={addChildNode}
              deleteNode={deleteNode}
              updateNodeFields={updateNodeFields}
              toggleDayAssignment={toggleDayAssignment}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TreeItem({ node, addChildNode, deleteNode, updateNodeFields, toggleDayAssignment }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newChildTitle, setNewChildTitle] = useState('');
  const [showMemo, setShowMemo] = useState(false);

  const handleAddChild = (e) => {
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    e.preventDefault();
    
    if (newChildTitle.trim()) {
      addChildNode(node.id, node.depth, newChildTitle.trim());
      setNewChildTitle('');
      setIsAdding(false);
      updateNodeFields(node.id, { isExpanded: true });
    } else {
      setIsAdding(false);
    }
  };

  const getPlaceholder = () => {
    if (node.depth === 1) return '세부 프로젝트 추가...';
    if (node.depth === 2) return '계획 추가...';
    if (node.depth === 3) return '세부 계획 추가...';
    return '';
  };

  const isLeaf = node.depth === 4;
  const projectColor = node.color || 'default';
  const customStyles = node.depth === 1 ? {
    '--primary': COLOR_PALETTE[projectColor].main,
    '--primary-light': COLOR_PALETTE[projectColor].light
  } : {};

  return (
    <div className={`tree-item depth-${node.depth}`} style={customStyles}>
      <div className={`tree-item-content ${isLeaf && node.completed ? 'completed' : ''}`}>
        
        {/* Expand / Collapse arrow */}
        {!isLeaf ? (
          <button 
            className={`expand-btn ${node.isExpanded ? 'expanded' : ''}`}
            onClick={() => updateNodeFields(node.id, { isExpanded: !node.isExpanded })}
          >
            ▶
          </button>
        ) : (
          <label className="task-checkbox-wrapper mini-box leaf-checkbox">
            <input type="checkbox" checked={node.completed} onChange={() => updateNodeFields(node.id, { completed: !node.completed })} />
            <span className="task-checkbox-custom mini-box"></span>
          </label>
        )}

        {/* Title */}
        <span className="tree-title">
          {node.title}
          {isLeaf && node.priority && node.priority !== 'normal' && (
            <span className={`priority-badge ${node.priority}`} style={{ marginLeft: '0.5rem' }}>
              {node.priority === 'urgent' && '⏰ 급함'}
              {node.priority === 'important' && '💰 중요'}
              {node.priority === 'both' && '🔥 집중'}
            </span>
          )}
        </span>

        {/* Depth 1 Specifics */}
        {node.depth === 1 && (
          <div className="tree-depth1-extras">
            <button 
              className="expand-btn" 
              onClick={() => setShowMemo(!showMemo)}
              title="프로젝트 참고자료 메모"
              style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}
            >
              📝
            </button>
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
            <div className="mini-ring">
              <div className="mini-ring-fill" style={{ '--angle': `${calculateProgress(node) * 3.6}deg` }}></div>
            </div>
            <span className="project-pct">{calculateProgress(node)}%</span>
          </div>
        )}

        {/* Depth 4 Contexts */}
        {isLeaf && (
          <div className="leaf-assignments">
            <select 
              value={node.priority || 'normal'} 
              onChange={(e) => updateNodeFields(node.id, { priority: e.target.value })}
              className="mini-select"
            >
              <option value="normal">일반</option>
              <option value="urgent">⏰ 급함</option>
              <option value="important">💰 중요</option>
              <option value="both">🔥 집중</option>
            </select>
            
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

        <div className="tree-actions">
          {!isLeaf && (
            <button className="add-child-btn" onClick={() => setIsAdding(!isAdding)}>+</button>
          )}
          <button className="delete-node-btn" onClick={() => deleteNode(node.id)}>×</button>
        </div>
      </div>

      {/* Actions */}
      <div className="tree-actions-container">
        {isAdding && (
          <div className="tree-add-drawer" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="tree-indent-line"></span>
            <input 
              autoFocus
              type="text" 
              className="tree-add-input" 
              placeholder={getPlaceholder()}
              value={newChildTitle}
              onChange={(e) => setNewChildTitle(e.target.value)}
              onKeyDown={handleAddChild}
              onBlur={() => setIsAdding(false)}
            />
            <button 
              onMouseDown={(e) => { e.preventDefault(); handleAddChild(e); }} 
              className="save-child-btn"
            >
              저장
            </button>
          </div>
        )}

        {showMemo && node.depth === 1 && (
          <div className="tree-add-drawer" style={{ marginBottom: '0.5rem' }}>
            <span className="tree-indent-line"></span>
            <textarea 
              className="memo-textarea tree-add-input" 
              placeholder="이 프로젝트에 필요한 링크나 참고자료를 자유롭게 적어두세요..."
              value={node.memo || ''}
              onChange={(e) => updateNodeFields(node.id, { memo: e.target.value })}
              style={{ minHeight: '80px', width: '100%', resize: 'vertical' }}
            />
          </div>
        )}
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && node.isExpanded && (
        <div className="tree-children">
          <div className="tree-indent-line"></div>
          <div className="tree-children-list">
            {node.children.map(child => (
              <TreeItem 
                key={child.id} 
                node={child} 
                addChildNode={addChildNode}
                deleteNode={deleteNode}
                updateNodeFields={updateNodeFields}
                toggleDayAssignment={toggleDayAssignment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
