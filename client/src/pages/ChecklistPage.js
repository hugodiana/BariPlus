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
    const [itemLoading, setItemLoading] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskText, setTaskText] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchChecklist = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/checklist`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error("Falha ao carregar checklist. Por favor, tente novamente.");
            }
            
            const data = await response.json();
            setChecklist(data);
        } catch (error) {
            console.error('Erro ao buscar checklist:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchChecklist();
    }, [fetchChecklist]);

    const handleOpenAddModal = () => {
        setEditingTask(null);
        setTaskText('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (task) => {
        setEditingTask(task);
        setTaskText(task.descricao);
        setIsModalOpen(true);
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        if (!taskText.trim()) {
            toast.warning('Por favor, insira uma descrição para a tarefa.');
            return;
        }

        const isEditing = !!editingTask;
        const endpoint = isEditing 
            ? `${apiUrl}/api/checklist/${editingTask._id}`
            : `${apiUrl}/api/checklist`;
            
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    descricao: taskText, 
                    type: activeTab 
                })
            });
            
            if (!response.ok) {
                throw new Error(isEditing 
                    ? "Falha ao atualizar a tarefa." 
                    : "Falha ao criar nova tarefa.");
            }

            toast.success(`Tarefa ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
            setIsModalOpen(false);
            await fetchChecklist();
        } catch (error) {
            console.error('Erro ao salvar tarefa:', error);
            toast.error(error.message);
        }
    };

    const handleToggleCompleted = async (task) => {
        if (itemLoading) return; // Previne múltiplos cliques
        
        setItemLoading(task._id);
        try {
            const response = await fetch(`${apiUrl}/api/checklist/${task._id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    concluido: !task.concluido, 
                    type: activeTab 
                })
            });
            
            if (!response.ok) {
                throw new Error("Falha ao atualizar status da tarefa.");
            }
            
            const data = await response.json();
            
            setChecklist(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].map(item => 
                    item._id === task._id ? data.item : item
                )
            }));

            // Mostra conquistas desbloqueadas
            if (data.novasConquistas?.length > 0) {
                data.novasConquistas.forEach((conquista, index) => {
                    setTimeout(() => {
                        toast.info(
                            <div>
                                <strong>🏆 Nova Conquista!</strong><br />
                                {conquista.nome}
                            </div>,
                            { autoClose: 5000 }
                        );
                    }, index * 1000); // Espaça as notificações
                });
            }
        } catch (error) {
            console.error('Erro ao alternar status da tarefa:', error);
            toast.error(error.message);
        } finally {
            setItemLoading(null);
        }
    };
    
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
        
        setItemLoading(taskId);
        try {
            const response = await fetch(`${apiUrl}/api/checklist/${taskId}?type=${activeTab}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            if (!response.ok) {
                throw new Error("Falha ao excluir tarefa.");
            }
            
            toast.success("Tarefa excluída com sucesso.");
            setChecklist(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].filter(item => item._id !== taskId)
            }));
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            toast.error(error.message);
        } finally {
            setItemLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <LoadingSpinner fullPage />
            </div>
        );
    }

    const activeTabItems = checklist[activeTab] || [];
    const completedCount = activeTabItems.filter(item => item.concluido).length;
    const totalCount = activeTabItems.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Meu Checklist</h1>
                <p>Acompanhe suas tarefas importantes</p>
            </header>
            
            <Card>
                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${activeTab === 'preOp' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preOp')}
                    >
                        Pré-Operatório
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'posOp' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posOp')}
                    >
                        Pós-Operatório
                    </button>
                </div>

                <div className="tab-content">
                    {totalCount > 0 && (
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${progress}%` }}
                                    aria-valuenow={progress}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>
                            <p className="progress-text">
                                {completedCount} de {totalCount} ({progress}%) concluídas
                            </p>
                        </div>
                    )}

                    <button 
                        className="add-task-btn"
                        onClick={handleOpenAddModal}
                    >
                        + Adicionar Tarefa
                    </button>
                    
                    {activeTabItems.length > 0 ? (
                        <ul className="task-list">
                            {activeTabItems.map(item => (
                                <li 
                                    key={item._id}
                                    className={`
                                        task-item 
                                        ${item.concluido ? 'completed' : ''}
                                        ${itemLoading === item._id ? 'loading' : ''}
                                    `}
                                >
                                    <div 
                                        className="checkbox"
                                        onClick={() => handleToggleCompleted(item)}
                                        aria-label={item.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
                                    >
                                        {item.concluido && <span className="check-icon">✓</span>}
                                    </div>
                                    <span className="task-text">{item.descricao}</span>
                                    <div className="task-actions">
                                        <button 
                                            onClick={() => handleOpenEditModal(item)}
                                            className="edit-btn"
                                            aria-label="Editar tarefa"
                                            disabled={itemLoading === item._id}
                                        >
                                            ✎
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTask(item._id)}
                                            className="delete-btn"
                                            aria-label="Excluir tarefa"
                                            disabled={itemLoading === item._id}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <h3>Nenhuma tarefa encontrada</h3>
                            <p>Adicione sua primeira tarefa clicando no botão acima.</p>
                        </div>
                    )}
                </div>
            </Card>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
            >
                <h2>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                <form onSubmit={handleSubmitTask}>
                    <input
                        type="text"
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        placeholder="Descreva a tarefa..."
                        required
                        autoFocus
                        maxLength={200}
                    />
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="secondary-btn"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="primary-btn">
                            {editingTask ? 'Salvar' : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ChecklistPage;