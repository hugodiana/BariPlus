// src/pages/AgendaPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setHours, setMinutes, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';

import { fetchApi } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import './AgendaPage.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const AgendaPage = () => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/nutri/agenda');
            const eventosFormatados = data.map(evt => ({
                ...evt,
                start: new Date(evt.start),
                end: new Date(evt.end),
            }));
            setAgendamentos(eventosFormatados);
        } catch (error) {
            toast.error("Erro ao carregar a agenda.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);
    
    const handleSelectSlot = useCallback((slotInfo) => {
        setSelectedSlot(slotInfo);
        setIsModalOpen(true);
    }, []);

    const handleEventDrop = useCallback(async ({ event, start, end }) => {
        try {
            await fetchApi(`/api/nutri/agenda/${event._id}`, {
                method: 'PUT',
                body: JSON.stringify({ start, end })
            });
            toast.success("Consulta reagendada com sucesso!");
            fetchAgendamentos();
        } catch (error) {
            toast.error("Erro ao reagendar a consulta.");
        }
    }, [fetchAgendamentos]);
    
    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minha Agenda</h1>
                <p>Gira as suas consultas e horários.</p>
            </div>
            <div className="calendar-container">
                <Calendar
                    localizer={localizer}
                    events={agendamentos}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '70vh' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onEventDrop={handleEventDrop}
                    messages={{
                        next: "Próximo",
                        previous: "Anterior",
                        today: "Hoje",
                        month: "Mês",
                        week: "Semana",
                        day: "Dia",
                        agenda: "Agenda",
                        date: "Data",
                        time: "Hora",
                        event: "Evento",
                    }}
                />
            </div>
            {isModalOpen && (
                <AddAgendamentoModal 
                    slot={selectedSlot}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchAgendamentos();
                    }}
                />
            )}
        </div>
    );
};

// --- COMPONENTE DO MODAL ATUALIZADO ---
const AddAgendamentoModal = ({ slot, onClose, onSave }) => {
    const [pacientes, setPacientes] = useState([]);
    const [formData, setFormData] = useState({
        pacienteId: '',
        pacienteModel: '',
        title: '',
        start: slot.start,
        end: slot.end,
    });

    useEffect(() => {
        // Busca a lista de todos os pacientes para o dropdown
        const fetchPacientes = async () => {
            try {
                const [bariplus, locais] = await Promise.all([
                    fetchApi('/api/nutri/dashboard'),
                    fetchApi('/api/nutri/pacientes-locais')
                ]);
                const allPacientes = [
                    ...bariplus.pacientes.map(p => ({ ...p, model: 'User', nomeCompleto: `${p.nome} ${p.sobrenome}`})),
                    ...locais.map(p => ({ ...p, model: 'PacienteNutri' }))
                ];
                setPacientes(allPacientes);
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
        const { name, value } = e.target; // name='startTime' ou 'endTime'
        const [hours, minutes] = value.split(':');
        const dateField = name === 'startTime' ? 'start' : 'end';
        
        const newDate = setMinutes(setHours(formData[dateField], hours), minutes);
        setFormData(prev => ({...prev, [dateField]: newDate}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetchApi('/api/nutri/agenda', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    end: addHours(formData.start, 1) // Garante que a consulta dure 1h por defeito
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
                <div className="form-group">
                    <label>Paciente</label>
                    <select value={formData.pacienteId} onChange={handlePacienteChange} required>
                        <option value="" disabled>Selecione um paciente</option>
                        {pacientes.map(p => (
                            <option key={p._id} value={p._id}>{p.nomeCompleto}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Título</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Data</label>
                    <input type="date" value={format(formData.start, 'yyyy-MM-dd')} readOnly disabled />
                </div>
                <div className="form-group">
                    <label>Hora de Início</label>
                    <input type="time" name="startTime" value={format(formData.start, 'HH:mm')} onChange={handleTimeChange} />
                </div>

                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-btn">Agendar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AgendaPage;