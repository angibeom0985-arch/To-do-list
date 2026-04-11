import { useState, useEffect } from 'react';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import ProjectDashboard from './components/ProjectDashboard';
import DailyView from './components/DailyView';
import MemoPad from './components/MemoPad';
import ManagePage from './components/ManagePage';
import VisionBoard from './components/VisionBoard';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const weekOrder = [1, 2, 3, 4, 5, 6, 0];

function App() {
  const [treeNodes, setTreeNodes] = useLocalStorage('projects-v2', []);
  const [globalMemos, setGlobalMemos] = useLocalStorage('global-memos-list', []);
  const [visionItems, setVisionItems] = useLocalStorage('vision-board-items', []);
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [theme, setTheme] = useLocalStorage('app-theme', 'dark');
  const [currentView, setCurrentView] = useState('main'); // 'main' | 'vision' | 'manage'

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  const mapNodes = (nodes, targetId, updateFn) => {
    return nodes.map((node) => {
      if (node.id === targetId) return updateFn(node);
      if (node.children) return { ...node, children: mapNodes(node.children, targetId, updateFn) };
      return node;
    });
  };

  const filterNodes = (nodes, targetId) => {
    return nodes
      .filter((node) => node.id !== targetId)
      .map((node) => ({ ...node, children: node.children ? filterNodes(node.children, targetId) : [] }));
  };

  const _addChild = (nodes, parentId, newNode) => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: [...(node.children || []), newNode], isExpanded: true };
      }
      if (node.children) {
        return { ...node, children: _addChild(node.children, parentId, newNode) };
      }
      return node;
    });
  };

  const findNodeById = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children?.length) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const containsNodeId = (node, targetId) => {
    if (!node?.children?.length) return false;
    for (const child of node.children) {
      if (child.id === targetId || containsNodeId(child, targetId)) return true;
    }
    return false;
  };

  const removeNodeById = (nodes, targetId) => {
    let removedNode = null;

    const walk = (arr) => {
      const next = [];
      for (const item of arr) {
        if (item.id === targetId) {
          removedNode = item;
          continue;
        }
        const nextChildren = item.children?.length ? walk(item.children) : item.children || [];
        next.push({ ...item, children: nextChildren });
      }
      return next;
    };

    return { nextNodes: walk(nodes), removedNode };
  };

  const rebalanceDepth = (node, depth) => {
    return {
      ...node,
      depth,
      children: (node.children || []).map((child) => rebalanceDepth(child, depth + 1)),
    };
  };

  const insertRelativeToTarget = (nodes, targetId, insertNode, position) => {
    let inserted = false;

    const walk = (arr) => {
      const next = [];
      for (const item of arr) {
        const nextChildren = item.children?.length ? walk(item.children) : item.children || [];
        const nextItem = { ...item, children: nextChildren };

        if (item.id === targetId && position === 'before') {
          next.push(insertNode);
          inserted = true;
        }

        if (item.id === targetId && position === 'inside') {
          next.push({
            ...nextItem,
            isExpanded: true,
            children: [...(nextItem.children || []), insertNode],
          });
          inserted = true;
          continue;
        }

        next.push(nextItem);

        if (item.id === targetId && position === 'after') {
          next.push(insertNode);
          inserted = true;
        }
      }
      return next;
    };

    const nextNodes = walk(nodes);
    return { nextNodes, inserted };
  };

  const addRootProject = (title) => {
    const newNode = {
      id: crypto.randomUUID(),
      title,
      depth: 1,
      color: 'default',
      isExpanded: true,
      children: [],
      memos: [],
      createdAt: new Date().toISOString(),
    };
    setTreeNodes((prev) => [...prev, newNode]);
  };

  const addChildNode = (parentId, parentDepth, title) => {
    const newNode = {
      id: crypto.randomUUID(),
      title,
      depth: parentDepth + 1,
      isExpanded: true,
      children: [],
      memos: [],
      ...(parentDepth + 1 === 4 ? { completed: false, priority: 'normal', assignedDays: [] } : {}),
      createdAt: new Date().toISOString(),
    };
    setTreeNodes((prev) => _addChild(prev, parentId, newNode));
  };

  const deleteNode = (nodeId) => {
    setTreeNodes((prev) => filterNodes(prev, nodeId));
  };

  const updateNodeFields = (nodeId, fieldsObj) => {
    setTreeNodes((prev) => mapNodes(prev, nodeId, (node) => ({ ...node, ...fieldsObj })));
  };

  const toggleDayAssignment = (nodeId, dayIndex) => {
    setTreeNodes((prev) =>
      mapNodes(prev, nodeId, (node) => {
        const days = node.assignedDays || [];
        const newDays = days.includes(dayIndex) ? days.filter((d) => d !== dayIndex) : [...days, dayIndex];
        return { ...node, assignedDays: newDays };
      }),
    );
  };

  const moveNode = (draggedId, targetId, position = 'after') => {
    if (!draggedId || draggedId === targetId) return;

    setTreeNodes((prev) => {
      const draggedNode = findNodeById(prev, draggedId);
      const targetNode = targetId ? findNodeById(prev, targetId) : null;

      if (!draggedNode) return prev;
      if (targetId && !targetNode) return prev;
      if (targetId && containsNodeId(draggedNode, targetId)) return prev;

      const { nextNodes, removedNode } = removeNodeById(prev, draggedId);
      if (!removedNode) return prev;

      if (position === 'root') {
        const movedNode = rebalanceDepth(removedNode, 1);
        return [...nextNodes, movedNode];
      }

      const movedDepth = position === 'inside' ? targetNode.depth + 1 : targetNode.depth;
      const movedNode = rebalanceDepth(removedNode, movedDepth);
      const { nextNodes: insertedNodes, inserted } = insertRelativeToTarget(nextNodes, targetId, movedNode, position);
      return inserted ? insertedNodes : prev;
    });
  };

  return (
    <div className="app-container">
      <header className="header animate-fade-in" style={{ marginBottom: '0.5rem', position: 'relative' }}>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="theme-toggle"
          title="테마 변경"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <h1
          style={{
            fontSize: '2.5rem',
            background: '-webkit-linear-gradient(45deg, var(--primary), #d8b4fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}
        >
          목표 달성 지표
        </h1>

        <div className="view-selector" style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: '1.5rem' }}>
          <button className={`view-tab ${currentView === 'main' ? 'active' : ''}`} onClick={() => setCurrentView('main')}>
            🔥 스케줄러 보드
          </button>
          <button className={`view-tab ${currentView === 'vision' ? 'active' : ''}`} onClick={() => setCurrentView('vision')}>
            🧭 비전 보드
          </button>
          <button className={`view-tab ${currentView === 'manage' ? 'active' : ''}`} onClick={() => setCurrentView('manage')}>
            ⚙️ 프로젝트 구성 관리
          </button>
        </div>
      </header>

      {currentView === 'manage' ? (
        <ManagePage
          treeNodes={treeNodes}
          addRootProject={addRootProject}
          addChildNode={addChildNode}
          updateNodeFields={updateNodeFields}
          deleteNode={deleteNode}
        />
      ) : currentView === 'vision' ? (
        <VisionBoard items={visionItems} setItems={setVisionItems} />
      ) : (
        <>
          <ProjectDashboard
            treeNodes={treeNodes}
            addRootProject={addRootProject}
            addChildNode={addChildNode}
            deleteNode={deleteNode}
            updateNodeFields={updateNodeFields}
            toggleDayAssignment={toggleDayAssignment}
            moveNode={moveNode}
          />

          <div className="execution-section animate-fade-in" style={{ animationDelay: '0.2s', marginTop: '1rem' }}>
            <div className="day-tabs">
              {weekOrder.map((dayIndex) => (
                <button
                  key={dayIndex}
                  className={`day-tab ${activeDay === dayIndex ? 'active' : ''}`}
                  onClick={() => setActiveDay(dayIndex)}
                >
                  {dayNames[dayIndex]}
                </button>
              ))}
              <button className={`day-tab memo-tab ${activeDay === 'memo' ? 'active' : ''}`} onClick={() => setActiveDay('memo')}>
                자유 메모
              </button>
            </div>

            {activeDay === 'memo' ? (
              <MemoPad memos={globalMemos} setMemos={setGlobalMemos} />
            ) : (
              <DailyView
                activeDay={activeDay}
                treeNodes={treeNodes}
                updateNodeFields={updateNodeFields}
                toggleDayAssignment={toggleDayAssignment}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
