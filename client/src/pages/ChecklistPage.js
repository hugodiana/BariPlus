import React, { useState, useEffect } from 'react';
import './ChecklistPage.css';
import Modal from '../components/Modal'; // Precisamos do nosso Modal
import Card from '../components/ui/Card'; // ✅ Importa o nosso novo componente
import { toast } from 'react-toastify';

const ChecklistPage = () => {
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [activeTab, setActiveTab] = useState('preOp');
    const [loading, setLoading] = useState(true);
    
    // Estados para o modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tarefaEmEdicao, setTarefaEmEdicao] = useState(null);
    const [textoDaTarefa, setTextoDaTarefa] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchChecklist = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/checklist`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json();
                setChecklist(data);
            } catch (error) { console.error("Erro ao buscar checklist:", error); } 
            finally { setLoading(false); }
        };
        fetchChecklist();
    }, [token, apiUrl]);

    const handleOpenModalParaAdicionar = () => {
        setTarefaEmEdicao(null);
        setTextoDaTarefa('');
        setIsModalOpen(true);
    };

    const handleOpenModalParaEditar = (tarefa) => {
        setTarefaEmEdicao(tarefa);
        setTextoDaTarefa(tarefa.descricao);
        setIsModalOpen(true);
    };

    const handleSubmitTarefa = async (e) => {
        e.preventDefault();
        if (!textoDaTarefa.trim()) return;

        if (tarefaEmEdicao) {
            // LÓGICA DE EDITAR (PUT)
            const res = await fetch(`${apiUrl}/api/checklist/${tarefaEmEdicao._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ descricao: textoDaTarefa, type: activeTab })
            });
            const itemAtualizado = await res.json();
            setChecklist(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].map(item => item._id === itemAtualizado._id ? itemAtualizado : item)
            }));
        } else {
            // LÓGICA DE ADICIONAR (POST)
            const res = await fetch(`${apiUrl}/api/checklist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ descricao: textoDaTarefa, type: activeTab })
            });
            const itemAdicionado = await res.json();
            setChecklist(prev => ({
                ...prev,
                [activeTab]: [...prev[activeTab], itemAdicionado]
            }));
        }
        setIsModalOpen(false);
    };

    const handleToggleConcluido = async (item) => {
    // ✅ CORREÇÃO: Usamos item._id diretamente do objeto recebido
    const itemId = item._id; 
    const statusAtual = item.concluido;

    const res = await fetch(`${apiUrl}/api/checklist/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ concluido: !statusAtual, type: activeTab })
    });
    const itemAtualizado = await res.json();
    setChecklist(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(i => i._id === itemId ? itemAtualizado : i)
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
        <div className="page-container">
            <div className="page-header">
                <h1>O Meu Checklist</h1>
                <p>Acompanhe aqui todas as suas tarefas importantes.</p>
            </div>
            
            {/* ✅ SUBSTITUIÇÃO: O conteúdo principal agora está dentro de um Card */}
            <Card>
                <div className="tab-buttons">
                    <button className={`tab-btn ${activeTab === 'preOp' ? 'active' : ''}`} onClick={() => setActiveTab('preOp')}>
                        Pré-Operatório
                    </button>
                    <button className={`tab-btn ${activeTab === 'posOp' ? 'active' : ''}`} onClick={() => setActiveTab('posOp')}>
                        Pós-Operatório
                    </button>
                </div>

                <div className="tab-content">
                    <div className="add-task-container">
                        <button className="add-btn" onClick={handleOpenModalParaAdicionar}>+ Adicionar Nova Tarefa</button>
                    </div>
                    
                    {itensDaAbaAtiva.length > 0 ? (
                        <ul className="checklist-ul">
                            {itensDaAbaAtiva.map(item => (
                                <li key={item._id} className={item.concluido ? 'concluido' : ''}>
                                    <div className="checkbox-container" onClick={() => handleToggleConcluido(item)}>
                                        <span className="checkmark">✓</span>
                                    </div>
                                    <span className="item-text">{item.descricao}</span>
                                    <div className="item-actions">
                                        <button onClick={() => handleOpenModalParaEditar(item)} className="action-btn edit-btn">✎</button>
                                        <button onClick={() => handleApagarItem(item._id)} className="action-btn delete-btn">×</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state-container">
                            <h3>Lista Vazia</h3>
                            <p>Ainda não há tarefas nesta lista. Comece por adicionar a sua primeira tarefa!</p>
                        </div>
                    )}
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>{tarefaEmEdicao ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}</h2>
                <form onSubmit={handleSubmitTarefa} className="checklist-form">
                    <input
                        type="text"
                        value={textoDaTarefa}
                        onChange={(e) => setTextoDaTarefa(e.target.value)}
                        placeholder="Descrição da tarefa..."
                        required
                    />
                    <button type="submit">{tarefaEmEdicao ? 'Salvar Alterações' : 'Adicionar Tarefa'}</button>
                </form>
            </Modal>
        </div>
    );
};

export default ChecklistPage;