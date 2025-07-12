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

    // Estados para o formulário
    const [especialidade, setEspecialidade] = useState('');
    const [data, setData] = useState(new Date());
    const [local, setLocal] = useState('');
    const [notas, setNotas] = useState('');

    const token = localStorage.getItem('bariplus_token');

    useEffect(() => {
        const fetchConsultas = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/consultas', { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setConsultas(data.sort((a, b) => new Date(a.data) - new Date(b.data)));
            } catch (error) {
                console.error("Erro ao buscar consultas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConsultas();
    }, [token]);

    const handleAgendarConsulta = async (e) => {
        e.preventDefault();
        const novaConsulta = { especialidade, data, local, notas };
        const res = await fetch('http://localhost:3001/api/consultas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(novaConsulta)
        });
        const consultaAdicionada = await res.json();
        setConsultas([...consultas, consultaAdicionada].sort((a, b) => new Date(a.data) - new Date(b.data)));
        setIsModalOpen(false);
        // Limpa o formulário
        setEspecialidade(''); setData(new Date()); setLocal(''); setNotas('');
    };

    const handleApagarConsulta = async (consultaId) => {
        if (window.confirm("Tem certeza que deseja apagar esta consulta?")) {
            await fetch(`http://localhost:3001/api/consultas/${consultaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setConsultas(consultas.filter(c => c.id !== consultaId));
        }
    };

    // Modificador para colocar pontos nos dias com eventos
    const diasComConsulta = consultas.map(c => new Date(c.data));

    if (loading) return <div>Carregando consultas...</div>;

    return (
        <div className="consultas-container">
            <h1>Minhas Consultas</h1>
            <button className="add-consulta-btn" onClick={() => setIsModalOpen(true)}>+ Agendar Consulta</button>

            <div className="consultas-layout">
                <div className="calendario-card">
                    <DayPicker
                        mode="single"
                        selected={diasComConsulta}
                        modifiers={{ comConsulta: diasComConsulta }}
                        modifiersClassNames={{ comConsulta: 'dia-com-consulta' }}
                        locale={ptBR}
                    />
                </div>
                <div className="lista-consultas-card">
                    <h3>Próximas Consultas</h3>
                    <ul>
                        {consultas.filter(c => new Date(c.data) >= new Date()).map(consulta => (
                            <li key={consulta.id}>
                                <div className="consulta-data">
                                    <span>{format(new Date(consulta.data), 'dd')}</span>
                                    <span>{format(new Date(consulta.data), 'MMM', { locale: ptBR })}</span>
                                </div>
                                <div className="consulta-info">
                                    <strong>{consulta.especialidade}</strong>
                                    <span>{format(new Date(consulta.data), 'HH:mm')}h - {consulta.local || 'Local não informado'}</span>
                                    {consulta.notas && <small>Nota: {consulta.notas}</small>}
                                </div>
                                <button onClick={() => handleApagarConsulta(consulta.id)} className="delete-consulta-btn">&times;</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Agendar Nova Consulta</h2>
                <form onSubmit={handleAgendarConsulta} className="consulta-form">
                    <input type="text" placeholder="Especialidade (Ex: Nutricionista)" value={especialidade} onChange={e => setEspecialidade(e.target.value)} required />
                    <input type="datetime-local" value={data} onChange={e => setData(e.target.value)} required />
                    <input type="text" placeholder="Local (Ex: Consultório Dr. João)" value={local} onChange={e => setLocal(e.target.value)} />
                    <textarea placeholder="Notas (Ex: Levar últimos exames)" value={notas} onChange={e => setNotas(e.target.value)}></textarea>
                    <button type="submit">Salvar Consulta</button>
                </form>
            </Modal>
        </div>
    );
};

export default ConsultasPage;