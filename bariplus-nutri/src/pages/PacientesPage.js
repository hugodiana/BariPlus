// src/pages/PacientesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import './PacientesPage.css'; // Vamos criar este ficheiro a seguir

const PacientesPage = () => {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchPacientes = useCallback(async () => {
        try {
            // A rota do dashboard já nos dá a lista de pacientes
            const data = await fetchApi('/api/nutri/dashboard');
            setPacientes(data.pacientesRecentes || []);
        } catch (error) {
            toast.error('Erro ao carregar a lista de pacientes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPacientes();
    }, [fetchPacientes]);

    const handleGenerateInvite = async () => {
        setIsGenerating(true);
        try {
            const data = await fetchApi('/api/nutri/convites/gerar', {
                method: 'POST'
            });
            setGeneratedLink(data.url);
            toast.success('Link de convite gerado com sucesso!');
        } catch (error) {
            toast.error(error.message || 'Não foi possível gerar o convite.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        toast.info('Link copiado para a área de transferência!');
    };

    if (loading) return <p>A carregar pacientes...</p>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meus Pacientes</h1>
            </div>

            <div className="pacientes-grid">
                <Card className="pacientes-list-card">
                    <h3>Lista de Pacientes</h3>
                    {pacientes.length > 0 ? (
                        <ul className="pacientes-list">
                            {pacientes.map(paciente => (
                                <li key={paciente._id} className="paciente-item">
                                    <span className="paciente-avatar">
                                        {paciente.nome.charAt(0)}{paciente.sobrenome?.charAt(0)}
                                    </span>
                                    <span className="paciente-name">{paciente.nome} {paciente.sobrenome}</span>
                                    {/* No futuro, este botão levará ao perfil detalhado do paciente */}
                                    <button className="paciente-action-btn">Ver Detalhes</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Você ainda não tem nenhum paciente vinculado.</p>
                    )}
                </Card>

                <Card className="convite-card">
                    <h3>Convidar Novo Paciente</h3>
                    <p>
                        Gere um link de convite único e envie para o seu paciente. Ao aceitar, ele será automaticamente vinculado à sua conta.
                    </p>
                    <button 
                        className="generate-btn" 
                        onClick={handleGenerateInvite} 
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'A gerar...' : 'Gerar Novo Convite'}
                    </button>

                    {generatedLink && (
                        <div className="generated-link-container">
                            <p><strong>Link gerado com sucesso!</strong> Envie para o seu paciente:</p>
                            <div className="link-input-group">
                                <input type="text" value={generatedLink} readOnly />
                                <button onClick={copyToClipboard}>Copiar</button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PacientesPage;