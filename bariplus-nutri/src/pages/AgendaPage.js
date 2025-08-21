// src/pages/AgendaPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import AddAgendamentoModal from '../components/agenda/AddAgendamentoModal';
import './AgendaPage.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const AgendaPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalInfo, setModalInfo] = useState({ isOpen: false, slot: null, event: null });

    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/nutri/agenda');
            const formattedEvents = data.map(ag => ({
                ...ag,
                start: new Date(ag.start),
                end: new Date(ag.end),
            }));
            setEvents(formattedEvents);
        } catch (error) {
            toast.error("Erro ao carregar agendamentos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const handleSelectSlot = useCallback((slotInfo) => {
        setModalInfo({ isOpen: true, slot: slotInfo, event: null });
    }, []);

    const handleSelectEvent = useCallback((event) => {
        setModalInfo({ isOpen: true, slot: null, event: event });
    }, []);

    const eventStyleGetter = (event) => {
        const className = `status-${event.status?.toLowerCase() || 'agendado'}`;
        return { className };
    };

    const closeModal = () => setModalInfo({ isOpen: false, slot: null, event: null });

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Agenda de Consultas</h1>
                <p>Clique num horário para criar um novo agendamento ou num evento existente para o editar.</p>
            </div>
            <div className="calendar-container">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '75vh' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    messages={{
                        next: "Próximo",
                        previous: "Anterior",
                        today: "Hoje",
                        month: "Mês",
                        week: "Semana",
                        day: "Dia",
                        agenda: "Agenda",
                        noEventsInRange: "Não há eventos neste período.",
                    }}
                />
            </div>

            {modalInfo.isOpen && (
                <AddAgendamentoModal
                    slot={modalInfo.slot}
                    eventToEdit={modalInfo.event}
                    onClose={closeModal}
                    onSave={() => {
                        closeModal();
                        fetchAgendamentos(); // Recarrega os eventos
                    }}
                />
            )}
        </div>
    );
};

export default AgendaPage;