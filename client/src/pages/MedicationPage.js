import React, { useState, useEffect, useCallback } from 'react';
import './MedicationPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MedicationPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [historico, setHistorico] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        dosagem: '',
        quantidade: 1,
        unidade: 'comprimido(s)',
        frequencia: {
            tipo: 'Diária',
            horarios: ['08:00'],
            diaDaSemana: 1, // Segunda-feira como padrão
        }
    });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    const hoje = new Date().toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/medication`, {
                headers: { 
                    'Authorization': `Bearer ${token}` 
                } 
            });
            
            if (!response.ok) {
                throw new Error('Erro ao carregar medicamentos');
            }
            
            const data = await response.json();
            setMedicamentos(data.medicamentos || []);
            
            const historicoMap = new Map();
            if (data.historico) {
                Object.entries(data.historico).forEach(([date, medications]) => {
                    historicoMap.set(date, new Map(Object.entries(medications)));
                });
            }
            setHistorico(historicoMap);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(previousState => ({ 
            ...previousState, 
            [name]: value 
        }));
    };

    const handleFrequenciaChange = (event) => {
        const { name, value } = event.target;
        setFormData(previousState => ({
            ...previousState,
            frequencia: { 
                ...previousState.frequencia, 
                [name]: value 
            }
        }));
    };

    const handleHorarioChange = (index, value) => {
        const novosHorarios = [...formData.frequencia.horarios];
        novosHorarios[index] = value;
        setFormData(previousState => ({ 
            ...previousState, 
            frequencia: { 
                ...previousState.frequencia, 
                horarios: novosHorarios 
            } 
        }));
    };

    const addHorario = () => {
        setFormData(previousState => ({ 
            ...previousState, 
            frequencia: { 
                ...previousState.frequencia, 
                horarios: [...previousState.frequencia.horarios, '08:00'] 
            } 
        }));
    };

    const removeHorario = (index) => {
        if (formData.frequencia.horarios.length > 1) {
            const novosHorarios = formData.frequencia.horarios.filter((_, i) => i !== index);
            setFormData(previousState => ({ 
                ...previousState, 
                frequencia: { 
                    ...previousState.frequencia, 
                    horarios: novosHorarios 
                } 
            }));
        }
    };

    const validateTimeFormat = (time) => {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    };

    const handleAddMedicamento = async (event) => {
        event.preventDefault();
        
        // Validar formatos de horário
        if (formData.frequencia.tipo === 'Diária') {
            for (const horario of formData.frequencia.horarios) {
                if (!validateTimeFormat(horario)) {
                    toast.error('Por favor, insira horários no formato HH:MM (ex: 08:00)');
                    return;
                }
            }
        }

        try {
            const response = await fetch(`${apiUrl}/api/medication`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao adicionar medicamento');
            }
            
            toast.success('Medicamento adicionado com sucesso!');
            setIsModalOpen(false);
            
            // Resetar formulário após sucesso
            setFormData({
                nome: '',
                dosagem: '',
                quantidade: 1,
                unidade: 'comprimido(s)',
                frequencia: {
                    tipo: 'Diária',
                    horarios: ['08:00'],
                    diaDaSemana: 1,
                }
            });
            
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleStatus = async (medication) => {
        const novoStatus = medication.status === 'Ativo' ? 'Inativo' : 'Ativo';
        try {
            const response = await fetch(`${apiUrl}/api/medication/${medication._id}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: novoStatus })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao alterar status do medicamento');
            }
            
            toast.info(`Medicamento marcado como ${novoStatus}.`);
            fetchData();
        } catch (error) {
            toast.error('Erro ao alterar status do medicamento');
        }
    };

    const handleDeleteMedicamento = async (medicationId) => {
        if (!window.confirm("Tem certeza que deseja apagar este medicamento? Esta ação é irreversível.")) {
            return;
        }
        
        try {
            const response = await fetch(`${apiUrl}/api/medication/${medicationId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao remover medicamento');
            }
            
            setMedicamentos(previousState => 
                previousState.filter(medication => medication._id !== medicationId)
            );
            toast.success('Medicamento removido com sucesso!');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const foiTomadoHoje = (medicationId, doseIndex) => {
        const logDeHoje = historico.get(hoje) || new Map();
        return (logDeHoje.get(medicationId) || 0) > doseIndex;
    };

    const handleToggleToma = async (medicationId, totalDoses) => {
        const logDeHoje = historico.get(hoje) || new Map();
        const tomasAtuais = logDeHoje.get(medicationId) || 0;
        const novasTomas = (tomasAtuais + 1) > totalDoses ? 0 : tomasAtuais + 1;

        try {
            const response = await fetch(`${apiUrl}/api/medication/log`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    date: hoje, 
                    medId: medicationId, 
                    count: novasTomas 
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao atualizar registro de medicação');
            }
            
            const newHistory = new Map(historico);
            const newLogHoje = new Map(newHistory.get(hoje));
            newLogHoje.set(medicationId, novasTomas);
            newHistory.set(hoje, newLogHoje);
            setHistorico(newHistory);
        } catch (error) {
            toast.error("Erro ao atualizar registro de medicação.");
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    const medicamentosAtivos = medicamentos.filter(medication => medication.status === 'Ativo');
    const medicamentosInativos = medicamentos.filter(medication => medication.status === 'Inativo');

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minha Medicação</h1>
                <p>Controle seus medicamentos e vitaminas diárias</p>
            </div>
            
            <Card>
                <div className="medication-header">
                    <h3>Medicamentos Ativos</h3>
                    <button 
                        className="add-btn" 
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Adicionar
                    </button>
                </div>
                
                {medicamentosAtivos.length > 0 ? (
                    <div className="medication-list">
                        {medicamentosAtivos.map(medication => (
                            <MedicationItem 
                                key={medication._id} 
                                med={medication} 
                                historico={historico} 
                                hoje={hoje} 
                                onToggleToma={handleToggleToma} 
                                onDelete={handleDeleteMedicamento} 
                                onToggleStatus={handleToggleStatus} 
                            />
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">Nenhum medicamento ativo cadastrado.</p>
                )}
            </Card>

            {medicamentosInativos.length > 0 && (
                <div 
                    className="inactive-toggle" 
                    onClick={() => setShowInactive(!showInactive)}
                >
                    {showInactive ? 'Ocultar' : 'Mostrar'} Medicamentos Arquivados ({medicamentosInativos.length})
                </div>
            )}

            {showInactive && (
                <Card>
                    <div className="medication-header">
                        <h3>Medicamentos Arquivados</h3>
                    </div>
                    <div className="medication-list">
                        {medicamentosInativos.map(medication => (
                            <MedicationItem 
                                key={medication._id} 
                                med={medication} 
                                onToggleStatus={handleToggleStatus} 
                                onDelete={handleDeleteMedicamento} 
                            />
                        ))}
                    </div>
                </Card>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="modal-content">
                    <h2>Adicionar Novo Medicamento</h2>
                    <form onSubmit={handleAddMedicamento} className="medication-form">
                        <div className="form-group">
                            <label htmlFor="nome">Nome</label>
                            <input 
                                type="text" 
                                id="nome" 
                                name="nome" 
                                value={formData.nome} 
                                onChange={handleInputChange} 
                                required 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="dosagem">Dosagem</label>
                            <input 
                                type="text" 
                                id="dosagem" 
                                name="dosagem" 
                                value={formData.dosagem} 
                                onChange={handleInputChange} 
                                placeholder="(Opcional)" 
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="quantidade">Quantidade</label>
                                <input 
                                    type="number" 
                                    id="quantidade" 
                                    name="quantidade" 
                                    min="1" 
                                    value={formData.quantidade} 
                                    onChange={handleInputChange} 
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
                                    <option>comprimido(s)</option>
                                    <option>cápsula(s)</option>
                                    <option>gota(s)</option>
                                    <option>ml</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Frequência</label>
                            <select 
                                name="tipo" 
                                value={formData.frequencia.tipo} 
                                onChange={handleFrequenciaChange} 
                                className="frequencia-select"
                            >
                                <option>Diária</option>
                                <option>Semanal</option>
                            </select>
                        </div>
                        
                        {formData.frequencia.tipo === 'Diária' && (
                            <div className="form-group">
                                <label>Horários das Doses</label>
                                {formData.frequencia.horarios.map((horario, index) => (
                                    <div key={index} className="horario-input-group">
                                        <input 
                                            type="time" 
                                            value={horario} 
                                            onChange={(event) => handleHorarioChange(index, event.target.value)} 
                                            required 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => removeHorario(index)} 
                                            className="remove-horario-btn"
                                        >
                                            -
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={addHorario} 
                                    className="add-horario-btn"
                                >
                                    + Adicionar Horário
                                </button>
                            </div>
                        )}

                        {formData.frequencia.tipo === 'Semanal' && (
                            <div className="form-group">
                                <label>Dia da Semana</label>
                                <select 
                                    name="diaDaSemana" 
                                    value={formData.frequencia.diaDaSemana} 
                                    onChange={handleFrequenciaChange}
                                >
                                    <option value="1">Segunda-feira</option>
                                    <option value="2">Terça-feira</option>
                                    <option value="3">Quarta-feira</option>
                                    <option value="4">Quinta-feira</option>
                                    <option value="5">Sexta-feira</option>
                                    <option value="6">Sábado</option>
                                    <option value="0">Domingo</option>
                                </select>
                            </div>
                        )}
                        
                        <button type="submit" className="submit-btn">
                            Adicionar à Lista
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

const MedicationItem = ({ med, historico, hoje, onToggleToma, onDelete, onToggleStatus }) => {
    const foiTomadoHoje = (medicationId, doseIndex) => {
        if (!historico || !hoje) return false;
        const logDeHoje = historico.get(hoje) || new Map();
        return (logDeHoje.get(medicationId) || 0) > doseIndex;
    };

    return (
        <div className={`med-item status-${med.status.toLowerCase()}`}>
            <div className="med-info">
                <strong>{med.nome}</strong>
                <span>
                    {med.dosagem && `${med.dosagem} - `}
                    {med.quantidade} {med.unidade}
                </span>
                <div className="med-horarios">
                    {med.frequencia.tipo === 'Diária' && 
                        med.frequencia.horarios.map((horario, index) => (
                            <span key={index} className="horario-tag">
                                {horario}
                            </span>
                        ))
                    }
                    
                    {med.frequencia.tipo === 'Semanal' && (
                        <span className="horario-tag">
                            Toda {format(new Date(2024, 0, med.frequencia.diaDaSemana + 1), 'EEEE', { locale: ptBR })}
                        </span>
                    )}
                </div>
            </div>
            
            {med.status === 'Ativo' && onToggleToma && (
                <div className="daily-med-checks">
                    {Array.from({ length: med.frequencia.horarios.length }).map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`med-checkbox-daily ${foiTomadoHoje(med._id, index) ? 'taken' : ''}`}
                            onClick={() => onToggleToma(med._id, med.frequencia.horarios.length)}
                            aria-label={`Marcar ${index + 1}ª dose`}
                        >
                            {foiTomadoHoje(med._id, index) && '✓'}
                        </button>
                    ))}
                </div>
            )}
            
            <div className="med-actions">
                <button 
                    onClick={() => onToggleStatus(med)} 
                    className="action-btn archive-btn"
                >
                    {med.status === 'Ativo' ? 'Arquivar' : 'Reativar'}
                </button>
                
                {med.status === 'Inativo' && (
                    <button 
                        onClick={() => onDelete(med._id)} 
                        className="action-btn delete-btn"
                    >
                        Apagar
                    </button>
                )}
            </div>
        </div>
    );
};

export default MedicationPage;