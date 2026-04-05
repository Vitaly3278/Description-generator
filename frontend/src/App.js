import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Upload, Loader2, Check, Image as ImageIcon, Sparkles, Shield, Zap, Globe, ArrowDown, Clock, Download, FileText, Moon, Sun, Trash2, LayoutGrid, Eye } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const STYLES = [
  { id: 'short', label: 'Краткое', desc: '2-3 предложения' },
  { id: 'standard', label: 'Стандартное', desc: 'Полное описание' },
  { id: 'seo', label: 'SEO', desc: 'С ключевыми словами' },
];

const PROMPTS = {
  short: `Ты - профессиональный копирайтер.
Посмотри на фото товара и создай КРАТКОЕ продающее описание (2-3 предложения + 3 ключевые характеристики).

Структура:
1. **Название товара** (1 строка)
2. **Краткое описание** (2-3 предложения)
3. **Ключевые характеристики** (3 пункта)

На русском языке.`,

  standard: `Ты - профессиональный копирайтер для интернет-магазина.
Посмотри на фото товара и создай продающее описание по структуре:

1. **Название товара** - короткое, привлекательное (1 строка)
2. **Краткое описание** - 2-3 предложения, подчеркивающие главные преимущества
3. **Ключевые характеристики** - список из 5-7 пунктов
4. **Преимущества** - 3-4 пункта, почему стоит купить именно этот товар
5. **Призыв к действию** - короткая фраза для покупки

Описание должно быть на русском языке, живым и продающим стилем.
Не используй placeholder тексты - пиши конкретное название.`,

  seo: `Ты - SEO-копирайтер для маркетплейсов.
Посмотри на фото товара и создай SEO-оптимизированное описание:

1. **Заголовок** - с ключевыми словами для поиска (до 80 символов)
2. **Описание для поиска** - 3-4 предложения с ключевыми словами
3. **Характеристики** - 7-10 пунктов (покупатели ищут именно их)
4. **Преимущества** - 4-5 пунктов с эмоциональными триггерами
5. **Ключевые слова для поиска** - 5-8 тегов через запятую
6. **Призыв к действию**

Оптимизировано для Ozon, Wildberries, Яндекс.Маркет. На русском языке.`
};

