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

// ✅ NOVAS CONFIGURAÇÕES DE TRADUÇÃO E FORMATO
const culture = 'pt-BR';
const messages = {
    allDay: 'Dia Inteiro',
    previous: '‹',
    next: '›',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há consultas neste período.',
    showMore: total => `+ Ver mais (${total})`
};

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
        } catch (error) { toast.error("Erro ao carregar agendamentos."); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);

    const handleSelectSlot = useCallback((slotInfo) => {
        setModalInfo({ isOpen: true, slot: slotInfo, event: null });
    }, []);

    const handleSelectEvent = useCallback((event) => {
        setModalInfo({ isOpen: true, slot: null, event: event });
    }, []);

    // ✅ NOVA FUNÇÃO PARA LIDAR COM O "ARRASTAR E SOLTAR"
    const handleEventDrop = useCallback(async ({ event, start, end }) => {
        if (window.confirm(`Tem a certeza que quer mover a consulta de "${event.title}"?`)) {
            try {
                await fetchApi(`/api/nutri/agenda/${event._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ start, end })
                });
                toast.success("Consulta reagendada com sucesso!");
                fetchAgendamentos();
            } catch (error) {
                toast.error("Não foi possível reagendar a consulta.");
            }
        }
    }, [fetchAgendamentos]);

    const eventStyleGetter = (event) => ({
        className: `status-${event.status?.toLowerCase() || 'agendado'}`
    });

    const closeModal = () => setModalInfo({ isOpen: false, slot: null, event: null });

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Agenda de Consultas</h1>
                <p>Arraste uma consulta para reagendar, clique num horário para agendar ou num evento para o editar.</p>
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
                    onEventDrop={handleEventDrop} // ✅ NOVA PROP
                    eventPropGetter={eventStyleGetter}
                    culture={culture} // ✅ TRADUÇÃO
                    messages={messages} // ✅ TRADUÇÃO
                    min={new Date(0, 0, 0, 8, 0, 0)} // ✅ HORÁRIO MÍNIMO 08:00
                    max={new Date(0, 0, 0, 20, 0, 0)} // ✅ HORÁRIO MÁXIMO 20:00
                    formats={{
                        timeGutterFormat: 'HH:mm', // ✅ FORMATO 24H
                        eventTimeRangeFormat: ({ start, end }, culture, local) =>
                            `${local.format(start, 'HH:mm', culture)} – ${local.format(end, 'HH:mm', culture)}`,
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
                        fetchAgendamentos();
                    }}
                />
            )}
        </div>
    );
};

export default AgendaPage;