import { useState } from 'react';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import TaskList from './components/TaskList';
import ProgressTracker from './components/ProgressTracker';
import MemoPad from './components/MemoPad';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const weekOrder = [1, 2, 3, 4, 5, 6, 0];

function App() {
  const initialWeeklyTasks = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const [weeklyTasks, setWeeklyTasks] = useLocalStorage('weekly-tasks-v2', initialWeeklyTasks);
  const [projectTitle, setProjectTitle] = useLocalStorage('project-title', '내 큰 프로젝트');
  const [globalMemo, setGlobalMemo] = useLocalStorage('global-memo', '');
  const [activeDay, setActiveDay] = useState(new Date().getDay()); // 0-6, or 'memo'
  const [inputValue, setInputValue] = useState('');

  const currentTasks = weeklyTasks[activeDay] || [];

  const addTask = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const newTask = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      subtasks: [],
      createdAt: new Date().toISOString()
    };
    
    setWeeklyTasks(prev => ({
      ...prev,
      [activeDay]: [newTask, ...(prev[activeDay] || [])]
    }));
    
    setInputValue('');
  };

  const toggleTask = (id) => {
    setWeeklyTasks(prev => {
      const dayTasks = prev[activeDay] || [];
      return {
        ...prev,
        [activeDay]: dayTasks.map(task => {
          if (task.id === id) {
            const isCompleted = !task.completed;
            return { 
              ...task, 
              completed: isCompleted,
              subtasks: task.subtasks ? task.subtasks.map(st => ({...st, completed: isCompleted})) : []
            };
          }
          return task;
        })
      };
    });
  };

  const deleteTask = (id) => {
    setWeeklyTasks(prev => {
      const dayTasks = prev[activeDay] || [];
      return {
        ...prev,
        [activeDay]: dayTasks.filter(task => task.id !== id)
      };
    });
  };

  const addSubtask = (taskId, text) => {
    setWeeklyTasks(prev => {
      const dayTasks = prev[activeDay] || [];
      return {
        ...prev,
        [activeDay]: dayTasks.map(task => 
          task.id === taskId ? {
            ...task,
            subtasks: [...(task.subtasks || []), { id: crypto.randomUUID(), text, completed: false }]
          } : task
        )
      };
    });
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setWeeklyTasks(prev => {
      const dayTasks = prev[activeDay] || [];
      return {
        ...prev,
        [activeDay]: dayTasks.map(task => {
          if (task.id === taskId) {
            const updatedSubtasks = (task.subtasks || []).map(st => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            // If all subtasks completed, main task might be considered completed (optional UI sync)
            const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
            
            return {
              ...task,
              subtasks: updatedSubtasks,
              completed: allCompleted
            };
          }
          return task;
        })
      };
    });
  };

  const deleteSubtask = (taskId, subtaskId) => {
    setWeeklyTasks(prev => {
      const dayTasks = prev[activeDay] || [];
      return {
        ...prev,
        [activeDay]: dayTasks.map(task => {
          if (task.id === taskId) {
            const remaining = (task.subtasks || []).filter(st => st.id !== subtaskId);
            return { ...task, subtasks: remaining };
          }
          return task;
        })
      };
    });
  };

  return (
    <div className="app-container">
      <header className="header animate-fade-in">
        <input 
          className="project-title-input"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          placeholder="나의 큰 프로젝트"
          autoComplete="off"
          spellCheck="false"
        />
        <p>집중력을 유지하고, 세부적인 계획들을 매일 일~토에 입력해서 진행하세요.</p>
      </header>
      
      <div className="day-tabs animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {weekOrder.map((dayIndex) => (
          <button 
            key={dayIndex}
            className={`day-tab ${activeDay === dayIndex ? 'active' : ''}`}
            onClick={() => setActiveDay(dayIndex)}
          >
            {dayNames[dayIndex]}
          </button>
        ))}
        <button 
          className={`day-tab memo-tab ${activeDay === 'memo' ? 'active' : ''}`}
          onClick={() => setActiveDay('memo')}
        >
          자유 메모
        </button>
      </div>
      
      {activeDay === 'memo' ? (
        <MemoPad memo={globalMemo} setMemo={setGlobalMemo} />
      ) : (
        <>
          <ProgressTracker weeklyTasks={weeklyTasks} activeDay={activeDay} />
          
          <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={addTask} className="task-form">
              <input 
                type="text" 
                className="task-input" 
                placeholder="추가할 할 일을 입력하세요..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className="add-btn" aria-label="할 일 추가">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </form>
            
            <TaskList 
              tasks={currentTasks} 
              toggleTask={toggleTask} 
              deleteTask={deleteTask}
              addSubtask={addSubtask}
              toggleSubtask={toggleSubtask}
              deleteSubtask={deleteSubtask}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
