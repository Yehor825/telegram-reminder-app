import { useState, useEffect } from 'react';
import { API_URL } from './config';

const customStyles = {
  root: {
    '--bg-paper': '#EBE5CE',
    '--bg-paper-dark': '#DDD4B6',
    '--ink-primary': '#1A1A1A',
    '--ink-secondary': '#4A4A4A',
    '--line-ruled': '#8C8570',
    '--status-green': '#3F5F3E',
    '--status-orange': '#C47F18',
    '--status-red': '#8B2E2E',
    '--status-gray': '#6B6B6B',
    '--spacing-unit': '8px',
    '--safe-top': 'env(safe-area-inset-top, 20px)',
    '--safe-bottom': 'env(safe-area-inset-bottom, 20px)',
    '--font-serif': "'Times New Roman', Times, serif",
    '--font-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: 'var(--bg-paper)',
    color: 'var(--ink-primary)',
    fontFamily: 'var(--font-serif)',
    WebkitFontSmoothing: 'antialiased',
    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.05) 100%)',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }
};

const Header = ({ username }) => (
  <header className="flex justify-between items-end p-4 border-b-2 border-double border-[#1A1A1A] bg-[#EBE5CE] z-10">
    <div className="text-xl italic border-b border-[#1A1A1A] pb-0.5" style={{ fontFamily: 'var(--font-serif)' }}>
      Напоминания
    </div>
    <div className="text-xs border border-[#1A1A1A] px-2 py-1 rounded-sm">
      {username || 'Пользователь'}
    </div>
  </header>
);

const SpecimenRow = ({ number, title, status, statusColor, frequency, endDate, isExpired = false, onEdit, onDelete }) => (
  <div className={`flex items-baseline py-4 border-b border-[#8C8570] relative ${isExpired ? 'opacity-70' : ''}`}>
    <div className="text-sm text-[#4A4A4A] mr-3 min-w-[20px]" style={{ fontFamily: 'var(--font-serif)' }}>
      {number}.
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className={`text-lg font-bold ${isExpired ? 'line-through text-[#6B6B6B]' : statusColor}`} style={{ fontFamily: 'var(--font-serif)' }}>
          {title}
        </span>
        <span className={`text-sm italic ${isExpired ? 'text-[#6B6B6B]' : statusColor}`} style={{ fontFamily: 'var(--font-serif)' }}>
          {status}
        </span>
      </div>
      <div className="text-[13px] text-[#4A4A4A] flex gap-3" style={{ fontFamily: 'var(--font-serif)' }}>
        <span>{frequency}</span>
        <span>• до {endDate}</span>
      </div>
      {!isExpired && (
        <div className="flex gap-2 mt-2">
          <button onClick={onEdit} className="text-xs underline text-[#4A4A4A] hover:text-[#1A1A1A]">
            ред.
          </button>
          <button onClick={onDelete} className="text-xs underline text-[#8B2E2E] hover:text-[#1A1A1A]">
            удал.
          </button>
        </div>
      )}
    </div>
  </div>
);

const ListView = ({ publications, onEdit, onDelete }) => {
  const activePublications = publications.filter(p => {
    const daysRemaining = getDaysRemaining(p.end_date);
    return daysRemaining >= 0;
  });

  const expiredPublications = publications.filter(p => {
    const daysRemaining = getDaysRemaining(p.end_date);
    return daysRemaining < 0;
  });

  return (
    <div>
      <h3 className="mb-4 border-b border-[#8C8570] pb-1 text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>
        Активные публикации
      </h3>
      
      {activePublications.length === 0 ? (
        <div className="text-center italic text-sm text-[#4A4A4A] py-8" style={{ fontFamily: 'var(--font-serif)' }}>
          Нет активных публикаций
        </div>
      ) : (
        activePublications.map((pub, index) => {
          const daysRemaining = getDaysRemaining(pub.end_date);
          const { status, color } = getStatusInfo(daysRemaining);
          
          return (
            <SpecimenRow
              key={pub.id}
              number={index + 1}
              title={pub.publisher}
              status={status}
              statusColor={color}
              frequency={`${pub.publications_per_day}x / день`}
              endDate={formatDate(pub.end_date)}
              onEdit={() => onEdit(pub)}
              onDelete={() => onDelete(pub.id)}
            />
          );
        })
      )}

      {expiredPublications.length > 0 && (
        <>
          <div className="h-2.5 w-full border-b border-[#1A1A1A] my-5 relative">
            <div className="absolute left-1/2 top-[-4px] transform -translate-x-1/2 bg-[#EBE5CE] px-2.5 text-[#4A4A4A]" style={{ fontFamily: 'var(--font-serif)' }}>
              §
            </div>
          </div>

          {expiredPublications.map((pub, index) => (
            <SpecimenRow
              key={pub.id}
              number={activePublications.length + index + 1}
              title={pub.publisher}
              status="Истекло"
              statusColor="text-[#6B6B6B]"
              frequency={`${pub.publications_per_day}x / день`}
              endDate={formatDate(pub.end_date)}
              isExpired={true}
              onDelete={() => onDelete(pub.id)}
            />
          ))}
        </>
      )}
      
      <div className="text-center italic text-xs text-[#4A4A4A] mt-5" style={{ fontFamily: 'var(--font-serif)' }}>
        Всего записей: {publications.length}
      </div>
    </div>
  );
};

