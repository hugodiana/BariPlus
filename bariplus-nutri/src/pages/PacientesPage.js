// src/pages/PacientesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './PacientesPage.css';

const PacientesPage = () => {
    const [pacientesBariplus, setPacientesBariplus] = useState([]);
    const [pacientesLocais, setPacientesLocais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // A rota do dashboard agora envia as duas listas de pacientes
            const data = await fetchApi('/api/nutri/dashboard');
            setPacientesBariplus(data.pacientesBariplus || []);
            setPacientesLocais(data.pacientesLocais || []);
        } catch (error) {
            toast.error('Erro ao carregar a lista de pacientes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-action">
                <div className="page-header">
                    <h1>Meus Pacientes</h1>
                    <p>Gira os seus pacientes e convide novos utilizadores para o BariPlus.</p>
                </div>
                <Link to="/pacientes/criar" className="action-btn-positive">
                    + Adicionar Paciente ao Prontuário
                </Link>
            </div>

            <div className="pacientes-grid">
                {/* Coluna da Esquerda: Listas de Pacientes */}
                <div className="pacientes-coluna">
                    <Card>
                        <h3>Pacientes Vinculados ao BariPlus ({pacientesBariplus.length})</h3>
                        <ListaPacientesBariplus pacientes={pacientesBariplus} />
                    </Card>
                    <Card>
                        <h3>Pacientes do Prontuário ({pacientesLocais.length})</h3>
                        <ListaPacientesLocais pacientes={pacientesLocais} />
                    </Card>
                </div>

                {/* Coluna da Direita: Convites */}
                <div className="convites-coluna">
                    <Card>
                        <h3>Convidar Paciente para o BariPlus</h3>
                        <p>
                            Gere um link de convite único para que um paciente possa criar uma conta gratuita no BariPlus e vinculá-la a si.
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
                                <p><strong>Link gerado!</strong> Envie para o seu paciente:</p>
                                <div className="link-input-group">
                                    <input type="text" value={generatedLink} readOnly />
                                    <button onClick={copyToClipboard}>Copiar</button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

const ListaPacientesBariplus = ({ pacientes }) => {
    if (pacientes.length === 0) {
        return <p>Nenhum paciente do BariPlus vinculado. Gere um link de convite para começar.</p>;
    }
    return (
        <ul className="pacientes-list">
            {pacientes.map(paciente => (
                <li key={paciente._id} className="paciente-item">
                    <span className="paciente-avatar">
                        {(paciente.nome?.charAt(0) || '')}{(paciente.sobrenome?.charAt(0) || '')}
                    </span>
                    <span className="paciente-name">{paciente.nome} {paciente.sobrenome}</span>
                    <Link to={`/paciente/${paciente._id}`} className="paciente-action-btn">
                        Ver Acompanhamento
                    </Link>
                </li>
            ))}
        </ul>
    );
};

const ListaPacientesLocais = ({ pacientes }) => {
    if (pacientes.length === 0) {
        return <p>Nenhum paciente particular adicionado. Clique em "Adicionar Paciente ao Prontuário" para começar.</p>;
    }
    return (
        <ul className="pacientes-list">
            {pacientes.map(paciente => (
                <li key={paciente._id} className="paciente-item">
                    <span className="paciente-avatar">
                        {paciente.nomeCompleto?.charAt(0)}
                    </span>
                    <span className="paciente-name">{paciente.nomeCompleto}</span>
                    <Link to={`/prontuario/${paciente._id}`} className="paciente-action-btn">Ver Prontuário</Link>
                </li>
            ))}
        </ul>
    );
};

export default PacientesPage;