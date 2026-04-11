import { useState } from 'react';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import ProjectDashboard from './components/ProjectDashboard';
import DailyView from './components/DailyView';
import MemoPad from './components/MemoPad';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
const weekOrder = [1, 2, 3, 4, 5, 6, 0];

function App() {
  const [projects, setProjects] = useLocalStorage('projects-v1', []);
  const [globalMemos, setGlobalMemos] = useLocalStorage('global-memos-list', []);
  const [activeDay, setActiveDay] = useState(new Date().getDay()); // 0-6, or 'memo'

  // Project Actions
  const addProject = (title) => {
    const newProject = {
      id: crypto.randomUUID(),
      title,
      tasks: [],
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const addTaskToProject = (projectId, taskPayload) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: [
            {
              id: crypto.randomUUID(),
              ...taskPayload,
              completed: false,
              createdAt: new Date().toISOString()
            },
            ...p.tasks
          ]
        };
      }
      return p;
    }));
  };

  const toggleTask = (projectId, taskId) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return p;
    }));
  };

  const deleteTask = (projectId, taskId) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId)
        };
      }
      return p;
    }));
  };

  const assignTaskDay = (projectId, taskId, dayIndex) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, assignedDay: dayIndex } : t)
        };
      }
      return p;
    }));
  };

  const reorderProjectTasks = (projectId, sourceIndex, destIndex) => {
    if (sourceIndex === destIndex) return;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newTasks = [...p.tasks];
        const [dragged] = newTasks.splice(sourceIndex, 1);
        newTasks.splice(destIndex, 0, dragged);
        return { ...p, tasks: newTasks };
      }
      return p;
    }));
  };

  return (
    <div className="app-container">
      <header className="header animate-fade-in" style={{ marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', background: '-webkit-linear-gradient(45deg, var(--primary), #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          목표 지향 스케줄러.
        </h1>
        <p>프로젝트 기획부터 요일별 실행까지 한 곳에서 끝내세요.</p>
      </header>
      
      {/* 1. 기획 영역: Project Dashboard */}
      <ProjectDashboard 
        projects={projects}
        addProject={addProject}
        deleteProject={deleteProject}
        addTaskToProject={addTaskToProject}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
        assignTaskDay={assignTaskDay}
        reorderProjectTasks={reorderProjectTasks}
      />

      {/* 2. 실행 영역: Daily View & Memos */}
      <div className="execution-section animate-fade-in" style={{ animationDelay: '0.2s', marginTop: '1rem' }}>
        <div className="day-tabs">
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
          <MemoPad memos={globalMemos} setMemos={setGlobalMemos} />
        ) : (
          <DailyView 
            activeDay={activeDay} 
            projects={projects} 
            toggleTask={toggleTask}
            assignTaskDay={assignTaskDay}
          />
        )}
      </div>
    </div>
  );
}

export default App;
