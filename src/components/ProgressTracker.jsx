import { useMemo } from 'react';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

export default function ProgressTracker({ weeklyTasks, activeDay }) {
  // Helper function to calculate total and completed items for a list of tasks
  const getProgressStats = (tasks) => {
    let total = 0;
    let completed = 0;

    tasks.forEach(task => {
      const subtasks = task.subtasks || [];
      if (subtasks.length === 0) {
        // 단일 할 일
        total += 1;
        if (task.completed) completed += 1;
      } else {
        // 세부 과정이 있는 할 일
        total += subtasks.length;
        completed += subtasks.filter(st => st.completed).length;
      }
    });

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  };

  const activeStats = useMemo(() => {
    const tasks = weeklyTasks[activeDay] || [];
    return getProgressStats(tasks);
  }, [weeklyTasks, activeDay]);

  const weeklyStats = useMemo(() => {
    const days = [];
    const weekOrder = [1, 2, 3, 4, 5, 6, 0];
    
    for (const dayIndex of weekOrder) {
      const tasks = weeklyTasks[dayIndex] || [];
      const stats = getProgressStats(tasks);
      
      days.push({
        dayIndex,
        label: dayNames[dayIndex],
        percentage: stats.percentage,
        isActive: dayIndex === activeDay
      });
    }
    return days;
  }, [weeklyTasks, activeDay]);

  return (
    <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="progress-container">
        <div className="progress-info">
          <span className="label">현재 요일 진행률 ({dayNames[activeDay]}요일)</span>
          <span className="percent">{activeStats.percentage}%</span>
        </div>
        
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${activeStats.percentage}%` }}
          />
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          총 {activeStats.total}개의 과정 중 {activeStats.completed}개 완료됨
        </p>
      </div>

      <div className="history-section">
        <h3 className="history-title">주간 진행 상황</h3>
        <div className="history-grid">
          {weeklyStats.map((day) => (
            <div key={day.dayIndex} className="history-day" title={`${day.label}요일: ${day.percentage}% 완료됨`}>
              <div 
                className="history-ring" 
                style={{ '--angle': `${day.percentage}%` }}
              >
                <div className="history-ring-fill" />
              </div>
              <span className="history-day-label" style={{ color: day.isActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight: day.isActive ? 'bold' : 'normal' }}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
