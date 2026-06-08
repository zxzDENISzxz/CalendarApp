import axios from 'axios';
import type { TaskDto, GroupDto, UserDto, CreateTaskDto } from '../types/index';

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
  getAll: () => agent.get<GroupDto[]>('/Groups').then(res => res.data),
  create: (body: { name: string }) => agent.post<GroupDto>('/Groups', body).then(res => res.data),
  // ДОБАВЛЕНО: Метод обновления группы (PUT)
  update: (id: number, body: { name: string }) => agent.put<GroupDto>(`/Groups/${id}`, body).then(res => res.data),
  delete: (id: number) => agent.delete(`/Groups/${id}`).then(res => res.data),
};

export const TaskRequests = {
  getAll: () => agent.get<TaskDto[]>('/Tasks').then(res => res.data),
  create: (body: CreateTaskDto) => agent.post<TaskDto>('/Tasks', body).then(res => res.data),
  // ИСПРАВЛЕНО: Добавлен PUT-метод для обновления задачи на бэкенде .NET
  update: (id: number, body: CreateTaskDto) => agent.put<TaskDto>(`/Tasks/${id}`, body).then(res => res.data),
  delete: (id: number) => agent.delete(`/Tasks/${id}`).then(res => res.data),
};

export const UserRequests = {
  getAll: () => agent.get<UserDto[]>('/Users').then(res => res.data),
  getById: (id: number) => agent.get<UserDto>(`/Users/${id}`).then(res => res.data),
};