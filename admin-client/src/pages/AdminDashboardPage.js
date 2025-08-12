import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao carregar estatísticas.");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return <p>A carregar estatísticas...</p>;
    }

    return (
        <div className="admin-dashboard-page">
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>Visão geral e estatísticas do BariPlus.</p>
            </header>
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total de Usuários</h3>
                        <p>{stats.totalUsers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Usuários Pagantes</h3>
                        <p>{stats.paidUsers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Novos na Última Semana</h3>
                        <p>{stats.newUsersLast7Days}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;