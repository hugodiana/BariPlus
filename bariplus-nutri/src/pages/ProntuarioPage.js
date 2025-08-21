// src/pages/ProntuarioPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import AnamneseForm from '../components/paciente/AnamneseForm';
import AvaliacoesTab from '../components/paciente/AvaliacoesTab';
import PlanosTab from '../components/paciente/PlanosTab';
import EvolucaoTab from '../components/paciente/EvolucaoTab'; 
import AcompanhamentoTab from '../components/paciente/AcompanhamentoTab';
import MetasTab from '../components/paciente/MetasTab'; // ✅ 1. IMPORTE A ABA DE METAS
import ChatTab from '../components/paciente/ChatTab';   // ✅ 2. IMPORTE A ABA DE CHAT
import './ProntuarioPage.css';

const ProntuarioPage = () => {
    const { pacienteId } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [prontuario, setProntuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [nutricionista, setNutricionista] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pacienteData, prontuarioData, nutriData] = await Promise.all([
                fetchApi(`/api/nutri/pacientes/${pacienteId}`),
                fetchApi(`/api/nutri/prontuarios/${pacienteId}`),
                fetchApi('/api/nutri/auth/me')
            ]);
            setPaciente(pacienteData);
            setProntuario(prontuarioData);
            setNutricionista(nutriData);

            if (pacienteData.statusConta === 'ativo') {
                setActiveTab('acompanhamento');
            } else {
                setActiveTab('anamnese');
            }
        } catch (error) {
            toast.error("Erro ao carregar os dados do paciente.");
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleConvidar = async () => {
        if (!paciente.email) {
            return toast.warn("Para convidar, o paciente precisa de ter um e-mail cadastrado.");
        }
        if (window.confirm(`Tem a certeza que deseja convidar ${paciente.nome} para o app BariPlus?`)) {
            try {
                const data = await fetchApi(`/api/nutri/pacientes/${pacienteId}/convidar`, { method: 'POST' });
                toast.success(data.message);
                fetchData();
            } catch (error) {
                toast.error(error.message || "Não foi possível enviar o convite.");
            }
        }
    };
    
    if (loading) return <LoadingSpinner />;
    if (!paciente || !prontuario) return <p>Não foi possível carregar os dados.</p>;

    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista de pacientes</Link>
            <div className="page-header-action">
                <div className="page-header">
                    <h1>Prontuário de {paciente.nome} {paciente.sobrenome}</h1>
                    <p>Status: <span className={`status-tag ${paciente.statusConta === 'ativo' ? 'ativo' : 'prontuario'}`}>{paciente.statusConta === 'ativo' ? 'App BariPlus Ativo' : 'Apenas Prontuário'}</span></p>
                </div>
                {paciente.statusConta === 'pendente_prontuario' && (
                    <button className="action-btn-positive" onClick={handleConvidar}>Convidar para o App</button>
                )}
            </div>

            <Card>
                <div className="tab-buttons">
                    {/* ✅ 3. RENDERIZAÇÃO CONDICIONAL DE TODAS AS ABAS */}
                    <button className={`tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`} onClick={() => setActiveTab('anamnese')}>Anamnese</button>
                    <button className={`tab-btn ${activeTab === 'planos' ? 'active' : ''}`} onClick={() => setActiveTab('planos')}>Planos</button>
                    <button className={`tab-btn ${activeTab === 'avaliacoes' ? 'active' : ''}`} onClick={() => setActiveTab('avaliacoes')}>Avaliações</button>
                    <button className={`tab-btn ${activeTab === 'evolucoes' ? 'active' : ''}`} onClick={() => setActiveTab('evolucoes')}>Evolução</button>
                    {paciente.statusConta === 'ativo' && (
                        <>
                            <button className={`tab-btn ${activeTab === 'acompanhamento' ? 'active' : ''}`} onClick={() => setActiveTab('acompanhamento')}>Acompanhamento</button>
                            <button className={`tab-btn ${activeTab === 'metas' ? 'active' : ''}`} onClick={() => setActiveTab('metas')}>Metas</button>
                            <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
                        </>
                    )}
                    
                </div>
                <div className="tab-content">
                    {activeTab === 'anamnese' && <AnamneseForm prontuario={prontuario} onSave={setProntuario} />}
                    {activeTab === 'planos' && <PlanosTab />}
                    {activeTab === 'avaliacoes' && <AvaliacoesTab prontuario={prontuario} onUpdate={setProntuario} />}
                    {activeTab === 'evolucoes' && <EvolucaoTab prontuario={prontuario} onUpdate={setProntuario} />}
                    {activeTab === 'acompanhamento' && <AcompanhamentoTab paciente={paciente} nutricionista={nutricionista} />}
                    {activeTab === 'metas' && <MetasTab />}
                    {activeTab === 'chat' && <ChatTab paciente={paciente} nutricionista={nutricionista} />}
                </div>
            </Card>
        </div>
    );
};

export default ProntuarioPage;