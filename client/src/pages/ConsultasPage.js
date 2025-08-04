import React, { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

import './ConsultasPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const ConsultasPage = () => {
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemLoading, setItemLoading] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [consultaEmEdicao, setConsultaEmEdicao] = useState(null);

    // Unificamos o estado do formulário
    const [formState, setFormState] = useState({
        especialidade: '', data: '', local: '', notas: '', status: 'Agendado'
    });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchConsultas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Falha ao carregar consultas.");
            const data = await res.json();
            setConsultas(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

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
        const url = isEditing ? `${apiUrl}/api/consultas/${consultaEmEdicao._id}` : `${apiUrl}/api/consultas`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formState)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Falha ao salvar consulta');
            toast.success(`Consulta ${isEditing ? 'atualizada' : 'agendada'} com sucesso!`);
            setIsModalOpen(false);
            fetchConsultas();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleApagarConsulta = async (consultaId) => {
        if (window.confirm("Tem certeza que deseja apagar esta consulta?")) {
            setItemLoading(consultaId);
            try {
                const res = await fetch(`${apiUrl}/api/consultas/${consultaId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Falha ao apagar consulta.");
                toast.info("Consulta apagada.");
                fetchConsultas();
            } catch (error) {
                toast.error(error.message);
            } finally {
                setItemLoading(null);
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    const hoje = new Date();
    const proximasConsultas = consultas.filter(c => parseISO(c.data) >= hoje).sort((a, b) => new Date(a.data) - new Date(b.data));
    const consultasAnteriores = consultas.filter(c => parseISO(c.data) < hoje).sort((a, b) => new Date(b.data) - new Date(a.data));
    const diasComConsulta = consultas.map(c => new Date(c.data));

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>As Minhas Consultas</h1>
                <p>Registe e organize todos os seus compromissos médicos.</p>
            </div>
            
            <div className="consultas-layout">
                <Card className="calendario-card">
                    <DayPicker mode="single" modifiers={{ comConsulta: diasComConsulta }} modifiersClassNames={{ comConsulta: 'dia-com-consulta' }} locale={ptBR} showOutsideDays />
                </Card>
                <div className="consultas-list-container">
                    <Card className="lista-consultas-card">
                        <div className="lista-header">
                            <h3>Próximas Consultas</h3>
                            <button className="add-btn" onClick={handleOpenModalParaAdicionar}>+ Agendar</button>
                        </div>
                        {proximasConsultas.length > 0 ? (
                            <ul> {proximasConsultas.map(c => <ConsultaItem key={c._id} consulta={c} loading={itemLoading === c._id} onEdit={handleOpenModalParaEditar} onDelete={handleApagarConsulta} />)} </ul>
                        ) : ( <p className="empty-list-message">Nenhuma consulta futura agendada.</p> )}
                    </Card>

                    <Card className="lista-consultas-card">
                        <div className="lista-header"><h3>Consultas Anteriores</h3></div>
                        {consultasAnteriores.length > 0 ? (
                            <ul> {consultasAnteriores.map(c => <ConsultaItem key={c._id} consulta={c} loading={itemLoading === c._id} onEdit={handleOpenModalParaEditar} onDelete={handleApagarConsulta} />)} </ul>
                        ) : ( <p className="empty-list-message">Nenhum histórico de consultas.</p> )}
                    </Card>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>{consultaEmEdicao ? 'Editar Consulta' : 'Agendar Nova Consulta'}</h2>
                <form onSubmit={handleSubmit} className="consulta-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Especialidade</label>
                            <input name="especialidade" type="text" placeholder="Ex: Nutricionista" value={formState.especialidade} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select name="status" value={formState.status} onChange={handleInputChange}>
                                <option value="Agendado">Agendado</option>
                                <option value="Realizado">Realizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Data e Hora</label>
                        <input name="data" type="datetime-local" value={formState.data} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Local</label>
                        <input name="local" type="text" placeholder="Ex: Consultório Dr. Silva" value={formState.local} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Notas</label>
                        <textarea name="notas" placeholder="Ex: Levar últimos exames." value={formState.notas} onChange={handleInputChange}></textarea>
                    </div>
                    <button type="submit">{consultaEmEdicao ? 'Salvar Alterações' : 'Salvar Consulta'}</button>
                </form>
            </Modal>
        </div>
    );
};

const ConsultaItem = ({ consulta, loading, onEdit, onDelete }) => (
    <li className={loading ? 'loading' : ''}>
        <div className="consulta-data">
            <span>{format(parseISO(consulta.data), 'dd')}</span>
            <span>{format(parseISO(consulta.data), 'MMM', { locale: ptBR })}</span>
        </div>
        <div className="consulta-info">
            <strong>{consulta.especialidade}</strong>
            <span className={`status-badge status-${consulta.status?.toLowerCase()}`}>{consulta.status}</span>
            <span>{format(parseISO(consulta.data), 'p', { locale: ptBR })} - {consulta.local || 'Local não informado'}</span>
            {consulta.notas && <small>Nota: {consulta.notas}</small>}
        </div>
        <div className="consulta-actions">
            <button onClick={() => onEdit(consulta)} className="action-btn edit-btn">✎</button>
            <button onClick={() => onDelete(consulta._id)} className="action-btn delete-btn">×</button>
        </div>
    </li>
);

export default ConsultasPage;