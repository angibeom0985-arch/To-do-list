import React from 'react';

export default function ManagePage({ treeNodes, addRootProject, addChildNode, updateNodeFields, deleteNode }) {
  const handleAddRoot = () => {
    addRootProject('새 프로젝트');
  };

  return (
    <div className="manage-page-container glass-panel animate-fade-in">
      <div className="manage-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>⚙️ 대량 편집 모드</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          이름 수정과 + / - 버튼으로 항목 추가, 삭제를 바로 처리할 수 있습니다.
        </p>

        <div style={{ marginTop: '0.8rem' }}>
          <button type="button" className="add-btn mini-btn" onClick={handleAddRoot}>
            + 상위 프로젝트 추가
          </button>
        </div>
      </div>

      <div className="manage-tree-list">
        {treeNodes.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            설정된 프로젝트가 없습니다.
          </p>
        ) : (
          treeNodes.map((node) => (
            <ManageNode
              key={node.id}
              node={node}
              addChildNode={addChildNode}
              updateNodeFields={updateNodeFields}
              deleteNode={deleteNode}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ManageNode({ node, addChildNode, updateNodeFields, deleteNode }) {
  const getPrefix = () => {
    const depthIcons = ['📁', '📂', '🧩', '📝', '🔹', '🔸', '▫️', '◽'];
    return depthIcons[(Math.max(node.depth, 1) - 1) % depthIcons.length];
  };

  const handleAddChild = () => {
    addChildNode(node.id, node.depth, '새 항목');
  };

  return (
    <div className={`manage-node-item depth-${node.depth}`} style={{ display: 'flex', flexDirection: 'column', marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem', borderRadius: '8px' }}>
        {node.depth > 1 && (
          <div style={{ width: `${(node.depth - 1) * 20}px`, borderBottom: '1px dashed var(--glass-border)', height: '1px', marginLeft: '0.5rem' }} />
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
            fontWeight: node.depth === 1 ? '600' : '400',
          }}
        />

        <button onClick={handleAddChild} className="add-child-btn" title="하위 항목 추가">
          +
        </button>

        <button
          onClick={() => deleteNode(node.id)}
          className="delete-btn mini"
          title="삭제"
          style={{ opacity: 0.75 }}
        >
          -
        </button>
      </div>

      {node.children && node.children.length > 0 && (
        <div style={{ paddingLeft: '0.5rem' }}>
          {node.children.map((child) => (
            <ManageNode
              key={child.id}
              node={child}
              addChildNode={addChildNode}
              updateNodeFields={updateNodeFields}
              deleteNode={deleteNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
