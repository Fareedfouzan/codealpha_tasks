import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const db = new DatabaseSync(path.join(__dirname, 'social.db'));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      bio TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id),
      CHECK (follower_id <> following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const count = get('SELECT COUNT(*) AS count FROM users').count;
  if (count > 0) return;

  const users = [
    ['Ava Patel', 'ava', 'Frontend dev sharing tiny wins and design notes.', 'AP'],
    ['Noah Green', 'noah', 'Coffee, code, community, and clean APIs.', 'NG'],
    ['Mia Chen', 'mia', 'Building calm products for busy people.', 'MC'],
    ['Omar Khan', 'omar', 'Student developer learning in public.', 'OK']
  ];

  for (const user of users) {
    run('INSERT INTO users (name, username, bio, avatar) VALUES (?, ?, ?, ?)', user);
  }

  const posts = [
    [1, 'Just shipped a new profile card layout. Small details really do change the whole feel.'],
    [2, 'SQLite plus Express is such a good combo for fast prototypes. Simple, readable, useful.'],
    [3, 'Working on a comment system today. The best interfaces make conversation feel effortless.'],
    [4, 'Mini social app milestone: users, posts, comments, likes, and follows are all alive.']
  ];

  for (const post of posts) {
    run('INSERT INTO posts (user_id, content) VALUES (?, ?)', post);
  }

  const comments = [
    [1, 2, 'That profile card looked sharp.'],
    [1, 3, 'Tiny layout choices matter so much.'],
    [2, 1, 'Agreed. Great for coursework demos too.'],
    [4, 1, 'That is a proper milestone.']
  ];

  for (const comment of comments) {
    run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', comment);
  }

  const likes = [
    [1, 2], [1, 3], [2, 1], [2, 4], [3, 1], [4, 2]
  ];

  for (const like of likes) {
    run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', like);
  }

  const follows = [
    [1, 2], [1, 3], [2, 1], [3, 1], [4, 1], [4, 2]
  ];

  for (const follow of follows) {
    run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', follow);
  }
}

function userSummarySelect(currentUserId) {
  const viewerId = Number.isFinite(Number(currentUserId)) ? Number(currentUserId) : 0;
  return `
    SELECT users.id, users.name, users.username, users.bio, users.avatar,
           COUNT(DISTINCT followers.follower_id) AS followers,
           COUNT(DISTINCT following.following_id) AS following,
           CASE WHEN viewer_follow.follower_id IS NULL THEN 0 ELSE 1 END AS followed_by_me
    FROM users
    LEFT JOIN follows followers ON followers.following_id = users.id
    LEFT JOIN follows following ON following.follower_id = users.id
    LEFT JOIN follows viewer_follow
      ON viewer_follow.following_id = users.id
     AND viewer_follow.follower_id = ${viewerId}
  `;
}

function postResponse(post, currentUserId) {
  const comments = all(`
    SELECT comments.id, comments.content, comments.created_at,
           users.id AS user_id, users.name, users.username, users.avatar
    FROM comments
    JOIN users ON users.id = comments.user_id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC, comments.id ASC
  `, [post.id]);

  return {
    ...post,
    liked_by_me: Boolean(get('SELECT 1 AS liked FROM likes WHERE user_id = ? AND post_id = ?', [currentUserId, post.id])),
    comments
  };
}

function loadFeed(currentUserId) {
  return all(`
    SELECT posts.id, posts.content, posts.created_at,
           users.id AS user_id, users.name, users.username, users.avatar,
           COUNT(DISTINCT likes.user_id) AS like_count,
           COUNT(DISTINCT comments.id) AS comment_count
    FROM posts
    JOIN users ON users.id = posts.user_id
    LEFT JOIN likes ON likes.post_id = posts.id
    LEFT JOIN comments ON comments.post_id = posts.id
    GROUP BY posts.id
    ORDER BY posts.created_at DESC, posts.id DESC
  `).map((post) => postResponse(post, currentUserId));
}

app.get('/api/users', (req, res) => {
  const currentUserId = Number(req.query.currentUserId || 1);
  res.json(all(`
    ${userSummarySelect(currentUserId)}
    GROUP BY users.id, viewer_follow.follower_id
    ORDER BY users.name ASC
  `));
});

