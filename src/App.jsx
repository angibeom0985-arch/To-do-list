import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import ProjectDashboard from './components/ProjectDashboard';
import DailyView from './components/DailyView';
import MemoPad from './components/MemoPad';
import ManagePage from './components/ManagePage';
import VisionBoard from './components/VisionBoard';
import WorkflowWindow from './components/WorkflowWindow';

const dayNames = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];
const weekOrder = [1, 2, 3, 4, 5, 6, 0];
const AUTO_SYNC_KEY = 'to-do-list-owner-default';
const CLOUD_POLL_INTERVAL_MS = 20000;
const UI_SCALE_STORAGE_KEY = 'ui-scale';
const MIN_UI_SCALE = 0.6;
const MAX_UI_SCALE = 2.2;
const PINCH_SENSITIVITY = 0.75;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getTouchDistance = (touches) => {
  const [firstTouch, secondTouch] = touches;
  return Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);
};

const toTimestamp = (value) => {
  const parsed = Date.parse(value || '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

function App() {
  const [treeNodes, setTreeNodes] = useLocalStorage('projects-v2', []);
  const [globalMemos, setGlobalMemos] = useLocalStorage('global-memos-list', []);
  const [visionItems, setVisionItems] = useLocalStorage('vision-board-items', []);
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [theme, setTheme] = useLocalStorage('app-theme', 'dark');
  const [currentView, setCurrentView] = useState('main'); // 'main' | 'vision' | 'manage'
  const [syncStatus, setSyncStatus] = useState('\uD074\uB77C\uC6B0\uB4DC \uB3D9\uAE30\uD654 \uC5F0\uACB0 \uC911...');
  const [isSyncReady, setIsSyncReady] = useState(false);
  const isHydratingFromCloudRef = useRef(false);
  const hasPendingLocalChangesRef = useRef(false);
  const latestCloudSavedAtRef = useRef('');
  const saveTimerRef = useRef(null);
  const pinchStartDistanceRef = useRef(null);
  const pinchStartScaleRef = useRef(1);
  const [uiScale, setUiScale] = useLocalStorage(UI_SCALE_STORAGE_KEY, 1);
  const uiScaleRef = useRef(1);
  const workflowNodeId = new URLSearchParams(window.location.search).get('workflowNode');

  const applyCloudSnapshot = useCallback((cloudData) => {
    setTreeNodes(Array.isArray(cloudData.treeNodes) ? cloudData.treeNodes : []);
    setGlobalMemos(Array.isArray(cloudData.globalMemos) ? cloudData.globalMemos : []);
    setVisionItems(Array.isArray(cloudData.visionItems) ? cloudData.visionItems : []);
    setTheme(cloudData.theme === 'light' ? 'light' : 'dark');
    setCurrentView(
      cloudData.currentView === 'manage' || cloudData.currentView === 'vision' ? cloudData.currentView : 'main',
    );
    setActiveDay(
      cloudData.activeDay === 'memo' ? 'memo' : Number.isInteger(cloudData.activeDay) && cloudData.activeDay >= 0 && cloudData.activeDay <= 6
        ? cloudData.activeDay
        : new Date().getDay(),
    );
  }, [setGlobalMemos, setTheme, setTreeNodes, setVisionItems]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    if (!Number.isFinite(uiScale)) {
      setUiScale(1);
      return;
    }

    const boundedScale = clamp(uiScale, MIN_UI_SCALE, MAX_UI_SCALE);
    if (boundedScale !== uiScale) {
      setUiScale(boundedScale);
    }
  }, [uiScale, setUiScale]);

  useEffect(() => {
    uiScaleRef.current = uiScale;
  }, [uiScale]);

  useEffect(() => {
    const handleTouchStart = (event) => {
      if (event.touches.length !== 2) return;
      pinchStartDistanceRef.current = getTouchDistance(event.touches);
      pinchStartScaleRef.current = uiScaleRef.current;
    };

    const handleTouchMove = (event) => {
      if (event.touches.length !== 2 || pinchStartDistanceRef.current === null) return;

      event.preventDefault();
      const currentDistance = getTouchDistance(event.touches);
      const scaleFactor = currentDistance / pinchStartDistanceRef.current;
      const adjustedScaleFactor = scaleFactor ** PINCH_SENSITIVITY;
      const nextScale = clamp(pinchStartScaleRef.current * adjustedScaleFactor, MIN_UI_SCALE, MAX_UI_SCALE);
      setUiScale(nextScale);
    };

    const handleTouchEnd = (event) => {
      if (event.touches.length >= 2) return;
      pinchStartDistanceRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // iOS Safari: block native gesture zoom so custom pinch scale remains authoritative.
    const preventNativeGestureZoom = (event) => event.preventDefault();
    document.addEventListener('gesturestart', preventNativeGestureZoom, { passive: false });
    document.addEventListener('gesturechange', preventNativeGestureZoom, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('gesturestart', preventNativeGestureZoom);
      document.removeEventListener('gesturechange', preventNativeGestureZoom);
    };
  }, []);

  useEffect(() => {
    const trimmedKey = AUTO_SYNC_KEY;

    let cancelled = false;
    isHydratingFromCloudRef.current = true;
    setSyncStatus('\uD074\uB77C\uC6B0\uB4DC \uB370\uC774\uD130 \uBD88\uB7EC\uC624\uB294 \uC911...');

    const loadCloudState = async () => {
      try {
        const response = await fetch(`/api/sync?key=${encodeURIComponent(trimmedKey)}`);
        if (!response.ok) {
          throw new Error('\uB3D9\uAE30\uD654 \uBD88\uB7EC\uC624\uAE30 \uC2E4\uD328');
        }

        const payload = await response.json();
        const cloudData = payload?.data;

        if (!cancelled && cloudData) {
          applyCloudSnapshot(cloudData);
          latestCloudSavedAtRef.current = typeof cloudData.savedAt === 'string' ? cloudData.savedAt : '';
          hasPendingLocalChangesRef.current = false;
        }

        if (!cancelled) {
          setIsSyncReady(true);
          setSyncStatus(
            cloudData
              ? '\uD074\uB77C\uC6B0\uB4DC \uB3D9\uAE30\uD654 \uC5F0\uACB0\uB428'
              : '\uC0C8 \uB3D9\uAE30\uD654 \uACF5\uAC04 \uC0DD\uC131\uB428 (\uCCAB \uC800\uC7A5 \uB300\uAE30)',
          );
        }
      } catch (error) {
        if (!cancelled) {
          setIsSyncReady(false);
          setSyncStatus('\uB3D9\uAE30\uD654 \uC2E4\uD328 (\uD0A4 \uB610\uB294 \uC11C\uBC84 \uC0C1\uD0DC \uD655\uC778)');
          console.error(error);
        }
      } finally {
        setTimeout(() => {
          isHydratingFromCloudRef.current = false;
        }, 0);
      }
    };

    loadCloudState();

    return () => {
      cancelled = true;
    };
  }, [applyCloudSnapshot]);

  useEffect(() => {
    const trimmedKey = AUTO_SYNC_KEY;
    if (!isSyncReady || isHydratingFromCloudRef.current) return;

    hasPendingLocalChangesRef.current = true;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    const snapshot = {
      treeNodes,
      globalMemos,
      visionItems,
      activeDay,
      theme,
      currentView,
      savedAt: new Date().toISOString(),
    };

    saveTimerRef.current = setTimeout(async () => {
      setSyncStatus('\uD074\uB77C\uC6B0\uB4DC \uC800\uC7A5 \uC911...');
      try {
        const response = await fetch('/api/sync', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: trimmedKey,
            data: snapshot,
          }),
        });

        if (!response.ok) {
          throw new Error('\uC800\uC7A5 \uC2E4\uD328');
        }

        latestCloudSavedAtRef.current = snapshot.savedAt;
        hasPendingLocalChangesRef.current = false;
        const savedTime = new Date().toLocaleTimeString('ko-KR', { hour12: false });
        setSyncStatus(`\uB3D9\uAE30\uD654 \uC644\uB8CC (${savedTime})`);
      } catch (error) {
        setSyncStatus('\uB3D9\uAE30\uD654 \uC800\uC7A5 \uC2E4\uD328');
        console.error(error);
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [activeDay, currentView, globalMemos, isSyncReady, theme, treeNodes, visionItems]);

  useEffect(() => {
    const trimmedKey = AUTO_SYNC_KEY;
    if (!isSyncReady) return;

    const pullLatestCloudState = async () => {
      if (isHydratingFromCloudRef.current || hasPendingLocalChangesRef.current) return;

      try {
        const response = await fetch(`/api/sync?key=${encodeURIComponent(trimmedKey)}`);
        if (!response.ok) return;

        const payload = await response.json();
        const cloudData = payload?.data;
        if (!cloudData) return;

        const remoteSavedAt = typeof cloudData.savedAt === 'string' ? cloudData.savedAt : '';
        const isRemoteNewer = toTimestamp(remoteSavedAt) > toTimestamp(latestCloudSavedAtRef.current);
        if (!isRemoteNewer) return;

        isHydratingFromCloudRef.current = true;
        applyCloudSnapshot(cloudData);
        latestCloudSavedAtRef.current = remoteSavedAt;
        hasPendingLocalChangesRef.current = false;
        setSyncStatus('\uB2E4\uB978 \uAE30\uAE30\uC758 \uCD5C\uC2E0 \uBCC0\uACBD\uC0AC\uD56D\uC744 \uBC18\uC601\uD588\uC5B4\uC694');
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => {
          isHydratingFromCloudRef.current = false;
        }, 0);
      }
    };

    const pollId = setInterval(pullLatestCloudState, CLOUD_POLL_INTERVAL_MS);
    return () => clearInterval(pollId);
  }, [applyCloudSnapshot, isSyncReady]);

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

  if (workflowNodeId) {
    const targetNode = findNodeById(treeNodes, workflowNodeId);
    return (
      <div className="app-zoom-layer" style={{ transform: `scale(${uiScale})` }}>
        <div className="app-container">
          <WorkflowWindow targetNode={targetNode} updateNodeFields={updateNodeFields} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-zoom-layer" style={{ transform: `scale(${uiScale})` }}>
      <div className="app-container">
        <header className="header animate-fade-in" style={{ marginBottom: '0.5rem', position: 'relative' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="theme-toggle"
            title={'\uD14C\uB9C8 \uBCC0\uACBD'}
          >
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
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
            {'\uBAA9\uD45C \uB2EC\uC131 \uC9C0\uD45C'}
          </h1>

          <div className="view-selector" style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: '1.5rem' }}>
            <button className={`view-tab ${currentView === 'main' ? 'active' : ''}`} onClick={() => setCurrentView('main')}>
              {'\uC2A4\uCF00\uC904\uB7EC \uBCF4\uB4DC'}
            </button>
            <button className={`view-tab ${currentView === 'vision' ? 'active' : ''}`} onClick={() => setCurrentView('vision')}>
              {'\uBE44\uC804 \uBCF4\uB4DC'}
            </button>
            <button className={`view-tab ${currentView === 'manage' ? 'active' : ''}`} onClick={() => setCurrentView('manage')}>
              {'\uD504\uB85C\uC81D\uD2B8 \uAD6C\uC131 \uAD00\uB9AC'}
            </button>
          </div>

          <p className="sync-status">{syncStatus}</p>
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
                  {'\uC790\uC720 \uBA54\uBAA8'}
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
    </div>
  );
}

export default App;

