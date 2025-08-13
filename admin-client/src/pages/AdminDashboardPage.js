import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './AdminDashboardPage.css';

// Componente para os cards de estatística
const StatCard = ({ icon, label, value }) => (
    <div className="stat-card">
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    </div>
);

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Usando o fetch padrão, pois o fetchApi não existe neste projeto
            const [statsRes, usersRes] = await Promise.all([
                fetch(`${apiUrl}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/api/admin/users?limit=5`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!statsRes.ok || !usersRes.ok) {
                throw new Error("Falha ao carregar os dados do painel.");
            }

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();

            setStats(statsData);
            setRecentUsers(usersData.users || []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <p>A carregar o painel...</p>;
    }

    return (
        <div className="admin-dashboard-page">
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>Visão geral e estatísticas do BariPlus.</p>
            </header>

            {stats && (
                <div className="stats-grid">
                    <StatCard icon="👥" label="Total de Usuários" value={stats.totalUsers} />
                    <StatCard icon="💳" label="Usuários Pagantes" value={stats.paidUsers} />
                    <StatCard icon="✨" label="Novos na Semana" value={stats.newUsersLast7Days} />
                </div>
            )}

            <div className="dashboard-grid">
                <div className="recent-activity-card">
                    <h3>Atividade Recente</h3>
                    <div className="user-list">
                        {recentUsers.length > 0 ? (
                            recentUsers.map(user => (
                                <div key={user._id} className="user-item">
                                    <div className="user-info">
                                        <strong>{user.nome} {user.sobrenome}</strong>
                                        <span>{user.email}</span>
                                    </div>
                                    <span className="user-date">
                                        {format(new Date(user.createdAt), 'dd MMM, yyyy', { locale: ptBR })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>Nenhuma atividade recente de usuários.</p>
                        )}
                    </div>
                </div>
                <div className="quick-actions-card">
                    <h3>Ações Rápidas</h3>
                    <Link to="/users" className="action-link">
                        Gerir Usuários
                    </Link>
                    <Link to="/content/new" className="action-link">
                        Criar Conteúdo
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;