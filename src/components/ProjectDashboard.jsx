import React, { useState } from 'react';

// 간단한 원형 프로그레스 바 컴포넌트
function ProjectProgress({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="project-progress">
      <div className="mini-ring">
        <div className="mini-ring-fill" style={{ '--angle': `${percentage * 3.6}deg` }}></div>
      </div>
      <span className="project-pct">{percentage}%</span>
    </div>
  );
}

export default function ProjectDashboard({ projects, addProject, deleteProject, addTaskToProject, toggleTask, deleteTask, assignTaskDay, reorderProjectTasks }) {
  const [newProjectTitle, setNewProjectTitle] = useState('');

  const handleAddProject = (e) => {
    e.preventDefault();
    if (newProjectTitle.trim()) {
      addProject(newProjectTitle.trim());
      setNewProjectTitle('');
    }
  };

  return (
    <div className="project-dashboard glass-panel">
      <div className="dashboard-header">
        <h2>📁 나의 프로젝트 보드</h2>
        <form onSubmit={handleAddProject} className="project-add-form">
          <input 
            type="text" 
            placeholder="새 프로젝트 이름..." 
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            className="project-input"
          />
          <button type="submit" className="add-btn mini-btn">+</button>
        </form>
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <p className="empty-projects">기획된 프로젝트가 없습니다. 위의 칸에 가장 멋진 목표를 적어보세요!</p>
        ) : (
          projects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              deleteProject={deleteProject}
              addTaskToProject={addTaskToProject}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              assignTaskDay={assignTaskDay}
              reorderProjectTasks={reorderProjectTasks}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, deleteProject, addTaskToProject, toggleTask, deleteTask, assignTaskDay, reorderProjectTasks }) {
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (taskText.trim()) {
      addTaskToProject(project.id, { text: taskText.trim(), priority: taskPriority, assignedDay: null });
      setTaskText('');
      setTaskPriority('normal');
    }
  };

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-title-area">
          <h3 className="project-card-title">{project.title}</h3>
          <ProjectProgress tasks={project.tasks} />
        </div>
        <button onClick={() => deleteProject(project.id)} className="delete-btn">×</button>
      </div>
      
      <form onSubmit={handleAddTask} className="project-task-form">
        <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="mini-select">
          <option value="normal">일반</option>
          <option value="urgent">⏰ 급함</option>
          <option value="important">💰 중요</option>
          <option value="both">🔥 집중</option>
        </select>
        <input 
          type="text" 
          placeholder="세부 과정 추가..." 
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          className="mini-task-input"
        />
        <button type="submit" className="add-btn mini-btn ">→</button>
      </form>

      <ul className="project-task-list">
        {project.tasks.map(task => (
          <li key={task.id} className={`project-task-item ${task.completed ? 'completed' : ''}`}>
            <label className="task-checkbox-wrapper mini-box">
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(project.id, task.id)} />
              <span className="task-checkbox-custom mini-box"></span>
            </label>
            
            <span className="task-text-content">
              {task.text}
            </span>

            <div className="task-actions">
              <select 
                value={task.assignedDay === null ? '' : task.assignedDay} 
                onChange={(e) => assignTaskDay(project.id, task.id, e.target.value === '' ? null : Number(e.target.value))}
                className="day-assign-select"
              >
                <option value="">상시 대기</option>
                <option value="1">월요일 배정</option>
                <option value="2">화요일 배정</option>
                <option value="3">수요일 배정</option>
                <option value="4">목요일 배정</option>
                <option value="5">금요일 배정</option>
                <option value="6">토요일 배정</option>
                <option value="0">일요일 배정</option>
              </select>
              <button onClick={() => deleteTask(project.id, task.id)} className="delete-btn mini">×</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
