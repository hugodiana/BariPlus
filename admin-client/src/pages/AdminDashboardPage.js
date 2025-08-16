import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Card from '../components/ui/Card'; // Usando seu componente Card
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminDashboardPage.css';

// Componente para os cards de estatística
const StatCard = ({ icon, label, value }) => (
    <div className="stat-card">
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    </div>
);

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bariplus_admin_token');
            if (!token) throw new Error("Token de administrador não encontrado.");
            
            const headers = { 'Authorization': `Bearer ${token}` };
            const apiUrl = process.env.REACT_APP_API_URL;

            const [statsRes, usersRes] = await Promise.all([
                fetch(`${apiUrl}/api/admin/stats`, { headers }),
                fetch(`${apiUrl}/api/admin/users?limit=5`, { headers })
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
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <LoadingSpinner />;
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
                <Card>
                    <div className="card-header">
                        <h3>Usuários Recentes</h3>
                    </div>
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
                            <p className="empty-message">Nenhuma atividade recente de usuários.</p>
                        )}
                    </div>
                </Card>
                <Card>
                    <div className="card-header">
                        <h3>Ações Rápidas</h3>
                    </div>
                    <div className="quick-actions-list">
                        <Link to="/users" className="action-link">
                            Gerir todos os Usuários
                        </Link>
                        <Link to="/content/new" className="action-link">
                            Criar novo Conteúdo
                        </Link>
                        <Link to="/notifications" className="action-link">
                            Enviar Notificação em Massa
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboardPage;