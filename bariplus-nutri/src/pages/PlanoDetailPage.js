// src/pages/PlanoDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
// Usaremos os mesmos estilos da página do paciente
import './PlanoAlimentarPage.css'; 

const PlanoDetailPage = () => {
    const { planoId, pacienteId } = useParams();
    const [plano, setPlano] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPlano = useCallback(async () => {
        try {
            const data = await fetchApi(`/api/nutri/planos/${planoId}`);
            setPlano(data);
        } catch (error) {
            toast.error("Erro ao carregar o plano alimentar.");
        } finally {
            setLoading(false);
        }
    }, [planoId]);

    useEffect(() => {
        fetchPlano();
    }, [fetchPlano]);

    if (loading) return <LoadingSpinner />;
    if (!plano) return <p>Plano não encontrado.</p>;

    return (
        <div className="page-container">
            <Link to={`/paciente/${pacienteId}`} className="back-link">‹ Voltar para o perfil do paciente</Link>
            <div className="page-header">
                <h1>Detalhes do Plano</h1>
            </div>

            <Card className="plano-container">
                <div className="plano-header">
                    <h2>{plano.titulo}</h2>
                    <div className="plano-meta">
                        <span><strong>Status:</strong> {plano.ativo ? 'Ativo' : 'Arquivado'}</span>
                        <span><strong>Criado em:</strong> {format(new Date(plano.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                </div>

                <div className="refeicoes-container">
                    {plano.refeicoes.map((refeicao, index) => (
                        <div key={index} className="refeicao-item-paciente">
                            <h3>{refeicao.nome} <span>({refeicao.horario})</span></h3>
                            <ul>
                                {refeicao.itens.map((item, itemIndex) => (
                                    <li key={itemIndex}>
                                        <span className="alimento">{item.alimento}</span>
                                        <span className="quantidade">{item.quantidade}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {plano.observacoesGerais && (
                    <div className="observacoes-gerais">
                        <h4>Observações Gerais</h4>
                        <p>{plano.observacoesGerais}</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PlanoDetailPage;