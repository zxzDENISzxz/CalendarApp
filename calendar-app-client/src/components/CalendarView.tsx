import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskRequests } from '../api/agent';
import type { TaskDto } from '../types/index';
import { TaskModal } from './TaskModal';

interface CalendarViewProps {
  onDataChanged?: () => void;
  refreshTrigger?: boolean; 
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onDataChanged, refreshTrigger }) => {
  // ==========================================================================
  // СТЭЙТЫ ДАННЫХ И ЗАГРУЗКИ
  // ==========================================================================
  const [events, setEvents] = useState<any[]>([]);
  const [rawTasks, setRawTasks] = useState<TaskDto[]>([]); // Сохраняем исходные таски для поиска объекта при клике
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // ==========================================================================
  // СТЭЙТЫ МОДАЛЬНОГО ОКНА (Управление режимами и выбранной задачей)
  // ==========================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  // ИСПРАВЛЕНО: Добавлен тип 'edit' для полноценной поддержки редактирования
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create'); 
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);   // Хранит задачу для режима просмотра
  
  const [selectionStart, setSelectionStart] = useState('');
  const [selectionEnd, setSelectionEnd] = useState('');

  // ==========================================================================
  // БЛОК ЛОГИКИ: Загрузка задач с бэкенда и маппинг в события FullCalendar
  // ==========================================================================
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const tasks: TaskDto[] = await TaskRequests.getAll();
      setRawTasks(tasks); // Запоминаем "сырые" данные из БД
      
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
  }, [refreshTrigger]);

  // ==========================================================================
  // БЛОК ЛОГИКИ: Выделение ячеек мышкой (Создание новой задачи)
  // ==========================================================================
  const handleSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    const selectedDate = new Date(selectInfo.startStr);
    const today = new Date();
    
    const compareSelected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (compareSelected < compareToday) {
      alert('Нельзя создавать задачи на прошедшие даты.');
      calendarApi.unselect(); 
      return;
    }

    let finalStartStr = selectInfo.startStr;
    let finalEndStr = selectInfo.endStr;

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

    const isMonthView = !selectInfo.startStr.includes('T');

    if (isMonthView) {
      if (compareSelected.getTime() === compareToday.getTime()) {
        const startTaskDate = new Date(today);
        const currentMinutes = today.getMinutes();

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

        finalStartStr = toLocalISOString(startTaskDate);
        finalEndStr = toLocalISOString(endTaskDate);
      } else {
        const startTaskDate = new Date(selectedDate);
        startTaskDate.setHours(8, 0, 0, 0);

        const endTaskDate = new Date(selectedDate);
        endTaskDate.setHours(9, 0, 0, 0);

        finalStartStr = toLocalISOString(startTaskDate);
        finalEndStr = toLocalISOString(endTaskDate);
      }
    }

    // Явно переключаем в режим создания и сбрасываем старый таск
    setModalMode('create');
    setSelectedTask(null);
    setSelectionStart(finalStartStr);
    setSelectionEnd(finalEndStr);
    setIsModalOpen(true);
  };

  // ==========================================================================
  // БЛОК ЛОГИКИ: Клик по задаче в сетке (Просмотр подробностей)
  // ==========================================================================
  const handleEventClick = (info: any) => {
    const taskId = Number(info.event.id);
    // Ищем полноценный объект задачи в сохраненном массиве rawTasks
    const targetTask = rawTasks.find(t => t.id === taskId);

    if (targetTask) {
      setSelectedTask(targetTask); // Передаем найденную задачу в стэйт
      setModalMode('view');         // Переключаем модалку в режим просмотра
      setIsModalOpen(true);         // Открываем
    }
  };

  // ==========================================================================
  // БЛОК ЛОГИКИ: Удаление задачи (Передается колбэком внутрь TaskModal)
  // ==========================================================================
  const handleTaskDelete = async (taskId: number) => {
    if (window.confirm('Вы уверены, что хотите окончательно удалить эту задачу?')) {
      try {
        await TaskRequests.delete(taskId);
        alert('Задача успешно удалена.');
        
        // Пинаем триггер обновления данных в App.tsx, чтобы обновить сайдбар и перерендерить календарь
        if (onDataChanged) onDataChanged();
      } catch (err) {
        console.error('Ошибка при удалении задачи:', err);
        alert('Не удалось удалить задачу.');
      }
    }
  };

  // ==========================================================================
  // БЛОК ЛОГИКИ: Редактирование (Вызывается при нажатии на "Редактировать")
  // ==========================================================================
  const handleTaskEditClick = () => {
    setModalMode('edit');
  };

  // ==========================================================================
  // БЛОК ИНДИКАЦИИ СОСТОЯНИЙ (Загрузка и Ошибки)
  // ==========================================================================
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

  // ==========================================================================
  // БЛОК ВЕРСТКИ (Рендеринг FullCalendar и Модального Окна)
  // ==========================================================================
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

      {/* Универсальная обновленная модалка */}
      <TaskModal 
        isOpen={isModalOpen}
        mode={modalMode}
        task={selectedTask}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={() => {
          if (onDataChanged) onDataChanged();
        }} 
        onDeleteClick={handleTaskDelete}
        onEditClick={handleTaskEditClick}
        selectionStart={selectionStart} 
        selectionEnd={selectionEnd}
      />
    </div>
  );
};