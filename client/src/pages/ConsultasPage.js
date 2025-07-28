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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [consultaEmEdicao, setConsultaEmEdicao] = useState(null);

    // Estados para o formulário
    const [especialidade, setEspecialidade] = useState('');
    const [data, setData] = useState('');
    const [local, setLocal] = useState('');
    const [notas, setNotas] = useState('');

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

    useEffect(() => {
        fetchConsultas();
    }, [fetchConsultas]);

    useEffect(() => {
        if (consultaEmEdicao) {
            setEspecialidade(consultaEmEdicao.especialidade);
            setData(format(parseISO(consultaEmEdicao.data), "yyyy-MM-dd'T'HH:mm"));
            setLocal(consultaEmEdicao.local || '');
            setNotas(consultaEmEdicao.notas || '');
        }
    }, [consultaEmEdicao]);

    const handleOpenModalParaAdicionar = () => {
        setConsultaEmEdicao(null);
        setEspecialidade('');
        setData('');
        setLocal('');
        setNotas('');
        setIsModalOpen(true);
    };

    const handleOpenModalParaEditar = (consulta) => {
        setConsultaEmEdicao(consulta);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dadosConsulta = { especialidade, data, local, notas };
        const method = consultaEmEdicao ? 'PUT' : 'POST';
        const url = consultaEmEdicao ? `${apiUrl}/api/consultas/${consultaEmEdicao._id}` : `${apiUrl}/api/consultas`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosConsulta)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Falha ao salvar consulta');

            if (consultaEmEdicao) {
                toast.success("Consulta atualizada com sucesso!");
            } else {
                toast.success("Consulta agendada com sucesso!");
            }
            setIsModalOpen(false);
            fetchConsultas(); // Recarrega a lista
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleApagarConsulta = async (consultaId) => {
        if (window.confirm("Tem certeza que deseja apagar esta consulta?")) {
            try {
                const res = await fetch(`${apiUrl}/api/consultas/${consultaId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Falha ao apagar consulta.");
                
                toast.info("Consulta apagada.");
                fetchConsultas(); // Recarrega a lista
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    const proximasConsultas = consultas
        .filter(c => new Date(c.data) >= new Date())
        .sort((a, b) => new Date(a.data) - new Date(b.data));
    
    const diasComConsulta = consultas.map(c => new Date(c.data));

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>As Minhas Consultas</h1>
                <p>Registe e organize todos os seus compromissos médicos.</p>
            </div>
            
            <div className="consultas-layout">
                <Card className="calendario-card">
                    <DayPicker
                        mode="single"
                        modifiers={{ comConsulta: diasComConsulta }}
                        modifiersClassNames={{ comConsulta: 'dia-com-consulta' }}
                        locale={ptBR}
                        showOutsideDays
                    />
                </Card>

                <Card className="lista-consultas-card">
                    <div className="lista-header">
                        <h3>Próximas Consultas</h3>
                        <button className="add-btn" onClick={handleOpenModalParaAdicionar}>+ Agendar</button>
                    </div>
                    {proximasConsultas.length > 0 ? (
                        <ul>
                            {proximasConsultas.map(consulta => (
                                <li key={consulta._id}>
                                    <div className="consulta-data">
                                        <span>{format(parseISO(consulta.data), 'dd')}</span>
                                        <span>{format(parseISO(consulta.data), 'MMM', { locale: ptBR })}</span>
                                    </div>
                                    <div className="consulta-info">
                                        <strong>{consulta.especialidade}</strong>
                                        <span>{format(parseISO(consulta.data), 'p', { locale: ptBR })} - {consulta.local || 'Local não informado'}</span>
                                        {consulta.notas && <small>Nota: {consulta.notas}</small>}
                                    </div>
                                    <div className="consulta-actions">
                                        <button onClick={() => handleOpenModalParaEditar(consulta)} className="action-btn edit-btn">✎</button>
                                        <button onClick={() => handleApagarConsulta(consulta._id)} className="action-btn delete-btn">×</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-list-message">Nenhuma consulta futura agendada.</p>
                    )}
                </Card>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>{consultaEmEdicao ? 'Editar Consulta' : 'Agendar Nova Consulta'}</h2>
                <form onSubmit={handleSubmit} className="consulta-form">
                    <label>Especialidade</label>
                    <input type="text" placeholder="Ex: Nutricionista" value={especialidade} onChange={e => setEspecialidade(e.target.value)} required />
                    <label>Data e Hora</label>
                    <input type="datetime-local" value={data} onChange={e => setData(e.target.value)} required />
                    <label>Local</label>
                    <input type="text" placeholder="Ex: Consultório Dr. Silva, Sala 10" value={local} onChange={e => setLocal(e.target.value)} />
                    <label>Notas</label>
                    <textarea placeholder="Ex: Levar últimos exames de sangue." value={notas} onChange={e => setNotas(e.target.value)}></textarea>
                    <button type="submit">Salvar Consulta</button>
                </form>
            </Modal>
        </div>
    );
};

export default ConsultasPage;