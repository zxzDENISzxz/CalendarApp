import React, { useState, useEffect } from 'react';
import { GroupRequests, TaskRequests } from '../api/agent';
import type { GroupDto, TaskDto } from '../types/index';

interface SidebarProps {
  onCreateTaskClick: () => void;
  onShowTodayTasks: () => void;
  onShowAllTasks: () => void;
  onCreateGroupClick: () => void;
  onEditGroupClick: (group: GroupDto) => void;
  refreshTrigger: boolean; // Проп для триггера обновления счетчиков и групп
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCreateTaskClick,
  onShowTodayTasks,
  onShowAllTasks,
  onCreateGroupClick,
  onEditGroupClick,
  refreshTrigger
}) => {
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Загрузка данных для счетчиков и списка групп
  const loadSidebarData = async () => {
    try {
      setLoading(true);
      const [fetchedGroups, fetchedTasks]: [GroupDto[], TaskDto[]] = await Promise.all([
        GroupRequests.getAll(),
        TaskRequests.getAll()
      ]);

      setGroups(fetchedGroups);
      setAllCount(fetchedTasks.length);

      // Считаем задачи на сегодня (сравниваем только год-месяц-день)
      const todayStr = new Date().toDateString();
      const todayTasks = fetchedTasks.filter(task => {
        if (!task.startAt) return false;
        return new Date(task.startAt).toDateString() === todayStr;
      });
      setTodayCount(todayTasks.length);

    } catch (err) {
      console.error('Ошибка при загрузке данных сайдбара:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSidebarData();
  }, [refreshTrigger]); // Перезапускаем при изменении триггера (например, после создания задачи/группы)

  return (
    <aside className="sidebar">
      {/* Логотип / Заголовок приложения */}
      <div className="sidebar-brand">
        <h2>CalendarApp</h2>
      </div>

      {/* БЛОК 1: ЗАДАЧИ */}
      <div className="sidebar-section">
        <button className="btn-create-task" onClick={onCreateTaskClick}>
          <span className="icon">＋</span> Создать задачу
        </button>

        <ul className="menu-list">
          <li className="menu-item" onClick={onShowTodayTasks}>
            <span className="menu-item-left">
              <span className="icon">📅</span> Сегодня
            </span>
            <span className="badge badge-today">{todayCount}</span>
          </li>
          <li className="menu-item" onClick={onShowAllTasks}>
            <span className="menu-item-left">
              <span className="icon">📋</span> Все задачи
            </span>
            <span className="badge badge-all">{allCount}</span>
          </li>
        </ul>
      </div>

      <hr className="sidebar-divider" />

      {/* БЛОК 2: ГРУППЫ */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3>Категории</h3>
          <button className="btn-add-group" onClick={onCreateGroupClick} title="Создать категорию">
            ＋
          </button>
        </div>

        {loading && groups.length === 0 ? (
          <p className="sidebar-loading">Загрузка групп...</p>
        ) : (
          <ul className="group-list">
            {groups.map(group => (
              <li key={group.id} className="group-item">
                <div className="group-item-left">
                  {/* Цветной маркер группы. Если с бэкенда прилетает цвет — используем, иначе дефолт */}
                  <span 
                    className="group-marker" 
                    style={{ backgroundColor: (group as any).color || '#718096' }}
                  />
                  <span className="group-name">{group.name}</span>
                </div>
                
                {/* Карандашик для редактирования (появляется при ховере через CSS) */}
                <button 
                  className="btn-edit-group" 
                  onClick={() => onEditGroupClick(group)}
                  title="Редактировать"
                >
                  ✏️
                </button>
              </li>
            ))}
            {groups.length === 0 && <p className="sidebar-empty">Нет категорий</p>}
          </ul>
        )}
      </div>
    </aside>
  );
};