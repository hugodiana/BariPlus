// src/pages/PlanoAlimentarPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './PlanoAlimentarPage.css'; // Vamos criar este ficheiro

const PlanoAlimentarPage = () => {
    const [plano, setPlano] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPlano = useCallback(async () => {
        try {
            const data = await fetchApi('/api/meal-plan/my-plan');
            setPlano(data);
        } catch (error) {
            // Se o erro for 404 (plano não encontrado), não mostramos um toast de erro.
            if (error.message.includes('404') || error.message.includes('não encontrado')) {
                setPlano(null);
            } else {
                toast.error("Erro ao carregar o seu plano alimentar.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlano();
    }, [fetchPlano]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meu Plano Alimentar</h1>
                <p>Este é o plano alimentar ativo criado pelo seu nutricionista.</p>
            </div>

            {plano ? (
                <Card className="plano-container">
                    <div className="plano-header">
                        <h2>{plano.titulo}</h2>
                        <div className="plano-meta">
                            <span><strong>Nutricionista:</strong> {plano.nutricionistaId?.nome}</span>
                            <span><strong>CRN:</strong> {plano.nutricionistaId?.crn}</span>
                            <span><strong>Atualizado em:</strong> {format(new Date(plano.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
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
            ) : (
                <EmptyState
                    title="Nenhum Plano Encontrado"
                    message="Parece que o seu nutricionista ainda não criou um plano alimentar para si, ou não há nenhum plano ativo. Entre em contato com o seu profissional."
                />
            )}
        </div>
    );
};

export default PlanoAlimentarPage;