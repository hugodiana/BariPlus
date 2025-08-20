// src/components/paciente/PlanosTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import '../../pages/ProntuarioPage.css';

const PlanosTab = () => {
    const { pacienteId } = useParams();
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingEmailId, setSendingEmailId] = useState(null); // ✅ 1. NOVO ESTADO DE LOADING

    const fetchPlanos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`/api/nutri/pacientes/${pacienteId}/planos`);
            setPlanos(data);
        } catch (error) {
            toast.error("Erro ao carregar os planos alimentares.");
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchPlanos();
    }, [fetchPlanos]);

    // ✅ 2. NOVA FUNÇÃO PARA ENVIAR O E-MAIL
    const handleSendEmail = async (planoId) => {
        setSendingEmailId(planoId); // Ativa o loading para este botão específico
        try {
            const data = await fetchApi(`/api/nutri/planos/${planoId}/enviar-email`, {
                method: 'POST'
            });
            toast.success(data.message);
        } catch (error) {
            toast.error(error.message || "Não foi possível enviar o e-mail.");
        } finally {
            setSendingEmailId(null); // Desativa o loading
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="card-header-action">
                <h3>Histórico de Planos Alimentares</h3>
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
                            <div className="plano-status">
                                {plano.ativo ? 'Ativo no App' : 'Arquivado'}
                            </div>
                            <div className="plano-actions">
                                <Link to={`/paciente/${pacienteId}/plano/${plano._id}`} className="action-btn-view">Ver</Link>
                                {/* ✅ 3. O BOTÃO AGORA CHAMA A FUNÇÃO E MOSTRA LOADING */}
                                <button 
                                    className="action-btn-email" 
                                    onClick={() => handleSendEmail(plano._id)}
                                    disabled={sendingEmailId === plano._id}
                                >
                                    {sendingEmailId === plano._id ? 'A enviar...' : 'Enviar por E-mail'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Nenhum plano alimentar criado para este paciente.</p>
            )}
        </div>
    );
};

export default PlanosTab;