import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export const CalendarView: React.FC = () => {
  // В будущем сюда мы добавим загрузку тасок с бэка, а пока накидаем демо-данные
  const demoEvents = [
    {
      id: '1',
      title: 'Сдать лабу по мат-анализу 📐',
      start: '2026-06-08T10:00:00',
      end: '2026-06-08T12:00:00',
      backgroundColor: '#764ba2',
      borderColor: '#764ba2'
    },
    {
      id: '2',
      title: 'ДР друга 🎉',
      start: '2026-06-12',
      allDay: true,
      backgroundColor: '#e53e3e',
      borderColor: '#e53e3e'
    }
  ];

  const handleDateClick = (arg: { dateStr: string }) => {
    alert(`Вы кликнули на дату: ${arg.dateStr}. Скоро здесь будет открываться модалка создания задачи!`);
  };

  const handleEventClick = (info: any) => {
    alert(`Задача: ${info.event.title}\nОписание будет тут.`);
  };

  return (
    <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ru" // Переключаем календарь на русский язык
        firstDay={1} // Начинаем неделю с понедельника
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
        events={demoEvents}
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