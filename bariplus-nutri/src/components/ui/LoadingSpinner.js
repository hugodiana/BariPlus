// bariplus-nutri/src/components/ui/LoadingSpinner.js
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullPage, message }) => {
    if (fullPage) {
        return (
            <div className="fullpage-spinner-overlay">
                <div className="spinner"></div>
                {message && <p className="spinner-message">{message}</p>}
            </div>
        );
    }
    return <div className="spinner"></div>;
};

export default LoadingSpinner;