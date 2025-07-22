import React, { useState, useEffect } from 'react';
import './MedicationPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';

const MedicationPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [historico, setHistorico] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formError, setFormError] = useState('');

    // Estados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        dosagem: '',
        quantidade: 1,
        unidade: 'comprimido(s)',
        vezesAoDia: 1
    });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    const hoje = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${apiUrl}/api/medication`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Erro ao carregar medicamentos');
                
                const data = await res.json();
                setMedicamentos(data.medicamentos || []);
                
                // Converter o histórico para Map
                const historicoMap = new Map();
                if (data.historico) {
                    Object.entries(data.historico).forEach(([date, meds]) => {
                        historicoMap.set(date, meds);
                    });
                }
                setHistorico(historicoMap);
            } catch (error) {
                toast.error(error.message);
                console.error("Erro ao buscar medicação:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, apiUrl]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantidade' || name === 'vezesAoDia' 
                   ? parseInt(value) || 0 
                   : value
        }));
    };

    const handleAddMedicamento = async (e) => {
        e.preventDefault();
        
        // Validação simples
        if (!formData.nome.trim()) {
            setFormError('Por favor, insira o nome do medicamento');
            return;
        }
        
        try {
            const res = await fetch(`${apiUrl}/api/medication`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            
            if (!res.ok) throw new Error('Erro ao adicionar medicamento');
            
            const medAdicionado = await res.json();
            setMedicamentos(prev => [...prev, medAdicionado]);
            setIsModalOpen(false);
            setFormError('');
            
            // Reset do formulário
            setFormData({
                nome: '',
                dosagem: '',
                quantidade: 1,
                unidade: 'comprimido(s)',
                vezesAoDia: 1
            });
            
            toast.success('Medicamento adicionado com sucesso!');
        } catch (error) {
            toast.error(error.message);
            console.error("Erro ao adicionar medicamento:", error);
        }
    };

    const handleDeleteMedicamento = async (medId) => {
        if (!window.confirm("Tem certeza que deseja remover este medicamento?")) return;
        
        try {
            const res = await fetch(`${apiUrl}/api/medication/${medId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('Erro ao remover medicamento');
            
            setMedicamentos(prev => prev.filter(med => med._id !== medId));
            toast.success('Medicamento removido com sucesso!');
        } catch (error) {
            toast.error(error.message);
            console.error("Erro ao remover medicamento:", error);
        }
    };

    const foiTomadoHoje = (medId, tomaIndex) => {
        const logDeHoje = historico.get(hoje) || {};
        return (logDeHoje[medId] || 0) > tomaIndex;
    };

    const handleToggleToma = async (medId, totalDoses) => {
        const logDeHoje = historico.get(hoje) || {};
        const tomasAtuais = logDeHoje[medId] || 0;
        const novasTomas = (tomasAtuais + 1) > totalDoses ? 0 : tomasAtuais + 1;

        try {
            const res = await fetch(`${apiUrl}/api/medication/log/update`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    date: hoje, 
                    medId: medId, 
                    count: novasTomas 
                })
            });
            
            if (!res.ok) throw new Error('Erro ao atualizar registro');
            
            // Atualizar o estado local
            const newHistory = new Map(historico);
            newHistory.set(hoje, {
                ...(newHistory.get(hoje) || {}),
                [medId]: novasTomas
            });
            setHistorico(newHistory);
            
        } catch (error) {
            toast.error(error.message);
            console.error("Erro ao atualizar registro:", error);
        }
    };

    if (loading) {
        return (
            <div className="page-container loading-container">
                <div className="loading-spinner"></div>
                <p>Carregando seus medicamentos...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minha Medicação</h1>
                <p>Controle seus medicamentos e vitaminas diárias</p>
            </div>
            
            <div className="medication-content">
                <div className="medication-header">
                    <h3>Lista de Medicamentos</h3>
                    <button 
                        className="add-btn" 
                        onClick={() => setIsModalOpen(true)}
                        aria-label="Adicionar novo medicamento"
                    >
                        <span>+</span> Adicionar
                    </button>
                </div>
                
                {medicamentos.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhum medicamento cadastrado ainda.</p>
                        <button 
                            className="add-btn" 
                            onClick={() => setIsModalOpen(true)}
                        >
                            Adicionar primeiro medicamento
                        </button>
                    </div>
                ) : (
                    <div className="medication-list">
                        {medicamentos.map(med => (
                            <div key={med._id} className="med-item">
                                <div className="med-info">
                                    <strong>{med.nome}</strong>
                                    <span>
                                        {med.dosagem && `${med.dosagem} - `}
                                        {med.quantidade} {med.unidade}, {med.vezesAoDia}x ao dia
                                    </span>
                                </div>
                                
                                <div className="daily-med-checks">
                                    {Array.from({ length: med.vezesAoDia }).map((_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`med-checkbox-daily ${foiTomadoHoje(med._id, index) ? 'taken' : ''}`}
                                            onClick={() => handleToggleToma(med._id, med.vezesAoDia)}
                                            aria-label={`Marcar ${index + 1}ª dose como ${foiTomadoHoje(med._id, index) ? 'não tomada' : 'tomada'}`}
                                        >
                                            {foiTomadoHoje(med._id, index) && '✓'}
                                        </button>
                                    ))}
                                </div>
                                
                                <button 
                                    onClick={() => handleDeleteMedicamento(med._id)} 
                                    className="delete-med-btn"
                                    aria-label="Remover medicamento"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="modal-content">
                    <h2>Adicionar Novo Medicamento</h2>
                    {formError && <div className="form-error">{formError}</div>}
                    
                    <form onSubmit={handleAddMedicamento} className="medication-form">
                        <div className="form-group">
                            <label htmlFor="nome">Nome do Medicamento/Vitamina</label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleInputChange}
                                placeholder="Ex: Vitamina D3"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="dosagem">Dosagem (opcional)</label>
                            <input
                                type="text"
                                id="dosagem"
                                name="dosagem"
                                value={formData.dosagem}
                                onChange={handleInputChange}
                                placeholder="Ex: 500mg, 1000mcg"
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="quantidade">Quantidade por dose</label>
                                <input
                                    type="number"
                                    id="quantidade"
                                    name="quantidade"
                                    min="1"
                                    value={formData.quantidade}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="unidade">Unidade</label>
                                <select
                                    id="unidade"
                                    name="unidade"
                                    value={formData.unidade}
                                    onChange={handleInputChange}
                                >
                                    <option value="comprimido(s)">comprimido(s)</option>
                                    <option value="cápsula(s)">cápsula(s)</option>
                                    <option value="gota(s)">gota(s)</option>
                                    <option value="ml">ml</option>
                                    <option value="mg">mg</option>
                                    <option value="mcg">mcg</option>
                                    <option value="UI">UI</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="vezesAoDia">Frequência diária</label>
                            <select
                                id="vezesAoDia"
                                name="vezesAoDia"
                                value={formData.vezesAoDia}
                                onChange={handleInputChange}
                            >
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>
                                        {num} {num === 1 ? 'vez' : 'vezes'} ao dia
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <button type="submit" className="submit-btn">
                            Adicionar à Lista
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default MedicationPage;