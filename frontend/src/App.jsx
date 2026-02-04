import { useState, useEffect } from 'react';
import { Plus, Calendar, Users, TrendingUp, Bell, Trash2, Edit2, Check, X } from 'lucide-react';
import { API_URL } from './config';

function App() {
  const [publications, setPublications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('publications');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userId, setUserId] = useState(null);
  
  const [formData, setFormData] = useState({
    publisher: '',
    groups: '',
    publicationsPerDay: '',
    endDate: ''
  });

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id);
        loadPublications(user.id);
        loadNotifications(user.id);
      }
    } else {
      // Для тестирования
      setUserId(123456789);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await fetch(`${API_URL}/publications/${editingId}?userId=${userId}`, {
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
      resetForm();
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
    setFormData({
      publisher: publication.publisher,
      groups: publication.groups,
      publicationsPerDay: publication.publications_per_day,
      endDate: publication.end_date
    });
    setEditingId(publication.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({ publisher: '', groups: '', publicationsPerDay: '', endDate: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return Math.floor((end - today) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell size={24} />
          Напоминания о публикациях
        </h1>
      </div>

      <div className="bg-white border-b sticky top-14 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('publications')}
            className={`flex-1 py-3 px-4 font-medium ${
              activeTab === 'publications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            📋 Публикации
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 font-medium ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            📝 История
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'publications' && (
          <>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-4 shadow-md hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                Добавить публикацию
              </button>
            )}

            {showAddForm && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 className="text-lg font-bold mb-4">
                  {editingId ? 'Редактировать' : 'Новая публикация'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Кто публикуется
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Имя или название"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      В каких группах
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.groups}
                      onChange={(e) => setFormData({ ...formData, groups: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Названия групп"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Публикаций в день
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.publicationsPerDay}
                      onChange={(e) => setFormData({ ...formData, publicationsPerDay: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Конечная дата
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      {editingId ? 'Сохранить' : 'Добавить'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {publications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет публикаций</p>
              </div>
            ) : (
              <div className="space-y-3">
                {publications.map((pub) => {
                  const daysRemaining = getDaysRemaining(pub.end_date);
                  const isUrgent = daysRemaining <= 1;
                  
                  return (
                    <div
                      key={pub.id}
                      className={`bg-white rounded-lg shadow-md p-4 ${
                        isUrgent ? 'border-l-4 border-red-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{pub.publisher}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <Users size={14} />
                            <span>{pub.groups}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(pub)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(pub.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-gray-400" />
                          <span>{pub.publications_per_day} раз/день</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{formatDate(pub.end_date)}</span>
                        </div>
                      </div>

                      <div className={`p-2 rounded-lg text-sm font-medium ${
                        daysRemaining < 0
                          ? 'bg-gray-100 text-gray-600'
                          : daysRemaining === 0
                          ? 'bg-red-100 text-red-700'
                          : daysRemaining === 1
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {daysRemaining < 0
                          ? '❌ Срок истёк'
                          : daysRemaining === 0
                          ? '🔥 Последний день!'
                          : daysRemaining === 1
                          ? '⚠️ Завтра последний день'
                          : `✅ Осталось ${daysRemaining} дн.`
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>История пуста</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {notif.type === 'one_day_before' ? '⏰' : '🔔'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{notif.publisher}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notif.groups}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          {notif.type === 'one_day_before'
                            ? 'За 1 день'
                            : 'День окончания'
                          } • {new Date(notif.sent_at).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
