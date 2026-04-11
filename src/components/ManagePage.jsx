import React from 'react';

export default function ManagePage({ treeNodes, updateNodeFields, deleteNode }) {
  return (
    <div className="manage-page-container glass-panel animate-fade-in">
      <div className="manage-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>⚙️ 대량 편집 모드</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          모든 항목의 이름을 즉각적으로 변경할 수 있습니다. 칸을 클릭하고 글씨를 치면 별도의 저장 없이 즉시 반영됩니다.
        </p>
      </div>

      <div className="manage-tree-list">
        {treeNodes.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            수정할 프로젝트가 없습니다.
          </p>
        ) : (
          treeNodes.map(node => (
            <ManageNode 
              key={node.id} 
              node={node} 
              updateNodeFields={updateNodeFields}
              deleteNode={deleteNode}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ManageNode({ node, updateNodeFields, deleteNode }) {
  const getPrefix = () => {
    if (node.depth === 1) return '📁';
    if (node.depth === 2) return '📂';
    if (node.depth === 3) return '📄';
    return '📋';
  };

  return (
    <div className={`manage-node-item depth-${node.depth}`} style={{ display: 'flex', flexDirection: 'column', marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem', borderRadius: '8px' }}>
        
        {/* Indent Lines */}
        {node.depth > 1 && (
          <div style={{ width: `${(node.depth - 1) * 20}px`, borderBottom: '1px dashed var(--glass-border)', height: '1px', marginLeft: '0.5rem' }}></div>
        )}

        <span style={{ fontSize: '1.1rem' }}>{getPrefix()}</span>
        
        <input 
          type="text"
          className="transparent-input"
          value={node.title}
          onChange={(e) => updateNodeFields(node.id, { title: e.target.value })}
          placeholder="항목 이름..."
          style={{ 
            flex: 1, 
            fontSize: node.depth === 1 ? '1.1rem' : '0.95rem',
            fontWeight: node.depth === 1 ? '600' : '400' 
          }}
        />

        <button 
          onClick={() => deleteNode(node.id)} 
          className="delete-btn mini" 
          title="삭제"
          style={{ opacity: 0.5 }}
        >
          ×
        </button>
      </div>

      {/* Children rendering */}
      {node.children && node.children.length > 0 && (
        <div style={{ paddingLeft: '0.5rem' }}>
          {node.children.map(child => (
            <ManageNode 
              key={child.id} 
              node={child} 
              updateNodeFields={updateNodeFields}
              deleteNode={deleteNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
