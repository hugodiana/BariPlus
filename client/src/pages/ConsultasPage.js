import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './ConsultasPage.css';
import Modal from '../components/Modal';

const ConsultasPage = () => {
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estado para saber qual consulta estamos a editar
    const [consultaEmEdicao, setConsultaEmEdicao] = useState(null);

    // Estados para o formulário
    const [especialidade, setEspecialidade] = useState('');
    const [data, setData] = useState('');
    const [local, setLocal] = useState('');
    const [notas, setNotas] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    // Busca as consultas iniciais
    useEffect(() => {
        const fetchConsultas = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const res = await fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setConsultas(data.sort((a, b) => new Date(a.data) - new Date(b.data)));
            } catch (error) {
                console.error("Erro ao buscar consultas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConsultas();
    }, [token, apiUrl]);

    // Preenche o formulário quando o modo de edição é ativado
    useEffect(() => {
        if (consultaEmEdicao) {
            setEspecialidade(consultaEmEdicao.especialidade);
            // Formata a data para o formato que o input 'datetime-local' espera
            setData(format(new Date(consultaEmEdicao.data), "yyyy-MM-dd'T'HH:mm"));
            setLocal(consultaEmEdicao.local || '');
            setNotas(consultaEmEdicao.notas || '');
        }
    }, [consultaEmEdicao]);

    // Abre o modal em modo "Adicionar"
    const handleOpenModalParaAdicionar = () => {
        setConsultaEmEdicao(null);
        setEspecialidade('');
        setData('');
        setLocal('');
        setNotas('');
        setIsModalOpen(true);
    };

    // Abre o modal em modo "Editar"
    const handleOpenModalParaEditar = (consulta) => {
        setConsultaEmEdicao(consulta);
        setIsModalOpen(true);
    };

    // Função unificada para submeter o formulário (cria ou edita)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const dadosConsulta = { especialidade, data, local, notas };

        if (consultaEmEdicao) {
            // LÓGICA DE EDITAR (PUT)
            const res = await fetch(`${apiUrl}/api/consultas/${consultaEmEdicao._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosConsulta)
            });
            const consultaAtualizada = await res.json();
            setConsultas(
                consultas.map(c => c._id === consultaAtualizada._id ? consultaAtualizada : c)
                         .sort((a, b) => new Date(a.data) - new Date(b.data))
            );
        } else {
            // LÓGICA DE ADICIONAR (POST)
            const res = await fetch(`${apiUrl}/api/consultas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosConsulta)
            });
            const consultaAdicionada = await res.json();
            setConsultas(prev => [...prev, consultaAdicionada].sort((a, b) => new Date(a.data) - new Date(b.data)));
        }
        
        setIsModalOpen(false);
    };
    
    const handleApagarConsulta = async (consultaId) => {
        if (window.confirm("Tem certeza que deseja apagar esta consulta?")) {
            await fetch(`${apiUrl}/api/consultas/${consultaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setConsultas(consultas.filter(c => c._id !== consultaId));
        }
    };

    const diasComConsulta = consultas.map(c => new Date(c.data));

    if (loading) return <div>A carregar consultas...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>As Minhas Consultas</h1>
                <p>Registe e organize todos os seus compromissos médicos.</p>
            </div>
            
            <div className="consultas-layout">
                <div className="calendario-card">
                    <DayPicker
                        mode="single"
                        modifiers={{ comConsulta: diasComConsulta }}
                        modifiersClassNames={{ comConsulta: 'dia-com-consulta' }}
                        locale={ptBR}
                        showOutsideDays
                    />
                </div>
                <div className="lista-consultas-card">
                    <div className="lista-header">
                        <h3>Próximas Consultas</h3>
                        <button className="add-btn" onClick={handleOpenModalParaAdicionar}>+ Agendar</button>
                    </div>
                    {consultas.filter(c => new Date(c.data) >= new Date()).length > 0 ? (
                        <ul>
                            {consultas.filter(c => new Date(c.data) >= new Date()).map(consulta => (
                                <li key={consulta._id}>
                                    <div className="consulta-data">
                                        <span>{format(new Date(consulta.data), 'dd')}</span>
                                        <span>{format(new Date(consulta.data), 'MMM', { locale: ptBR })}</span>
                                    </div>
                                    <div className="consulta-info">
                                        <strong>{consulta.especialidade}</strong>
                                        <span>{format(new Date(consulta.data), 'p', { locale: ptBR })} - {consulta.local || 'Local não informado'}</span>
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
                </div>
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
                    
                    <button type="submit">Guardar Consulta</button>
                </form>
            </Modal>
        </div>
    );
};

export default ConsultasPage;