import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullPage = false }) => {
  return (
    <div className={`spinner-overlay ${fullPage ? 'full-page' : ''}`} role="status" aria-live="polite">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;