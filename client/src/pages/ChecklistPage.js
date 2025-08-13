import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './ChecklistPage.css';

// ✅ NOVO: Templates de tarefas pré-definidas
const taskTemplates = {
    preOp: [
        { title: 'Exames Pré-Operatórios', tasks: ['Agendar cardiologista', 'Realizar endoscopia', 'Coletar exames de sangue', 'Consulta com psicólogo'] },
        { title: 'Dieta Pré-Operatória', tasks: ['Comprar suplementos líquidos', 'Iniciar dieta líquida', 'Beber 2L de água por dia'] },
    ],
    posOp: [
        { title: 'Primeira Semana Pós-Op', tasks: ['Tomar medicação para dor', 'Beber apenas líquidos claros', 'Caminhar 10 minutos a cada hora', 'Agendar retorno com cirurgião'] },
        { title: 'Suplementação Inicial', tasks: ['Comprar polivitamínico mastigável', 'Iniciar suplemento de cálcio', 'Comprar whey protein isolado'] },
    ]
};

const ChecklistPage = () => {
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [activeTab, setActiveTab] = useState('preOp');
    const [loading, setLoading] = useState(true);
    const [itemLoading, setItemLoading] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskText, setTaskText] = useState('');

    const fetchChecklist = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchApi('/api/checklist');
            if (!response.ok) throw new Error("Falha ao carregar checklist.");
            const data = await response.json();
            setChecklist(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

    const handleOpenAddModal = () => {
        setEditingTask(null);
        setTaskText('');
        setIsTaskModalOpen(true);
    };

    const handleOpenEditModal = (task) => {
        setEditingTask(task);
        setTaskText(task.descricao);
        setIsTaskModalOpen(true);
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        if (!taskText.trim()) return toast.warning('Por favor, insira uma descrição.');

        const isEditing = !!editingTask;
        const endpoint = isEditing ? `/api/checklist/${editingTask._id}` : `/api/checklist`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            const response = await fetchApi(endpoint, {
                method,
                body: JSON.stringify({ descricao: taskText, type: activeTab, concluido: editingTask?.concluido || false })
            });
            if (!response.ok) throw new Error(`Falha ao ${isEditing ? 'atualizar' : 'criar'} tarefa.`);
            
            toast.success(`Tarefa ${isEditing ? 'atualizada' : 'criada'}!`);
            setIsTaskModalOpen(false);
            await fetchChecklist();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    // ✅ NOVO: Função para adicionar tarefas de um template
    const handleAddTemplate = async (tasksToAdd) => {
        toast.info("A adicionar tarefas do template...");
        try {
            // Envia cada tarefa do template para a API
            for (const task of tasksToAdd) {
                await fetchApi('/api/checklist', {
                    method: 'POST',
                    body: JSON.stringify({ descricao: task, type: activeTab })
                });
            }
            toast.success("Tarefas do template adicionadas com sucesso!");
            setIsTemplateModalOpen(false);
            await fetchChecklist();
        } catch (error) {
            toast.error("Ocorreu um erro ao adicionar as tarefas do template.");
        }
    };

    const handleToggleCompleted = async (task) => {
        if (itemLoading) return;
        setItemLoading(task._id);
        try {
            const response = await fetchApi(`/api/checklist/${task._id}`, {
                method: 'PUT',
                body: JSON.stringify({ concluido: !task.concluido, type: activeTab, descricao: task.descricao })
            });
            if (!response.ok) throw new Error("Falha ao atualizar status.");
            
            const data = await response.json();
            setChecklist(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].map(item => item._id === task._id ? data.item : item)
            }));

            if (data.novasConquistas?.length > 0) {
                data.novasConquistas.forEach(c => toast.info(<div><strong>🏆 Nova Conquista!</strong><br />{c.nome}</div>));
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setItemLoading(null);
        }
    };
    
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
        setItemLoading(taskId);
        try {
            await fetchApi(`/api/checklist/${taskId}?type=${activeTab}`, { method: 'DELETE' });
            toast.success("Tarefa excluída.");
            setChecklist(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(item => item._id !== taskId) }));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setItemLoading(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    const activeTabItems = checklist[activeTab] || [];
    const completedCount = activeTabItems.filter(item => item.concluido).length;
    const totalCount = activeTabItems.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Meu Checklist</h1>
                <p>Organize todas as suas tarefas da jornada bariátrica.</p>
            </header>
            
            <Card>
                <div className="tab-buttons">
                    <button className={`tab-btn ${activeTab === 'preOp' ? 'active' : ''}`} onClick={() => setActiveTab('preOp')}>Pré-Operatório</button>
                    <button className={`tab-btn ${activeTab === 'posOp' ? 'active' : ''}`} onClick={() => setActiveTab('posOp')}>Pós-Operatório</button>
                </div>

                <div className="tab-content">
                    {totalCount > 0 && (
                        <div className="progress-container">
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
                            <p className="progress-text">{completedCount} de {totalCount} ({progress}%) concluídas</p>
                        </div>
                    )}
                    
                    {activeTabItems.length > 0 ? (
                        <ul className="task-list">
                            {activeTabItems.map(item => (
                                <li key={item._id} className={`task-item ${item.concluido ? 'completed' : ''} ${itemLoading === item._id ? 'loading' : ''}`}>
                                    <div className="checkbox" onClick={() => handleToggleCompleted(item)}>
                                        {item.concluido && <span className="check-icon">✓</span>}
                                    </div>
                                    <span className="task-text">{item.descricao}</span>
                                    <div className="task-actions">
                                        <button onClick={() => handleOpenEditModal(item)} className="edit-btn" disabled={itemLoading === item._id}>✎</button>
                                        <button onClick={() => handleDeleteTask(item._id)} className="delete-btn" disabled={itemLoading === item._id}>×</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">🎉</span>
                            <h3>Lista Vazia!</h3>
                            <p>Adicione tarefas personalizadas ou use um dos nossos modelos para começar.</p>
                        </div>
                    )}
                    
                    <div className="checklist-actions">
                        <button className="secondary-btn" onClick={() => setIsTemplateModalOpen(true)}>Usar Modelo</button>
                        <button className="primary-btn" onClick={handleOpenAddModal}>+ Adicionar Tarefa</button>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
                <h2>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                <form onSubmit={handleSubmitTask} className="modal-form">
                    <input type="text" value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="Descreva a tarefa..." required autoFocus maxLength={200} />
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsTaskModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="primary-btn">{editingTask ? 'Salvar' : 'Adicionar'}</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}>
                <h2>Usar um Modelo de Checklist</h2>
                <p>Selecione um dos modelos abaixo para adicionar um conjunto de tarefas comuns à sua lista.</p>
                <div className="template-list">
                    {taskTemplates[activeTab].map(template => (
                        <div key={template.title} className="template-item">
                            <h4>{template.title}</h4>
                            <ul>{template.tasks.map((task, i) => <li key={i}>{task}</li>)}</ul>
                            <button className="primary-btn" onClick={() => handleAddTemplate(template.tasks)}>Adicionar estas Tarefas</button>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default ChecklistPage;