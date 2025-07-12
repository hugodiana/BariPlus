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
    const [data, setData] = useState(''); // Alterado para string para o input
    const [local, setLocal] = useState('');
    const [notas, setNotas] = useState('');

    const token = localStorage.getItem('bariplus_token');
    // ✅ "Apelido" para o endereço da API
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchConsultas = async () => {
            try {
                // ✅ Usando a variável apiUrl
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
    
    const handleAgendarConsulta = async (e) => {
        e.preventDefault();
        const novaConsulta = { especialidade, data, local, notas };
        
        // ✅ Usando a variável apiUrl
        const res = await fetch(`${apiUrl}/api/consultas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(novaConsulta)
        });
        const consultaAdicionada = await res.json();
        setConsultas([...consultas, consultaAdicionada].sort((a, b) => new Date(a.data) - new Date(b.data)));
        setIsModalOpen(false);
        // Limpa o formulário
        setEspecialidade(''); setData(''); setLocal(''); setNotas('');
    };
    
    const handleApagarConsulta = async (consultaId) => {
        if (window.confirm("Tem certeza que deseja apagar esta consulta?")) {
            // ✅ Usando a variável apiUrl
            await fetch(`${apiUrl}/api/consultas/${consultaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setConsultas(consultas.filter(c => c._id !== consultaId)); // Usar _id do MongoDB
        }
    };

    const diasComConsulta = consultas.map(c => new Date(c.data));

    if (loading) return <div>A carregar consultas...</div>;

    return (
        <div className="consultas-container">
            <h1>As Minhas Consultas</h1>
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
                    <ul>
                        {consultas.filter(c => new Date(c.data) >= new Date()).map(consulta => (
                            <li key={consulta._id}> {/* Usar _id do MongoDB */}
                                <div className="consulta-data">
                                    <span>{format(new Date(consulta.data), 'dd')}</span>
                                    <span>{format(new Date(consulta.data), 'MMM', { locale: ptBR })}</span>
                                </div>
                                <div className="consulta-info">
                                    <strong>{consulta.especialidade}</strong>
                                    <span>{format(new Date(consulta.data), 'HH:mm')}h - {consulta.local || 'Local não informado'}</span>
                                    {consulta.notas && <small>Nota: {consulta.notas}</small>}
                                </div>
                                <button onClick={() => handleApagarConsulta(consulta._id)} className="delete-consulta-btn">&times;</button> {/* Usar _id do MongoDB */}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Agendar Nova Consulta</h2>
                <form onSubmit={handleAgendarConsulta} className="consulta-form">
                    <input type="text" placeholder="Especialidade (Ex: Nutricionista)" value={especialidade} onChange={e => setEspecialidade(e.target.value)} required />
                    {/* O input de data e hora funciona melhor assim */}
                    <input type="datetime-local" value={data} onChange={e => setData(e.target.value)} required />
                    <input type="text" placeholder="Local (Ex: Consultório Dr. João)" value={local} onChange={e => setLocal(e.target.value)} />
                    <textarea placeholder="Notas (Ex: Levar últimos exames)" value={notas} onChange={e => setNotas(e.target.value)}></textarea>
                    <button type="submit">Guardar Consulta</button>
                </form>
            </Modal>
        </div>
    );
};

export default ConsultasPage;