const AddView = ({ onSubmit, editData, onCancel }) => {
  const [formData, setFormData] = useState({
    publisher: editData?.publisher || '',
    groups: editData?.groups || '',
    publicationsPerDay: editData?.publications_per_day || '1',
    endDate: editData?.end_date || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div>
      <h3 className="mb-6 border-b border-[#8C8570] pb-1 text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>
        {editData ? 'Редактирование' : 'Новая запись'}
      </h3>
      
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="relative">
          <label className="block italic text-sm text-[#4A4A4A] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            Кто публикуется
          </label>
          <input
            type="text"
            required
            className="w-full bg-transparent border-none border-b border-[#1A1A1A] rounded-none py-2 text-lg text-[#1A1A1A] outline-none focus:border-b-2 focus:bg-[rgba(0,0,0,0.02)]"
            style={{ fontFamily: 'var(--font-serif)' }}
            placeholder="Например: Иван Петров"
            value={formData.publisher}
            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
          />
        </div>

        <div className="relative">
          <label className="block italic text-sm text-[#4A4A4A] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            Целевые группы
          </label>
          <input
            type="text"
            required
            className="w-full bg-transparent border-none border-b border-[#1A1A1A] rounded-none py-2 text-lg text-[#1A1A1A] outline-none focus:border-b-2 focus:bg-[rgba(0,0,0,0.02)]"
            style={{ fontFamily: 'var(--font-serif)' }}
            placeholder="Группы через запятую"
            value={formData.groups}
            onChange={(e) => setFormData({ ...formData, groups: e.target.value })}
          />
        </div>

        <div className="relative">
          <label className="block italic text-sm text-[#4A4A4A] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            Частота (раз в день)
          </label>
          <input
            type="number"
            required
            min="1"
            className="w-full bg-transparent border-none border-b border-[#1A1A1A] rounded-none py-2 text-lg text-[#1A1A1A] outline-none focus:border-b-2 focus:bg-[rgba(0,0,0,0.02)]"
            style={{ fontFamily: 'var(--font-serif)' }}
            value={formData.publicationsPerDay}
            onChange={(e) => setFormData({ ...formData, publicationsPerDay: e.target.value })}
          />
        </div>

        <div className="relative">
          <label className="block italic text-sm text-[#4A4A4A] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            Дата окончания
          </label>
          <input
            type="date"
            required
            className="w-full bg-transparent border-none border-b border-[#1A1A1A] rounded-none py-2 text-lg text-[#1A1A1A] outline-none focus:border-b-2 focus:bg-[rgba(0,0,0,0.02)]"
            style={{ fontFamily: 'var(--font-serif)' }}
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-[#EBE5CE] border-2 border-[#1A1A1A] text-[#1A1A1A] py-3 px-6 font-bold text-base uppercase tracking-wider cursor-pointer relative active:bg-[#1A1A1A] active:text-[#EBE5CE]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            <span className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 border border-[#8C8570] pointer-events-none"></span>
            {editData ? 'Сохранить' : 'Записать'}
          </button>
          
          {editData && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-[#EBE5CE] border-2 border-[#8C8570] text-[#4A4A4A] py-3 px-6 font-bold text-base uppercase tracking-wider cursor-pointer"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const HistoryView = ({ notifications }) => (
  <div>
    <h3 className="mb-4 border-b border-[#8C8570] pb-1 text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>
      Архив напоминаний
    </h3>
    
    {notifications.length === 0 ? (
      <div className="text-center italic text-sm text-[#4A4A4A] py-8" style={{ fontFamily: 'var(--font-serif)' }}>
        История пуста
      </div>
    ) : (
      notifications.map((notif) => (
        <div key={notif.id} className="flex items-baseline py-4 border-b border-[#8C8570] relative">
          <div className="text-[10px] text-[#4A4A4A] mr-3 min-w-[50px]" style={{ fontFamily: 'var(--font-serif)' }}>
            {formatDateTime(notif.sent_at)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                {notif.publisher}
              </span>
            </div>
            <div className="text-[13px] text-[#4A4A4A]" style={{ fontFamily: 'var(--font-serif)' }}>
              {notif.type === 'one_day_before' ? 'За 1 день' : 'День окончания'}
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);

const ProfileView = ({ user }) => (
  <div>
    <h3 className="mb-6 border-b border-[#8C8570] pb-1 text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>
      Личный кабинет
    </h3>
    
    <div className="border border-[#1A1A1A] p-5 text-center mb-5">
      <div className="w-[60px] h-[60px] rounded-full border border-[#1A1A1A] mx-auto mb-4 flex items-center justify-center italic text-2xl bg-[rgba(0,0,0,0.05)]" style={{ fontFamily: 'var(--font-serif)' }}>
        {user?.first_name?.[0] || 'У'}
      </div>
      <div className="text-xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
        {user?.first_name || 'Пользователь'} {user?.last_name || ''}
      </div>
      <div className="text-sm text-[#4A4A4A]" style={{ fontFamily: 'var(--font-serif)' }}>
        Telegram Mini App
      </div>
    </div>

    <div className="flex flex-col gap-6">
      <div className="relative">
        <label className="block italic text-sm text-[#4A4A4A] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          Telegram ID
        </label>
        <div className="py-2 border-b border-dashed border-[#8C8570]" style={{ fontFamily: 'var(--font-serif)' }}>
          {user?.username ? `@${user.username}` : `ID: ${user?.id || 'N/A'}`}
        </div>
      </div>
    </div>
  </div>
);

const TabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'list', icon: 'I', label: 'Реестр' },
    { id: 'add', icon: '+', label: 'Новый' },
    { id: 'history', icon: 'H', label: 'Архив' },
    { id: 'profile', icon: 'No.', label: 'Кабинет' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[calc(60px+var(--safe-bottom))] bg-[#EBE5CE] border-t border-[#1A1A1A] flex pb-[var(--safe-bottom)] z-[100] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center ${index < tabs.length - 1 ? 'border-r border-[#8C8570]' : ''} ${activeTab === tab.id ? 'bg-[#DDD4B6] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : ''} cursor-pointer transition-all duration-200`}
          style={{
            color: activeTab === tab.id ? 'var(--ink-primary)' : 'var(--ink-secondary)'
          }}
        >
          <div className="text-xl mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            {tab.icon}
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em]">
            {tab.label}
          </div>
        </div>
      ))}
    </nav>
  );
};

// Утилиты
const getDaysRemaining = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end - today) / (1000 * 60 * 60 * 24));
};

const getStatusInfo = (days) => {
  if (days < 0) return { status: 'Истекло', color: 'text-[#6B6B6B]' };
  if (days === 0) return { status: 'Сегодня!', color: 'text-[#8B2E2E]' };
  if (days === 1) return { status: 'Завтра', color: 'text-[#C47F18]' };
  return { status: `${days} дней`, color: 'text-[#3F5F3E]' };
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

// Главный компонент
function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [publications, setPublications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [editingPublication, setEditingPublication] = useState(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      const telegramUser = tg.initDataUnsafe?.user;
      if (telegramUser) {
        setUser(telegramUser);
        setUserId(telegramUser.id);
        loadPublications(telegramUser.id);
        loadNotifications(telegramUser.id);
      }
    } else {
      // Тест без Telegram
      setUserId(123456789);
      setUser({ id: 123456789, first_name: 'Тест', username: 'test_user' });
      loadPublications(123456789);
      loadNotifications(123456789);
    }
  }, []);

  const loadPublications = async (uid) => {
    try {
      const response = await fetch(`${API_URL}/publications?userId=${uid}`);
      const data = await response.json();
      setPublications(data);
    } catch (error) {
      console.error('Error loading publications:', error);
    }
  };

  const loadNotifications = async (uid) => {
    try {
      const response = await fetch(`${API_URL}/notifications?userId=${uid}`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingPublication) {
        await fetch(`${API_URL}/publications/${editingPublication.id}?userId=${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_URL}/publications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, userId })
        });
      }
      
      loadPublications(userId);
      setEditingPublication(null);
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving publication:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить эту публикацию?')) {
      try {
        await fetch(`${API_URL}/publications/${id}?userId=${userId}`, {
          method: 'DELETE'
        });
        loadPublications(userId);
      } catch (error) {
        console.error('Error deleting publication:', error);
      }
    }
  };

  const handleEdit = (publication) => {
    setEditingPublication(publication);
    setActiveTab('add');
  };

  const handleCancelEdit = () => {
    setEditingPublication(null);
    setActiveTab('list');
  };

  return (
    <div style={customStyles.root}>
      <div style={customStyles.body}>
        <div className="flex flex-col h-full" style={{ paddingTop: 'var(--safe-top)' }}>
          <Header username={user?.first_name} />
          
          <div className="flex-1 overflow-y-auto relative">
            <div className="absolute left-0 top-0 bottom-0 w-6 border-r border-[#8C8570] opacity-50 z-0" style={{
              backgroundImage: 'repeating-linear-gradient(to bottom, var(--line-ruled) 0, var(--line-ruled) 1px, transparent 1px, transparent 10px)'
            }}></div>
            
            <div className="py-5 px-5 pb-[100px] pl-10 relative z-[1]">
              {activeTab === 'list' && (
                <ListView 
                  publications={publications} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
              {activeTab === 'add' && (
                <AddView 
                  onSubmit={handleFormSubmit}
                  editData={editingPublication}
                  onCancel={editingPublication ? handleCancelEdit : null}
                />
              )}
              {activeTab === 'history' && <HistoryView notifications={notifications} />}
              {activeTab === 'profile' && <ProfileView user={user} />}
            </div>
          </div>

          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

export default App;
