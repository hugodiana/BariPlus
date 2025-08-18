import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';

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
        <div>
            <h1>Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <Card>
                    <h3>Total de Pacientes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.totalPacientes}</p>
                </Card>
                <Card>
                    <h3>Vagas Gratuitas Restantes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.vagasGratisRestantes}</p>
                </Card>
                <Card>
                    <h3>Pacientes Extras</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.pacientesExtrasPagos}</p>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;