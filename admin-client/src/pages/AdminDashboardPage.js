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

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p className="error-message">{error}</p>
                <button onClick={handleRetry} className="retry-button">
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Dashboard Administrativo</h1>
                <p>Visão geral do sistema</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{stats?.totalUsers || 0}</div>
                    <div className="stat-label">Usuários Totais</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">{stats?.paidUsers || 0}</div>
                    <div className="stat-label">Contas Ativas</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">🆕</div>
                    <div className="stat-value">{stats?.newUsersLast7Days || 0}</div>
                    <div className="stat-label">Novos (7 dias)</div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;