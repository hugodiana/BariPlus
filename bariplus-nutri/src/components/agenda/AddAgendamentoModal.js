// src/components/agenda/AddAgendamentoModal.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format, setHours, setMinutes, addMinutes } from 'date-fns';

import { fetchApi } from '../../utils/api';
import Modal from '../Modal';

const AddAgendamentoModal = ({ slot, onClose, onSave }) => {
    const [pacientes, setPacientes] = useState([]);
    const [view, setView] = useState('select');
    const [novoPacienteNome, setNovoPacienteNome] = useState('');
    const [formData, setFormData] = useState({
        pacienteId: '',
        pacienteModel: '',
        title: '',
        start: slot.start,
        duracao: 60,
    });

    useEffect(() => {
        const fetchPacientes = async () => {
            try {
                const [bariplus, locais] = await Promise.all([
                    fetchApi('/api/nutri/dashboard'),
                    fetchApi('/api/nutri/pacientes-locais')
                ]);
                const allPacientes = [
                    ...bariplus.pacientes.map(p => ({ ...p, model: 'User', nomeCompleto: `${p.nome} ${p.sobrenome || ''}`.trim()})),
                    ...locais.map(p => ({ ...p, model: 'PacienteNutri' }))
                ];
                setPacientes(allPacientes.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)));
            } catch (error) {
                toast.error("Não foi possível carregar a lista de pacientes.");
            }
        };
        fetchPacientes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleQuickCreate = async () => {
        if (!novoPacienteNome.trim()) return toast.warn("O nome é obrigatório.");
        try {
            const novoPaciente = await fetchApi('/api/nutri/pacientes-locais', {
                method: 'POST',
                body: JSON.stringify({ nomeCompleto: novoPacienteNome })
            });
            
            const pacienteFormatado = { ...novoPaciente, model: 'PacienteNutri' };
            setPacientes(prev => [...prev, pacienteFormatado].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)));
            
            setFormData(prev => ({
                ...prev,
                pacienteId: novoPaciente._id,
                pacienteModel: 'PacienteNutri',
                title: `Consulta - ${novoPaciente.nomeCompleto}`
            }));

            setNovoPacienteNome('');
            setView('select');
            toast.success("Paciente criado e selecionado com sucesso!");
        } catch (error) {
            toast.error("Erro ao criar paciente.");
        }
    };
    
    const handlePacienteChange = (e) => {
        const selectedId = e.target.value;
        const selectedPaciente = pacientes.find(p => p._id === selectedId);
        if (selectedPaciente) {
            setFormData(prev => ({
                ...prev,
                pacienteId: selectedPaciente._id,
                pacienteModel: selectedPaciente.model,
                title: `Consulta - ${selectedPaciente.nomeCompleto}`
            }));
        }
    };

    const handleTimeChange = (e) => {
        // --- CORREÇÃO APLICADA AQUI ---
        // A variável 'name' foi removida, pois não era utilizada.
        const { value } = e.target; 
        const [hours, minutes] = value.split(':');
        const newDate = setMinutes(setHours(formData.start, hours), minutes);
        setFormData(prev => ({...prev, start: newDate}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endTime = addMinutes(formData.start, formData.duracao);
            await fetchApi('/api/nutri/agenda', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    end: endTime
                })
            });
            toast.success("Consulta agendada com sucesso!");
            onSave();
        } catch (error) {
            toast.error("Erro ao agendar consulta.");
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Novo Agendamento</h2>
            <form onSubmit={handleSubmit} className="modal-form">
                {view === 'select' ? (
                    <div className="form-group">
                        <label>Paciente</label>
                        <div className="paciente-selector">
                            <select value={formData.pacienteId} onChange={handlePacienteChange} required>
                                <option value="" disabled>Selecione um paciente</option>
                                {pacientes.map(p => (
                                    <option key={p._id} value={p._id}>{p.nomeCompleto}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => setView('create')}>+ Novo</button>
                        </div>
                    </div>
                ) : (
                    <div className="form-group">
                        <label>Criar Novo Paciente (Rápido)</label>
                        <div className="paciente-creator">
                            <input 
                                type="text" 
                                value={novoPacienteNome} 
                                onChange={e => setNovoPacienteNome(e.target.value)} 
                                placeholder="Nome completo do novo paciente" 
                            />
                            <button type="button" onClick={handleQuickCreate} className="save-quick-btn">Guardar</button>
                            <button type="button" onClick={() => setView('select')} className="cancel-quick-btn">Cancelar</button>
                        </div>
                    </div>
                )}
                
                <div className="form-group">
                    <label>Título</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Data</label>
                    <input type="date" value={format(formData.start, 'yyyy-MM-dd')} readOnly disabled />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Hora de Início</label>
                        <input type="time" name="startTime" value={format(formData.start, 'HH:mm')} onChange={handleTimeChange} />
                    </div>
                    <div className="form-group">
                        <label>Duração</label>
                        <select name="duracao" value={formData.duracao} onChange={handleInputChange}>
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={60}>1 hora</option>
                            <option value={90}>1 hora e 30 min</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-btn" disabled={!formData.pacienteId}>
                        Agendar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddAgendamentoModal;