// src/pages/PacienteDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './PacientesPage.css';

const PacienteDetailPage = () => {
    const { pacienteId } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDetalhes = useCallback(async () => {
        try {
            // CORREÇÃO: Agora buscamos os dados de duas rotas diferentes e dedicadas
            const [pacienteData, planosData] = await Promise.all([
                fetchApi(`/api/nutri/pacientes/${pacienteId}`), // Nova rota para detalhes
                fetchApi(`/api/nutri/pacientes/${pacienteId}/planos`) // Rota para os planos
            ]);
            
            setPaciente(pacienteData);
            setPlanos(planosData);

        } catch (error) {
            toast.error(error.message || "Erro ao carregar detalhes do paciente.");
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchDetalhes();
    }, [fetchDetalhes]);

    if (loading) return <LoadingSpinner />;

    if (!paciente) return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista</Link>
            <p>Não foi possível carregar os dados do paciente.</p>
        </div>
    );

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