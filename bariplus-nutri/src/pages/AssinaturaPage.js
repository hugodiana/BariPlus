// src/pages/AssinaturaPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './AssinaturaPage.css'; // Vamos criar este ficheiro

// Links de checkout dos seus produtos na Kiwify (ou outro provedor)
const checkoutLinks = {
    profissional: "https://pay.kiwify.com.br/Q0EiyCH",
    clinica: "https://pay.kiwify.com.br/i67KzjX"
};

const AssinaturaPage = () => {
    const [nutricionista, setNutricionista] = useState(null);
    const [stats, setStats] = useState({ totalPacientes: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            // Usamos a rota /me/nutri que vamos criar para obter os dados do nutri logado
            const [nutriData, statsData] = await Promise.all([
                fetchApi('/api/nutri/auth/me'),
                fetchApi('/api/nutri/dashboard')
            ]);
            setNutricionista(nutriData);
            setStats(statsData);
        } catch (error) {
            toast.error("Erro ao carregar dados da assinatura.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !nutricionista) return <LoadingSpinner />;

    const planoAtual = nutricionista.assinatura;
    const totalPacientes = stats.totalPacientes;
    const limitePacientes = nutricionista.limiteGratis;
    const progresso = limitePacientes > 0 ? (totalPacientes / limitePacientes) * 100 : 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minha Assinatura</h1>
                <p>Gira o seu plano, vagas de pacientes e pagamentos.</p>
            </div>

            <div className="assinatura-grid">
                <Card className="status-card">
                    <h3>Seu Plano Atual: <span className="plano-nome">{planoAtual.plano || 'Nenhum'}</span></h3>
                    <p>Status: <span className={`status-badge ${planoAtual.status}`}>{planoAtual.status}</span></p>
                    
                    <div className="usage-meter">
                        <p>Vagas de Pacientes Utilizadas</p>
                        <strong>{totalPacientes} / {limitePacientes}</strong>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progresso}%`}}></div>
                        </div>
                    </div>

                    <a href="https://dashboard.kiwify.com.br/purchases" target="_blank" rel="noopener noreferrer" className="manage-btn">
                        Gerir Pagamentos na Kiwify
                    </a>
                </Card>

                <Card className="upgrade-card">
                    <h3>Mude de Plano</h3>
                    <p>Precisa de mais vagas ou funcionalidades? Faça o upgrade.</p>
                    <div className="plan-option">
                        <h4>Plano Clínica</h4>
                        <span>Pacientes ilimitados, múltiplos logins e mais.</span>
                        <a href={checkoutLinks.clinica} className="action-btn-positive">Fazer Upgrade</a>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AssinaturaPage;