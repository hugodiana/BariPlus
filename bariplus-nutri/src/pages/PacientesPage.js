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
    const [activeTab, setActiveTab] = useState('bariplus'); // 'bariplus' ou 'locais'

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Buscamos os dois tipos de pacientes em paralelo
            const [dataDashboard, dataLocais] = await Promise.all([
                fetchApi('/api/nutri/dashboard'), // Pacientes BariPlus
                fetchApi('/api/nutri/pacientes-locais') // Pacientes Locais
            ]);
            
            setPacientesBariplus(dataDashboard.pacientes || []);
            setPacientesLocais(dataLocais || []);
        } catch (error) {
            toast.error('Erro ao carregar a lista de pacientes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-action">
                <div className="page-header">
                    <h1>Meus Pacientes</h1>
                    <p>Gira os seus pacientes vinculados ao BariPlus e os seus prontuários particulares.</p>
                </div>
                <Link to="/pacientes/criar" className="action-btn-positive">
                    + Adicionar Paciente
                </Link>
            </div>

            <Card>
                <div className="tab-buttons">
                    <button 
                        className={`tab-btn ${activeTab === 'bariplus' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('bariplus')}
                    >
                        Pacientes BariPlus ({pacientesBariplus.length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'locais' ? 'active' : ''}`}
                        onClick={() => setActiveTab('locais')}
                    >
                        Meus Pacientes ({pacientesLocais.length})
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'bariplus' && (
                        <ListaPacientesBariplus pacientes={pacientesBariplus} />
                    )}
                    {activeTab === 'locais' && (
                        <ListaPacientesLocais pacientes={pacientesLocais} />
                    )}
                </div>
            </Card>
        </div>
    );
};

// Componente para a lista de pacientes do BariPlus
const ListaPacientesBariplus = ({ pacientes }) => {
    if (pacientes.length === 0) {
        return <p>Nenhum paciente do BariPlus vinculado. Gere e envie um link de convite.</p>;
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

// Componente para a lista de pacientes locais
const ListaPacientesLocais = ({ pacientes }) => {
    if (pacientes.length === 0) {
        return <p>Nenhum paciente particular adicionado. Clique em "Adicionar Paciente" para começar.</p>;
    }
    return (
        <ul className="pacientes-list">
            {pacientes.map(paciente => (
                <li key={paciente._id} className="paciente-item">
                    <span className="paciente-avatar">
                        {paciente.nomeCompleto?.charAt(0)}
                    </span>
                    <span className="paciente-name">{paciente.nomeCompleto}</span>
                    {/* No futuro, este link levará ao prontuário completo */}
                    <Link to={`/prontuario/${paciente._id}`} className="paciente-action-btn">Ver Prontuário</Link>
                </li>
            ))}
        </ul>
    );
};


export default PacientesPage;