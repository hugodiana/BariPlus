import React from 'react';
import './EmptyState.css';

const EmptyState = ({ title, message, buttonText, onButtonClick }) => {
    return (
        <div className="empty-state-container">
            <h3>{title}</h3>
            <p>{message}</p>
            {buttonText && onButtonClick && (
                <button className="empty-state-btn" onClick={onButtonClick}>
                    {buttonText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;