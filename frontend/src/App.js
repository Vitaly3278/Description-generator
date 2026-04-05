import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Upload, Loader2, Check, Image as ImageIcon, Sparkles, Shield, Zap, Globe, ArrowDown } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (description) {
      setShowResult(true);
      setTimeout(() => {
        document.querySelector('.result-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [description]);

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
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImage(file);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImage(e.dataTransfer.files[0]);
    }
  }, []);

  const generateDescription = async () => {
    if (!image) {
      setError('Сначала загрузите изображение');
      return;
    }

    setLoading(true);
    setError('');
    setDescription('');

    try {
      const formData = new FormData();
      formData.append('file', image);

      const response = await fetch(`${API_URL}/api/generate-description`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Ошибка при генерации описания');
      }

      const data = await response.json();
      setDescription(data.description);
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = description;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearAll = () => {
    setImage(null);
    setImagePreview(null);
    setDescription('');
    setError('');
    setShowResult(false);
  };

  return (
    <div className="App">
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
            <div className="hero-feature">
              <Sparkles size={18} />
              <span>AI-анализ фото</span>
            </div>
            <div className="hero-feature">
              <Globe size={18} />
              <span>Русский язык</span>
            </div>
            <div className="hero-feature">
              <Zap size={18} />
              <span>10-15 секунд</span>
            </div>
            <div className="hero-feature">
              <Shield size={18} />
              <span>Без регистрации</span>
            </div>
          </div>
          <div className="hero-arrow" onClick={() => document.querySelector('.main')?.scrollIntoView({ behavior: 'smooth' })}>
            <ArrowDown size={24} />
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="main container">
        {/* Upload Section */}
        <div className="card upload-card">
          <div className="card-header">
            <div className="step-badge">1</div>
            <h2 className="card-title">
              <Upload size={20} />
              Загрузите фото товара
            </h2>
          </div>
          
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${imagePreview ? 'has-image' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="preview-container">
                <img src={imagePreview} alt="Preview" className="preview-image" />
                <button className="btn-remove" onClick={clearAll} title="Удалить">
                  ✕
                </button>
              </div>
            ) : (
              <label className="upload-placeholder" htmlFor="file-input">
                <div className="upload-icon-wrapper">
                  <ImageIcon size={48} />
                </div>
                <p className="upload-text">Перетащите фото сюда</p>
                <p className="upload-subtext">или нажмите для выбора файла</p>
                <span className="upload-hint">JPG, PNG, WEBP до 10MB</span>
              </label>
            )}
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {image && !loading && (
            <button
              className="btn-generate"
              onClick={generateDescription}
            >
              <Sparkles size={18} />
              Сгенерировать описание
            </button>
          )}

          {loading && (
            <button className="btn-generate loading" disabled>
              <Loader2 size={18} className="spinner" />
              Анализируем изображение...
            </button>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {showResult && (
          <div className="card result-card fade-in">
            <div className="card-header">
              <div className="step-badge success">2</div>
              <h2 className="card-title">
                <span>📝</span>
                Готовое описание
              </h2>
              <button
                className={`btn-copy ${copied ? 'copied' : ''}`}
                onClick={copyToClipboard}
                title={copied ? 'Скопировано!' : 'Копировать'}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Скопировано!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Копировать
                  </>
                )}
              </button>
            </div>

            <div className="result-content">
              {description && (
                <div className="description-output">
                  {description.split('\n').map((line, index) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h4 key={index} className="desc-heading">{line.replace(/\*\*/g, '')}</h4>;
                    }
                    if (line.startsWith('- ') || line.startsWith('• ')) {
                      return <li key={index} className="desc-list-item">{line.slice(2)}</li>;
                    }
                    if (line.startsWith('**')) {
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <p key={index} className="desc-paragraph">
                          {parts.map((part, i) => 
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                          )}
                        </p>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={index} />;
                    }
                    return <p key={index} className="desc-paragraph">{line}</p>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!showResult && (
          <div className="card result-card">
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <ImageIcon size={64} />
              </div>
              <h3>Описание появится здесь</h3>
              <p>Загрузите фото товара и нажмите «Сгенерировать»</p>
              <p className="empty-hint">
                ИИ создаст продающее описание с характеристиками и преимуществами
              </p>
            </div>
          </div>
        )}
      </main>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Как это работает</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon photo">
                <Upload size={28} />
              </div>
              <h3>1. Загрузите фото</h3>
              <p>Сфотографируйте товар и загрузите изображение на сайт</p>
            </div>
            <div className="step-card">
              <div className="step-icon ai">
                <Sparkles size={28} />
              </div>
              <h3>2. ИИ анализирует</h3>
              <p>Нейросеть Qwen распознаёт товар и создаёт описание</p>
            </div>
            <div className="step-card">
              <div className="step-icon done">
                <Check size={28} />
              </div>
              <h3>3. Готово!</h3>
              <p>Скопируйте описание и используйте в магазине</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span>📦</span>
              <span>Description generator</span>
            </div>
            <p className="footer-text">Генерация описаний с помощью Qwen AI • 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
