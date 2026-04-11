import { useState } from 'react';

export default function TaskItem({ task, index, onDragStart, onDragEnter, onDragEnd, toggleTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask }) {
  const [subtaskInput, setSubtaskInput] = useState('');
  
  const handleAddSubtask = (e) => {
    if (e.key === 'Enter' && subtaskInput.trim()) {
      e.preventDefault();
      addSubtask(task.id, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  // If task has subtasks, completion of the main item could be determined by subtasks completion
  // so we show it as strikethrough only if it is actually completed (which App.jsx syncs if all subtasks are done).

  return (
    <li 
      className={`task-item-container animate-slide-in ${task.completed ? 'completed' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="task-item">
        <div className="drag-handle" title="드래그해서 순서 변경">≡</div>
        <label className="task-checkbox-wrapper">
          <input 
            type="checkbox" 
            checked={task.completed} 
            onChange={() => toggleTask(task.id)} 
          />
          <span className="task-checkbox-custom"></span>
        </label>
        
        <span className="task-content">
          {task.priority && task.priority !== 'normal' && (
            <span className={`priority-badge ${task.priority}`}>
              {task.priority === 'urgent' && '⏰ 급한 일'}
              {task.priority === 'important' && '💰 중요한 일'}
              {task.priority === 'both' && '🔥 급하고 중요'}
            </span>
          )}
          {task.text}
        </span>
        
        <button 
          onClick={() => deleteTask(task.id)}
          className="delete-btn"
          aria-label="할 일 삭제"
          title="할 일 삭제"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div className="subtask-section">
        {hasSubtasks && (
          <ul className="subtask-list">
            {task.subtasks.map(st => (
              <li key={st.id} className={`subtask-item ${st.completed ? 'completed' : ''}`}>
                <label className="subtask-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    checked={st.completed} 
                    onChange={() => toggleSubtask(task.id, st.id)} 
                  />
                  <span className="subtask-checkbox-custom"></span>
                </label>
                <span className="subtask-content">{st.text}</span>
                <button size="sm" className="subtask-delete-btn" onClick={() => deleteSubtask(task.id, st.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="subtask-input-wrapper">
          <span className="subtask-icon">↳</span>
          <input 
            type="text" 
            className="subtask-input" 
            placeholder="세부 과정 추가 (엔터 입력)..." 
            value={subtaskInput}
            onChange={(e) => setSubtaskInput(e.target.value)}
            onKeyDown={handleAddSubtask}
          />
        </div>
      </div>
    </li>
  );
}
