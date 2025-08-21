// src/components/agenda/AddAgendamentoModal.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format, setHours, setMinutes, addMinutes } from 'date-fns';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';

const AddAgendamentoModal = ({ slot, eventToEdit, onClose, onSave }) => {
    const [pacientes, setPacientes] = useState([]);
    const [formData, setFormData] = useState({
        pacienteId: eventToEdit?.pacienteId || '',
        pacienteModel: eventToEdit?.pacienteModel || '',
        title: eventToEdit?.title || '',
        start: eventToEdit?.start || slot?.start,
        duracao: 60,
        status: eventToEdit?.status || 'Agendado',
    });
    
    // ✅ 1. NOVO ESTADO PARA A NOTA DE EVOLUÇÃO
    const [notaEvolucao, setNotaEvolucao] = useState('');
    const [isSavingEvolucao, setIsSavingEvolucao] = useState(false);

    useEffect(() => {
        const fetchPacientes = async () => {
            try {
                const data = await fetchApi('/api/nutri/dashboard');
                const allPacientes = (data.pacientesBariplus || []).concat(data.pacientesLocais || []);
                setPacientes(allPacientes.sort((a,b) => (a.nome || '').localeCompare(b.nome || '')));
            } catch (error) { toast.error("Não foi possível carregar pacientes."); }
        };
        fetchPacientes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handlePacienteChange = (e) => {
        const selectedId = e.target.value;
        const selectedPaciente = pacientes.find(p => p._id === selectedId);
        if (selectedPaciente) {
            setFormData(prev => ({
                ...prev,
                pacienteId: selectedPaciente._id,
                pacienteModel: selectedPaciente.statusConta === 'ativo' ? 'User' : 'PacienteNutri',
                title: `Consulta - ${selectedPaciente.nome} ${selectedPaciente.sobrenome || ''}`.trim()
            }));
        }
    };

    const handleTimeChange = (e) => {
        const { value } = e.target;
        const [hours, minutes] = value.split(':');
        const newDate = setMinutes(setHours(new Date(formData.start), hours), minutes);
        setFormData(prev => ({...prev, start: newDate}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!eventToEdit;
        const url = isEditing ? `/api/nutri/agenda/${eventToEdit._id}` : '/api/nutri/agenda';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const body = { ...formData, end: addMinutes(formData.start, formData.duracao) };
            await fetchApi(url, { method, body: JSON.stringify(body) });
            toast.success(`Consulta ${isEditing ? 'atualizada' : 'agendada'}!`);
            onSave();
        } catch (error) {
            toast.error("Erro ao guardar agendamento.");
        }
    };

    // ✅ 2. NOVA FUNÇÃO PARA GUARDAR A NOTA DE EVOLUÇÃO
    const handleSaveEvolucao = async () => {
        if (!notaEvolucao.trim()) return toast.warn("A nota não pode estar vazia.");
        setIsSavingEvolucao(true);
        try {
            await fetchApi(`/api/nutri/prontuarios/${formData.pacienteId}/evolucao`, {
                method: 'POST',
                body: JSON.stringify({ nota: `[Consulta ${format(new Date(formData.start), 'dd/MM/yy HH:mm')}] ${notaEvolucao}` })
            });
            toast.success("Nota de evolução adicionada ao prontuário do paciente!");
            setNotaEvolucao(''); // Limpa o campo
        } catch (error) {
            toast.error("Erro ao guardar a nota de evolução.");
        } finally {
            setIsSavingEvolucao(false);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>{eventToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
                {/* ... (o formulário de agendamento continua igual) ... */}
                <div className="form-group">
                    <label>Paciente</label>
                    <select value={formData.pacienteId} onChange={handlePacienteChange} required disabled={!!eventToEdit}>
                        <option value="" disabled>Selecione um paciente</option>
                        {pacientes.map(p => ( <option key={p._id} value={p._id}>{p.nome} {p.sobrenome}</option> ))}
                    </select>
                </div>
                <div className="form-group"><label>Título</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Data</label><input type="date" value={format(new Date(formData.start), 'yyyy-MM-dd')} readOnly disabled /></div>
                <div className="form-row">
                    <div className="form-group"><label>Hora de Início</label><input type="time" name="startTime" value={format(new Date(formData.start), 'HH:mm')} onChange={handleTimeChange} /></div>
                    <div className="form-group"><label>Duração</label><select name="duracao" value={formData.duracao} onChange={handleInputChange}><option value={30}>30 min</option><option value={60}>1 hora</option></select></div>
                    <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleInputChange}><option>Agendado</option><option>Confirmado</option><option>Realizado</option><option>Cancelado</option></select></div>
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-btn" disabled={!formData.pacienteId}>{eventToEdit ? 'Guardar Alterações' : 'Agendar'}</button>
                </div>
            </form>
            
            {/* ✅ 3. NOVA SECÇÃO PARA EVOLUÇÃO (só aparece na edição) */}
            {eventToEdit && (
                <div className="evolucao-section">
                    <h4>Evolução da Consulta</h4>
                    <div className="form-group">
                        <textarea 
                            value={notaEvolucao}
                            onChange={(e) => setNotaEvolucao(e.target.value)}
                            placeholder="Adicione aqui as suas observações sobre a consulta. Esta nota será guardada no prontuário do paciente."
                            rows="4"
                        />
                    </div>
                    <div className="form-actions">
                        <button className="submit-btn" onClick={handleSaveEvolucao} disabled={isSavingEvolucao}>
                            {isSavingEvolucao ? 'A guardar...' : 'Guardar Evolução no Prontuário'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AddAgendamentoModal;