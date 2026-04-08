import React from 'react';
import { Loader2 } from 'lucide-react';

function ProgressBar({ progress, stage }) {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-info">
        <Loader2 size={14} className="spinner" />
        <span>{stage}</span>
        <span className="progress-pct">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export default ProgressBar;
