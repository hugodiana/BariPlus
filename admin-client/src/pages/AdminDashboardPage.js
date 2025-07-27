import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }

            const response = await fetch(`${apiUrl}/api/admin/stats`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao carregar estatísticas');
            }

            const data = await response.json();
            
            if (!data || typeof data !== 'object') {
                throw new Error('Dados recebidos são inválidos');
            }

            setStats(data);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            setError(error.message);
            toast.error(`Falha ao carregar dashboard: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRetry = () => {
        fetchStats();
    };

    // Componente de Loading embutido
    const LoadingSpinner = () => (
        <div className="spinner-container">
            <div className="loading-spinner"></div>
        </div>
    );

    // Componente de Error embutido
    const ErrorMessage = ({ message, onRetry }) => (
        <div className="error-container">
            <p className="error-message">{message}</p>
            <button onClick={onRetry} className="retry-button">
                Tentar novamente
            </button>
        </div>
    );

    // Componente StatsCard embutido
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
                    <span className="stats-icon">{icon || '📊'}</span>
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

    if (loading) {
        return (
            <div className="loading-state">
                <LoadingSpinner />
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <ErrorMessage 
                    message={error}
                    onRetry={handleRetry}
                />
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-subtitle">Visão geral do desempenho do sistema</p>
            </header>

            <section className="stats-section">
                <div className="stats-grid">
                    <StatsCard 
                        value={stats?.totalUsers || 0} 
                        label="Usuários Totais" 
                        icon="👥"
                        trend={stats?.userGrowthRate}
                    />
                    <StatsCard 
                        value={stats?.paidUsers || 0} 
                        label="Contas Ativas" 
                        icon="💰"
                        trend={stats?.paidUserGrowthRate}
                    />
                    <StatsCard 
                        value={stats?.newUsersLast7Days || 0} 
                        label="Novos (7 dias)" 
                        icon="🆕"
                    />
                </div>
            </section>
        </div>
    );
};

export default AdminDashboardPage;