(() => {
  const config = window.ALWATIN_SUPABASE;
  const sessionKey = 'alwatin-supabase-session';
  if (!config?.url || !config?.anonKey) return;

  function session() {
    try { return JSON.parse(localStorage.getItem(sessionKey) || 'null'); } catch { return null; }
  }
  function saveSession(value) {
    if (value) localStorage.setItem(sessionKey, JSON.stringify(value));
    else localStorage.removeItem(sessionKey);
  }
  async function request(path, options = {}) {
    const current = session();
    const headers = { apikey: config.anonKey, 'Content-Type': 'application/json', ...(options.headers || {}) };
    headers.Authorization = `Bearer ${current?.access_token || config.anonKey}`;
    const response = await fetch(`${config.url}${path}`, { ...options, headers });
    const body = await response.text();
    let data = null;
    try { data = body ? JSON.parse(body) : null; } catch { data = body; }
    if (!response.ok) throw new Error(data?.message || data?.error_description || `Supabase request failed (${response.status})`);
    return data;
  }
  function consumeAuthHash() {
    if (!location.hash.includes('access_token=')) return null;
    const params = new URLSearchParams(location.hash.slice(1));
    const value = { access_token: params.get('access_token'), refresh_token: params.get('refresh_token'), expires_at: Date.now() + Number(params.get('expires_in') || 3600) * 1000 };
    if (value.access_token) saveSession(value);
    history.replaceState({}, document.title, `${location.pathname}${location.search}`);
    return value;
  }
  async function sendMagicLink(email) {
    return request('/auth/v1/otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        create_user: true,
        options: { emailRedirectTo: `${location.origin}/admin.html` }
      })
    });
  }
  async function getUser() { const current = session(); if (!current?.access_token) return null; try { return await request('/auth/v1/user'); } catch { saveSession(null); return null; } }
  async function signOut() { saveSession(null); }
  async function select(table, query = '') { return request(`/rest/v1/${table}${query}`, { headers: { Accept: 'application/json' } }); }
  async function insert(table, value, options = {}) { return request(`/rest/v1/${table}`, { method: 'POST', headers: { Prefer: options.returning === false ? 'return=minimal' : 'return=representation' }, body: JSON.stringify(value) }); }
  async function upsert(table, value, onConflict) { return request(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(value) }); }
  async function update(table, query, value) { return request(`/rest/v1/${table}${query}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(value) }); }
  async function remove(table, query) { return request(`/rest/v1/${table}${query}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); }
  async function uploadImage(file) {
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const current = session();
    const response = await fetch(`${config.url}/storage/v1/object/product-images/${path}`, {
      method: 'POST',
      headers: { apikey: config.anonKey, Authorization: `Bearer ${current?.access_token || config.anonKey}`, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'true' },
      body: file
    });
    if (!response.ok) throw new Error('Image upload failed');
    return `${config.url}/storage/v1/object/public/product-images/${path}`;
  }
  window.AlwatinDB = { config, request, session, saveSession, consumeAuthHash, sendMagicLink, getUser, signOut, select, insert, upsert, update, remove, uploadImage };
  consumeAuthHash();
})();
