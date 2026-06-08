import React, { useState, useEffect } from 'react';
import { GroupRequests } from '../api/agent';
import type { GroupDto } from '../types/index';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupChanged: () => void; // Обновляет сайдбар и календарь
  editingGroup: GroupDto | null; // Если null — режим создания, если есть объект — редактирование
}

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, onGroupChanged, editingGroup }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Синхронизируем стейт с входящей группой (режим создания vs редактирования)
  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setName(editingGroup.name);
      } else {
        setName('');
      }
    }
  }, [isOpen, editingGroup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(false);
      if (editingGroup) {
        // Режим редактирования (PUT)
        // Предполагается, что на бэкенде метод принимает объект или id + dto
        await GroupRequests.update(editingGroup.id, { name: name.trim() });
      } else {
        // Режим создания (POST)
        await GroupRequests.create({ name: name.trim() });
      }

      onGroupChanged();
      onClose();
    } catch (err) {
      console.error('Ошибка при сохранении категории:', err);
      alert('Не удалось сохранить категорию.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingGroup) return;

    if (window.confirm(`Вы уверены, что хотите удалить категорию "${editingGroup.name}"? Все задачи из неё останутся, но потеряют привязку к категории.`)) {
      try {
        setLoading(true);
        await GroupRequests.delete(editingGroup.id);
        onGroupChanged();
        onClose();
      } catch (err) {
        console.error('Ошибка при удалении категории:', err);
        alert('Не удалось удалить категорию.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '400px' }}>
        <h3>{editingGroup ? 'Редактировать категорию' : 'Создать категорию'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название категории *</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="Например: Учёба, Спорт, Работа"
              disabled={loading}
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <div>
              {editingGroup && (
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={handleDelete}
                  style={{ backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7' }}
                  disabled={loading}
                >
                  Удалить
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                Отмена
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {editingGroup ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};