import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { CalendarView } from './components/CalendarView'; // Импортируем календарь

function App() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

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

  // Если не авторизован — показываем форму входа/регистрации
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Если авторизован — показываем основной интерфейс
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Привет, {user.name}! 👋</h2>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          Выйти
        </button>
      </header>

      <main>
        {/* Рендерим полноценный интерактивный календарь */}
        <CalendarView />
      </main>
    </div>
  );
}

export default App;