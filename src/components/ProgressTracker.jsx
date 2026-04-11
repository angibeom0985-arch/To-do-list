import { useMemo } from 'react';

export default function ProgressTracker({ tasks, history }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [tasks]);

  // Generate the last 7 days for the history grid
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Use today's live stats if it's today, otherwise use history
      let percentage = 0;
      if (i === 0) {
        percentage = stats.percentage;
      } else {
        percentage = history[dateStr] || 0;
      }
      
      days.push({
        date: dateStr,
        label: dayName,
        percentage,
        isToday: i === 0
      });
    }
    return days;
  }, [history, stats.percentage]);

  return (
    <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="progress-container">
        <div className="progress-info">
          <span className="label">Today's Progress</span>
          <span className="percent">{stats.percentage}%</span>
        </div>
        
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {stats.completed} of {stats.total} tasks completed
        </p>
      </div>

      <div className="history-section">
        <h3 className="history-title">Last 7 Days</h3>
        <div className="history-grid">
          {last7Days.map((day) => (
            <div key={day.date} className="history-day" title={`${day.date}: ${day.percentage}% completed`}>
              <div 
                className="history-ring" 
                style={{ '--angle': `${day.percentage}%` }}
              >
                <div className="history-ring-fill" />
              </div>
              <span className="history-day-label" style={{ color: day.isToday ? 'var(--primary)' : 'var(--text-muted)' }}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
