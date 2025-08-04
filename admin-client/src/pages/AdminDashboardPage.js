import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { 
  FiUsers, 
  FiDollarSign, 
  FiUserPlus, 
  FiActivity,
  FiTrendingUp,
  FiClock
} from 'react-icons/fi';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

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
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'include' // Para suporte a cookies seguros
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Sessão expirada. Por favor, faça login novamente.');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao carregar estatísticas');
            }

            const data = await response.json();
            
            if (!data || typeof data !== 'object') {
                throw new Error('Dados recebidos são inválidos');
            }

            setStats(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            setError(error.message);
            toast.error(`Falha ao carregar dashboard: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    // Atualização automática a cada 5 minutos
    useEffect(() => {
        fetchStats();
        
        const interval = setInterval(() => {
            fetchStats();
        }, 5 * 60 * 1000); // 5 minutos

        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleRetry = () => {
        fetchStats();
    };

    const formatNumber = (num) => {
        return num ? num.toLocaleString('pt-BR') : 0;
    };

    if (loading && !stats) {
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
            <Helmet>
                <title>Dashboard Administrativo - BariPlus</title>
                <meta name="description" content="Painel de controle administrativo do BariPlus" />
            </Helmet>

            <header className="dashboard-header">
                <h1>Dashboard Administrativo</h1>
                <p>Visão geral do sistema {lastUpdated && (
                    <span className="last-updated">
                        <FiClock /> Atualizado em: {lastUpdated.toLocaleTimeString()}
                    </span>
                )}</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon"><FiUsers /></div>
                    <div className="stat-value">{formatNumber(stats?.totalUsers)}</div>
                    <div className="stat-label">Usuários Totais</div>
                    {stats?.userGrowthRate && (
                        <div className={`stat-trend ${stats.userGrowthRate >= 0 ? 'positive' : 'negative'}`}>
                            <FiTrendingUp /> {Math.abs(stats.userGrowthRate)}%
                        </div>
                    )}
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon"><FiDollarSign /></div>
                    <div className="stat-value">{formatNumber(stats?.paidUsers)}</div>
                    <div className="stat-label">Contas Ativas</div>
                    <div className="stat-subtext">
                        {stats?.conversionRate ? `${stats.conversionRate}% conversão` : ''}
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon"><FiUserPlus /></div>
                    <div className="stat-value">{formatNumber(stats?.newUsersLast7Days)}</div>
                    <div className="stat-label">Novos (7 dias)</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon"><FiActivity /></div>
                    <div className="stat-value">{formatNumber(stats?.activeUsersLast30Days)}</div>
                    <div className="stat-label">Ativos (30 dias)</div>
                </div>
            </div>

            {/* Seção adicional para gráficos/resumo */}
            {stats && (
                <div className="dashboard-summary">
                    <h2>Resumo de Atividades</h2>
                    <div className="summary-grid">
                        {/* Adicionar gráficos ou mais estatísticas aqui */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;