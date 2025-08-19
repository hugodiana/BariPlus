// src/pages/ProntuarioPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import './ProntuarioPage.css'; // Vamos criar este ficheiro

const ProntuarioPage = () => {
    const { pacienteId } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('anamnese');
    const [isAvaliacaoModalOpen, setIsAvaliacaoModalOpen] = useState(false);

    const fetchProntuario = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`/api/nutri/prontuario/${pacienteId}`);
            setPaciente(data);
        } catch (error) {
            toast.error("Erro ao carregar o prontuário do paciente.");
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchProntuario();
    }, [fetchProntuario]);

    if (loading) return <LoadingSpinner />;
    if (!paciente) return <p>Não foi possível carregar os dados do paciente.</p>;

    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista de pacientes</Link>
            <div className="page-header">
                <h1>Prontuário de {paciente.nomeCompleto}</h1>
            </div>

            <Card>
                <div className="tab-buttons">
                    <button 
                        className={`tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`}
                        onClick={() => setActiveTab('anamnese')}
                    >
                        Anamnese
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'avaliacoes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('avaliacoes')}
                    >
                        Avaliações Físicas
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'anamnese' && <AnamneseSection paciente={paciente} onSave={setPaciente} />}
                    {activeTab === 'avaliacoes' && (
                        <AvaliacoesSection 
                            avaliacoes={paciente.avaliacoes} 
                            onAddClick={() => setIsAvaliacaoModalOpen(true)}
                        />
                    )}
                </div>
            </Card>

            {isAvaliacaoModalOpen && (
                <AddAvaliacaoModal 
                    pacienteId={pacienteId}
                    onClose={() => setIsAvaliacaoModalOpen(false)}
                    onSave={(updatedPaciente) => {
                        setPaciente(updatedPaciente);
                        setIsAvaliacaoModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

// Componentes internos para cada secção
const AnamneseSection = ({ paciente, onSave }) => {
    const [formData, setFormData] = useState({
        objetivo: paciente.objetivo || '',
        historicoSaude: paciente.historicoSaude || '',
        historicoFamiliar: paciente.historicoFamiliar || '',
        habitos: paciente.habitos || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSave = async () => {
        try {
            const updatedPaciente = await fetchApi(`/api/nutri/prontuario/${paciente._id}/anamnese`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            onSave(updatedPaciente);
            toast.success("Anamnese guardada com sucesso!");
        } catch (error) {
            toast.error("Erro ao guardar anamnese.");
        }
    };
    
    return (
        <div>
            <div className="form-group">
                <label>Objetivo Principal</label>
                <textarea name="objetivo" value={formData.objetivo} onChange={handleChange} rows="3"></textarea>
            </div>
            <div className="form-group">
                <label>Histórico de Saúde</label>
                <textarea name="historicoSaude" value={formData.historicoSaude} onChange={handleChange} rows="5"></textarea>
            </div>
            <div className="form-group">
                <label>Histórico Familiar</label>
                <textarea name="historicoFamiliar" value={formData.historicoFamiliar} onChange={handleChange} rows="3"></textarea>
            </div>
             <div className="form-group">
                <label>Hábitos (Sono, Álcool, Fumo, etc.)</label>
                <textarea name="habitos" value={formData.habitos} onChange={handleChange} rows="3"></textarea>
            </div>
            <button className="submit-btn" onClick={handleSave}>Guardar Anamnese</button>
        </div>
    );
};

const AvaliacoesSection = ({ avaliacoes, onAddClick }) => (
    <div>
        <button className="primary-btn" onClick={onAddClick}>+ Adicionar Nova Avaliação</button>
        {/* Aqui virá a lista de avaliações */}
    </div>
);

const AddAvaliacaoModal = ({ pacienteId, onClose, onSave }) => {
    // Adicione os estados para todos os campos da avaliação aqui
    const [formData, setFormData] = useState({ peso: '', altura: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedPaciente = await fetchApi(`/api/nutri/prontuario/${pacienteId}/avaliacoes`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            onSave(updatedPaciente);
        } catch (error) {
            toast.error("Erro ao adicionar avaliação.");
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Nova Avaliação Física</h2>
            <form onSubmit={handleSubmit}>
                {/* Adicione os inputs para todos os campos da avaliação aqui */}
                <div className="form-group">
                    <label>Peso (kg)</label>
                    <input type="number" name="peso" value={formData.peso} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Altura (cm)</label>
                    <input type="number" name="altura" value={formData.altura} onChange={handleChange} />
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-btn">Guardar Avaliação</button>
                </div>
            </form>
        </Modal>
    );
};

export default ProntuarioPage;