import React from 'react';
import { Clock, Trash2 } from 'lucide-react';

const STYLES = [
  { id: 'short', label: 'Краткое', desc: '2-3 предложения' },
  { id: 'standard', label: 'Стандартное', desc: 'Полное описание' },
  { id: 'seo', label: 'SEO', desc: 'С ключевыми словами' },
];

function HistoryPanel({ history, show, onClose, onLoad, onDelete, onClear }) {
  if (!show) return null;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h3><Clock size={18} />История генераций</h3>
          <div className="history-actions">
            {history.length > 0 && (
              <button className="btn-clear-history" onClick={onClear}>
                <Trash2 size={14} />Очистить
              </button>
            )}
            <button className="btn-close-history" onClick={onClose}>✕</button>
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
              <div key={item.id} className="history-item" onClick={() => onLoad(item)}>
                {item.thumbnailHash && (
                  <div className="history-thumb-placeholder" title={item.productName || 'Товар'}>
                    {item.productName ? item.productName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div className="history-info">
                  <span className="history-style">{STYLES.find(s => s.id === item.style)?.label || item.style}</span>
                  <span className="history-date">{formatDate(item.date)}</span>
                  <span className="history-preview">{item.description.slice(0, 80)}...</span>
                </div>
                <button className="btn-delete-history" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPanel;
