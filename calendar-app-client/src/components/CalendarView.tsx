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
  
  // Стейты для точного диапазона времени вместо одной даты
  const [selectionStart, setSelectionStart] = useState('');
  const [selectionEnd, setSelectionEnd] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const tasks: TaskDto[] = await TaskRequests.getAll();
      
      const mappedEvents = tasks.map((task: TaskDto) => {
        const eventColor = task.groupId ? '#667eea' : '#718096'; 
        
        return {
          id: task.id.toString(),
          title: task.title,
          start: task.startAt, 
          end: task.endAt,     
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

  // ИСПРАВЛЕНО: Умный перехват выделения с округлением времени и валидацией прошлых дат
  const handleSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    
    // Создаем базовые даты для сравнения (срезаем время для чистой проверки дней)
    const selectedDate = new Date(selectInfo.startStr);
    const today = new Date();
    
    const compareSelected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 1. ПРОВЕРКА НА ПРОШЛОЕ: Если выбранный день раньше сегодняшнего — блокируем создание
    if (compareSelected < compareToday) {
      alert('Нельзя создавать задачи на прошедшие даты.');
      calendarApi.unselect(); // Снимаем выделение в UI
      return;
    }

    let finalStartStr = selectInfo.startStr;
    let finalEndStr = selectInfo.endStr;

    // Вспомогательная функция сборки ISO с учетом локального смещения
    const toLocalISOString = (date: Date) => {
      const tzo = -date.getTimezoneOffset();
      const dif = tzo >= 0 ? '+' : '-';
      const pad = (num: number) => (num < 10 ? '0' : '') + num;
      return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':00' + dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
    };

    // FullCalendar в разрезе месяца возвращает строку без 'T' (например, "2026-06-08")
    const isMonthView = !selectInfo.startStr.includes('T');

    if (isMonthView) {
      // 2. ЕСЛИ ВЫБРАЛИ СЕГОДНЯШНИЙ ДЕНЬ В РЕЖИМЕ МЕСЯЦА
      if (compareSelected.getTime() === compareToday.getTime()) {
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

        // Время окончания — ровно на 1 час позже начала
        const endTaskDate = new Date(startTaskDate);
        endTaskDate.setHours(endTaskDate.getHours() + 1);

        finalStartStr = toLocalISOString(startTaskDate);
        finalEndStr = toLocalISOString(endTaskDate);
      } 
      // 3. ЕСЛИ ВЫБРАЛИ БУДУЩУЮ ДАТУ В РЕЖИМЕ МЕСЯЦА
      else {
        const startTaskDate = new Date(selectedDate);
        startTaskDate.setHours(8, 0, 0, 0); // Стандартное время: 8:00

        const endTaskDate = new Date(selectedDate);
        endTaskDate.setHours(9, 0, 0, 0);  // Стандартное время окончания: 9:00

        finalStartStr = toLocalISOString(startTaskDate);
        finalEndStr = toLocalISOString(endTaskDate);
      }
    }

    setSelectionStart(finalStartStr);
    setSelectionEnd(finalEndStr);
    setIsModalOpen(true);
  };

  // Логика удаления задачи через confirm
  const handleEventClick = async (info: any) => {
    const desc = info.event.extendedProps.description || 'Без описания';
    const assignedUsers = info.event.extendedProps.assignedUsers || [];
    
    const usersList = assignedUsers.length > 0 
      ? assignedUsers.map((u: any) => `${u.name} (${u.email})`).join(', ')
      : 'Не назначены';

    const confirmMessage = `Событие: ${info.event.title}\nОписание: ${desc}\nИсполнители: ${usersList}\n\nХотите удалить эту задачу?`;

    if (window.confirm(confirmMessage)) {
      try {
        const taskId = Number(info.event.id);
        
        // Отправляем DELETE запрос на бэкенд
        await TaskRequests.delete(taskId);
        
        // Мгновенно удаляем задачу из сетки FullCalendar на клиенте
        info.event.remove(); 
        
        alert('Задача успешно удалена.');
      } catch (err) {
        console.error('Ошибка при удалении задачи:', err);
        alert('Не удалось удалить задачу.');
      }
    }
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
        eventClick={handleEventClick}
        select={handleSelect} 
      />

      {/* Сама модалка формы */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={fetchTasks} 
        selectionStart={selectionStart} 
        selectionEnd={selectionEnd}
      />
    </div>
  );
};