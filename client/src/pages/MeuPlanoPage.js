// client/src/pages/MeuPlanoPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './MeuPlanoPage.css';

const MeuPlanoPage = () => {
    const { user } = useOutletContext(); // ✅ USA O CONTEXTO
    const [plano, setPlano] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPlano = useCallback(async () => {
        if (!user?.nutricionistaId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await fetchApi('/api/meal-plan/my-plan');
            setPlano(data);
        } catch (error) {
            // Se o erro for 404 (plano não encontrado), não mostramos um toast de erro.
            if (error.message.includes('404')) {
                setPlano(null);
            } else {
                toast.error("Erro ao carregar o seu plano alimentar.");
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPlano();
    }, [fetchPlano]);

    if (loading) return <LoadingSpinner />;
    
    // ✅ VERIFICA PRIMEIRO SE HÁ NUTRICIONISTA
    if (!user?.nutricionistaId) {
        return (
            <div className="page-container">
                <EmptyState
                    title="Nenhum Nutricionista Vinculado"
                    message="Para ter um plano alimentar, você precisa de estar conectado a um nutricionista na plataforma."
                />
            </div>
        );
    }
    
    // Depois, verifica se há plano
    if (!plano) {
         return (
            <div className="page-container">
                <EmptyState
                    title="Nenhum Plano Ativo"
                    message="O seu nutricionista ainda não definiu um plano alimentar ativo para si."
                />
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meu Plano Alimentar</h1>
                <p>Definido por: <strong>{plano.nutricionistaId.nome}</strong> (CRN: {plano.nutricionistaId.crn})</p>
            </div>
            <Card className="plano-container-view">
                 <div className="plano-header-view">
                    <h2>{plano.titulo}</h2>
                    <div className="plano-meta-view">
                        <span>Criado em: {format(new Date(plano.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                </div>

                <div className="refeicoes-container-view">
                    {plano.refeicoes.map((refeicao, index) => (
                        <div key={index} className="refeicao-item-view">
                            <h3>{refeicao.nome} {refeicao.horario && <small>({refeicao.horario})</small>}</h3>
                            <ul className="alimentos-list">
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
                    <div className="observacoes-gerais-view">
                        <h4>Observações do Nutricionista</h4>
                        <p>{plano.observacoesGerais}</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MeuPlanoPage;