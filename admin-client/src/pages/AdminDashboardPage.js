import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './AdminDashboardPage.css'; // Vamos criar este CSS a seguir

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Não foi possível carregar as estatísticas.');
                }
                const data = await response.json();
                setStats(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [token, apiUrl]);

    if (loading) {
        return <div className="loading-state">Carregando dashboard...</div>;
    }

    return (
        <div className="admin-page-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral do desempenho do seu aplicativo.</p>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h2>{stats.totalUsers}</h2>
                        <p>Usuários Totais</p>
                    </div>
                    <div className="stat-card">
                        <h2>{stats.paidUsers}</h2>
                        <p>Contas Ativas (Pagas)</p>
                    </div>
                    <div className="stat-card">
                        <h2>{stats.newUsersLast7Days}</h2>
                        <p>Novos nos últimos 7 dias</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;