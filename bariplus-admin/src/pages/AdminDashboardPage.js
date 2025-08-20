// src/pages/AdminDashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import GrowthChartCard from '../components/charts/GrowthChartCard'; // ✅ 1. IMPORTAR
import '../components/charts/Charts.css'; // ✅ 2. IMPORTAR CSS
import './AdminPages.css'; 
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [growthData, setGrowthData] = useState(null); // ✅ 3. NOVO ESTADO
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, growthStatsData] = await Promise.all([
                fetchAdminApi('/api/admin/stats'),
                fetchAdminApi('/api/admin/growth-stats')
            ]);
            setStats(statsData);
            setGrowthData(growthStatsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <LoadingSpinner />;

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

                {/* ✅ 4. ADICIONAR O COMPONENTE DO GRÁFICO */}
                {growthData && <GrowthChartCard data={growthData} />}
            </div>
        </div>
    );
};

export default AdminDashboardPage;