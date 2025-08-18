import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './ConsultasPage.css';

const ConsultasPage = () => {
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [consultaEmEdicao, setConsultaEmEdicao] = useState(null);

    const [formState, setFormState] = useState({
        especialidade: '', data: '', local: '', notas: '', status: 'Agendado'
    });

    const fetchConsultas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/consultas'); // Simplificado
            setConsultas(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchConsultas(); }, [fetchConsultas]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenModalParaAdicionar = () => {
        setConsultaEmEdicao(null);
        setFormState({ especialidade: '', data: '', local: '', notas: '', status: 'Agendado' });
        setIsModalOpen(true);
    };

    const handleOpenModalParaEditar = (consulta) => {
        setConsultaEmEdicao(consulta);
        setFormState({
            especialidade: consulta.especialidade,
            data: format(parseISO(consulta.data), "yyyy-MM-dd'T'HH:mm"),
            local: consulta.local || '',
            notas: consulta.notas || '',
            status: consulta.status || 'Agendado'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!consultaEmEdicao;
        const url = isEditing ? `/api/consultas/${consultaEmEdicao._id}` : `/api/consultas`;
        const method = isEditing ? 'PUT' : 'POST';
        const dadosConsulta = { ...formState, data: new Date(formState.data).toISOString() };

        try {
            await fetchApi(url, { // Simplificado
                method,
                body: JSON.stringify(dadosConsulta)
            });
            toast.success(`Consulta ${isEditing ? 'atualizada' : 'agendada'}!`);
            setIsModalOpen(false);
            fetchConsultas();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleApagarConsulta = async (consultaId) => {
        if (window.confirm("Tem certeza que deseja apagar esta consulta?")) {
            try {
                await fetchApi(`/api/consultas/${consultaId}`, { method: 'DELETE' }); // Simplificado
                toast.info("Consulta apagada.");
                fetchConsultas();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const { proximasConsultas, consultasAnteriores, proximaConsultaDestaque } = useMemo(() => {
        const hoje = new Date();
        const futuras = consultas
            .filter(c => parseISO(c.data) >= hoje)
            .sort((a, b) => new Date(a.data) - new Date(b.data));
        const passadas = consultas
            .filter(c => parseISO(c.data) < hoje)
            .sort((a, b) => new Date(b.data) - new Date(a.data));
        
        return {
            proximasConsultas: futuras,
            consultasAnteriores: passadas,
            proximaConsultaDestaque: futuras.find(c => c.status === 'Agendado') || null
        };
    }, [consultas]);

    const diasComConsulta = useMemo(() => consultas.map(c => parseISO(c.data)), [consultas]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minhas Consultas</h1>
                <p>Registe e organize todos os seus compromissos médicos.</p>
            </div>
            
            {proximaConsultaDestaque && <ProximaConsultaCard consulta={proximaConsultaDestaque} />}
            
            <div className="consultas-layout">
                <Card className="calendario-card">
                    <DayPicker mode="multiple" selected={diasComConsulta} locale={ptBR} showOutsideDays />
                </Card>
                <div className="consultas-list-container">
                    <Card>
                        <div className="lista-header">
                            <h3>Próximas Consultas</h3>
                            <button className="add-btn" onClick={handleOpenModalParaAdicionar}>+ Agendar</button>
                        </div>
                        {proximasConsultas.length > 0 ? (
                            <ul className="consultas-list"> {proximasConsultas.map(c => <ConsultaItem key={c._id} consulta={c} onEdit={handleOpenModalParaEditar} onDelete={handleApagarConsulta} />)} </ul>
                        ) : ( <EmptyState title="Tudo em dia!" message="Você não tem nenhuma consulta futura agendada." /> )}
                    </Card>

                    {consultasAnteriores.length > 0 && (
                        <Card>
                            <div className="lista-header"><h3>Consultas Anteriores</h3></div>
                            <ul className="consultas-list"> {consultasAnteriores.map(c => <ConsultaItem key={c._id} consulta={c} onEdit={handleOpenModalParaEditar} onDelete={handleApagarConsulta} />)} </ul>
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>{consultaEmEdicao ? 'Editar Consulta' : 'Agendar Nova Consulta'}</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group"><label>Especialidade</label><input name="especialidade" type="text" placeholder="Ex: Nutricionista" value={formState.especialidade} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Status</label><select name="status" value={formState.status} onChange={handleInputChange}><option value="Agendado">Agendado</option><option value="Realizado">Realizado</option><option value="Cancelado">Cancelado</option></select></div>
                    </div>
                    <div className="form-group"><label>Data e Hora</label><input name="data" type="datetime-local" value={formState.data} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Local</label><input name="local" type="text" placeholder="Ex: Consultório Dr. Silva" value={formState.local} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Notas</label><textarea name="notas" placeholder="Ex: Levar últimos exames." value={formState.notas} onChange={handleInputChange}></textarea></div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="primary-btn">{consultaEmEdicao ? 'Salvar' : 'Agendar'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const ProximaConsultaCard = ({ consulta }) => {
    const diasRestantes = differenceInDays(parseISO(consulta.data), new Date());
    let countdownText = 'É hoje!';
    if (diasRestantes > 0) {
        countdownText = `em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;
    }

    return (
        <Card className="proxima-consulta-card">
            <div className="proxima-consulta-header">
                <span className="proxima-consulta-tag">Próxima Consulta</span>
                <span className="countdown">{countdownText}</span>
            </div>
            <div className="proxima-consulta-body">
                <h3>{consulta.especialidade}</h3>
                <p>
                    <span className="info-icon">🗓️</span>
                    {format(parseISO(consulta.data), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                {consulta.local && (
                    <p>
                        <span className="info-icon">📍</span>
                        {consulta.local}
                    </p>
                )}
            </div>
        </Card>
    );
};

const ConsultaItem = ({ consulta, onEdit, onDelete }) => {
    const statusInfo = {
        Agendado: { icon: '🔔', className: 'agendado' },
        Realizado: { icon: '✅', className: 'realizado' },
        Cancelado: { icon: '❌', className: 'cancelado' },
    };
    const { icon, className } = statusInfo[consulta.status] || { icon: '🔔', className: 'agendado' };

    return (
        <li className={`consulta-item status-${className}`}>
            <div className={`status-icon-wrapper`}>{icon}</div>
            <div className="consulta-info">
                <strong>{consulta.especialidade}</strong>
                <span className="consulta-details">
                    {format(parseISO(consulta.data), "dd/MM/yy 'às' p", { locale: ptBR })}
                    {consulta.local && ` • ${consulta.local}`}
                </span>
                {consulta.notas && <small className="consulta-notas">Nota: {consulta.notas}</small>}
            </div>
            <div className="consulta-actions">
                <button onClick={() => onEdit(consulta)} className="action-btn edit-btn">✎</button>
                <button onClick={() => onDelete(consulta._id)} className="action-btn delete-btn">×</button>
            </div>
        </li>
    );
};

export default ConsultasPage;