import React, { useState, useEffect, useRef } from 'react';
import { GroupRequests, UserRequests, TaskRequests } from '../api/agent';
import type { CreateTaskDto, GroupDto, UserDto, TaskDto } from '../types/index';

// ==========================================================================
// ИНТЕРФЕЙС ПРОПСОВ МОДАЛЬНОГО ОКНА
// ==========================================================================
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void; // Используется и для перерисовок после редактирования
  selectionStart: string; 
  selectionEnd: string;
  mode?: 'create' | 'view' | 'edit'; // ДОБАВЛЕН РЕЖИМ 'edit'
  task?: TaskDto | null;
  onEditClick?: (task: TaskDto) => void;
  onDeleteClick?: (taskId: number) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onTaskCreated, 
  selectionStart, 
  selectionEnd,
  mode = 'create',
  task = null,
  onEditClick,
  onDeleteClick
}) => {
  // ==========================================================================
  // СТЕМАТИЧЕСКИЕ СТЭЙТЫ (Поля формы)
  // ==========================================================================
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskDate, setTaskDate] = useState(''); 
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  // ==========================================================================
  // СТЭЙТЫ ДЛЯ АВТОКОМПЛИТА ПОЛЬЗОВАТЕЛЕЙ
  // ==========================================================================
  const [selectedUsers, setSelectedUsers] = useState<UserDto[]>([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 

  // ==========================================================================
  // СТЭЙТЫ ДЛЯ ДАННЫХ ИЗ БЭКЕНДА И БЫСТРОГО СОЗДАНИЯ КАТЕГОРИЙ
  // ==========================================================================
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [loadingGroup, setLoadingGroup] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Флаги состояний модалки
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  // ==========================================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Сброс и форматирование)
  // ==========================================================================
  const resetToDefaultUser = (allUsersList: UserDto[]) => {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId && allUsersList.length > 0) {
      const defaultUser = allUsersList.find(u => u.id === parseInt(currentUserId));
      if (defaultUser) {
        setSelectedUsers([defaultUser]);
        return;
      }
    }
    setSelectedUsers([]);
  };

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

  // ==========================================================================
  // БЛОК ЭФФЕКТОВ: Загрузка справочников и распределение режимов (Create/View/Edit)
  // ==========================================================================
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
          
          // Если это РЕЖИМ ПРОСМОТРА или РЕЖИМ РЕДАКТИРОВАНИЯ — подтягиваем данные таски
          if ((isViewMode || isEditMode) && task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setSelectedGroupId(task.groupId || '');
            setSelectedUsers((task as any).assignedUsers || []);

            const startSrc = new Date(task.startAt);
            const endSrc = new Date(task.endAt);
            const pad = (num: number) => (num < 10 ? '0' : '') + num;

            setTaskDate(`${startSrc.getFullYear()}-${pad(startSrc.getMonth() + 1)}-${pad(startSrc.getDate())}`);
            setStartTime(`${pad(startSrc.getHours())}:${pad(startSrc.getMinutes())}`);
            setEndTime(`${pad(endSrc.getHours())}:${pad(endSrc.getMinutes())}`);
          } else if (mode === 'create') {
            // Если это чистый РЕЖИМ СОЗДАНИЯ
            setTitle('');
            setDescription('');
            setSelectedGroupId('');
            setIsCreatingGroup(false);
            setNewGroupName('');
            resetToDefaultUser(fetchedUsers);
          }
        } catch (err) {
          console.error("Не удалось загрузить данные для формы:", err);
        } finally {
          setLoadingData(false);
        }
      };

      loadFormData();
      setSearchQuery('');
      setIsDropdownOpen(false);
    }
  }, [isOpen, mode, task]);

  // ==========================================================================
  // БЛОК ЭФФЕКТОВ: Парсинг дат при выделении ячеек (Только для Create)
  // ==========================================================================
  useEffect(() => {
    if (isOpen && mode === 'create' && selectionStart && selectionEnd) {
      const startDate = new Date(selectionStart);
      const endDate = new Date(selectionEnd);
      const pad = (num: number) => (num < 10 ? '0' : '') + num;

      setTaskDate(`${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`);
      setStartTime(`${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`);
      setEndTime(`${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`);
    }
  }, [isOpen, selectionStart, selectionEnd, mode]);

  // ==========================================================================
  // БЛОК ЭФФЕКТОВ: Закрытие дропдауна пользователей при клике вовне
  // ==========================================================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // ==========================================================================
  // БЛОК ЛОГИКИ: Управление списком назначенных пользователей
  // ==========================================================================
  const filteredUsers = users.filter(u => {
    if (selectedUsers.some(selected => selected.id === u.id)) return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return u.name.toLowerCase().includes(query) || (u.email && u.email.toLowerCase().includes(query));
  });

  const handleSelectUser = (user: UserDto) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // ==========================================================================
  // БЛОК ЛОГИКИ: Быстрое добавление категории прямо на лету
  // ==========================================================================
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

  // ==========================================================================
  // БЛОК ЛОГИКИ: Отправка формы (Создание ИЛИ Обновление задачи)
  // ==========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return; 

    if (!title.trim() || !taskDate) return;

    const [year, month, day] = taskDate.split('-').map(Number);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startDateObj = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);

    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const endDateObj = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

    const today = new Date();
    // Валидацию на прошедшее время делаем только для новых задач, чтобы старые можно было редактировать
    if (mode === 'create' && startDateObj < today) {
      alert('Нельзя создавать задачи на прошедшее время.');
      return;
    }

    if (endDateObj <= startDateObj) {
      alert('Время окончания должно быть позже времени начала.');
      return;
    }

    // Собираем DTO (структура совпадает и для Create, и для Update)
    const taskData: CreateTaskDto = {
      title,
      description,
      startAt: toLocalISOString(startDateObj),
      endAt: toLocalISOString(endDateObj),
      isExternal: false,
      groupId: selectedGroupId === '' ? null : Number(selectedGroupId),
      userIds: selectedUsers.map(u => u.id)
    };

    try {
      if (isEditMode && task) {
        // Вызываем метод UPDATE на бэкенде (agent.ts)
        await TaskRequests.update(task.id, taskData);
      } else {
        // Иначе создаем новую
        await TaskRequests.create(taskData);
      }
      onTaskCreated(); // Перерисовываем календарную сетку
      onClose();       // Закрываем окно
    } catch (err) {
      console.error("Ошибка сохранения задачи:", err);
      alert("Не удалось сохранить изменения.");
    }
  };

  // Вычисляем динамический заголовок
  const getModalTitle = () => {
    if (isViewMode) return 'Просмотр задачи';
    if (isEditMode) return 'Редактирование задачи';
    return 'Новая задача';
  };

  // ==========================================================================
  // БЛОК ВЕРСТКИ (Рендеринг компонента)
  // ==========================================================================
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* КНОПКА-КРЕСТИК В ВЕРХНЕМ ПРАВОМ УГЛУ */}
        <button type="button" className="modal-close-x" onClick={onClose}>
          &times;
        </button>

        <h3>{getModalTitle()}</h3>
        
        {loadingData ? (
          <p>Загрузка параметров...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ИНПУТ: Название */}
            <div className="form-group">
              <label>Название задачи *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                disabled={isViewMode} // заблокировано только в режиме просмотра
                placeholder="Например: Сдать лабораторную" 
              />
            </div>

            {/* ИНПУТ: Описание */}
            <div className="form-group">
              <label>Описание</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                disabled={isViewMode}
                placeholder="Дополнительная информация..." 
                rows={3} 
              />
            </div>

            {/* ИНПУТ: Дата */}
            <div className="form-group">
              <label>Дата задачи *</label>
              <input 
                type="date" 
                value={taskDate} 
                onChange={e => setTaskDate(e.target.value)} 
                disabled={isViewMode}
                required 
              />
            </div>

            {/* ИНПУТЫ: Диапазон времени */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Начало</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={isViewMode} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Окончание</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={isViewMode} required />
              </div>
            </div>

            {/* СЕКЦИЯ: Выбор или добавление Категории */}
            <div className="form-group">
              <label>Категория (Группа)</label>
              
              {!isCreatingGroup ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={selectedGroupId} 
                    onChange={e => setSelectedGroupId(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isViewMode}
                    style={{ flex: 1 }}
                  >
                    <option value="">Без категории</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  {!isViewMode && (
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingGroup(true)}
                      style={{ padding: '0 12px', cursor: 'pointer', fontSize: '16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                    >
                      ＋
                    </button>
                  )}
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

            {/* СЕКЦИЯ: Список выбранных исполнителей и Autocomplete поиск */}
            <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
              <label>Назначить пользователям:</label>
              
              {selectedUsers.length > 0 && (
                <div className="selected-users-tags" style={{ marginTop: '6px' }}>
                  {selectedUsers.map(u => (
                    <span key={u.id} className="user-tag">
                      {u.name}
                      {!isViewMode && <button type="button" onClick={() => handleRemoveUser(u.id)}>×</button>}
                    </span>
                  ))}
                </div>
              )}

              {!isViewMode && (
                <>
                  <input
                    type="text"
                    placeholder="Начните вводить имя или почту..."
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                  />

                  {isDropdownOpen && (
                    <div className="user-search-dropdown">
                      {filteredUsers.length === 0 ? (
                        <div className="dropdown-item-empty">Пользователи не найдены</div>
                      ) : (
                        filteredUsers.map(u => (
                          <div key={u.id} className="dropdown-item-user" onClick={() => handleSelectUser(u)}>
                            <div className="dropdown-user-name">{u.name}</div>
                            {u.email && <div className="dropdown-user-email">{u.email}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* НИЖНЯЯ ПАНЕЛЬ: Переключаем кнопки в зависимости от 3х режимов */}
            <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              {isViewMode && (
                <>
                  {/* РЕЖИМ ПРОСМОТРА: Редактировать слева, Удалить справа */}
                  <button
                    type="button"
                    className="btn-submit"
                    style={{ backgroundColor: '#f59e0b', margin: 0 }}
                    onClick={() => {
                      if (task && onEditClick) {
                        onEditClick(task); // Триггерим переход в режим edit у родителя
                      }
                    }}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    className="btn-cancel"
                    style={{ backgroundColor: '#fee2e2', color: '#ef4444', margin: 0 }}
                    onClick={() => {
                      if (task && onDeleteClick) {
                        onDeleteClick(task.id);
                        onClose();
                      }
                    }}
                  >
                    Удалить задачу
                  </button>
                </>
              )}

              {isEditMode && (
                <>
                  {/* РЕЖИМ РЕДАКТИРОВАНИЯ: Отмена и Сохранить изменения справа */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      className="btn-cancel" 
                      onClick={onClose} // Либо закрываем, либо можно настроить сброс обратно в 'view'
                    >
                      Отмена
                    </button>
                    <button 
                      type="submit" 
                      className="btn-submit"
                      style={{ backgroundColor: '#4f46e5' }}
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </>
              )}

              {mode === 'create' && (
                <>
                  {/* РЕЖИМ СОЗДАНИЯ */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn-cancel" onClick={onClose}>Отмена</button>
                    <button type="submit" className="btn-submit">Создать</button>
                  </div>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};