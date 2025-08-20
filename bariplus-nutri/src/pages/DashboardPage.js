// src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ConsultasHojeCard from '../components/dashboard/ConsultasHojeCard';
import AtividadeRecenteCard from '../components/dashboard/AtividadeRecenteCard'; // ✅ 1. IMPORTAR O NOVO COMPONENTE
import './DashboardPage.css';

const DashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [atividades, setAtividades] = useState([]); // ✅ 2. NOVO ESTADO PARA ATIVIDADES
    const [loading, setLoading] = useState(true);

    // ✅ 3. ATUALIZAR A FUNÇÃO DE BUSCA
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Busca os dados do dashboard e as atividades em paralelo
            const [data, activityData] = await Promise.all([
                fetchApi('/api/nutri/dashboard'),
                fetchApi('/api/nutri/recent-activity') 
            ]);
            setDashboardData(data);
            setAtividades(activityData);
        } catch (error) {
            toast.error("Erro ao carregar os dados do dashboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading || !dashboardData) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Bem-vindo(a) ao seu painel de controlo.</p>
            </div>

            <div className="dashboard-stats-grid">
                <Card className="stat-card">
                    <span className="stat-label">Total de Pacientes</span>
                    <span className="stat-value">{dashboardData.totalPacientes}</span>
                </Card>
                <Card className="stat-card">
                    <span className="stat-label">Vagas Gratuitas Restantes</span>
                    <span className="stat-value">{dashboardData.vagasGratisRestantes}</span>
                </Card>
                <Card className="stat-card">
                    <span className="stat-label">Pacientes Extras</span>
                    <span className="stat-value">{dashboardData.pacientesExtrasPagos}</span>
                </Card>
            </div>

            <div className="dashboard-widgets-grid">
                <ConsultasHojeCard consultas={dashboardData.consultasDoDia || []} />
                {/* ✅ 4. ADICIONAR O NOVO CARD */}
                <AtividadeRecenteCard atividades={atividades} />
            </div>
        </div>
    );
};

export default DashboardPage;