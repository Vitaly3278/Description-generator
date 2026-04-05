import React, { useState, useCallback } from 'react';
import { Copy, Upload, Loader2, Check, Image as ImageIcon } from 'lucide-react';
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
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">📦</span>
              <h1>ProductDesc</h1>
            </div>
            <p className="tagline">Генерация продающих описаний товаров по фото с помощью ИИ</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main container">
        <div className="grid">
          {/* Upload Section */}
          <div className="card upload-card">
            <h2 className="card-title">
              <Upload size={20} />
              Загрузите фото товара
            </h2>
            
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
                  <ImageIcon size={48} className="upload-icon" />
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

            {image && !description && (
              <button
                className="btn-generate"
                onClick={generateDescription}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Генерация...
                  </>
                ) : (
                  <>✨ Сгенерировать описание</>
                )}
              </button>
            )}

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="card result-card">
            <div className="result-header">
              <h2 className="card-title">
                <span>📝</span>
                Описание товара
              </h2>
              {description && (
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
              )}
            </div>

            <div className="result-content">
              {loading && (
                <div className="loading-state">
                  <Loader2 size={32} className="spinner-large" />
                  <p>ИИ анализирует изображение...</p>
                  <p className="loading-hint">Это может занять несколько секунд</p>
                </div>
              )}

              {!loading && !description && (
                <div className="empty-state">
                  <ImageIcon size={48} className="empty-icon" />
                  <p>Загрузите фото товара и нажмите «Сгенерировать»</p>
                  <p className="empty-hint">
                    ИИ создаст продающее описание с характеристиками и преимуществами
                  </p>
                </div>
              )}

              {!loading && description && (
                <div className="description-output">
                  {description.split('\n').map((line, index) => {
                    // Simple markdown-like formatting
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
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>ProductDesc © 2026 • Генерация описаний с помощью Qwen AI</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
