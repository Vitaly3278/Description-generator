import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Plus, Trash2, Save, X, Home, Moon, Sun, UserPlus, Shield, Wallet, ArrowDown, ArrowUp } from 'lucide-react';

const API_URL = import.meta?.env?.VITE_API_URL || '/api';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBalance, setNewBalance] = useState('0');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('auth-token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUsers();
  }, [token, navigate]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) { navigate('/'); return; }
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (e) { setError('Ошибка удаления'); }
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ balance: parseFloat(editBalance), email: editEmail })
      });
      if (res.ok) { setEditingId(null); fetchUsers(); }
    } catch (e) { setError('Ошибка сохранения'); }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail, password: newPassword, balance: parseFloat(newBalance) })
      });
      if (res.ok) { setShowCreate(false); setNewEmail(''); setNewPassword(''); setNewBalance('0'); fetchUsers(); }
      else { const d = await res.json(); setError(d.detail || 'Ошибка создания'); }
    } catch (e) { setError('Ошибка создания'); }
  };

  if (loading) return <div className="auth-page"><div className="auth-card"><h2>Загрузка...</h2></div></div>;

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="top-bar-left">
            <Link to="/" className="nav-link" title="На главную">
              <Home size={18} />
            </Link>
          </div>
          <div className="top-bar-right">
            <div className="balance-badge" title="Админ-панель">
              <Shield size={15} />
              <span>Admin</span>
            </div>
            <div className="top-bar-divider" />
            <button className="btn-icon" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Светлая тема' : 'Тёмная тема'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-page">
        <div className="admin-header">
          <h2><Users size={24} />Пользователи ({users.length})</h2>
          <button className="btn-create" onClick={() => setShowCreate(!showCreate)}>
            <Plus size={16} /> Добавить
          </button>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Create Form */}
        {showCreate && (
          <div className="admin-create-card">
            <h3>Новый пользователь</h3>
            <div className="admin-form-row">
              <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <input type="text" placeholder="Пароль" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <input type="number" placeholder="Баланс" value={newBalance} onChange={e => setNewBalance(e.target.value)} />
              <button className="btn-save" onClick={handleCreate}><Save size={14} /> Создать</button>
              <button className="btn-cancel" onClick={() => setShowCreate(false)}><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Баланс</th>
                <th>Генераций</th>
                <th>Регистрация</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={editingId === u.id ? 'editing' : ''}>
                  <td>{u.id}</td>
                  <td>
                    {editingId === u.id ? (
                      <input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <input type="number" step="1" value={editBalance} onChange={e => setEditBalance(e.target.value)} />
                    ) : (
                      <span className="balance-cell">{u.balance.toFixed(0)}₽</span>
                    )}
                  </td>
                  <td>{u.generation_count || 0}</td>
                  <td className="date-cell">{u.created_at?.slice(0, 10) || '-'}</td>
                  <td>
                    <div className="admin-actions">
                      {editingId === u.id ? (
                        <>
                          <button className="btn-action btn-save" onClick={() => handleSaveEdit(u.id)} title="Сохранить">
                            <Save size={14} />
                          </button>
                          <button className="btn-action btn-cancel" onClick={() => setEditingId(null)} title="Отмена">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-action btn-edit" onClick={() => { setEditingId(u.id); setEditBalance(u.balance); setEditEmail(u.email); }} title="Редактировать">
                            ✏️
                          </button>
                          <button className="btn-action btn-delete" onClick={() => handleDelete(u.id)} title="Удалить">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