app.get('/api/users/:id', (req, res) => {
  const currentUserId = Number(req.query.currentUserId || 1);
  const userId = Number(req.params.id);
  const user = get(`
    ${userSummarySelect(currentUserId)}
    WHERE users.id = ?
    GROUP BY users.id, viewer_follow.follower_id
  `, [userId]);

  if (!user) return res.status(404).json({ error: 'User not found.' });

  const posts = loadFeed(currentUserId).filter((post) => post.user_id === userId);
  const followersList = all(`
    SELECT users.id, users.name, users.username, users.avatar
    FROM follows
    JOIN users ON users.id = follows.follower_id
    WHERE follows.following_id = ?
    ORDER BY users.name ASC
  `, [userId]);
  const followingList = all(`
    SELECT users.id, users.name, users.username, users.avatar
    FROM follows
    JOIN users ON users.id = follows.following_id
    WHERE follows.follower_id = ?
    ORDER BY users.name ASC
  `, [userId]);

  res.json({
    ...user,
    followed_by_me: Boolean(user.followed_by_me),
    posts,
    followers_list: followersList,
    following_list: followingList
  });
});

app.post('/api/users', (req, res) => {
  const { name, username, bio = '' } = req.body;
  if (!name?.trim() || !username?.trim()) {
    return res.status(400).json({ error: 'Name and username are required.' });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanUsername) return res.status(400).json({ error: 'Username must contain letters, numbers, or underscores.' });

  const avatar = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  try {
    const result = run(
      'INSERT INTO users (name, username, bio, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), cleanUsername, bio.trim(), avatar]
    );
    res.status(201).json(get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]));
  } catch (error) {
    res.status(409).json({ error: 'That username is already taken.' });
  }
});

app.get('/api/feed', (req, res) => {
  const currentUserId = Number(req.query.currentUserId || 1);
  res.json(loadFeed(currentUserId));
});

app.post('/api/posts', (req, res) => {
  const { userId, content } = req.body;
  if (!userId || !content?.trim()) return res.status(400).json({ error: 'User and post content are required.' });

  const result = run('INSERT INTO posts (user_id, content) VALUES (?, ?)', [Number(userId), content.trim()]);
  const post = loadFeed(Number(userId)).find((item) => item.id === Number(result.lastInsertRowid));
  res.status(201).json(post);
});

app.post('/api/posts/:id/comments', (req, res) => {
  const { userId, content } = req.body;
  const postId = Number(req.params.id);
  if (!userId || !content?.trim()) return res.status(400).json({ error: 'User and comment content are required.' });

  run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [postId, Number(userId), content.trim()]);
  res.status(201).json(postResponse(loadFeed(Number(userId)).find((post) => post.id === postId), Number(userId)));
});

app.post('/api/posts/:id/like', (req, res) => {
  const { userId } = req.body;
  const postId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: 'User is required.' });

  const existing = get('SELECT 1 AS liked FROM likes WHERE user_id = ? AND post_id = ?', [Number(userId), postId]);
  if (existing) {
    run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [Number(userId), postId]);
  } else {
    run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [Number(userId), postId]);
  }

  res.json(postResponse(loadFeed(Number(userId)).find((post) => post.id === postId), Number(userId)));
});

app.post('/api/users/:id/follow', (req, res) => {
  const followerId = Number(req.body.userId);
  const followingId = Number(req.params.id);
  if (!followerId) return res.status(400).json({ error: 'User is required.' });
  if (followerId === followingId) return res.status(400).json({ error: 'You cannot follow yourself.' });

  const existing = get('SELECT 1 AS followed FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
  if (existing) {
    run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
  } else {
    run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId]);
  }

  const updated = get(`
    ${userSummarySelect(followerId)}
    WHERE users.id = ?
    GROUP BY users.id, viewer_follow.follower_id
  `, [followingId]);

  res.json({ ...updated, followed_by_me: Boolean(updated.followed_by_me) });
});

initDatabase();

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Mini social app running at http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
