import React, { useState } from 'react';
import { AuthRequests } from '../api/agent';

interface AuthProps {
  onAuthSuccess: (userId: number, userName: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Логика Входа
        const response = await AuthRequests.login({ email, password });
        // Извлекаем ключи в точности так, как их присылает .NET контроллер
        onAuthSuccess(response.userId, response.name);
      } else {
        // Логика Регистрации
        if (!name.trim()) {
          setError('Имя не может быть пустым');
          return;
        }
        await AuthRequests.register({ name, email, password });
        alert('Регистрация успешна! Теперь вы можете войти.');
        setIsLogin(true); // Переключаем на экран логина
        setPassword('');
        setName('');
      }
    } catch (err: any) {
      console.error("Детали ошибки авторизации:", err);
      
      const backendError = err.response?.data;
      
      // Гибкая обработка ответов об ошибках от бэкенда
      if (typeof backendError === 'string') {
        setError(backendError);
      } else if (backendError?.message) {
        setError(backendError.message);
      } else {
        setError(`Ошибка авторизации (Статус: ${err.response?.status || 'Сеть'})`);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Вход в Календарь' : 'Регистрация'}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Имя</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Иван Ivanov"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="example@mail.com"
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-btn">
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <p>Еще нет аккаунта? <span onClick={() => { setIsLogin(false); setError(''); }}>Зарегистрироваться</span></p>
          ) : (
            <p>Уже есть аккаунт? <span onClick={() => { setIsLogin(true); setError(''); }}>Войти</span></p>
          )}
        </div>
      </div>
    </div>
  );
};