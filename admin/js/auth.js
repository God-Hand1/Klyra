// ─── Auth Module ───

const Auth = (() => {
  const TOKEN_KEY = 'klyra_token';
  const USER_KEY = 'klyra_user';

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    return sessionStorage.getItem(USER_KEY) || 'admin';
  }

  function setSession(token, username) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, username);
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function login(username, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Invalid credentials');
    }

    const data = await res.json();
    setSession(data.token, username);
    return data.token;
  }

  function logout() {
    clearSession();
    WS.disconnect();
    App.init();
  }

  return { getToken, getUser, setSession, clearSession, isLoggedIn, login, logout };
})();
