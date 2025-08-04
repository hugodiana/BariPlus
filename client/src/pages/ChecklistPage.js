import React, { useState, useEffect, useCallback } from 'react';
import './ChecklistPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const ChecklistPage = () => {
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [activeTab, setActiveTab] = useState('preOp');
    const [loading, setLoading] = useState(true);
    const [itemLoading, setItemLoading] = useState(null); // ✅ NOVO: Para o feedback visual
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tarefaEmEdicao, setTarefaEmEdicao] = useState(null);
    const [textoDaTarefa, setTextoDaTarefa] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchChecklist = useCallback(async () => {
        try {
            const response = await fetch(`${apiUrl}/api/checklist`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            setChecklist(data);
        } catch (error) { toast.error("Erro ao buscar checklist."); } 
        finally { setLoading(false); }
    }, [token, apiUrl]);

    useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

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

        const isEditing = !!tarefaEmEdicao;
        const url = isEditing ? `${apiUrl}/api/checklist/${tarefaEmEdicao._id}` : `${apiUrl}/api/checklist`;
        const method = isEditing ? 'PUT' : 'POST';
        const body = JSON.stringify({ descricao: textoDaTarefa, type: activeTab });

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body });
            if (!res.ok) throw new Error(isEditing ? "Falha ao editar tarefa." : "Falha ao adicionar tarefa.");
            
            toast.success(`Tarefa ${isEditing ? 'editada' : 'adicionada'} com sucesso!`);
            setIsModalOpen(false);
            fetchChecklist(); // Recarrega a lista completa
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleConcluido = async (item) => {
        setItemLoading(item._id); // ✅ Ativa o loading para este item
        try {
            const res = await fetch(`${apiUrl}/api/checklist/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ concluido: !item.concluido, type: activeTab })
            });
            if (!res.ok) throw new Error("Falha ao atualizar tarefa.");
            
            const itemAtualizado = await res.json();
            setChecklist(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].map(i => i._id === item._id ? itemAtualizado : i)
            }));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setItemLoading(null); // ✅ Desativa o loading
        }
    };
    
    const handleApagarItem = async (itemId) => {
        if (!window.confirm("Tem a certeza que quer apagar esta tarefa?")) return;
        setItemLoading(itemId); // ✅ Ativa o loading para este item
        try {
            const res = await fetch(`${apiUrl}/api/checklist/${itemId}?type=${activeTab}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao apagar tarefa.");
            
            toast.info("Tarefa apagada.");
            setChecklist(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].filter(item => item._id !== itemId)
            }));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setItemLoading(null); // ✅ Desativa o loading
        }
    };

    if (loading) return <LoadingSpinner />;

    const itensDaAbaAtiva = checklist[activeTab] || [];
    const totalItens = itensDaAbaAtiva.length;
    const itensConcluidos = itensDaAbaAtiva.filter(item => item.concluido).length;
    const progresso = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>O Meu Checklist</h1>
                <p>Acompanhe aqui todas as suas tarefas importantes.</p>
            </div>
            
            <Card>
                <div className="tab-buttons">
                    <button className={`tab-btn ${activeTab === 'preOp' ? 'active' : ''}`} onClick={() => setActiveTab('preOp')}>Pré-Operatório</button>
                    <button className={`tab-btn ${activeTab === 'posOp' ? 'active' : ''}`} onClick={() => setActiveTab('posOp')}>Pós-Operatório</button>
                </div>

                <div className="tab-content">
                    {/* ✅ Barra de Progresso */}
                    {totalItens > 0 && (
                        <div className="progress-container">
                            <div className="progress-bar-background">
                                <div className="progress-bar-foreground" style={{ width: `${progresso}%` }}></div>
                            </div>
                            <p className="progress-text">{itensConcluidos} de {totalItens} tarefas concluídas</p>
                        </div>
                    )}

                    <div className="add-task-container">
                        <button className="add-btn" onClick={handleOpenModalParaAdicionar}>+ Adicionar Nova Tarefa</button>
                    </div>
                    
                    {itensDaAbaAtiva.length > 0 ? (
                        <ul className="checklist-ul">
                            {itensDaAbaAtiva.map(item => (
                                <li key={item._id} className={`${item.concluido ? 'concluido' : ''} ${itemLoading === item._id ? 'loading' : ''}`}>
                                    <div className="checkbox-container" onClick={() => handleToggleConcluido(item)}>
                                        {item.concluido && <span className="checkmark">✓</span>}
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