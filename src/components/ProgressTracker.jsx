import { useMemo } from 'react';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

export default function ProgressTracker({ weeklyTasks, activeDay }) {
  // Calculate stats for the currently selected day
  const activeStats = useMemo(() => {
    const tasks = weeklyTasks[activeDay] || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [weeklyTasks, activeDay]);

  // Generate stats for all 7 days for the chart
  const weeklyStats = useMemo(() => {
    const days = [];
    // Start from Monday (1) to Sunday (0) to feel like a standard week, or Sunday(0) to Saturday(6)
    // Let's do Mon-Sun order: 1, 2, 3, 4, 5, 6, 0
    const weekOrder = [1, 2, 3, 4, 5, 6, 0];
    
    for (const dayIndex of weekOrder) {
      const tasks = weeklyTasks[dayIndex] || [];
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      
      days.push({
        dayIndex,
        label: dayNames[dayIndex],
        percentage,
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
          {activeStats.total}개의 할 일 중 {activeStats.completed}개 완료됨
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
