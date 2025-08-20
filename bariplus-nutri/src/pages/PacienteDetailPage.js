// bariplus-nutri/src/pages/PacienteDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import ChatBox from '../components/chat/ChatBox';
import LoadingSpinner from '../components/LoadingSpinner';
import AcompanhamentoTab from '../components/paciente/AcompanhamentoTab';
import MetasTab from '../components/paciente/MetasTab';
import './PacientesPage.css';

const PacienteDetailPage = () => {
    const { pacienteId } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('acompanhamento');
    
    // ✅ CORREÇÃO: Buscamos os dados do nutricionista logado uma vez
    const [nutricionista, setNutricionista] = useState(null);

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            // Buscamos os dados do paciente e do nutri em paralelo
            const [pacienteData, nutriData] = await Promise.all([
                fetchApi(`/api/nutri/pacientes/${pacienteId}`),
                fetchApi('/api/nutri/auth/me')
            ]);
            setPaciente(pacienteData);
            setNutricionista(nutriData);
        } catch (error) {
            toast.error(error.message || "Erro ao carregar detalhes do paciente.");
            // Adicione um redirecionamento ou mensagem de erro mais robusta se desejar
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    if (loading) return <LoadingSpinner />;
    if (!paciente) return <div className="page-container"><p>Paciente não encontrado.</p></div>;
    
    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista</Link>
            <div className="page-header-action">
                <div className="page-header">
                    <h1>{paciente.nome} {paciente.sobrenome}</h1>
                    <p>Acompanhe e gira os planos alimentares e o progresso deste paciente.</p>
                </div>
                <button className="chat-btn" onClick={() => setIsChatOpen(true)}>💬 Enviar Mensagem</button>
            </div>
            
            {/* ✅ CORREÇÃO ESTRUTURAL: O Card agora envolve toda a área de abas */}
            <Card>
                <div className="tab-buttons">
                    <button 
                        className={`tab-btn ${activeTab === 'acompanhamento' ? 'active' : ''}`}
                        onClick={() => setActiveTab('acompanhamento')}>
                        Acompanhamento
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'metas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('metas')}>
                        Metas
                    </button>
                </div>

                <div className="tab-content">
                    {/* Renderiza o conteúdo da aba ativa */}
                    {activeTab === 'acompanhamento' && <AcompanhamentoTab paciente={paciente} nutricionista={nutricionista} />}
                    {activeTab === 'metas' && <MetasTab />}
                </div>
            </Card>

            <Modal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
                <h2>Conversa com {paciente.nome}</h2>
                <ChatBox currentUser={nutricionista} receiver={paciente} />
            </Modal>
        </div>
    );
};

export default PacienteDetailPage;