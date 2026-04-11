import { useState, useEffect } from 'react';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import TaskList from './components/TaskList';
import ProgressTracker from './components/ProgressTracker';

function App() {
  const [tasks, setTasks] = useLocalStorage('todo-tasks', []);
  const [history, setHistory] = useLocalStorage('todo-history', {});
  const [inputValue, setInputValue] = useState('');

  // Save today's progress to history whenever tasks change
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    setHistory(prev => ({
      ...prev,
      [today]: percentage
    }));
  }, [tasks, setHistory]);

  const addTask = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const newTask = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setTasks([newTask, ...tasks]);
    setInputValue('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="app-container">
      <header className="header animate-fade-in">
        <h1>Tracker.</h1>
        <p>Stay focused, track your daily progress.</p>
      </header>
      
      <ProgressTracker tasks={tasks} history={history} />
      
      <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <form onSubmit={addTask} className="task-form">
          <input 
            type="text" 
            className="task-input" 
            placeholder="What needs to be done?" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="add-btn" aria-label="Add task">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </form>
        
        <TaskList 
          tasks={tasks} 
          toggleTask={toggleTask} 
          deleteTask={deleteTask} 
        />
      </div>
    </div>
  );
}

export default App;
