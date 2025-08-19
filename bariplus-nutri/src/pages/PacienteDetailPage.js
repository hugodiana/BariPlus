// src/pages/PacienteDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import './PacientesPage.css'; // Reutilizaremos os estilos

const PacienteDetailPage = () => {
    const { pacienteId } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDetalhes = useCallback(async () => {
        try {
            // Usamos a rota do dashboard do nutri, que já nos dá os detalhes do paciente
            const dashboardData = await fetchApi('/api/nutri/dashboard');
            const pacienteAtual = dashboardData.pacientes.find(p => p._id === pacienteId);
            
            if (!pacienteAtual) {
                toast.error("Paciente não encontrado.");
                return;
            }
            setPaciente(pacienteAtual);

            const planosData = await fetchApi(`/api/nutri/pacientes/${pacienteId}/planos`);
            setPlanos(planosData);

        } catch (error) {
            toast.error("Erro ao carregar detalhes do paciente.");
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchDetalhes();
    }, [fetchDetalhes]);

    if (loading) return <p>A carregar detalhes do paciente...</p>;

    if (!paciente) return <p>Paciente não encontrado.</p>;

    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista</Link>
            <div className="page-header">
                <h1>{paciente.nome} {paciente.sobrenome}</h1>
                <p>Acompanhe e gira os planos alimentares deste paciente.</p>
            </div>

            <Card>
                <div className="card-header-action">
                    <h3>Planos Alimentares</h3>
                    <Link to={`/paciente/${pacienteId}/plano/criar`} className="action-btn-positive">
                        + Criar Novo Plano
                    </Link>
                </div>
                {planos.length > 0 ? (
                    <ul className="planos-list">
                        {planos.map(plano => (
                            <li key={plano._id} className={`plano-item ${plano.ativo ? 'ativo' : 'inativo'}`}>
                                <div className="plano-info">
                                    <strong>{plano.titulo}</strong>
                                    <span>Criado em: {format(new Date(plano.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                </div>
                                <span className="plano-status">{plano.ativo ? 'Ativo' : 'Arquivado'}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nenhum plano alimentar criado para este paciente ainda.</p>
                )}
            </Card>
        </div>
    );
};

export default PacienteDetailPage;