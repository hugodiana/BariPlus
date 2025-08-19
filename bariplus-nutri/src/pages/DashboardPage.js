// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import './DashboardPage.css'; // Novo ficheiro de estilos

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await fetchApi('/api/nutri/dashboard');
                setStats(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <p>A carregar dashboard...</p>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Dashboard</h1>
            </div>
            <div className="dashboard-stats-grid">
                <Card className="stat-card">
                    <span className="stat-label">Total de Pacientes</span>
                    <span className="stat-value">{stats?.totalPacientes}</span>
                </Card>
                <Card className="stat-card">
                    <span className="stat-label">Vagas Gratuitas Restantes</span>
                    <span className="stat-value">{stats?.vagasGratisRestantes}</span>
                </Card>
                <Card className="stat-card">
                    <span className="stat-label">Pacientes Extras</span>
                    <span className="stat-value">{stats?.pacientesExtrasPagos}</span>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;