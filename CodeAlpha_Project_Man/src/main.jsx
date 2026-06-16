import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Circle,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Send,
  UserPlus,
  Users
} from 'lucide-react';
import './styles.css';

const API_URL = 'http://localhost:4000';
const columns = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'In progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' }
];

function api(path, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  });
}

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('token', data.token);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Collaborative workspace</p>
          <h1>Project Board</h1>
          <p className="muted">Coordinate projects, tasks, comments, notifications, and live board changes from one focused workspace.</p>
        </div>
        <form onSubmit={submit} className="stack">
          <div className="segmented">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
          </div>
          {mode === 'register' && <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
      </section>
    </main>
  );
}

function ProjectForm({ users, onCreate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState([]);

  async function submit(event) {
    event.preventDefault();
    const project = await api('/api/projects', { method: 'POST', body: JSON.stringify({ name, description, memberIds }) });
    onCreate(project);
    setName('');
    setDescription('');
    setMemberIds([]);
    setOpen(false);
  }

  return (
    <div className="form-block">
      <button className="icon-text" onClick={() => setOpen(!open)}><Plus size={16} /> Project</button>
      {open && (
        <form className="stack surface" onSubmit={submit}>
          <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <MemberPicker users={users} selected={memberIds} onChange={setMemberIds} />
          <button className="primary">Create project</button>
        </form>
      )}
    </div>
  );
}

function MemberPicker({ users, selected, onChange }) {
  return (
    <div className="picker">
      {users.map((user) => (
        <label key={user.id}>
          <input
            type="checkbox"
            checked={selected.includes(user.id)}
            onChange={(event) => onChange(event.target.checked ? [...selected, user.id] : selected.filter((id) => id !== user.id))}
          />
          <span>{user.name}</span>
        </label>
      ))}
    </div>
  );
}

function TaskComposer({ project, onCreate }) {
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('Medium');

  async function submit(event) {
    event.preventDefault();
    const task = await api(`/api/projects/${project.id}/tasks`, { method: 'POST', body: JSON.stringify({ title, assigneeId, priority }) });
    onCreate(task);
    setTitle('');
    setAssigneeId('');
  }

  return (
    <form className="task-composer" onSubmit={submit}>
      <input placeholder="Add a task" value={title} onChange={(e) => setTitle(e.target.value)} />
      <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
        <option value="">Unassigned</option>
        {project.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
      </select>
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <button className="icon-only" aria-label="Add task" title="Add task"><Plus size={18} /></button>
    </form>
  );
}

function TaskCard({ task, project, onUpdate, selected, onSelect }) {
  const assignee = project.members.find((member) => member.id === task.assigneeId);
  const icon = task.status === 'done' ? <CheckCircle2 size={16} /> : <Circle size={16} />;

  return (
    <button className={`task-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(task)}>
      <div className="task-title">{icon}<span>{task.title}</span></div>
      {task.description && <p>{task.description}</p>}
      <div className="task-meta">
        <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
        <span>{assignee?.name || 'Unassigned'}</span>
        <span><MessageSquare size={14} /> {task.comments?.length || 0}</span>
      </div>
      <select
        value={task.status}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onUpdate(task.id, { status: event.target.value })}
      >
        {columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
      </select>
    </button>
  );
}

function TaskDetail({ task, project, onClose, onUpdate, onComment }) {
  const [draft, setDraft] = useState(task?.body || '');
  const [comment, setComment] = useState('');

  useEffect(() => {
    setDraft(task?.description || '');
    setComment('');
  }, [task?.id]);

  if (!task) return <aside className="detail empty">Select a task to open the discussion.</aside>;

  async function addComment(event) {
    event.preventDefault();
    const created = await api(`/api/tasks/${task.id}/comments`, { method: 'POST', body: JSON.stringify({ body: comment }) });
    onComment(created);
    setComment('');
  }

  return (
    <aside className="detail">
      <button className="close" onClick={onClose}>Close</button>
      <h2>{task.title}</h2>
      <label>Description</label>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => onUpdate(task.id, { description: draft })} />
      <div className="detail-grid">
        <label>
          Assignee
          <select value={task.assigneeId} onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {project.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </label>
        <label>
          Due date
          <input type="date" value={task.dueDate || ''} onChange={(e) => onUpdate(task.id, { dueDate: e.target.value })} />
        </label>
      </div>
      <section className="comments">
        <h3>Comments</h3>
        {task.comments?.map((item) => (
          <article key={item.id}>
            <strong>{item.author?.name}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </section>
      <form className="comment-form" onSubmit={addComment}>
        <input placeholder="Write a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        <button className="icon-only" aria-label="Send comment" title="Send comment"><Send size={18} /></button>
      </form>
    </aside>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api('/api/me').then((data) => setUser(data.user)).catch(() => localStorage.removeItem('token'));
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([api('/api/users'), api('/api/projects'), api('/api/notifications')]).then(([userList, projectList, notificationList]) => {
      setUsers(userList.filter((item) => item.id !== user.id));
      setProjects(projectList);
      setActiveId(projectList[0]?.id || '');
      setNotifications(notificationList);
    });
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;
    const socket = io(API_URL, { auth: { token } });
    projects.forEach((project) => socket.emit('project:join', project.id));
    socket.on('project:updated', upsertProject);
    socket.on('task:created', upsertTask);
    socket.on('task:updated', upsertTask);
    socket.on('comment:created', appendComment);
    socket.on('notification', (notification) => setNotifications((current) => [notification, ...current]));
    return () => socket.disconnect();
  }, [user, projects.map((project) => project.id).join(',')]);

  const activeProject = projects.find((project) => project.id === activeId);
  const selectedTask = activeProject?.tasks.find((task) => task.id === selectedTaskId);
  const filteredTasks = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));
  }, [activeProject, query]);

  function upsertProject(project) {
    setProjects((current) => current.some((item) => item.id === project.id) ? current.map((item) => item.id === project.id ? project : item) : [project, ...current]);
  }

  function upsertTask(task) {
    setProjects((current) => current.map((project) => {
      if (project.id !== task.projectId) return project;
      const tasks = project.tasks.some((item) => item.id === task.id)
        ? project.tasks.map((item) => item.id === task.id ? { ...item, ...task, comments: item.comments || [] } : item)
        : [{ ...task, comments: [] }, ...project.tasks];
      return { ...project, tasks };
    }));
  }

  function appendComment(comment) {
    setProjects((current) => current.map((project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === comment.taskId ? { ...task, comments: [...(task.comments || []), comment] } : task)
    })));
  }

  async function updateTask(taskId, updates) {
    const task = await api(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    upsertTask(task);
  }

  if (!user) return <AuthScreen onAuthed={setUser} />;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><CheckCircle2 /> Project Board</div>
        <ProjectForm users={users} onCreate={(project) => { upsertProject(project); setActiveId(project.id); }} />
        <nav>
          {projects.map((project) => (
            <button key={project.id} className={project.id === activeId ? 'active' : ''} onClick={() => setActiveId(project.id)}>
              <span>{project.name}</span>
              <small>{project.tasks.length}</small>
            </button>
          ))}
        </nav>
        <section className="notifications">
          <h3><Bell size={16} /> Notifications</h3>
          {notifications.slice(0, 6).map((notification) => <p key={notification.id}>{notification.message}</p>)}
        </section>
        <button className="ghost" onClick={() => { localStorage.removeItem('token'); location.reload(); }}><LogOut size={16} /> Sign out</button>
      </aside>

      {activeProject ? (
        <section className="workspace">
          <header className="topbar">
            <div>
              <h1>{activeProject.name}</h1>
              <p>{activeProject.description || 'No description yet'}</p>
            </div>
            <div className="top-actions">
              <div className="search"><Search size={16} /><input placeholder="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
              <span className="members"><Users size={16} /> {activeProject.members.length}</span>
            </div>
          </header>
          <TaskComposer project={activeProject} onCreate={upsertTask} />
          <section className="board">
            {columns.map((column) => (
              <div className="column" key={column.id}>
                <h2>{column.label}<span>{filteredTasks.filter((task) => task.status === column.id).length}</span></h2>
                {filteredTasks.filter((task) => task.status === column.id).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={activeProject}
                    selected={task.id === selectedTaskId}
                    onSelect={(item) => setSelectedTaskId(item.id)}
                    onUpdate={updateTask}
                  />
                ))}
              </div>
            ))}
          </section>
        </section>
      ) : (
        <section className="workspace empty-state">
          <UserPlus size={40} />
          <h1>Create your first group project</h1>
        </section>
      )}

      <TaskDetail
        task={selectedTask}
        project={activeProject}
        onClose={() => setSelectedTaskId('')}
        onUpdate={updateTask}
        onComment={appendComment}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
