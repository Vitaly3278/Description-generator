import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Copy, Upload, Sparkles, Shield, Zap, Globe, ArrowDown, Clock, Moon, Sun, Check, LogOut, Wallet, User, UserPlus, Home, History } from 'lucide-react';
import './App.css';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AdminPage from './pages/AdminPage';
import UploadZone, { useImageUpload } from './components/UploadZone.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import ResultDisplay from './components/ResultDisplay.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';

const API_URL = import.meta?.env?.VITE_API_URL || '/api';

const STYLES = [
  { id: 'short', label: 'Краткое', desc: '2-3 предложения' },
  { id: 'standard', label: 'Стандартное', desc: 'Полное описание' },
  { id: 'seo', label: 'SEO', desc: 'С ключевыми словами' },
];

/* ======================== Landing Page (без auth) ======================== */

function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDark = localStorage.getItem('dark-mode');
    if (savedDark === 'true') setDarkMode(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    try { localStorage.setItem('dark-mode', darkMode); } catch (e) {}
  }, [darkMode]);

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="top-bar-left">
            <Link to="/" className="nav-link" title="На главную">
              <Home size={18} />
            </Link>
          </div>
          <div className="top-bar-right">
            <Link to="/login" className="btn-icon" title="Войти">
              <User size={18} />
            </Link>
            <Link to="/register" className="btn-icon btn-register" title="Зарегистрироваться">
              <UserPlus size={18} />
            </Link>
            <button className="btn-icon" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Светлая тема' : 'Тёмная тема'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <header className="hero">
        <div className="hero-particles">
          <div className="particle p1"></div><div className="particle p2"></div><div className="particle p3"></div>
          <div className="particle p4"></div><div className="particle p5"></div><div className="particle p6"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🎁</span>
            <span className="badge-text">10₽ на баланс при регистрации</span>
          </div>

          <div className="hero-title-wrapper">
            <div className="hero-icon-row">
              <span className="hero-icon hero-icon-photo">📸</span>
              <span className="hero-icon-arrow">
                <span className="arrow-line"></span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M6 15L11 10L6 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="hero-icon hero-icon-sparkle">✨</span>
            </div>

            <h1 className="hero-title">
              <span className="title-line title-line-1">Генератор описания</span>
              <span className="title-line title-line-2">товара по фото</span>
            </h1>
          </div>

          <p className="hero-subtitle">
            Загрузите фото — нейросеть мгновенно определит товар и напишет убедительное описание, которое поможет увеличить продажи.
          </p>

          <div className="hero-features">
            <div className="hero-feature"><Sparkles size={16} /><span>AI-анализ</span></div>
            <div className="hero-feature"><Globe size={16} /><span>Русский</span></div>
            <div className="hero-feature"><Zap size={16} /><span>10 секунд</span></div>
          </div>
          <div className="hero-cta-group">
            <Link to="/register" className="hero-cta hero-cta-primary">
              Регистрация <ArrowDown size={18} />
            </Link>
            <Link to="/login" className="hero-cta hero-cta-secondary">
              Войти
            </Link>
          </div>
        </div>
        <div className="hero-wave"><svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 52C1200 55 1320 60 1380 62L1440 65V80H0Z" className="hero-wave-fill"/></svg></div>
      </header>

      {/* Examples */}
      <section className="examples-section">
        <div className="container">
          <h2 className="section-title">Примеры генераций</h2>
          <p className="section-subtitle">Вот что создаёт нейросеть по фото товара</p>

          <div className="examples-grid">
            <div className="example-card">
              <div className="example-header">
                <span className="example-badge example-badge-short">Краткое</span>
                <span className="example-icon">👟</span>
              </div>
              <div className="example-body">
                <p className="example-title">Кроссовки Nike Air Max 90</p>
                <p>Легендарные кроссовки с видимой воздушной подушкой Air Max обеспечивают непревзойдённую амортизацию при каждом шаге. Верх из натуральной кожи и текстиля обеспечивает надёжную поддержку и вентиляцию.</p>
                <ul className="example-specs">
                  <li>Материал: натуральная кожа</li>
                  <li>Подошва: Air Max</li>
                  <li>Сезон: весна/осень</li>
                </ul>
              </div>
            </div>

            <div className="example-card example-card-popular">
              <div className="example-ribbon">Популярное</div>
              <div className="example-header">
                <span className="example-badge example-badge-standard">Стандартное</span>
                <span className="example-icon">🎧</span>
              </div>
              <div className="example-body">
                <p className="example-title">Беспроводные наушники Sony WH-1000XM5</p>
                <p>Погрузитесь в мир чистого звука с флагманскими наушниками Sony. Технология шумоподавления нового поколения автоматически адаптируется к вашему окружению, а 30 часов автономной работы хватит на весь день.</p>
                <ul className="example-specs">
                  <li>Шумоподавление: ANC нового поколения</li>
                  <li>Время работы: до 30 часов</li>
                  <li>Bluetooth 5.2, multipoint</li>
                  <li>Вес: 250 г</li>
                  <li>Быстрая зарядка: 3 мин = 3 часа</li>
                </ul>
                <div className="example-advantages">
                  <p><strong>Почему стоит купить:</strong></p>
                  <ul className="example-specs">
                    <li>Лучшее шумоподавление в классе</li>
                    <li>Комфортные амбушюры из мягкой кожи</li>
                    <li>Складная конструкция для удобной переноски</li>
                  </ul>
                </div>
                <p className="example-cta">🛒 Закажите прямо сейчас и наслаждайтесь идеальным звуком!</p>
              </div>
            </div>

            <div className="example-card">
              <div className="example-header">
                <span className="example-badge example-badge-seo">SEO</span>
                <span className="example-icon">⌚</span>
              </div>
              <div className="example-body">
                <p className="example-title">Умные часы Apple Watch SE 2023 44mm GPS</p>
                <p>Стильные и функциональные смарт-часы с большим дисплеем Retina, отслеживанием фитнеса, пульса и сна. Идеальный выбор для активного образа жизни и повседневного использования.</p>
                <ul className="example-specs">
                  <li>Дисплей: Retina OLED 44mm</li>
                  <li>Процессор: Apple S8 SiP</li>
                  <li>Защита: WR50 (до 50 м)</li>
                  <li>Датчики: пульс, акселерометр, гироскоп</li>
                  <li>Совместимость: iPhone 8 и новее</li>
                </ul>
                <div className="example-tags">
                  <span className="example-tag">Apple Watch</span>
                  <span className="example-tag">смарт-часы</span>
                  <span className="example-tag">фитнес</span>
                  <span className="example-tag">GPS</span>
                  <span className="example-tag">44mm</span>
                </div>
                <p className="example-cta">🔥 Добавьте в корзину и будьте всегда на связи!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Как это работает</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon photo"><Upload size={24} /></div>
              <h3>1. Зарегистрируйтесь</h3>
              <p>Получите 10₽ на баланс бесплатно</p>
            </div>
            <div className="step-card">
              <div className="step-icon ai"><Sparkles size={24} /></div>
              <h3>2. Загрузите фото</h3>
              <p>Нейросеть распознаёт товар</p>
            </div>
            <div className="step-card">
              <div className="step-icon done"><Check size={24} /></div>
              <h3>3. Готово!</h3>
              <p>Скопируйте или скачайте описание</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container"><div className="footer-content"><div className="footer-logo"><span>📦</span><span>Description generator</span></div><p className="footer-text">Qwen AI • 2026</p></div></div>
      </footer>
    </div>
  );
}

