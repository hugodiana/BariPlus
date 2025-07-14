import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './ConsultasPage.css';
import Modal from '../components/Modal';

const ConsultasPage = () => {
    // ... (toda a lógica de useState, useEffect, e as funções handle... continuam exatamente iguais)
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [especialidade, setEspecialidade] = useState('');
    const [data, setData] = useState('');
    const [local, setLocal] = useState('');
    const [notas, setNotas] = useState('');
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchConsultas = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setConsultas(data.sort((a, b) => new Date(a.data) - new Date(b.data)));
            } catch (error) { console.error("Erro ao buscar consultas:", error); } 
            finally { setLoading(false); }
        };
        fetchConsultas();
    }, [token, apiUrl]);
    
    const handleAgendarConsulta = async (e) => {
        e.preventDefault();
        const novaConsulta = { especialidade, data, local, notas };
        const res = await fetch(`${apiUrl}/api/consultas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(novaConsulta)
        });
        const consultaAdicionada = await res.json();
        setConsultas(prev => [...prev, consultaAdicionada].sort((a, b) => new Date(a.data) - new Date(b.data)));
        setIsModalOpen(false);
        setEspecialidade(''); setData(''); setLocal(''); setNotas('');
    };
    
    const handleApagarConsulta = async (consultaId) => {
        if (window.confirm("Tem a certeza que deseja apagar esta consulta?")) {
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
        // NOVIDADE: Adicionámos um contêiner principal e um cabeçalho padrão
        <div className="consultas-container">
            <h1>As Minhas Consultas</h1>
            <p>Registe e organize todos os seus compromissos médicos.</p>
            <button className="add-consulta-btn" onClick={() => setIsModalOpen(true)}>+ Agendar Consulta</button>
            
            <div className="consultas-layout">
                <div className="calendario-card">
                    <DayPicker
                        mode="single"
                        modifiers={{ comConsulta: diasComConsulta }}
                        modifiersClassNames={{ comConsulta: 'dia-com-consulta' }}
                        locale={ptBR}
                    />
                </div>
                <div className="lista-consultas-card">
                    <h3>Próximas Consultas</h3>
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
                                    <button onClick={() => handleApagarConsulta(consulta._id)} className="delete-consulta-btn">&times;</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-list-message">Nenhuma consulta futura agendada.</p>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* ... (o conteúdo do Modal continua o mesmo) ... */}
            </Modal>
        </div>
    );
};

export default ConsultasPage;