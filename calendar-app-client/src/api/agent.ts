import axios from 'axios';

// Базовый URL нашего бэкенда на .NET
const API_BASE_URL = 'http://localhost:5171/api';

const agent = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Группируем запросы по сущностям (как наши контроллеры)
export const AuthRequests = {
  register: (body: any) => agent.post('/Auth/register', body).then(res => res.data),
  login: (body: any) => agent.post('/Auth/login', body).then(res => res.data),
};

export const GroupRequests = {
  getAll: () => agent.get('/Groups').then(res => res.data),
  create: (body: any) => agent.post('/Groups', body).then(res => res.data),
  delete: (id: number) => agent.delete(`/Groups/${id}`).then(res => res.data),
};

export const TaskRequests = {
  getAll: () => agent.get('/Tasks').then(res => res.data),
  create: (body: any) => agent.post('/Tasks', body).then(res => res.data),
  delete: (id: number) => agent.delete(`/Tasks/${id}`).then(res => res.data),
};

export const UserRequests = {
  getAll: () => agent.get('/Users').then(res => res.data),
  getById: (id: number) => agent.get(`/Users/${id}`).then(res => res.data),
};