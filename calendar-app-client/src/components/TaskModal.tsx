import React, { useState, useEffect } from 'react';
import { GroupRequests, UserRequests, TaskRequests } from '../api/agent';
import type { CreateTaskDto, GroupDto, UserDto } from '../types/index';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  selectedDate: string; // Формат "YYYY-MM-DD"
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onTaskCreated, selectedDate }) => {
  // Поля формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Списки из бэкенда
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Вспомогательная функция для сброса выбранных пользователей к текущему из localStorage
  const resetToDefaultUser = () => {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      setSelectedUserIds([parseInt(currentUserId)]);
    } else {
      setSelectedUserIds([]);
    }
  };

  // Загружаем группы и пользователей при открытии модалки
  useEffect(() => {
    if (isOpen) {
      const loadFormData = async () => {
        try {
          setLoadingData(true);
          const [fetchedGroups, fetchedUsers] = await Promise.all([
            GroupRequests.getAll(),
            UserRequests.getAll()
          ]);
          setGroups(fetchedGroups);
          setUsers(fetchedUsers);
          
          resetToDefaultUser();
        } catch (err) {
          console.error("Не удалось загрузить данные для формы:", err);
        } finally {
          setLoadingData(false);
        }
      };

      loadFormData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUserToggle = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Функция форматирования локальной даты в ISO 8601 со смещением часового пояса (исправляет сдвиг времени)
  const toLocalISOString = (date: Date) => {
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      dif + pad(Math.floor(Math.abs(tzo) / 60)) +
      ':' + pad(Math.abs(tzo) % 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Парсим введенное время и собираем валидные объекты локальных дат
    const [startHours, startMinutes] = startTime.split(':');
    const startDateObj = new Date(selectedDate);
    startDateObj.setHours(Number(startHours), Number(startMinutes), 0, 0);

    const [endHours, endMinutes] = endTime.split(':');
    const endDateObj = new Date(selectedDate);
    endDateObj.setHours(Number(endHours), Number(endMinutes), 0, 0);

    // Генерируем строки вида 2026-06-08T10:15:00+05:00
    const startIso = toLocalISOString(startDateObj);
    const endIso = toLocalISOString(endDateObj);

    // Логируем для отладки, чтобы проверить чекбоксы перед отправкой
    console.log("Попытка создания задачи. Передаваемые userIds:", selectedUserIds);

    const taskData: CreateTaskDto = {
      title,
      description,
      startAt: startIso,
      endAt: endIso,
      isExternal: false,
      groupId: selectedGroupId === '' ? null : Number(selectedGroupId),
      userIds: selectedUserIds
    };

    try {
      await TaskRequests.create(taskData);
      onTaskCreated(); // Перезагружаем календарь
      onClose();       // Закрываем модалку
      
      // Полная зачистка формы к дефолтному состоянию
      setTitle('');
      setDescription('');
      setSelectedGroupId('');
      setStartTime('10:00');
      setEndTime('11:00');
      resetToDefaultUser();
    } catch (err) {
      console.error("Ошибка создания задачи:", err);
      alert("Не удалось сохранить задачу.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Новая задача на {selectedDate}</h3>
        {loadingData ? (
          <p>Загрузка параметров...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Название задачи *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Например: Сдать лабораторную" />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Дополнительная информация..." rows={3} />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Начало</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Окончание</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Категория (Группа)</label>
              <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">Без категории</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Назначить пользователям:</label>
              <div className="users-checkbox-list">
                {users.map(u => (
                  <label key={u.id} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={selectedUserIds.includes(u.id)} 
                      onChange={() => handleUserToggle(u.id)} 
                    />
                    <span>{u.name} ({u.email})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Отмена</button>
              <button type="submit" className="btn-submit">Создать</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};