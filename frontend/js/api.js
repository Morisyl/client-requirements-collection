// js/api.js
import { APP_CONFIG } from '../config.js';
import { getToken, clearToken } from './auth.js';

const BASE = APP_CONFIG.api.baseUrl;

// ─── CORE FETCH WRAPPER ────────────────────────────────────────────────────
async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : null),
  });

  if (res.status === 401) { clearToken(); window.location.hash = '#/admin/login'; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────
export const API = {

  // GET /api/services — fetch active service list for homepage grid
  getServices: () => request('GET', '/api/services'),

  // POST /api/submissions — submit a new application (multipart/form-data)
  createSubmission: (formData) => request('POST', '/api/submissions', formData, true),

  // ─── ADMIN AUTH ────────────────────────────────────────────────────────
  // POST /api/admin/auth/login — ★ THE FIX
  login: (email, password) =>
    request('POST', '/api/admin/auth/login', { email, password }),

  // ─── ADMIN SUBMISSIONS ─────────────────────────────────────────────────
  // GET /api/admin/submissions/:id — fetch a single submission by ID
  getSubmission: (id) => request('GET', `/api/admin/submissions/${id}`),

  // GET /api/admin/submissions?page=1&limit=20&status=pending&service_type=...
  getSubmissions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/admin/submissions?${qs}`);
  },

  // PATCH /api/admin/submissions/:id/status
  updateStatus: (id, status) =>
    request('PATCH', `/api/admin/submissions/${id}/status`, { status }),

  // PATCH /api/admin/submissions/:id/notes
  saveNotes: (id, note) =>
    request('PATCH', `/api/admin/submissions/${id}/notes`, { note }),

  // POST /api/admin/submissions/:id/tags
  addTag: (id, tagName, tagColor) =>
    request('POST', `/api/admin/submissions/${id}/tags`, { tag_name: tagName, tag_color: tagColor }),

  // DELETE /api/admin/submissions/:id/tags/:tag
  removeTag: (submissionId, tag) =>
    request('DELETE', `/api/admin/submissions/${submissionId}/tags/${tag}`),

  // ─── ADMIN SERVICES ─────────────────────────────────────────────────────
getAdminServices: () => request('GET', '/api/services'),
getService:       (id) => request('GET', `/api/services/${id}`),
createService:    (data) => request('POST', '/api/services', data),
updateService:    (id, data) => request('PUT', `/api/services/${id}`, data),
deleteService:    (id) => request('DELETE', `/api/services/${id}`),
};