import { useRef } from 'react';
import TaskItem from './TaskItem';

export default function TaskList({ tasks, toggleTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, reorderTasks }) {
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleSort = () => {
    if (dragItem.current !== undefined && dragOverItem.current !== undefined) {
      reorderTasks(dragItem.current, dragOverItem.current);
    }
    dragItem.current = undefined;
    dragOverItem.current = undefined;
  };
  if (!tasks || tasks.length === 0) {
    return (
      <div className="task-list-empty animate-fade-in">
        <p>등록된 할 일이 없습니다. 먼저 할 일을 추가해 보세요!</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          index={index}
          onDragStart={(e) => (dragItem.current = index)}
          onDragEnter={(e) => (dragOverItem.current = index)}
          onDragEnd={handleSort}
          toggleTask={toggleTask} 
          deleteTask={deleteTask} 
          addSubtask={addSubtask}
          toggleSubtask={toggleSubtask}
          deleteSubtask={deleteSubtask}
        />
      ))}
    </ul>
  );
}
