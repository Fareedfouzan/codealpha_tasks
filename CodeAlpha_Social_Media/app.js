const state = {
  users: [],
  currentUserId: 1,
  selectedProfileId: 1,
  view: 'feed',
  selectedProfile: null,
  feed: []
};

const els = {
  currentUser: document.querySelector('#currentUser'),
  createUserForm: document.querySelector('#createUserForm'),
  newName: document.querySelector('#newName'),
  newUsername: document.querySelector('#newUsername'),
  newBio: document.querySelector('#newBio'),
  profileCard: document.querySelector('#profileCard'),
  composer: document.querySelector('#composer'),
  composerAvatar: document.querySelector('#composerAvatar'),
  postContent: document.querySelector('#postContent'),
  postButton: document.querySelector('#postButton'),
  postHint: document.querySelector('#postHint'),
  feedViewButton: document.querySelector('#feedViewButton'),
  myProfileButton: document.querySelector('#myProfileButton'),
  contentHeader: document.querySelector('#contentHeader'),
  peopleList: document.querySelector('#peopleList'),
  feed: document.querySelector('#feed'),
  toast: document.querySelector('#toast')
};

let toastTimer;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(`${value}Z`));
}

function formatFullDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(`${value}Z`));
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || state.users[0];
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('show');
  }, 2200);
}

function updateComposerState() {
  const count = els.postContent.value.length;
  els.postHint.textContent = `${count} / 280`;
  els.postHint.classList.toggle('warning', count > 240);
  els.postButton.disabled = count === 0;
}

function renderUsers() {
  els.currentUser.innerHTML = state.users.map((user) => `
    <option value="${user.id}" ${user.id === state.currentUserId ? 'selected' : ''}>
      ${escapeHtml(user.name)} (@${escapeHtml(user.username)})
    </option>
  `).join('');

  els.peopleList.innerHTML = state.users.map((user) => `
    <article class="person ${user.id === state.selectedProfileId && state.view === 'profile' ? 'active' : ''}">
      <button class="avatar avatar-button" type="button" data-view-profile="${user.id}">${escapeHtml(user.avatar)}</button>
      <div class="person-info">
        <button type="button" data-view-profile="${user.id}" class="truncate">${escapeHtml(user.name)}</button>
        <div class="handle truncate">@${escapeHtml(user.username)} · ${user.followers} followers</div>
      </div>
      <button class="mini-follow ${user.followed_by_me ? 'following' : ''}" type="button" data-follow="${user.id}" ${user.id === state.currentUserId ? 'disabled' : ''}>
        ${user.id === state.currentUserId ? 'You' : user.followed_by_me ? 'Following' : 'Follow'}
      </button>
    </article>
  `).join('');

  const user = currentUser();
  if (user) els.composerAvatar.textContent = user.avatar;
}

async function renderProfile() {
  const profile = await api(`/api/users/${state.selectedProfileId}?currentUserId=${state.currentUserId}`);
  state.selectedProfile = profile;
  const isMe = profile.id === state.currentUserId;

  els.profileCard.innerHTML = `
    <div class="profile-header">
      <div class="profile-id">
        <div class="avatar large">${escapeHtml(profile.avatar)}</div>
        <div>
          <h2 class="profile-name">${escapeHtml(profile.name)}</h2>
          <div class="handle">@${escapeHtml(profile.username)}</div>
        </div>
      </div>
      <button class="button ${profile.followed_by_me ? 'secondary' : ''}" type="button" data-follow="${profile.id}" ${isMe ? 'disabled' : ''}>
        ${isMe ? 'Your Profile' : profile.followed_by_me ? 'Following' : 'Follow'}
      </button>
    </div>
    <p>${escapeHtml(profile.bio || 'No bio added yet.')}</p>
    <div class="profile-stats">
      <div class="stat"><strong>${profile.followers}</strong><span class="muted">Followers</span></div>
      <div class="stat"><strong>${profile.following}</strong><span class="muted">Following</span></div>
      <div class="stat"><strong>${profile.posts.length}</strong><span class="muted">Posts</span></div>
    </div>
    <div class="relationship-grid">
      <div>
        <h3 class="mini-title">Followers</h3>
        ${renderRelationshipList(profile.followers_list)}
      </div>
      <div>
        <h3 class="mini-title">Following</h3>
        ${renderRelationshipList(profile.following_list)}
      </div>
    </div>
  `;
}

