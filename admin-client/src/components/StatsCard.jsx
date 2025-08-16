import React from 'react';
import './StatsCard.css';

const StatsCard = ({ icon, label, value }) => (
    <div className="stats-card">
        <div className="stats-icon">{icon}</div>
        <div className="stats-info">
            <span className="stats-value">{value}</span>
            <span className="stats-label">{label}</span>
        </div>
    </div>
);

export default StatsCard;