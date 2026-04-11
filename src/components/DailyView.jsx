import React from 'react';

export default function DailyView({ activeDay, projects, toggleTask, assignTaskDay }) {
  // Get all tasks across all projects assigned to activeDay
  const dailyTasks = [];
  projects.forEach(project => {
    project.tasks.forEach(task => {
      if (task.assignedDay === activeDay) {
        dailyTasks.push({ ...task, projectName: project.title, projectId: project.id });
      }
    });
  });

  // Calculate completion
  const total = dailyTasks.length;
  const completed = dailyTasks.filter(t => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="daily-view-container glass-panel">
      <div className="daily-header">
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem' }}>오늘의 스케줄 실행 🚀</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>각 기획에서 넘어온 오늘의 업무들을 완수하세요.</p>
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
            이 요일에 배정된 업무가 없습니다. 기획 보드에서 일정을 배정해 보세요!
          </p>
        ) : (
          dailyTasks.map(task => (
            <li key={task.id} className={`daily-task-item ${task.completed ? 'completed' : ''}`}>
              <label className="task-checkbox-wrapper">
                <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.projectId, task.id)} />
                <span className="task-checkbox-custom"></span>
              </label>

              <div className="daily-task-content">
                <span className="daily-project-badge">{task.projectName}</span>
                {task.priority && task.priority !== 'normal' && (
                  <span className={`priority-badge ${task.priority}`}>
                    {task.priority === 'urgent' && '⏰ 급한 일'}
                    {task.priority === 'important' && '💰 중요한 일'}
                    {task.priority === 'both' && '🔥 급하고 중요'}
                  </span>
                )}
                <span className="task-text">{task.text}</span>
              </div>

              <div className="daily-task-actions">
                <button onClick={() => assignTaskDay(task.projectId, task.id, null)} className="unassign-btn" title="요일 배정 취소(기획으로 돌려보내기)">
                  배정 취소
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
