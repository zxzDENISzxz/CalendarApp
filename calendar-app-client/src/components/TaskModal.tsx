import React, { useState, useEffect } from 'react';
import { GroupRequests, UserRequests, TaskRequests } from '../api/agent';
import type { CreateTaskDto, GroupDto, UserDto } from '../types/index';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  selectionStart: string; // Принимаем точные ISO-строки выбора диапазона времени
  selectionEnd: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onTaskCreated, selectionStart, selectionEnd }) => {
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

  // Состояния для быстрого создания новой категории (группы)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [loadingGroup, setLoadingGroup] = useState(false);

  // Вспомогательная функция для сброса выбранных пользователей к текущему из localStorage
  const resetToDefaultUser = () => {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      setSelectedUserIds([parseInt(currentUserId)]);
    } else {
      setSelectedUserIds([]);
    }
  };

  // ИСПРАВЛЕНО: Загружаем группы и пользователей при открытии модалки (без синтаксических разрывов)
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

  // Автоматический парсинг времени из выделенного диапазона FullCalendar
  useEffect(() => {
    if (isOpen && selectionStart && selectionEnd) {
      const startDate = new Date(selectionStart);
      const endDate = new Date(selectionEnd);

      const pad = (num: number) => (num < 10 ? '0' : '') + num;

      // Вытаскиваем локальные часы и минуты
      const startHHMM = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
      const endHHMM = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

      setStartTime(startHHMM);
      setEndTime(endHHMM);
    }
  }, [isOpen, selectionStart, selectionEnd]);

  if (!isOpen) return null;

  const handleUserToggle = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Функция для создания категории прямо "на лету"
  const handleCreateGroupDirectly = async () => {
    if (!newGroupName.trim()) return;

    try {
      setLoadingGroup(true);
      const createdGroup = await GroupRequests.create({ name: newGroupName.trim() });
      setGroups(prevGroups => [...prevGroups, createdGroup]);
      setSelectedGroupId(createdGroup.id);
      setIsCreatingGroup(false);
      setNewGroupName('');
    } catch (err) {
      console.error("Не удалось быстро создать группу:", err);
      alert("Ошибка при создании категории.");
    } finally {
      setLoadingGroup(false);
    }
  };

  // Функция форматирования локальной даты в ISO 8601 со смещением часового пояса
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

    // Собираем итоговые даты на основе базового дня из выборки и выставленного времени в инпутах
    const baseDate = new Date(selectionStart);

    const [startHours, startMinutes] = startTime.split(':');
    const startDateObj = new Date(baseDate);
    startDateObj.setHours(Number(startHours), Number(startMinutes), 0, 0);

    const [endHours, endMinutes] = endTime.split(':');
    const endDateObj = new Date(baseDate);
    endDateObj.setHours(Number(endHours), Number(endMinutes), 0, 0);

    const startIso = toLocalISOString(startDateObj);
    const endIso = toLocalISOString(endDateObj);

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
      onTaskCreated(); 
      onClose();       
      
      // Сброс полей к дефолтному состоянию
      setTitle('');
      setDescription('');
      setSelectedGroupId('');
      setIsCreatingGroup(false);
      setNewGroupName('');
      resetToDefaultUser();
    } catch (err) {
      console.error("Ошибка создания задачи:", err);
      alert("Не удалось сохранить задачу.");
    }
  };

  // Красиво форматируем дату для заголовка (например, "8 июня 2026 г.")
  const formatHeaderDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Новая задача на {formatHeaderDate(selectionStart)}</h3>
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
              
              {!isCreatingGroup ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={selectedGroupId} 
                    onChange={e => setSelectedGroupId(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ flex: 1 }}
                  >
                    <option value="">Без категории</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingGroup(true)}
                    style={{ padding: '0 12px', cursor: 'pointer', fontSize: '16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                  >
                    ＋
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Название новой категории..." 
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    disabled={loadingGroup}
                    style={{ flex: 1, padding: '6px' }}
                  />
                  <button 
                    type="button" 
                    onClick={handleCreateGroupDirectly} 
                    disabled={loadingGroup}
                    style={{ padding: '6px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {loadingGroup ? '...' : 'ОК'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    }} 
                    disabled={loadingGroup}
                    style={{ padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Отмена
                  </button>
                </div>
              )}
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