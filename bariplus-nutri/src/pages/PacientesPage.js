// bariplus-nutri/src/pages/PacientesPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner'; // ✅ CAMINHO CORRIGIDO
import Modal from '../components/ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faUserCheck, faIdCard } from '@fortawesome/free-solid-svg-icons';
import './PacientesPage.css';

const PacientesPage = () => {
    const { nutricionista } = useAuth();
    const { isLoading, request } = useApi();
    const navigate = useNavigate();
    
    const [pacientes, setPacientes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoPaciente, setNovoPaciente] = useState({ nomeCompleto: '', email: '', telefone: '', dataNascimento: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('todos');
    const [sortBy, setSortBy] = useState('nome-asc');

    const fetchPacientes = useCallback(async () => {
        if (nutricionista && nutricionista.pacientes) {
            setPacientes(nutricionista.pacientes);
        }
    }, [nutricionista]);

    useEffect(() => {
        fetchPacientes();
    }, [fetchPacientes]);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleInputChange = (e) => {
        setNovoPaciente({ ...novoPaciente, [e.target.name]: e.target.value });
    };

    const handleAddPaciente = async (e) => {
        e.preventDefault();
        try {
            await request('/api/nutri/pacientes', {
                method: 'POST',
                body: JSON.stringify(novoPaciente),
            });
            toast.success("Paciente de prontuário criado com sucesso!");
            window.location.reload(); 
        } catch (error) {
            // O hook useApi já exibe o toast de erro
        }
    };
    
    const filteredAndSortedPacientes = useMemo(() => {
        let items = [...pacientes];

        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            items = items.filter(p => 
                `${p.nome || ''} ${p.sobrenome || ''}`.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }
        
        if (activeFilter === 'app') {
            items = items.filter(p => p.statusConta === 'ativo');
        } else if (activeFilter === 'local') {
            items = items.filter(p => p.statusConta === 'pendente_prontuario');
        }
        
        switch (sortBy) {
            case 'nome-asc':
                items.sort((a, b) => `${a.nome} ${a.sobrenome}`.localeCompare(`${b.nome} ${b.sobrenome}`));
                break;
            case 'nome-desc':
                items.sort((a, b) => `${b.nome} ${b.sobrenome}`.localeCompare(`${a.nome} ${a.sobrenome}`));
                break;
            case 'data-desc':
                items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            default:
                break;
        }

        return items;
    }, [pacientes, searchTerm, activeFilter, sortBy]);

    if (!nutricionista) {
        return <LoadingSpinner fullPage />;
    }

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header">
                    <h1>Meus Pacientes</h1>
                    <p>Gira os seus pacientes do prontuário e do aplicativo BariPlus.</p>
                </div>
                <button className="add-btn" onClick={handleOpenModal}>
                    <FontAwesomeIcon icon={faPlus} /> Novo Paciente (Prontuário)
                </button>
            </div>

            <Card className="pacientes-controls">
                <div className="search-bar">
                    <FontAwesomeIcon icon={faSearch} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    <button className={activeFilter === 'todos' ? 'active' : ''} onClick={() => setActiveFilter('todos')}>Todos</button>
                    <button className={activeFilter === 'app' ? 'active' : ''} onClick={() => setActiveFilter('app')}>Do App</button>
                    <button className={activeFilter === 'local' ? 'active' : ''} onClick={() => setActiveFilter('local')}>Só Prontuário</button>
                </div>
                <div className="sort-select">
                    <label htmlFor="sort">Ordenar por:</label>
                    <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="nome-asc">Nome (A-Z)</option>
                        <option value="nome-desc">Nome (Z-A)</option>
                        <option value="data-desc">Mais Recentes</option>
                    </select>
                </div>
            </Card>

            <div className="pacientes-grid">
                {isLoading && <LoadingSpinner />}
                {!isLoading && filteredAndSortedPacientes.map(paciente => (
                    <Card 
                        key={paciente._id} 
                        className="paciente-card" 
                        onClick={() => navigate(`/pacientes/${paciente._id}`)}
                    >
                        <img src={paciente.fotoPerfilUrl || 'https://i.imgur.com/V4RclNb.png'} alt="Foto do Paciente" className="paciente-avatar" />
                        <div className="paciente-info">
                            <h4>{`${paciente.nome || ''} ${paciente.sobrenome || ''}`.trim()}</h4>
                            <span className={`paciente-status ${paciente.statusConta === 'ativo' ? 'app' : 'local'}`}>
                                <FontAwesomeIcon icon={paciente.statusConta === 'ativo' ? faUserCheck : faIdCard} />
                                {paciente.statusConta === 'ativo' ? 'Usa o App' : 'Só Prontuário'}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Criar Novo Paciente (Apenas Prontuário)">
                <form onSubmit={handleAddPaciente} className="modal-form">
                    <p>Este paciente será adicionado apenas ao seu sistema de prontuários. Você poderá convidá-lo para o aplicativo mais tarde.</p>
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input type="text" name="nomeCompleto" value={novoPaciente.nomeCompleto} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email (Opcional, para convite futuro)</label>
                        <input type="email" name="email" value={novoPaciente.email} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Telefone (Opcional)</label>
                        <input type="tel" name="telefone" value={novoPaciente.telefone} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Data de Nascimento (Opcional)</label>
                        <input type="date" name="dataNascimento" value={novoPaciente.dataNascimento} onChange={handleInputChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={handleCloseModal}>Cancelar</button>
                        <button type="submit" className="primary-btn" disabled={isLoading}>
                            {isLoading ? 'A criar...' : 'Criar Paciente'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PacientesPage;