# PulseBoard Mini Social Media App

PulseBoard is a small full-stack social media app built with HTML, CSS, JavaScript, Express.js, and SQLite. It supports user profiles, posts, comments, likes, and following other users.

## Features

- Create user profiles with name, username, bio, and avatar initials
- Switch between users to test the app as different people
- View individual user profiles
- Follow and unfollow users
- See follower and following counts
- View follower and following lists on profiles
- Create posts
- Like and unlike posts
- Add comments to posts
- View a global feed and profile-specific posts

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express.js
- Database: SQLite using Node's built-in `node:sqlite` module
- Package manager: npm

## Project Structure

```text
Social_Media/
├── app.js              # Frontend JavaScript
├── index.html          # Main HTML page
├── package.json        # Project scripts and dependencies
├── package-lock.json   # Locked npm dependency versions
├── server.js           # Express backend and SQLite database setup
├── social.db           # SQLite database file
└── styles.css          # Frontend styling
```

## Prerequisites

Install Node.js before running the project.

This project uses the built-in `node:sqlite` module, so use a recent Node.js version that supports it. The project was tested with:

```bash
node --version
```

Example working version:

```bash
v26.0.0
```

Also check npm:

```bash
npm --version
```

## Setup Instructions

1. Open a terminal.

2. Go to the project folder:

```bash
cd /Users/user_name/Downloads/Social_Media
```

3. Install dependencies:

```bash
npm install
```

This installs Express.js and creates/updates the `node_modules` folder.

4. Start the app:

```bash
npm start
```

5. Open the app in your browser:

```text
http://localhost:3000
```

## Development Mode

For development, you can run:

```bash
npm run dev
```

This uses Node's watch mode and restarts the server when backend files change.

## Database Setup

The app uses SQLite.

The database file is:

```text
social.db
```

When the server starts, `server.js` automatically creates these tables if they do not already exist:

- `users`
- `posts`
- `comments`
- `likes`
- `follows`

If the database has no users, the app automatically adds sample data so you can test it immediately.

## Database Tables

### users

Stores profile information:

- `id`
- `name`
- `username`
- `bio`
- `avatar`
- `created_at`

### posts

Stores posts created by users:

- `id`
- `user_id`
- `content`
- `created_at`

### comments

Stores comments on posts:

- `id`
- `post_id`
- `user_id`
- `content`
- `created_at`

### likes

Stores which users liked which posts:

- `user_id`
- `post_id`
- `created_at`

### follows

Stores follow relationships:

- `follower_id`
- `following_id`
- `created_at`

## How to Use the App

1. Select a user from the "Posting as" dropdown.
2. Use the post composer to create a new post.
3. Click "Like" on a post to like it.
4. Write a comment under a post and click "Comment".
5. Click a user's name, avatar, or "Profile" button to open their profile.
6. Click "Follow" or "Following" to follow or unfollow that user.
7. Use "Feed" to return to the global feed.
8. Use "My Profile" to view the selected user's profile.

## API Routes

### Get all users

```http
GET /api/users?currentUserId=1
```

Returns all users with follower counts, following counts, and whether the current user follows them.

### Get one user profile

```http
GET /api/users/:id?currentUserId=1
```

Returns one user profile, their posts, followers list, and following list.

### Create a user

```http
POST /api/users
```

Request body:

```json
{
  "name": "New User",
  "username": "newuser",
  "bio": "Hello, I am new here."
}
```

### Get the feed

```http
GET /api/feed?currentUserId=1
```

Returns all posts with comments, like counts, comment counts, and like status for the current user.

### Create a post

```http
POST /api/posts
```

Request body:

```json
{
  "userId": 1,
  "content": "This is my first post."
}
```

### Add a comment

```http
POST /api/posts/:id/comments
```

Request body:

```json
{
  "userId": 1,
  "content": "Nice post!"
}
```

### Like or unlike a post

```http
POST /api/posts/:id/like
```

Request body:

```json
{
  "userId": 1
}
```

If the user has not liked the post, this route likes it. If the user has already liked it, this route unlikes it.

### Follow or unfollow a user

```http
POST /api/users/:id/follow
```

Request body:

```json
{
  "userId": 1
}
```

If the current user is not following the profile, this route follows them. If they are already following the profile, this route unfollows them.

## Resetting the Database

To reset the app data, stop the server and delete `social.db`.

Then start the server again:

```bash
npm start
```

The server will recreate the database tables and add the sample data again.

## Common Issues

### Port already in use

If port `3000` is already being used, stop the other server or run this app on another port:

```bash
PORT=4000 npm start
```

Then open:

```text
http://localhost:4000
```

### Dependencies missing

If you see an error about Express missing, run:

```bash
npm install
```

### SQLite module error

If Node.js cannot find `node:sqlite`, upgrade Node.js to a newer version that supports the built-in SQLite module.

## Useful Commands

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Start in development mode:

```bash
npm run dev
```

Check Node version:

```bash
node --version
```

Check npm version:

```bash
npm --version
```
