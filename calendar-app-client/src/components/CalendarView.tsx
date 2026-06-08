import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskRequests } from '../api/agent';
import type { TaskDto } from '../types/index';

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Функция загрузки задач с бэкенда
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const tasks: TaskDto[] = await TaskRequests.getAll();
      
      // Маппим наши DTO из C# под формат FullCalendar
      const mappedEvents = tasks.map(task => {
        // Если у задачи есть группа, берём её цвет, иначе ставим дефолтный (например, синий)
        const eventColor = task.groupId ? '#3788d8' : '#4a5568'; 
        
        return {
          id: task.id.toString(),
          title: task.title,
          start: task.start, // ISO строка "YYYY-MM-DDTHH:mm:ss"
          end: task.end,     // ISO строка "YYYY-MM-DDTHH:mm:ss"
          description: task.description,
          // Передаем кастомные свойства, если понадобятся при клике
          extendedProps: {
            isExternal: task.isExternal,
            groupId: task.groupId,
            assignedUsers: task.assignedUsers
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

  // Вызываем загрузку при первом рендере компонента
  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDateClick = (arg: { dateStr: string }) => {
    alert(`Вы выбрали дату: ${arg.dateStr}\nСкоро здесь будет открываться форма создания новой задачи!`);
  };

  const handleEventClick = (info: any) => {
    const desc = info.event.extendedProps.description || 'Без описания';
    alert(`Событие: ${info.event.title}\nОписание: ${desc}`);
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
        events={events} // Передаем наш стейт с реальными тасками
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />
    </div>
  );
};