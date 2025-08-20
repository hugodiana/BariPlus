// src/pages/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
// CORREÇÃO: Importa o CSS unificado para as páginas de admin
import './AdminPages.css'; 

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        fetchAdminApi('/api/admin/stats').then(setStats);
    }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Dashboard do Administrador</h1>
            </div>
            <div className="dashboard-stats-grid">
                <Card className="stat-card">
                    <span className="stat-label">Total de Pacientes</span>
                    <span className="stat-value">{stats?.totalUsers}</span>
                </Card>
                <Card className="stat-card">
                    <span className="stat-label">Pacientes Pagos</span>
                    <span className="stat-value">{stats?.paidUsers}</span>
                </Card>
                <Card className="stat-card">
                    <span className="stat-label">Total de Nutricionistas</span>
                    <span className="stat-value">{stats?.totalNutris}</span>
                </Card>
                 <Card className="stat-card">
                    <span className="stat-label">Nutricionistas Ativos</span>
                    <span className="stat-value">{stats?.activeNutris}</span>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboardPage;