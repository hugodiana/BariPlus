import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ className = '' }) => {
  return (
    <div className={`spinner-overlay ${className}`} role="status" aria-live="polite">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
