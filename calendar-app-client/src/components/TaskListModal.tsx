import React, { useState, useEffect } from 'react';
import { TaskRequests } from '../api/agent';
import type { TaskDto } from '../types/index';

interface TaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: 'today' | 'all';
  onDataChanged: () => void; // Чтобы обновить календарь и сайдбар при удалении
}

export const TaskListModal: React.FC<TaskListModalProps> = ({ isOpen, onClose, filter, onDataChanged }) => {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await TaskRequests.getAll();

      if (filter === 'today') {
        const todayStr = new Date().toDateString();
        const filtered = allTasks.filter(task => {
          if (!task.startAt) return false;
          return new Date(task.startAt).toDateString() === todayStr;
        });
        setTasks(filtered);
      } else {
        setTasks(allTasks);
      }
    } catch (err) {
      console.error('Ошибка при загрузке списка задач:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen, filter]);

  if (!isOpen) return null;

  const handleDeleteTask = async (id: number, title: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить задачу "${title}"?`)) {
      try {
        await TaskRequests.delete(id);
        // Локально убираем из списка, чтобы не делать лишний запрос
        setTasks(prev => prev.filter(t => t.id !== id));
        onDataChanged(); // Пинаем родителя, чтобы обновились сайдбар и календарь
      } catch (err) {
        console.error('Не удалось удалить задачу:', err);
        alert('Ошибка при удалении задачи.');
      }
    }
  };

  // Красивое форматирование даты и времени для таблицы
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    
    // Если смотрим задачи на сегодня, дату выводить избыточно, покажем только время
    if (filter === 'today') {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Для всех задач выводим полную дату и время
    return date.toLocaleString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card list-modal-card">
        <div className="list-modal-header">
          <h3>{filter === 'today' ? 'Задачи на сегодня' : 'Все задачи'}</h3>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <p className="list-modal-loading">Загрузка списка задач...</p>
        ) : (
          <div className="table-wrapper">
            {tasks.length === 0 ? (
              <p className="list-modal-empty">Задач пока нет</p>
            ) : (
              <table className="task-list-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Время</th>
                    <th>Описание</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id}>
                      <td className="task-title-cell">
                        <strong style={{ display: 'block' }}>{task.title}</strong>
                        {task.isExternal && <span className="external-tag">Назначено мне</span>}
                      </td>
                      <td className="task-time-cell">
                        {formatDateTime(task.startAt)}
                      </td>
                      <td className="task-desc-cell">{task.description || '—'}</td>
                      <td>
                        <button 
                          className="btn-delete-task-row" 
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          title="Удалить задачу"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};