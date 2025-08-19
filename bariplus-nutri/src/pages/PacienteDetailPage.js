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
    const [progresso, setProgresso] = useState(null); // NOVO ESTADO
    const [loading, setLoading] = useState(true);

    const fetchDetalhes = useCallback(async () => {
        try {
            const [pacienteData, planosData, progressoData] = await Promise.all([
                fetchApi(`/api/nutri/pacientes/${pacienteId}`),
                fetchApi(`/api/nutri/pacientes/${pacienteId}/planos`),
                fetchApi(`/api/nutri/paciente/${pacienteId}/progresso`) // NOVA CHAMADA
            ]);
            
            setPaciente(pacienteData);
            setPlanos(planosData);
            setProgresso(progressoData); // ARMAZENA OS DADOS DE PROGRESSO

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
    if (!paciente) return <div className="page-container"><p>Paciente não encontrado.</p></div>;

    const pesoInicial = progresso?.detalhes?.detalhesCirurgia?.pesoInicial || 0;
    const pesoAtual = progresso?.detalhes?.detalhesCirurgia?.pesoAtual || 0;
    const pesoPerdido = pesoInicial - pesoAtual;

    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista</Link>
            <div className="page-header">
                <h1>{paciente.nome} {paciente.sobrenome}</h1>
                <p>Acompanhe e gira os planos alimentares e o progresso deste paciente.</p>
            </div>

            {/* NOVO CARD DE RESUMO DE PROGRESSO */}
            <Card className="progresso-summary">
                <div><span>Peso Inicial</span><strong>{pesoInicial.toFixed(1)} kg</strong></div>
                <div><span>Peso Atual</span><strong>{pesoAtual.toFixed(1)} kg</strong></div>
                <div><span>Total Perdido</span><strong className="perdido">{pesoPerdido.toFixed(1)} kg</strong></div>
            </Card>

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