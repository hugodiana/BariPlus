// src/pages/ProntuarioPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import AnamneseForm from '../components/paciente/AnamneseForm';
import AddAvaliacaoModal from '../components/paciente/AddAvaliacaoModal';
import EvolucaoTab from '../components/paciente/EvolucaoTab'; 
import './ProntuarioPage.css';

// ✅ 2. NOVO COMPONENTE INTERNO PARA A ABA DE AVALIAÇÕES
const AvaliacoesTab = ({ prontuario, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const avaliacoesOrdenadas = [...prontuario.avaliacoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    return (
        <div>
            <div className="card-header-action">
                <h3>Histórico de Avaliações</h3>
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>
                    + Nova Avaliação
                </button>
            </div>

            {avaliacoesOrdenadas.length > 0 ? (
                <div className="admin-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Peso (kg)</th>
                                <th>Altura (cm)</th>
                                <th>IMC</th>
                                <th>Cintura (cm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {avaliacoesOrdenadas.map(av => (
                                <tr key={av._id}>
                                    <td>{format(new Date(av.data), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                    <td>{av.peso || '-'}</td>
                                    <td>{av.altura || '-'}</td>
                                    <td>{av.imc || '-'}</td>
                                    <td>{av.circunferencias?.cintura || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Nenhuma avaliação física registada para este paciente.</p>
            )}

            {isModalOpen && (
                <AddAvaliacaoModal 
                    pacienteId={prontuario.pacienteId}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(updatedProntuario) => {
                        onUpdate(updatedProntuario);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};


const ProntuarioPage = () => {
    const { pacienteId } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [prontuario, setProntuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('anamnese');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pacienteData, prontuarioData] = await Promise.all([
                fetchApi(`/api/nutri/pacientes/${pacienteId}`),
                fetchApi(`/api/nutri/prontuarios/${pacienteId}`)
            ]);
            setPaciente(pacienteData);
            setProntuario(prontuarioData);
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
                    <button className={`tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`} onClick={() => setActiveTab('anamnese')}>Anamnese</button>
                    <button className={`tab-btn ${activeTab === 'avaliacoes' ? 'active' : ''}`} onClick={() => setActiveTab('avaliacoes')}>Avaliações Físicas</button>
                    <button className={`tab-btn ${activeTab === 'evolucoes' ? 'active' : ''}`} onClick={() => setActiveTab('evolucoes')}>Evolução</button>
                </div>
                <div className="tab-content">
                    {activeTab === 'anamnese' && <AnamneseForm prontuario={prontuario} onSave={setProntuario} />}
                    {activeTab === 'avaliacoes' && <AvaliacoesTab prontuario={prontuario} onUpdate={setProntuario} />}
                    {activeTab === 'evolucoes' && <EvolucaoTab prontuario={prontuario} onUpdate={setProntuario} />}
                </div>
            </Card>
        </div>
    );
};

export default ProntuarioPage;