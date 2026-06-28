// Lightweight fetch wrapper that attaches the stored auth token.
export function getToken() {
  return localStorage.getItem('ielts_token') || '';
}
export function setToken(t) {
  if (t) localStorage.setItem('ielts_token', t);
  else localStorage.removeItem('ielts_token');
}

async function request(method, path, body, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (isForm) {
    payload = body; // FormData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  del: (p) => request('DELETE', p),
  postForm: (p, form) => request('POST', p, form, true),
};
