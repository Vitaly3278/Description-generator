import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function UploadZone({ image, imagePreview, onImageSelect, onClear, dragActive, onDragEnter, onDragLeave, onDragOver, onDrop }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onImageSelect(file);
  };

  return (
    <div
      className={`upload-zone ${dragActive ? 'drag-active' : ''} ${imagePreview ? 'has-image' : ''}`}
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
    >
      {imagePreview ? (
        <div className="preview-container">
          <img src={imagePreview} alt="Preview" className="preview-image" />
          <button className="btn-next-image" onClick={onClear}>
            <Upload size={14} />
            Следующее фото
          </button>
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
  );
}

export function useImageUpload() {
  const [image, setImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Файл слишком большой (макс. 10MB)');
      return;
    }
    setError('');
    setImage(file);
    // Создаём компактное превью — уменьшенный canvas вместо base64 оригинала
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

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
  }, [handleImage]);

  const clearImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
  }, []);

  return { image, imagePreview, dragActive, error, setError, handleImage, handleDrag, handleDrop, clearImage, setImage, setImagePreview };
}

export default UploadZone;
