import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskRequests } from '../api/agent';
import type { TaskDto } from '../types/index';
import { TaskModal } from './TaskModal'; // Импортируем модалку

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Состояние модального окна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const tasks: TaskDto[] = await TaskRequests.getAll();
      
      // ИСПРАВЛЕНО: добавили скобки (task: TaskDto) для синтаксиса TS
      const mappedEvents = tasks.map((task: TaskDto) => {
        // ИСПРАВЛЕНО: ориентируемся на task.groupId. Если группа есть — красим в индиго, если нет — в серый
        const eventColor = task.groupId ? '#667eea' : '#718096'; 
        
        return {
          id: task.id.toString(),
          title: task.title,
          start: task.startAt, // Маппим startAt из бэкенда в start для FullCalendar
          end: task.endAt,     // Маппим endAt из бэкенда в end для FullCalendar
          description: task.description,
          extendedProps: {
            isExternal: task.isExternal,
            groupId: task.groupId,
            assignedUsers: (task as any).assignedUsers || []
          },
          backgroundColor: eventColor,
          borderColor: eventColor
        };
      });

      setEvents(mappedEvents);
    } catch (err: any) {
      console.error('Ошибка при загрузке задач:', err);
      setError('Не удалось загрузить задачи с сервера.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Перехватываем клик по пустой ячейке дня
  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr); // Сохраняем дату, на которую кликнули
    setIsModalOpen(true);         // Открываем форму создания
  };

  // ИСПРАВЛЕНО: Теперь метод корректно обрабатывает id назначенных пользователей
  const handleEventClick = (info: any) => {
    const desc = info.event.extendedProps.description || 'Без описания';
    const assignedUsers = info.event.extendedProps.assignedUsers || [];
    
    const usersList = assignedUsers.length > 0 
      ? assignedUsers.map((u: any) => `${u.name} (${u.email})`).join(', ')
      : 'Не назначены';

    alert(`Событие: ${info.event.title}\nОписание: ${desc}\nИсполнители: ${usersList}`);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка календаря и задач...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#e53e3e', background: '#ffe3e3', borderRadius: '8px' }}>
        {error}
        <button onClick={fetchTasks} style={{ marginLeft: '15px', padding: '4px 10px', cursor: 'pointer' }}>Повторить</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ru"
        firstDay={1}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        buttonText={{
          today: 'Сегодня',
          month: 'Месяц',
          week: 'Неделя',
          day: 'День'
        }}
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />

      {/* Сама модалка формы */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={fetchTasks} // При успешном добавлении функция fetchTasks перезагрузит сетку автоматически!
        selectedDate={selectedDate}
      />
    </div>
  );
};