function renderRelationshipList(users) {
  if (!users.length) return '<p class="muted compact">None yet</p>';

  return `
    <div class="chip-list">
      ${users.slice(0, 6).map((user) => `
        <button class="profile-chip" type="button" data-view-profile="${user.id}">
          <span class="avatar tiny">${escapeHtml(user.avatar)}</span>
          <span>@${escapeHtml(user.username)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderPost(post) {
  return `
    <article class="post">
      <header class="post-header">
        <div class="profile-id">
          <button class="avatar avatar-button" type="button" data-view-profile="${post.user_id}">${escapeHtml(post.avatar)}</button>
          <div>
            <h3 class="post-author">${escapeHtml(post.name)}</h3>
            <div class="handle">@${escapeHtml(post.username)} · ${formatDate(post.created_at)}</div>
          </div>
        </div>
        <button class="button ghost" type="button" data-view-profile="${post.user_id}">Profile</button>
      </header>
      <div class="post-body">${escapeHtml(post.content)}</div>
      <div class="post-actions">
        <button class="button ${post.liked_by_me ? 'liked' : 'ghost'}" type="button" data-like="${post.id}">
          ${post.liked_by_me ? 'Liked' : 'Like'} · ${post.like_count}
        </button>
        <span class="muted">${post.comment_count} comments</span>
      </div>
      <div class="comments">
        ${post.comments.map((comment) => `
          <div class="comment">
            <button class="avatar avatar-button" type="button" data-view-profile="${comment.user_id}">${escapeHtml(comment.avatar)}</button>
            <div class="comment-bubble">
              <div class="comment-head">
                <strong>${escapeHtml(comment.name)}</strong>
                <time class="comment-time" datetime="${escapeHtml(comment.created_at)}" title="${escapeHtml(formatFullDate(comment.created_at))}">
                  ${escapeHtml(formatDate(comment.created_at))}
                </time>
              </div>
              <div>${escapeHtml(comment.content)}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <form class="comment-form" data-comment-form="${post.id}">
        <input class="input" name="comment" placeholder="Write a comment" required>
        <button class="button secondary" type="submit">Comment</button>
      </form>
    </article>
  `;
}

function renderContent() {
  const isProfile = state.view === 'profile';
  const posts = isProfile ? state.selectedProfile?.posts || [] : state.feed;
  const profile = state.selectedProfile;

  els.profileCard.hidden = !isProfile;
  els.composer.hidden = isProfile && profile?.id !== state.currentUserId;
  els.feedViewButton.classList.toggle('active', !isProfile);
  els.myProfileButton.classList.toggle('active', isProfile && state.selectedProfileId === state.currentUserId);

  els.contentHeader.innerHTML = isProfile
    ? `
      <div>
        <h2 class="section-heading">${escapeHtml(profile?.name || 'Profile')} posts</h2>
        <p class="muted compact">${posts.length} ${posts.length === 1 ? 'post' : 'posts'} on this profile</p>
      </div>
      <button class="button ghost" type="button" data-show-feed>Back to Feed</button>
    `
    : `
      <div>
        <h2 class="section-heading">Home Feed</h2>
        <p class="muted compact">Latest posts from everyone</p>
      </div>
    `;

  if (!posts.length) {
    els.feed.innerHTML = `<div class="empty">${isProfile ? 'This profile has no posts yet.' : 'No posts yet. Start the conversation.'}</div>`;
    return;
  }

  els.feed.innerHTML = posts.map(renderPost).join('');
}

async function refresh() {
  state.users = await api(`/api/users?currentUserId=${state.currentUserId}`);
  if (!state.users.some((user) => user.id === state.currentUserId)) {
    state.currentUserId = state.users[0]?.id || 1;
  }
  if (!state.users.some((user) => user.id === state.selectedProfileId)) {
    state.selectedProfileId = state.currentUserId;
  }
  state.feed = await api(`/api/feed?currentUserId=${state.currentUserId}`);
  renderUsers();
  if (state.view === 'profile') await renderProfile();
  renderContent();
  updateComposerState();
}

els.currentUser.addEventListener('change', async (event) => {
  state.currentUserId = Number(event.target.value);
  state.selectedProfileId = state.currentUserId;
  state.view = 'profile';
  await refresh();
});

els.feedViewButton.addEventListener('click', async () => {
  state.view = 'feed';
  await refresh();
});

els.myProfileButton.addEventListener('click', async () => {
  state.view = 'profile';
  state.selectedProfileId = state.currentUserId;
  await refresh();
});

els.postButton.addEventListener('click', async () => {
  const content = els.postContent.value.trim();
  if (!content) return;
  els.postButton.disabled = true;
  await api('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ userId: state.currentUserId, content })
  });
  els.postContent.value = '';
  await refresh();
  showToast('Post published');
});

els.postContent.addEventListener('input', updateComposerState);

els.createUserForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const user = await api('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      name: els.newName.value,
      username: els.newUsername.value,
      bio: els.newBio.value
    })
  });
  state.currentUserId = user.id;
  state.selectedProfileId = user.id;
  event.target.reset();
  await refresh();
  showToast('Profile created');
});

document.body.addEventListener('click', async (event) => {
  const profileButton = event.target.closest('[data-view-profile]');
  const likeButton = event.target.closest('[data-like]');
  const followButton = event.target.closest('[data-follow]');
  const feedButton = event.target.closest('[data-show-feed]');

  if (profileButton) {
    state.selectedProfileId = Number(profileButton.dataset.viewProfile);
    state.view = 'profile';
    await refresh();
  }

  if (feedButton) {
    state.view = 'feed';
    await refresh();
  }

  if (likeButton) {
    await api(`/api/posts/${likeButton.dataset.like}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId: state.currentUserId })
    });
    await refresh();
    showToast(likeButton.classList.contains('liked') ? 'Post unliked' : 'Post liked');
  }

  if (followButton && !followButton.disabled) {
    const wasFollowing = followButton.textContent.trim() === 'Following';
    await api(`/api/users/${followButton.dataset.follow}/follow`, {
      method: 'POST',
      body: JSON.stringify({ userId: state.currentUserId })
    });
    await refresh();
    showToast(wasFollowing ? 'Unfollowed user' : 'Following user');
  }
});

document.body.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-comment-form]');
  if (!form) return;

  event.preventDefault();
  const input = form.elements.comment;
  const content = input.value.trim();
  if (!content) return;

  await api(`/api/posts/${form.dataset.commentForm}/comments`, {
    method: 'POST',
    body: JSON.stringify({ userId: state.currentUserId, content })
  });
  input.value = '';
  await refresh();
  showToast('Comment added');
});

refresh().catch((error) => {
  els.feed.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
