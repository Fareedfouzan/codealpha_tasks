import express from 'express';
import cors from 'cors';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }
});

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());

const initialData = {
  users: [],
  projects: [],
  tasks: [],
  comments: [],
  notifications: []
};

let db = structuredClone(initialData);

async function loadData() {
  try {
    const contents = await fs.readFile(DATA_FILE, 'utf8');
    db = { ...structuredClone(initialData), ...JSON.parse(contents) };
  } catch {
    await saveData();
  }
}

async function saveData() {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((candidate) => candidate.id === payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireProjectMember(projectId, userId) {
  const project = db.projects.find((candidate) => candidate.id === projectId);
  if (!project || !project.memberIds.includes(userId)) return null;
  return project;
}

function hydrateProject(project) {
  const tasks = db.tasks
    .filter((task) => task.projectId === project.id)
    .map((task) => ({
      ...task,
      comments: db.comments
        .filter((comment) => comment.taskId === task.id)
        .map((comment) => ({ ...comment, author: publicUser(db.users.find((user) => user.id === comment.authorId)) }))
    }));

  return {
    ...project,
    members: project.memberIds.map((id) => publicUser(db.users.find((user) => user.id === id))).filter(Boolean),
    tasks
  };
}

function notify(userId, payload) {
  const notification = {
    id: nanoid(),
    userId,
    read: false,
    createdAt: new Date().toISOString(),
    ...payload
  };
  db.notifications.unshift(notification);
  io.to(`user:${userId}`).emit('notification', notification);
  return notification;
}

function emitProject(projectId, event, payload) {
  io.to(`project:${projectId}`).emit(event, payload);
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email is already registered' });
  }

  const user = {
    id: nanoid(),
    name,
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  await saveData();
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((candidate) => candidate.email === email?.toLowerCase());
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get('/api/users', auth, (req, res) => {
  res.json(db.users.map(publicUser));
});

app.get('/api/projects', auth, (req, res) => {
  res.json(db.projects.filter((project) => project.memberIds.includes(req.user.id)).map(hydrateProject));
});

app.post('/api/projects', auth, async (req, res) => {
  const { name, description, memberIds = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  const uniqueMembers = [...new Set([req.user.id, ...memberIds])].filter((id) => db.users.some((user) => user.id === id));
  const project = {
    id: nanoid(),
    name,
    description: description || '',
    ownerId: req.user.id,
    memberIds: uniqueMembers,
    createdAt: new Date().toISOString()
  };
  db.projects.push(project);
  uniqueMembers.filter((id) => id !== req.user.id).forEach((id) => {
    notify(id, { projectId: project.id, type: 'project_invite', message: `${req.user.name} added you to ${project.name}` });
  });
  await saveData();
  emitProject(project.id, 'project:updated', hydrateProject(project));
  res.status(201).json(hydrateProject(project));
});

app.patch('/api/projects/:projectId/members', auth, async (req, res) => {
  const project = requireProjectMember(req.params.projectId, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const memberIds = [...new Set([project.ownerId, ...(req.body.memberIds || [])])].filter((id) => db.users.some((user) => user.id === id));
  const addedIds = memberIds.filter((id) => !project.memberIds.includes(id));
  project.memberIds = memberIds;
  addedIds.filter((id) => id !== req.user.id).forEach((id) => {
    notify(id, { projectId: project.id, type: 'project_invite', message: `${req.user.name} added you to ${project.name}` });
  });
  await saveData();
  const hydrated = hydrateProject(project);
  emitProject(project.id, 'project:updated', hydrated);
  res.json(hydrated);
});

app.post('/api/projects/:projectId/tasks', auth, async (req, res) => {
  const project = requireProjectMember(req.params.projectId, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { title, description, assigneeId, status = 'todo', priority = 'Medium', dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const task = {
    id: nanoid(),
    projectId: project.id,
    title,
    description: description || '',
    status,
    priority,
    dueDate: dueDate || '',
    assigneeId: project.memberIds.includes(assigneeId) ? assigneeId : '',
    creatorId: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.tasks.push(task);
  if (task.assigneeId && task.assigneeId !== req.user.id) {
    notify(task.assigneeId, { projectId: project.id, taskId: task.id, type: 'task_assigned', message: `${req.user.name} assigned you ${task.title}` });
  }
  await saveData();
  emitProject(project.id, 'task:created', task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:taskId', auth, async (req, res) => {
  const task = db.tasks.find((candidate) => candidate.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const project = requireProjectMember(task.projectId, req.user.id);
  if (!project) return res.status(404).json({ error: 'Task not found' });

  const oldAssigneeId = task.assigneeId;
  const updates = req.body;
  Object.assign(task, {
    title: updates.title ?? task.title,
    description: updates.description ?? task.description,
    status: updates.status ?? task.status,
    priority: updates.priority ?? task.priority,
    dueDate: updates.dueDate ?? task.dueDate,
    assigneeId: project.memberIds.includes(updates.assigneeId) ? updates.assigneeId : updates.assigneeId === '' ? '' : task.assigneeId,
    updatedAt: new Date().toISOString()
  });

  if (task.assigneeId && task.assigneeId !== oldAssigneeId && task.assigneeId !== req.user.id) {
    notify(task.assigneeId, { projectId: project.id, taskId: task.id, type: 'task_assigned', message: `${req.user.name} assigned you ${task.title}` });
  }

  await saveData();
  emitProject(project.id, 'task:updated', task);
  res.json(task);
});

app.post('/api/tasks/:taskId/comments', auth, async (req, res) => {
  const task = db.tasks.find((candidate) => candidate.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const project = requireProjectMember(task.projectId, req.user.id);
  if (!project) return res.status(404).json({ error: 'Task not found' });
  if (!req.body.body) return res.status(400).json({ error: 'Comment cannot be empty' });

  const comment = {
    id: nanoid(),
    taskId: task.id,
    authorId: req.user.id,
    body: req.body.body,
    createdAt: new Date().toISOString()
  };
  db.comments.push(comment);
  project.memberIds
    .filter((id) => id !== req.user.id)
    .forEach((id) => notify(id, { projectId: project.id, taskId: task.id, type: 'comment', message: `${req.user.name} commented on ${task.title}` }));
  await saveData();
  const hydrated = { ...comment, author: publicUser(req.user) };
  emitProject(project.id, 'comment:created', hydrated);
  res.status(201).json(hydrated);
});

app.get('/api/notifications', auth, (req, res) => {
  res.json(db.notifications.filter((notification) => notification.userId === req.user.id));
});

app.patch('/api/notifications/:notificationId/read', auth, async (req, res) => {
  const notification = db.notifications.find((candidate) => candidate.id === req.params.notificationId && candidate.userId === req.user.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  notification.read = true;
  await saveData();
  res.json(notification);
});

io.use((socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth.token, JWT_SECRET);
    const user = db.users.find((candidate) => candidate.id === payload.id);
    if (!user) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);

  socket.on('project:join', (projectId) => {
    const project = db.projects.find((candidate) => candidate.id === projectId);
    if (project?.memberIds.includes(socket.user.id)) socket.join(`project:${projectId}`);
  });
});

await loadData();
server.listen(PORT, () => {
  console.log(`API and realtime server running on http://localhost:${PORT}`);
});
