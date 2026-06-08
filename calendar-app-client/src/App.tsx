import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { CalendarView } from './components/CalendarView';
import { Sidebar } from './components/Sidebar';
import { TaskModal } from './components/TaskModal';
import { TaskListModal } from './components/TaskListModal';
import { GroupModal } from './components/GroupModal'; // ИСПРАВЛЕНО: Импортируем модалку групп
import type { GroupDto } from './types/index';

function App() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  // ИСПРАВЛЕНО: Теперь этот триггер обновляет и сайдбар, и сам календарь
  const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);

  // Управление модалкой создания задачи из сайдбара
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskSelectionStart, setTaskSelectionStart] = useState('');
  const [taskSelectionEnd, setTaskSelectionEnd] = useState('');

  // Управление модалкой списков задач
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [taskListFilter, setTaskListFilter] = useState<'today' | 'all'>('all');

  // Управление модалкой категорий/групп
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupDto | null>(null);

  // При первой загрузке проверяем, есть ли сохраненный юзер в браузере
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUserName = localStorage.getItem('userName');
    
    if (savedUserId && savedUserName) {
      setUser({ id: parseInt(savedUserId), name: savedUserName });
    }
  }, []);

  const handleAuthSuccess = (id: number, name: string) => {
    localStorage.setItem('userId', id.toString());
    localStorage.setItem('userName', name);
    setUser({ id, name });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUser(null);
  };

  // Функция триггера глобального обновления данных на клиенте
  const triggerGlobalRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  // Обработчик клика «Создать задачу» из Сайдбара
  const handleCreateTaskFromSidebar = () => {
    const today = new Date();
    const startTaskDate = new Date(today);
    const currentMinutes = today.getMinutes();

    // Округляем минуты вперед до ближайших 30 или 00 минут
    if (currentMinutes > 0 && currentMinutes <= 30) {
      startTaskDate.setMinutes(30, 0, 0);
    } else if (currentMinutes > 30) {
      startTaskDate.setHours(startTaskDate.getHours() + 1);
      startTaskDate.setMinutes(0, 0, 0);
    } else {
      startTaskDate.setMinutes(0, 0, 0);
    }

    const endTaskDate = new Date(startTaskDate);
    endTaskDate.setHours(endTaskDate.getHours() + 1);

    // Функция для генерации локальной ISO-строки
    const toLocalISOString = (date: Date) => {
      const tzo = -date.getTimezoneOffset();
      const dif = tzo >= 0 ? '+' : '-';
      const pad = (num: number) => (num < 10 ? '0' : '') + num;
      return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        '::' + pad(date.getMinutes()) +
        ':00' + dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
    };

    setTaskSelectionStart(toLocalISOString(startTaskDate));
    setTaskSelectionEnd(toLocalISOString(endTaskDate));
    setIsTaskModalOpen(true);
  };

  const handleShowTodayTasks = () => {
    setTaskListFilter('today');
    setIsTaskListOpen(true);
  };

  const handleShowAllTasks = () => {
    setTaskListFilter('all');
    setIsTaskListOpen(true);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null); // Очищаем объект, сигнализируя о режиме создания новой группы
    setIsGroupModalOpen(true);
  };

  const handleEditGroup = (group: GroupDto) => {
    setEditingGroup(group); // Передаем выбранную группу для редактирования
    setIsGroupModalOpen(true);
  };

  // Если не авторизован — показываем форму входа/регистрации
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Если авторизован — рендерим двухколоночный интерфейс с Сайдбаром и Календарем
  return (
    <div className="app-container">
      {/* Левая колонка: Сайдбар управления */}
      <Sidebar
        onCreateTaskClick={handleCreateTaskFromSidebar}
        onShowTodayTasks={handleShowTodayTasks}
        onShowAllTasks={handleShowAllTasks}
        onCreateGroupClick={handleCreateGroup}
        onEditGroupClick={handleEditGroup}
        refreshTrigger={refreshTrigger}
      />

      {/* Правая колонка: Главный контент с шапкой юзера и Календарем */}
      <div className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#2d3748' }}>Привет, {user.name}! 👋</h2>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500 }}
          >
            Выйти
          </button>
        </header>

        <main>
          {/* ИСПРАВЛЕНО: Передаем refreshTrigger внутрь Календаря, чтобы он реагировал на изменения, сделанные в модалках */}
          <CalendarView 
            onDataChanged={triggerGlobalRefresh} 
            refreshTrigger={refreshTrigger} 
          />
        </main>
      </div>

      {/* 1. Модалка создания задачи (из Сайдбара) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={triggerGlobalRefresh}
        selectionStart={taskSelectionStart}
        selectionEnd={taskSelectionEnd}
      />

      {/* 2. Модалка отображения списков задач (Сегодня / Все задачи) */}
      <TaskListModal
        isOpen={isTaskListOpen}
        onClose={() => setIsTaskListOpen(false)}
        filter={taskListFilter}
        onDataChanged={triggerGlobalRefresh}
      />

      {/* 3. Модалка управления группами/категориями */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        editingGroup={editingGroup}
        onGroupChanged={triggerGlobalRefresh}
      />
    </div>
  );
}

export default App;