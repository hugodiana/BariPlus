// src/pages/PacientesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './PacientesPage.css';

const PacientesPage = () => {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/nutri/dashboard');
            // Junta as duas listas (ativos e prontuário) numa só para exibição
            const allPacientes = (data.pacientesBariplus || []).concat(data.pacientesLocais || []);
            setPacientes(allPacientes.sort((a,b) => (a.nome || '').localeCompare(b.nome || ''))); // Ordena por nome
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
                    + Adicionar Paciente
                </Link>
            </div>

            <div className="pacientes-grid">
                <div className="pacientes-coluna">
                    <Card>
                        <div className="card-header-action">
                            <h3>Todos os Pacientes ({pacientes.length})</h3>
                        </div>
                        {pacientes.length > 0 ? (
                            <ul className="pacientes-list">
                                {pacientes.map(paciente => (
                                    <li key={paciente._id} className="paciente-item">
                                        <span className="paciente-avatar">
                                            {(paciente.nome?.charAt(0) || '')}{(paciente.sobrenome?.charAt(0) || '')}
                                        </span>
                                        <div className="paciente-info">
                                            <span className="paciente-name">{paciente.nome || ''} {paciente.sobrenome || ''}</span>
                                            <span className={`status-tag ${paciente.statusConta === 'ativo' ? 'ativo' : 'prontuario'}`}>
                                                {paciente.statusConta === 'ativo' ? 'App BariPlus' : 'Apenas Prontuário'}
                                            </span>
                                        </div>
                                        <Link to={`/prontuario/${paciente._id}`} className="paciente-action-btn">
                                            Ver Prontuário
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Nenhum paciente encontrado.</p>
                        )}
                    </Card>
                </div>

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

export default PacientesPage;