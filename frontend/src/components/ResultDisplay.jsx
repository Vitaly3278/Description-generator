import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download, FileText } from 'lucide-react';

function ResultDisplay({ description, copied, onCopy, onDownload }) {
  if (!description) {
    return (
      <div className="empty-state">
        <div className="empty-icon-wrapper">
          <FileText size={56} />
        </div>
        <h3>Описание появится здесь</h3>
        <p>Загрузите фото товара и нажмите «Сгенерировать»</p>
        <p className="empty-hint">ИИ создаст продающее описание</p>
      </div>
    );
  }

  return (
    <>
      <div className="card-header result-header">
        <div className="step-badge success">2</div>
        <h2 className="card-title"><span>📝</span>Готовое описание</h2>
        <div className="result-actions">
          <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={onCopy}>
            {copied ? <><Check size={14} />Скопировано</> : <><Copy size={14} />Копировать</>}
          </button>
          <button className="btn-download" onClick={() => onDownload('md')} title="Скачать .md">
            <FileText size={14} />
          </button>
          <button className="btn-download" onClick={() => onDownload('txt')} title="Скачать .txt">
            <Download size={14} />
          </button>
        </div>
      </div>
      <div className="description-output">
        <ReactMarkdown>{description}</ReactMarkdown>
      </div>
    </>
  );
}

export default ResultDisplay;
