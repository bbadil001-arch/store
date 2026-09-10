(() => {
  const config = window.ALWATIN_SUPABASE;
  const sessionKey = 'alwatin-supabase-session';
  const authEvent = 'alwatin-auth-change';
  if (!config?.url || !config?.anonKey) return;

  function session() {
    try { return JSON.parse(localStorage.getItem(sessionKey) || 'null'); }
    catch { return null; }
  }

  function saveSession(value) {
    if (value?.access_token) {
      const expiresIn = Number(value.expires_in || 3600);
      const rawExpiry = Number(value.expires_at || 0);
      const expiresAt = rawExpiry ? (rawExpiry < 1e12 ? rawExpiry * 1000 : rawExpiry) : Date.now() + expiresIn * 1000;
      const next = { ...value, expires_at: expiresAt };
      localStorage.setItem(sessionKey, JSON.stringify(next));
    } else {
      localStorage.removeItem(sessionKey);
    }
    window.dispatchEvent(new CustomEvent(authEvent, { detail: value || null }));
  }

  async function parseResponse(response) {
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; }
    catch { data = raw; }
    if (!response.ok) {
      const error = new Error(data?.msg || data?.message || data?.error_description || data?.error || `Supabase request failed (${response.status})`);
      error.status = response.status;
      error.code = data?.error_code || data?.code || '';
      throw error;
    }
    return data;
  }

  async function refreshSession() {
    const current = session();
    if (!current?.refresh_token) {
      saveSession(null);
      return null;
    }
    try {
      const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: current.refresh_token })
      });
      const data = await parseResponse(response);
      saveSession(data);
      return data;
    } catch (error) {
      saveSession(null);
      throw error;
    }
  }

  async function validSession() {
    const current = session();
    if (!current?.access_token) return null;
    if (Number(current.expires_at || 0) - Date.now() < 60000) return refreshSession();
    return current;
  }

  async function request(path, options = {}) {
    const { skipSession = false, noRetry = false, headers: optionHeaders = {}, ...fetchOptions } = options;
    const current = skipSession ? null : await validSession();
    const headers = { apikey: config.anonKey, 'Content-Type': 'application/json', ...optionHeaders };
    headers.Authorization = `Bearer ${current?.access_token || config.anonKey}`;
    const response = await fetch(`${config.url}${path}`, { ...fetchOptions, headers });
    if (response.status === 401 && current?.refresh_token && !noRetry) {
      await refreshSession();
      return request(path, { ...options, noRetry: true });
    }
    return parseResponse(response);
  }

  function consumeAuthHash() {
    if (!location.hash.includes('access_token=')) return null;
    const params = new URLSearchParams(location.hash.slice(1));
    const value = {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      expires_in: Number(params.get('expires_in') || 3600),
      token_type: params.get('token_type') || 'bearer',
      type: params.get('type') || ''
    };
    if (value.access_token) saveSession(value);
    const nextUrl = new URL(location.href);
    nextUrl.hash = '';
    if (value.type === 'recovery') nextUrl.searchParams.set('mode', 'reset');
    history.replaceState({}, document.title, `${nextUrl.pathname}${nextUrl.search}`);
    return value;
  }

  async function signUp(email, password, fullName) {
    const data = await request('/auth/v1/signup', {
      method: 'POST', skipSession: true,
      body: JSON.stringify({ email, password, data: { full_name: fullName } })
    });
    if (data?.access_token) saveSession(data);
    return data;
  }

  async function signInWithPassword(email, password) {
    const data = await request('/auth/v1/token?grant_type=password', {
      method: 'POST', skipSession: true, body: JSON.stringify({ email, password })
    });
    saveSession(data);
    return data;
  }

  async function sendMagicLink(email, redirectTo = `${location.origin}/admin.html`) {
    return request('/auth/v1/otp', { method: 'POST', skipSession: true, body: JSON.stringify({ email, create_user: true, redirect_to: redirectTo }) });
  }

  async function sendPasswordReset(email, redirectTo = `${location.origin}/account.html?mode=reset`) {
    return request('/auth/v1/recover', { method: 'POST', skipSession: true, body: JSON.stringify({ email, redirect_to: redirectTo }) });
  }

  async function updatePassword(password) { return request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) }); }
  async function updateAuthUser(data) { return request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ data }) }); }

  async function getUser() {
    const current = await validSession();
    if (!current?.access_token) return null;
    try {
      const user = await request('/auth/v1/user');
      const stored = session();
      if (stored && user) localStorage.setItem(sessionKey, JSON.stringify({ ...stored, user }));
      return user;
    } catch {
      saveSession(null);
      return null;
    }
  }

  async function signOut() {
    const current = session();
    if (current?.access_token) {
      try { await request('/auth/v1/logout', { method: 'POST', noRetry: true }); }
      catch { /* Local sign-out still completes when the network is unavailable. */ }
    }
    saveSession(null);
  }

  async function select(table, query = '') { return request(`/rest/v1/${table}${query}`, { headers: { Accept: 'application/json' } }); }
  async function insert(table, value, options = {}) { return request(`/rest/v1/${table}`, { method: 'POST', headers: { Prefer: options.returning === false ? 'return=minimal' : 'return=representation' }, body: JSON.stringify(value) }); }
  async function upsert(table, value, onConflict) { return request(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(value) }); }
  async function update(table, query, value) { return request(`/rest/v1/${table}${query}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(value) }); }
  async function remove(table, query) { return request(`/rest/v1/${table}${query}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); }
  async function rpc(name, value = {}) { return request(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(value) }); }

  async function uploadImage(file) {
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const current = await validSession();
    const response = await fetch(`${config.url}/storage/v1/object/product-images/${path}`, {
      method: 'POST',
      headers: { apikey: config.anonKey, Authorization: `Bearer ${current?.access_token || config.anonKey}`, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'true' },
      body: file
    });
    if (!response.ok) throw new Error('Image upload failed');
    return `${config.url}/storage/v1/object/public/product-images/${path}`;
  }

  window.AlwatinDB = {
    config, session, saveSession, validSession, refreshSession, request, consumeAuthHash,
    signUp, signInWithPassword, sendMagicLink, sendPasswordReset, updatePassword, updateAuthUser,
    getUser, signOut, select, insert, upsert, update, remove, rpc, uploadImage, authEvent
  };

  consumeAuthHash();
})();
