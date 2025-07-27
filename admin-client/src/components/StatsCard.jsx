import React from 'react';
import PropTypes from 'prop-types';
import './StatsCard.css';

const StatsCard = ({ value, label, icon, trend }) => {
    const getTrendClass = () => {
        if (!trend) return '';
        return trend > 0 ? 'trend-up' : 'trend-down';
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        return trend > 0 ? '↑' : '↓';
    };

    return (
        <div className="stats-card">
            <div className="stats-card-header">
                <span className="stats-icon">{icon}</span>
                {trend && (
                    <span className={`trend-indicator ${getTrendClass()}`}>
                        {getTrendIcon()} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className="stats-value">{value}</div>
            <div className="stats-label">{label}</div>
        </div>
    );
};

StatsCard.propTypes = {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    trend: PropTypes.number
};

StatsCard.defaultProps = {
    icon: '📊',
    trend: null
};

export default StatsCard;