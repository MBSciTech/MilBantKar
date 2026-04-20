const AUTH_SESSION_KEY = 'authSession';
const AUTH_SESSION_TTL_MS = 15 * 24 * 60 * 60 * 1000;

const getStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
};

const clearLegacyAuthState = (storage) => {
  storage.removeItem(AUTH_SESSION_KEY);
  storage.removeItem('username');
  storage.removeItem('userId');
  storage.removeItem('authToken');
};

const normalizeSession = (session) => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const userId = session.userId ? String(session.userId) : '';
  const username = session.username ? String(session.username) : '';
  const expiresAt = Number(session.expiresAt);

  if (!userId || !username || !Number.isFinite(expiresAt)) {
    return null;
  }

  return {
    userId,
    username,
    issuedAt: Number(session.issuedAt) || Date.now(),
    expiresAt,
  };
};

export const saveAuthSession = ({ userId, username }) => {
  const storage = getStorage();

  if (!storage || !userId || !username) {
    return null;
  }

  const now = Date.now();
  const session = {
    userId: String(userId),
    username: String(username),
    issuedAt: now,
    expiresAt: now + AUTH_SESSION_TTL_MS,
  };

  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  storage.setItem('userId', session.userId);
  storage.setItem('username', session.username);
  storage.setItem('authToken', `${session.userId}:${session.expiresAt}`);

  return session;
};

export const getAuthSession = () => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawSession = storage.getItem(AUTH_SESSION_KEY);

  if (!rawSession) {
    const legacyUserId = storage.getItem('userId');
    const legacyUsername = storage.getItem('username');

    if (legacyUserId && legacyUsername) {
      return saveAuthSession({
        userId: legacyUserId,
        username: legacyUsername,
      });
    }

    return null;
  }

  try {
    const session = normalizeSession(JSON.parse(rawSession));

    if (!session) {
      clearLegacyAuthState(storage);
      return null;
    }

    if (session.expiresAt <= Date.now()) {
      clearLegacyAuthState(storage);
      return null;
    }

    storage.setItem('userId', session.userId);
    storage.setItem('username', session.username);

    return session;
  } catch {
    clearLegacyAuthState(storage);
    return null;
  }
};

export const updateAuthSessionUsername = (username) => {
  const storage = getStorage();

  if (!storage || !username) {
    return null;
  }

  const session = getAuthSession();

  if (!session) {
    storage.setItem('username', username);
    return null;
  }

  const nextSession = {
    ...session,
    username: String(username),
  };

  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
  storage.setItem('username', nextSession.username);

  return nextSession;
};

export const clearAuthSession = () => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  clearLegacyAuthState(storage);
};