/* ======================== Main Page (с auth) ======================== */

function MainPage() {
  const { user, login, logout, updateBalance, getToken } = useAuth();
  const { image, imagePreview, dragActive, handleImage, handleDrag, handleDrop, clearImage } = useImageUpload();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorBalance, setErrorBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('short');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Load history
  useEffect(() => {
    const token = getToken();
    if (token && user) {
      fetch(`${API_URL}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : []).then(data => {
        setHistory(data.map(g => ({
          id: g.id,
          description: g.description,
          style: g.style,
          productName: g.description?.split('\n')[0]?.replace(/[#*_]/g, '').trim().slice(0, 30) || 'Товар',
          date: g.created_at,
        })));
      }).catch(() => {});
    }
    const savedDark = localStorage.getItem('dark-mode');
    if (savedDark === 'true') setDarkMode(true);
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    try { localStorage.setItem('dark-mode', darkMode); } catch (e) {}
  }, [darkMode]);

  const generateDescription = async () => {
    if (!image) { setError('Сначала загрузите изображение'); return; }

    const token = getToken();
    if (!token) { navigate('/'); return; }

    setLoading(true);
    setError('');
    setErrorBalance(false);
    setDescription('');
    setShowResult(false);
    setProgress(0);
    setProgressStage('Отправка...');

    const formData = new FormData();
    formData.append('file', image);
    formData.append('style', selectedStyle);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 30;
        setProgress(pct);
        setProgressStage('Загрузка изображения...');
      }
    });

    const promise = new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch (e) { reject(new Error('Неверный формат ответа')); }
        } else if (xhr.status === 401) {
          navigate('/');
          reject(new Error('Сессия истекла. Войдите снова.'));
        } else if (xhr.status === 402) {
          setErrorBalance(true);
          reject(new Error(xhr.getResponseHeader('X-Balance-Detail') || `Баланс: ${xhr.getResponseHeader('X-Balance') || '0'}₽. Для генерации нужно 10₽. Пополните баланс.`));
        } else {
          try {
            const d = JSON.parse(xhr.responseText);
            reject(new Error(d.detail || `Ошибка ${xhr.status}`));
          } catch { reject(new Error(`Ошибка ${xhr.status}`)); }
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Сетевая ошибка')));
      xhr.addEventListener('timeout', () => reject(new Error('Превышено время ожидания')));
    });

    xhr.open('POST', `${API_URL}/generate-description`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 120000;
    xhr.send(formData);

    try {
      const stageInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 30) return prev;
          if (prev < 50) { setProgressStage('Анализ изображения...'); return prev + 2; }
          if (prev < 80) { setProgressStage('Генерация описания...'); return prev + 1; }
          return prev;
        });
      }, 500);

      const data = await promise;
      clearInterval(stageInterval);

      setProgress(95);
      setProgressStage('Готово!');
      setDescription(data.description);
      setShowResult(true);
      if (data.balance !== undefined) updateBalance(data.balance);

      // Обновляем историю с сервера
      fetch(`${API_URL}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : []).then(hData => {
        setHistory(hData.map(g => ({
          id: g.id,
          description: g.description,
          style: g.style,
          productName: g.description?.split('\n')[0]?.replace(/[#*_]/g, '').trim().slice(0, 30) || 'Товар',
          date: g.created_at,
        })));
      }).catch(() => {});
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
      setTimeout(() => { setProgress(0); setProgressStage(''); }, 500);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadDescription = (format = 'md') => {
    const filename = `product-description-${Date.now()}.${format}`;
    let content = description;
    let type = 'text/markdown';
    if (format === 'txt') { content = description.replace(/\*\*/g, '').replace(/^- /gm, '• '); type = 'text/plain'; }
    const blob = new Blob([content], { type: type + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (item) => { setDescription(item.description); setShowResult(true); setShowHistory(false); };
  const deleteFromHistory = (id) => setHistory(prev => prev.filter(h => h.id !== id));
  const clearHistory = () => { setHistory([]); };

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="top-bar-left">
            <Link to="/" className="nav-link" title="На главную">
              <Home size={18} />
            </Link>
            <button className={`btn-icon ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(!showHistory)} title="История генераций">
              <History size={18} />
              {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
          </div>
          <div className="top-bar-right">
            {user?.is_admin && (
              <Link to="/admin" className="btn-icon" title="Админ-панель">
                <Shield size={18} />
              </Link>
            )}
            <div className="balance-badge" title="Баланс генераций">
              <Wallet size={15} />
              <span>{user?.balance?.toFixed(0) || '0'}₽</span>
            </div>
            <div className="top-bar-divider" />
            <Link to="/pricing" className="btn-icon" title="Пополнить баланс">
              <Zap size={18} />
            </Link>
            <button className="btn-icon" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Светлая тема' : 'Тёмная тема'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-icon" onClick={logout} title="Выйти из аккаунта">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <header className="hero">
        <div className="hero-particles">
          <div className="particle p1"></div><div className="particle p2"></div><div className="particle p3"></div>
          <div className="particle p4"></div><div className="particle p5"></div><div className="particle p6"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-icon">👋</span>
            <span className="badge-text">Привет, {user?.email?.split('@')[0]}</span>
          </div>

          <div className="hero-title-wrapper">
            <div className="hero-icon-row">
              <span className="hero-icon hero-icon-photo">📸</span>
              <span className="hero-icon-arrow">
                <span className="arrow-line"></span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M6 15L11 10L6 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="hero-icon hero-icon-sparkle">✨</span>
            </div>

            <h1 className="hero-title">
              <span className="title-line title-line-1">Генератор описания</span>
              <span className="title-line title-line-2">товара по фото</span>
            </h1>
          </div>

          <p className="hero-subtitle">
            Загрузите фото — нейросеть мгновенно определит товар и напишет убедительное описание, которое поможет увеличить продажи.
          </p>
          <div className="hero-features">
            <div className="hero-feature"><Sparkles size={16} /><span>AI-анализ</span></div>
            <div className="hero-feature"><Globe size={16} /><span>Русский</span></div>
            <div className="hero-feature"><Zap size={16} /><span>10 секунд</span></div>
          </div>
          <button className="hero-cta" onClick={() => document.querySelector('.main')?.scrollIntoView({ behavior: 'smooth' })}>
            Начать <ArrowDown size={18} />
          </button>
        </div>
        <div className="hero-wave"><svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 52C1200 55 1320 60 1380 62L1440 65V80H0Z" className="hero-wave-fill"/></svg></div>
      </header>

      {/* Main */}
      <main className="main container">
        <div className="card upload-card">
          <div className="card-header">
            <div className="step-badge">1</div>
            <h2 className="card-title"><Upload size={18} />Загрузите фото товара</h2>
          </div>

          <div className="style-selector">
            <label className="style-label">Стиль описания:</label>
            <div className="style-options">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  className={`style-option ${selectedStyle === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(s.id)}
                >
                  <span className="style-name">{s.label}</span>
                  <span className="style-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <UploadZone image={image} imagePreview={imagePreview} onImageSelect={handleImage} onClear={clearImage}
            dragActive={dragActive} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} />

          {loading && <ProgressBar progress={progress} stage={progressStage} />}

          {image && !loading && !description && (
            <button className="btn-generate" onClick={generateDescription}><Sparkles size={16} />Сгенерировать описание</button>
          )}
          {image && !loading && description && (
            <button className="btn-generate" onClick={generateDescription}><Sparkles size={16} />Перегенерировать</button>
          )}
          {error && (
            <div className="error-message">
              ⚠️ {error}
              {errorBalance && (
                <div className="error-balance-actions">
                  <Link to="/pricing" className="btn-balance-topup">
                    <Wallet size={14} /> Пополнить баланс
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card result-card">
          <ResultDisplay description={showResult ? description : ''} copied={copied} onCopy={copyToClipboard} onDownload={downloadDescription} />
        </div>
      </main>

      <HistoryPanel history={history} show={showHistory} onClose={() => setShowHistory(false)} onLoad={loadFromHistory} onDelete={deleteFromHistory} onClear={clearHistory} />

      <footer className="footer">
        <div className="container"><div className="footer-content"><div className="footer-logo"><span>📦</span><span>Description generator</span></div><p className="footer-text">Qwen AI • 2026</p></div></div>
      </footer>
    </div>
  );
}

/* ======================== App Router ======================== */

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AuthRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/admin" element={<AdminPage />} />
      {user ? (
        <Route path="/" element={<MainPage />} />
      ) : (
        <Route path="/" element={<LandingPage />} />
      )}
    </Routes>
  );
}

export default App;
