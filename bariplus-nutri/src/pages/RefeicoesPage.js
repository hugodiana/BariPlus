// src/pages/RefeicoesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import './RefeicoesPage.css'; // Criaremos este CSS a seguir

const RefeicoesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refeicao, setRefeicao] = useState({
        nome: '',
        horario: '',
        itens: [{ alimento: '', quantidade: '' }]
    });

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/nutri/refeicoes/templates');
            setTemplates(data);
        } catch (error) {
            toast.error("Erro ao carregar templates.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Funções para manipular o formulário (semelhantes à página de plano)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRefeicao(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const novosItens = [...refeicao.itens];
        novosItens[index][name] = value;
        setRefeicao(prev => ({ ...prev, itens: novosItens }));
    };

    const adicionarItem = () => {
        setRefeicao(prev => ({ ...prev, itens: [...prev.itens, { alimento: '', quantidade: '' }] }));
    };

    const removerItem = (index) => {
        if (refeicao.itens.length > 1) {
            const novosItens = refeicao.itens.filter((_, i) => i !== index);
            setRefeicao(prev => ({ ...prev, itens: novosItens }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetchApi('/api/nutri/refeicoes/templates', {
                method: 'POST',
                body: JSON.stringify(refeicao)
            });
            toast.success("Template de refeição guardado!");
            setIsModalOpen(false);
            fetchTemplates(); // Recarrega a lista
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleDelete = async (templateId) => {
        if (window.confirm("Tem a certeza que quer apagar este template de refeição?")) {
            try {
                await fetchApi(`/api/nutri/refeicoes/templates/${templateId}`, { method: 'DELETE' });
                toast.info("Template apagado.");
                fetchTemplates();
            } catch (error) {
                toast.error("Erro ao apagar o template.");
            }
        }
    };
    
    return (
        <div className="page-container">
            <div className="page-header-action">
                <div className="page-header">
                    <h1>Minhas Refeições</h1>
                    <p>Crie e gira os seus blocos de refeições para montar planos mais rápido.</p>
                </div>
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>
                    + Criar Nova Refeição
                </button>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="refeicoes-grid">
                    {templates.length > 0 ? templates.map(template => (
                        <Card key={template._id} className="refeicao-template-card">
                            <div className="card-header">
                                <h4>{template.nome}</h4>
                                <button onClick={() => handleDelete(template._id)} className="delete-template-btn">×</button>
                            </div>
                            <ul>
                                {template.itens.map((item, index) => (
                                    <li key={index}>
                                        <span>{item.alimento}</span>
                                        <span>{item.quantidade}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )) : <p>Nenhum template de refeição criado ainda.</p>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Criar Template de Refeição</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Nome do Template</label>
                        <input type="text" name="nome" placeholder="Ex: Pequeno-almoço rico em proteína" value={refeicao.nome} onChange={handleInputChange} required />
                    </div>
                     <div className="form-group">
                        <label>Horário Sugerido (Opcional)</label>
                        <input type="time" name="horario" value={refeicao.horario} onChange={handleInputChange} />
                    </div>
                    <label>Itens da Refeição</label>
                    {refeicao.itens.map((item, index) => (
                         <div key={index} className="item-fields">
                             <input type="text" name="alimento" value={item.alimento} onChange={(e) => handleItemChange(index, e)} placeholder="Alimento" required />
                             <input type="text" name="quantidade" value={item.quantidade} onChange={(e) => handleItemChange(index, e)} placeholder="Quantidade" required />
                             <button type="button" onClick={() => removerItem(index)} className="remove-btn">×</button>
                         </div>
                    ))}
                    <button type="button" onClick={adicionarItem} className="add-item-btn">+ Adicionar Item</button>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="submit-btn">Guardar Template</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RefeicoesPage;