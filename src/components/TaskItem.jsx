export default function TaskItem({ task, toggleTask, deleteTask }) {
  return (
    <li className={`task-item animate-slide-in ${task.completed ? 'completed' : ''}`}>
      <label className="task-checkbox-wrapper">
        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={() => toggleTask(task.id)} 
        />
        <span className="task-checkbox-custom"></span>
      </label>
      
      <span className="task-content">
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
    </li>
  );
}
