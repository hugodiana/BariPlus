import React, { useState, useEffect } from 'react';
import './ChecklistPage.css';

const ChecklistPage = () => {
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [activeTab, setActiveTab] = useState('preOp');
    const [novaTarefa, setNovaTarefa] = useState('');
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchChecklist = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/checklist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setChecklist(data);
            } catch (error) {
                console.error("Erro ao buscar checklist:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChecklist();
    }, [token, apiUrl]);

    const handleAdicionarTarefa = async (e) => {
        e.preventDefault();
        if (!novaTarefa.trim()) return;
        const response = await fetch(`${apiUrl}/api/checklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ descricao: novaTarefa, type: activeTab })
        });
        const itemAdicionado = await response.json();
        setChecklist(prev => ({
            ...prev,
            [activeTab]: [...prev[activeTab], itemAdicionado]
        }));
        setNovaTarefa('');
    };

    const handleToggleConcluido = async (itemId, statusAtual) => {
        const response = await fetch(`${apiUrl}/api/checklist/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ concluido: !statusAtual, type: activeTab })
        });
        const itemAtualizado = await response.json();
        setChecklist(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(item => item._id === itemId ? itemAtualizado : item)
        }));
    };
    
    const handleApagarItem = async (itemId) => {
        if (!window.confirm("Tem a certeza que quer apagar esta tarefa?")) return;
        
        await fetch(`${apiUrl}/api/checklist/${itemId}?type=${activeTab}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setChecklist(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].filter(item => item._id !== itemId)
        }));
    };

    if (loading) return <div>A carregar checklist...</div>;
    const itensDaAbaAtiva = checklist[activeTab] || [];

    return (
        <div className="checklist-page-container">
            <h1>O Meu Checklist</h1>
            <p>Acompanhe aqui todas as suas tarefas importantes.</p>
            <div className="checklist-content">
                <div className="tab-buttons">
                    <button className={`tab-btn ${activeTab === 'preOp' ? 'active' : ''}`} onClick={() => setActiveTab('preOp')}>
                        Pré-Operatório
                    </button>
                    <button className={`tab-btn ${activeTab === 'posOp' ? 'active' : ''}`} onClick={() => setActiveTab('posOp')}>
                        Pós-Operatório
                    </button>
                </div>
                <div className="tab-content">
                    <form onSubmit={handleAdicionarTarefa} className="add-item-form">
                        <input
                            type="text"
                            value={novaTarefa}
                            onChange={(e) => setNovaTarefa(e.target.value)}
                            placeholder="Adicionar nova tarefa..."
                        />
                        <button type="submit">+</button>
                    </form>
                    <ul>
                        {itensDaAbaAtiva.map(item => (
                            // Usamos _id do MongoDB para a key
                            <li key={item._id} className={item.concluido ? 'concluido' : ''}>
                                {/* NOVIDADE: Checkbox customizada */}
                                <div className="checkbox-container" onClick={() => handleToggleConcluido(item._id, item.concluido)}>
                                    <span className="checkmark">✓</span>
                                </div>
                                <span className="item-text">{item.descricao}</span>
                                <button onClick={() => handleApagarItem(item._id)} className="delete-btn">×</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
export default ChecklistPage;