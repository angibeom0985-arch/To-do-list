import TaskItem from './TaskItem';

export default function TaskList({ tasks, toggleTask, deleteTask }) {
  if (tasks.length === 0) {
    return (
      <div className="task-list-empty animate-fade-in">
        <p>No tasks for today. Add one to get started!</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
          toggleTask={toggleTask} 
          deleteTask={deleteTask} 
        />
      ))}
    </ul>
  );
}
