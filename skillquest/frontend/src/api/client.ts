import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sq_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem('sq_refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(
            'http://localhost:8000/api/auth/token/refresh/',
            { refresh }
          );
          localStorage.setItem('sq_access_token', data.access);
          orig.headers.Authorization = `Bearer ${data.access}`;
          return api(orig);
        } catch {
          localStorage.removeItem('sq_access_token');
          localStorage.removeItem('sq_refresh_token');
        }
      }
    }
    return Promise.reject(err);
  }
);

export const directionsApi = {
  list:       ()         => api.get('/directions/').then(r => r.data),
  get:        (id: string) => api.get(`/directions/${id}/`).then(r => r.data),
  create:     (data: object) => api.post('/directions/', data).then(r => r.data),
  update:     (id: string, data: object) => api.patch(`/directions/${id}/`, data).then(r => r.data),
  delete:     (id: string) => api.delete(`/directions/${id}/`),
  export:     (id: string) => api.get(`/directions/${id}/export/`).then(r => r.data),
  importJson: (data: object) => api.post('/directions/import_json/', data).then(r => r.data),
};

export const branchesApi = {
  list:   (directionId?: string) => api.get('/branches/', { params: directionId ? { direction: directionId } : {} }).then(r => r.data),
  create: (data: object) => api.post('/branches/', data).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/branches/${id}/`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/branches/${id}/`),
};

export const checkpointsApi = {
  create:            (data: object)                  => api.post('/checkpoints/', data).then(r => r.data),
  update:            (id: string, data: object)      => api.patch(`/checkpoints/${id}/`, data).then(r => r.data),
  delete:            (id: string)                    => api.delete(`/checkpoints/${id}/`),
  move:              (id: string, px: number, py: number) => api.patch(`/checkpoints/${id}/move/`, { pos_x: px, pos_y: py }).then(r => r.data),
  addPrerequisite:   (id: string, pid: string)       => api.post(`/checkpoints/${id}/add_prerequisite/`, { prerequisite_id: pid }).then(r => r.data),
  removePrerequisite:(id: string, pid: string)       => api.post(`/checkpoints/${id}/remove_prerequisite/`, { prerequisite_id: pid }).then(r => r.data),
};

export const tasksApi = {
  create: (data: object)               => api.post('/tasks/', data).then(r => r.data),
  update: (id: string, data: object)   => api.patch(`/tasks/${id}/`, data).then(r => r.data),
  delete: (id: string)                 => api.delete(`/tasks/${id}/`),
};

export const authApi = {
  register: (data: object)   => api.post('/auth/register/', data).then(r => r.data),
  login:    (data: object)   => api.post('/auth/login/', data).then(r => r.data),
  me:       ()               => api.get('/auth/me/').then(r => r.data),
  updateMe: (data: object)   => api.patch('/auth/me/', data).then(r => r.data),
  getProgress:         ()           => api.get('/auth/progress/').then(r => r.data),
  completeTask:        (task_id: string, undo = false)       => api.post('/auth/progress/complete-task/', { task_id, undo }).then(r => r.data),
  completeCheckpoint:  (checkpoint_id: string, undo = false) => api.post('/auth/progress/complete-checkpoint/', { checkpoint_id, undo }).then(r => r.data),
  syncProgress:        (data: object) => api.post('/auth/progress/sync/', data).then(r => r.data),
};

export const groupsApi = {
  list:              ()                    => api.get('/auth/groups/').then(r => r.data),
  create:            (data: object)        => api.post('/auth/groups/', data).then(r => r.data),
  get:               (id: string)          => api.get(`/auth/groups/${id}/`).then(r => r.data),
  update:            (id: string, d: object) => api.patch(`/auth/groups/${id}/`, d).then(r => r.data),
  delete:            (id: string)          => api.delete(`/auth/groups/${id}/`),
  join:              (invite_code: string) => api.post('/auth/groups/join/', { invite_code }).then(r => r.data),
  leave:             (id: string)          => api.post(`/auth/groups/${id}/leave/`).then(r => r.data),
  regenerateInvite:  (id: string)          => api.post(`/auth/groups/${id}/regenerate-invite/`).then(r => r.data),
};