function App() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('standard');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState('ozon');
  const progressRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('description-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {}

    const savedDark = localStorage.getItem('dark-mode');
    if (savedDark === 'true') setDarkMode(true);
  }, []);

  // Save history
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem('description-history', JSON.stringify(history.slice(0, 20)));
      } catch (e) {}
    }
  }, [history]);

  // Dark mode class
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    try { localStorage.setItem('dark-mode', darkMode); } catch (e) {}
  }, [darkMode]);

  // Progress animation
  useEffect(() => {
    if (loading) {
      let stage = 0;
      const stages = [
        { progress: 15, text: 'Загрузка изображения...' },
        { progress: 30, text: 'Отправка на сервер...' },
        { progress: 50, text: 'Анализ изображения...' },
        { progress: 75, text: 'Генерация описания...' },
        { progress: 90, text: 'Финальная обработка...' },
      ];

      const interval = setInterval(() => {
        if (stage < stages.length) {
          setProgress(stages[stage].progress);
          setProgressStage(stages[stage].text);
          stage++;
        } else {
          clearInterval(interval);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleImage = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой (макс. 10MB)');
      return;
    }
    setError('');
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImage(file);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
  }, []);

  const generateDescription = async () => {
    if (!image) { setError('Сначала загрузите изображение'); return; }

    setLoading(true);
    setError('');
    setDescription('');
    setShowResult(false);
    setProgress(5);
    setProgressStage('Подготовка...');

    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('style', selectedStyle);

      const response = await fetch(`${API_URL}/api/generate-description`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Ошибка при генерации');
      }

      setProgress(95);
      setProgressStage('Готово!');

      const data = await response.json();
      setDescription(data.description);
      setShowResult(true);

      // Add to history
      const item = {
        id: Date.now(),
        description: data.description,
        style: selectedStyle,
        imagePreview: imagePreview,
        date: new Date().toISOString(),
      };
      setHistory(prev => [item, ...prev].slice(0, 20));
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
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = description;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadDescription = (format = 'md') => {
    const filename = `product-description-${Date.now()}.${format}`;
    let content = description;
    let type = 'text/markdown';

    if (format === 'txt') {
      content = description.replace(/\*\*/g, '').replace(/^- /gm, '• ');
      type = 'text/plain';
    }

    const blob = new Blob([content], { type: type + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setImage(null);
    setImagePreview(null);
    setDescription('');
    setError('');
    setShowResult(false);
    setShowPreview(false);
  };

  const loadFromHistory = (item) => {
    setDescription(item.description);
    setSelectedStyle(item.style);
    setShowResult(true);
    setShowHistory(false);
    if (item.imagePreview) setImagePreview(item.imagePreview);
  };

  const deleteFromHistory = (id, e) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('description-history');
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="top-bar-left">
            <button
              className={`btn-icon ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
              title="История"
            >
              <Clock size={18} />
              {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
          </div>
          <div className="top-bar-right">
            <button
              className="btn-icon"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <header className="hero">
        <div className="container hero-content">
          <div className="hero-badge">✨ Бесплатно на тестовом лимите</div>
          <div className="logo">
            <div className="logo-icon-wrapper">
              <span>📦</span>
            </div>
            <h1>Description <span className="highlight">generator</span></h1>
          </div>
          <p className="hero-title">Генерация продающих описаний товаров по фото с помощью ИИ</p>
          <p className="hero-subtitle">
            Загрузите фотографию товара — нейросеть Qwen создаст профессиональное описание
            с характеристиками, преимуществами и призывом к покупке
          </p>
          <div className="hero-features">
            <div className="hero-feature"><Sparkles size={16} /><span>AI-анализ</span></div>
            <div className="hero-feature"><Globe size={16} /><span>Русский язык</span></div>
            <div className="hero-feature"><Zap size={16} /><span>10-15 сек</span></div>
            <div className="hero-feature"><Shield size={16} /><span>Без регистрации</span></div>
          </div>
          <div className="hero-arrow" onClick={() => document.querySelector('.main')?.scrollIntoView({ behavior: 'smooth' })}>
            <ArrowDown size={22} />
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 52C1200 55 1320 60 1380 62L1440 65V80H0Z" className="hero-wave-fill"/></svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="main container">
        {/* Upload Section */}
        <div className="card upload-card">
          <div className="card-header">
            <div className="step-badge">1</div>
            <h2 className="card-title"><Upload size={18} />Загрузите фото товара</h2>
          </div>

          {/* Style Selector */}
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

          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${imagePreview ? 'has-image' : ''}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="preview-container">
                <img src={imagePreview} alt="Preview" className="preview-image" />
                <button className="btn-remove" onClick={clearAll}>✕</button>
              </div>
            ) : (
              <label className="upload-placeholder" htmlFor="file-input">
                <div className="upload-icon-wrapper">
                  <ImageIcon size={40} />
                </div>
                <p className="upload-text">Перетащите фото сюда</p>
                <p className="upload-subtext">или нажмите для выбора</p>
                <span className="upload-hint">JPG, PNG, WEBP до 10MB</span>
              </label>
            )}
            <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-info">
                <Loader2 size={14} className="spinner" />
                <span>{progressStage}</span>
                <span className="progress-pct">{progress}%</span>
              </div>
            </div>
          )}

          {image && !loading && (
            <button className="btn-generate" onClick={generateDescription}>
              <Sparkles size={16} />
              Сгенерировать описание
            </button>
          )}

          {error && <div className="error-message">⚠️ {error}</div>}
        </div>

        {/* Result Section */}
        <div className="card result-card">
          {showResult && description ? (
            <>
              <div className="card-header result-header">
                <div className="step-badge success">2</div>
                <h2 className="card-title"><span>📝</span>Готовое описание</h2>
                <div className="result-actions">
                  <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copyToClipboard}>
                    {copied ? <><Check size={14} />Скопировано</> : <><Copy size={14} />Копировать</>}
                  </button>
                  <button className="btn-download" onClick={() => downloadDescription('md')} title="Скачать .md">
                    <FileText size={14} />
                  </button>
                  <button className="btn-download" onClick={() => downloadDescription('txt')} title="Скачать .txt">
                    <Download size={14} />
                  </button>
                  <button
                    className={`btn-download ${showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(!showPreview)}
                    title="Предпросмотр"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              {showPreview ? (
                <div className="marketplace-preview">
                  <div className={`marketplace-header ${selectedMarketplace}`}>
                    <div className="mp-tabs">
                      <button className={`mp-tab ${selectedMarketplace === 'ozon' ? 'active' : ''}`} onClick={() => setSelectedMarketplace('ozon')}>Ozon</button>
                      <button className={`mp-tab ${selectedMarketplace === 'wb' ? 'active' : ''}`} onClick={() => setSelectedMarketplace('wb')}>Wildberries</button>
                      <button className={`mp-tab ${selectedMarketplace === 'ym' ? 'active' : ''}`} onClick={() => setSelectedMarketplace('ym')}>Яндекс.Маркет</button>
                    </div>
                  </div>
                  <div className="marketplace-content">
                    {description.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <h3 key={i} className="mp-title">{line.replace(/\*\*/g, '')}</h3>;
                      }
                      if (line.startsWith('- ') || line.startsWith('• ')) {
                        return <li key={i} className="mp-list">{line.slice(2)}</li>;
                      }
                      if (line.startsWith('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return <p key={i} className="mp-text">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
                      }
                      if (line.trim() === '') return <br key={i} />;
                      return <p key={i} className="mp-text">{line}</p>;
                    })}
                  </div>
                </div>
              ) : (
                <div className="description-output">
                  {description.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) return <h4 key={i} className="desc-heading">{line.replace(/\*\*/g, '')}</h4>;
                    if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="desc-list-item">{line.slice(2)}</li>;
                    if (line.startsWith('**')) {
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return <p key={i} className="desc-paragraph">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
                    }
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="desc-paragraph">{line}</p>;
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <ImageIcon size={56} />
              </div>
              <h3>Описание появится здесь</h3>
              <p>Загрузите фото товара и нажмите «Сгенерировать»</p>
              <p className="empty-hint">ИИ создаст продающее описание</p>
            </div>
          )}
        </div>
      </main>

      {/* History Panel */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-panel" onClick={e => e.stopPropagation()}>
            <div className="history-header">
              <h3><Clock size={18} />История генераций</h3>
              <div className="history-actions">
                {history.length > 0 && (
                  <button className="btn-clear-history" onClick={clearHistory}>
                    <Trash2 size={14} />Очистить
                  </button>
                )}
                <button className="btn-close-history" onClick={() => setShowHistory(false)}>✕</button>
              </div>
            </div>
            <div className="history-list">
              {history.length === 0 ? (
                <div className="history-empty">
                  <Clock size={32} />
                  <p>Пока пусто</p>
                  <span>Здесь будут ваши генерации</span>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                    {item.imagePreview && <img src={item.imagePreview} alt="" className="history-thumb" />}
                    <div className="history-info">
                      <span className="history-style">{STYLES.find(s => s.id === item.style)?.label || item.style}</span>
                      <span className="history-date">{formatDate(item.date)}</span>
                      <span className="history-preview">{item.description.slice(0, 80)}...</span>
                    </div>
                    <button className="btn-delete-history" onClick={(e) => deleteFromHistory(item.id, e)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Как это работает</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon photo"><Upload size={24} /></div>
              <h3>1. Загрузите фото</h3>
              <p>Сфотографируйте товар и загрузите изображение</p>
            </div>
            <div className="step-card">
              <div className="step-icon ai"><Sparkles size={24} /></div>
              <h3>2. ИИ анализирует</h3>
              <p>Нейросеть распознаёт товар и создаёт описание</p>
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
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo"><span>📦</span><span>Description generator</span></div>
            <p className="footer-text">Qwen AI • 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
