// src/pages/AgendaPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';

import { fetchApi } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
// CORREÇÃO: Importa o modal do seu novo ficheiro
import AddAgendamentoModal from '../components/agenda/AddAgendamentoModal'; 
import './AgendaPage.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: 'Dia Inteiro',
  previous: '‹ Anterior',
  next: 'Próximo ›',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há eventos neste período.',
  showMore: total => `+ Ver mais (${total})`
};

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
                    messages={messages}
                    culture='pt-BR'
                    formats={{
                        timeGutterFormat: 'HH:mm',
                        eventTimeRangeFormat: ({ start, end }, culture, local) =>
                            `${local.format(start, 'HH:mm', culture)} - ${local.format(end, 'HH:mm', culture)}`,
                        agendaTimeRangeFormat: ({ start, end }, culture, local) =>
                            `${local.format(start, 'HH:mm', culture)} - ${local.format(end, 'HH:mm', culture)}`
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

export default AgendaPage;