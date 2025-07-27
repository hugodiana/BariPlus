import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import './AdminDashboardPage.css';

// Componentes auxiliares
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StatsCard from '../components/StatsCard';

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
            
            // Validação básica dos dados recebidos
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

    if (loading) {
        return (
            <div className="loading-container">
                <LoadingSpinner />
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorMessage 
                message={error}
                onRetry={handleRetry}
            />
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
                        value={stats.totalUsers} 
                        label="Usuários Totais" 
                        icon="👥"
                        trend={stats.userGrowthRate}
                    />
                    <StatsCard 
                        value={stats.paidUsers} 
                        label="Contas Ativas" 
                        icon="💰"
                        trend={stats.paidUserGrowthRate}
                    />
                    <StatsCard 
                        value={stats.newUsersLast7Days} 
                        label="Novos (7 dias)" 
                        icon="🆕"
                    />
                    <StatsCard 
                        value={stats.activeUsers} 
                        label="Usuários Ativos" 
                        icon="📈"
                    />
                </div>
            </section>
        </div>
    );
};

export default AdminDashboardPage;