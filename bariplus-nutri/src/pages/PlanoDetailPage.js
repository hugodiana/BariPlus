// src/pages/PlanoDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import './PlanoAlimentarPage.css'; 

const PlanoDetailPage = () => {
    const { planoId, pacienteId } = useParams();
    const [plano, setPlano] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');

    const fetchPlano = useCallback(async () => {
        try {
            const data = await fetchApi(`/api/nutri/planos/${planoId}`);
            setPlano(data);
            setTemplateName(data.titulo);
        } catch (error) {
            toast.error("Erro ao carregar o plano alimentar.");
        } finally {
            setLoading(false);
        }
    }, [planoId]);

    useEffect(() => {
        fetchPlano();
    }, [fetchPlano]);

    const handleSaveAsTemplate = async (e) => {
        e.preventDefault();
        if (!templateName.trim()) {
            return toast.warn('Por favor, dê um nome ao seu template.');
        }
        try {
            await fetchApi(`/api/nutri/planos/${planoId}/salvar-como-template`, {
                method: 'POST',
                body: JSON.stringify({ templateName })
            });
            toast.success(`"${templateName}" foi salvo como um novo template!`);
            setIsTemplateModalOpen(false);
        } catch (error) {
            toast.error('Não foi possível salvar o template.');
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!plano) return <p>Plano não encontrado.</p>;

    return (
        <div className="page-container">
            <Link to={`/paciente/${pacienteId}`} className="back-link">‹ Voltar para o perfil do paciente</Link>
            <div className="page-header-action">
                <h1>Detalhes do Plano</h1>
                <button type="button" className="template-btn" onClick={() => setIsTemplateModalOpen(true)}>
                    Salvar como Template
                </button>
            </div>

            {/* A ESTRUTURA VISUAL FOI MELHORADA A PARTIR DAQUI */}
            <Card className="plano-container-view">
                <div className="plano-header-view">
                    <h2>{plano.titulo}</h2>
                    <div className="plano-meta-view">
                        <span className={`status-badge ${plano.ativo ? 'ativo' : 'inativo'}`}>
                            {plano.ativo ? 'Ativo' : 'Arquivado'}
                        </span>
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
                        <h4>Observações Gerais</h4>
                        <p>{plano.observacoesGerais}</p>
                    </div>
                )}
            </Card>

            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}>
                <h2>Salvar Plano como Template</h2>
                <p>Este plano será guardado na sua lista de templates para que possa reutilizá-lo com outros pacientes.</p>
                <form onSubmit={handleSaveAsTemplate} className="template-save-form">
                    <div className="form-group">
                        <label>Nome do Template</label>
                        <input 
                            type="text" 
                            value={templateName} 
                            onChange={(e) => setTemplateName(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-actions">
                         <button type="button" className="secondary-btn" onClick={() => setIsTemplateModalOpen(false)}>Cancelar</button>
                         <button type="submit" className="submit-btn">Salvar Template</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PlanoDetailPage;