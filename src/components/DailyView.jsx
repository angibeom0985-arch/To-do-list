import React from 'react';

const COLOR_PALETTE = {
  default: { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)' },
  blue: { main: '#3b82f6', light: 'rgba(59, 130, 246, 0.2)' },
  green: { main: '#10b981', light: 'rgba(16, 185, 129, 0.2)' },
  amber: { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.2)' },
  rose: { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.2)' }
};

export default function DailyView({ activeDay, treeNodes, updateNodeFields, toggleDayAssignment }) {
  // Flatten tree to find depth-4 tasks where assignedDays includes activeDay
  const dailyTasks = [];

  const traverse = (node, pathStack, color) => {
    const currentPath = [...pathStack, node.title];
    const currentColor = node.depth === 1 ? (node.color || 'default') : color;

    if (node.depth >= 2 && (node.assignedDays || []).includes(activeDay)) {
      dailyTasks.push({
        ...node,
        path: pathStack.join(' > '), // Extracting parents
        projectColor: currentColor
      });
    }
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child, currentPath, currentColor));
    }
  };

  treeNodes.forEach(rootNode => traverse(rootNode, [], 'default'));

  // Calculate completion
  const total = dailyTasks.length;
  const completed = dailyTasks.filter(t => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="daily-view-container glass-panel">
      <div className="daily-header">
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem' }}>오늘의 스케줄 실행 🚀</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>기획 보드에서 이 요일로 복사된 임무들입니다.</p>
        </div>
        
        <div className="daily-progress-wrap">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>일일 달성률</span>
          <div className="daily-progress-bar">
            <div className="daily-progress-fill" style={{ width: `${percentage}%` }}></div>
          </div>
          <span style={{ fontWeight: 600 }}>{percentage}%</span>
        </div>
      </div>

      <ul className="daily-task-list">
        {dailyTasks.length === 0 ? (
          <p className="empty-projects" style={{ textAlign: 'center', padding: '2rem' }}>
            이 요일에 복사된 업무가 없습니다. 기획 보드에서 멀티 요일 스위치를 켜보세요!
          </p>
        ) : (
          dailyTasks.map(task => {
            const colorConfig = COLOR_PALETTE[task.projectColor] || COLOR_PALETTE.default;

            return (
              <li key={task.id} className={`daily-task-item ${task.completed ? 'completed' : ''}`}>
                <label className="task-checkbox-wrapper">
                  <input type="checkbox" checked={task.completed} onChange={() => updateNodeFields(task.id, { completed: !task.completed })} />
                  <span className="task-checkbox-custom"></span>
                </label>

                <div className="daily-task-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span 
                      className="daily-project-badge" 
                      style={{ 
                        background: colorConfig.light, 
                        color: colorConfig.main, 
                        borderColor: colorConfig.light 
                      }}
                      title={task.path}
                    >
                      {task.path}
                    </span>
                    {task.priority && task.priority !== 'normal' && (
                      <span className={`priority-badge ${task.priority}`}>
                        {task.priority === 'urgent' && '⏰ 급한 일'}
                        {task.priority === 'important' && '💰 중요한 일'}
                        {task.priority === 'both' && '🔥 급하고 중요'}
                      </span>
                    )}
                  </div>
                  <span className="task-text">{task.title}</span>
                </div>

                <div className="daily-task-actions">
                  <button onClick={() => toggleDayAssignment(task.id, activeDay)} className="unassign-btn" title="이 요일에서만 제거 (다른 요일은 유지됨)">
                    배정 취소
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
