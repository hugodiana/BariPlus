import React from 'react';
import './Card.css';

const Card = ({ children, className = '' }) => {
    // A classe 'card' é a base, e podemos adicionar outras classes se precisarmos
    return (
        <div className={`card ${className}`}>
            {children}
        </div>
    );
};

export default Card;