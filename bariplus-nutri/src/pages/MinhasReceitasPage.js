// src/pages/MinhasReceitasPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import BuscaAlimentos from '../components/BuscaAlimentos';
import './MinhasReceitasPage.css'; // ✅ USAR O NOVO CSS

const MinhasReceitasPage = () => {
    const [receitas, setReceitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formState, setFormState] = useState({ nome: '', ingredientes: [], modoDePreparo: '' });
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);

    const fetchReceitas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/nutri/receitas');
            setReceitas(data);
        } catch (error) {
            toast.error("Erro ao carregar receitas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReceitas(); }, [fetchReceitas]);

    const handleOpenModal = () => {
        setFormState({ nome: '', ingredientes: [], modoDePreparo: '' });
        setIsModalOpen(true);
    };

    const handleSelectAlimento = (alimento) => {
        const novoIngrediente = {
            alimento: alimento,
            quantidade: 100,
            medidaCaseira: '1 porção (100g)'
        };
        setFormState(prev => ({ ...prev, ingredientes: [...prev.ingredientes, novoIngrediente] }));
        setIsFoodModalOpen(false);
    };

    const handleIngredienteChange = (index, e) => {
        const { name, value } = e.target;
        const novosIngredientes = [...formState.ingredientes];
        novosIngredientes[index][name] = value;
        setFormState(prev => ({ ...prev, ingredientes: novosIngredientes }));
    };
    
    const handleRemoveIngrediente = (index) => {
        const novosIngredientes = formState.ingredientes.filter((_, i) => i !== index);
        setFormState(prev => ({...prev, ingredientes: novosIngredientes}));
    };

    const handleSaveReceita = async (e) => {
        e.preventDefault();
        try {
            await fetchApi('/api/nutri/receitas', {
                method: 'POST', body: JSON.stringify(formState)
            });
            toast.success("Receita guardada!");
            setIsModalOpen(false);
            fetchReceitas();
        } catch (error) {
            toast.error("Erro ao guardar receita.");
        }
    };
    
    const handleDeleteReceita = async (receitaId) => {
        if (window.confirm("Tem a certeza que quer apagar esta receita?")) {
            try {
                await fetchApi(`/api/nutri/receitas/${receitaId}`, { method: 'DELETE' });
                toast.info("Receita apagada.");
                fetchReceitas();
            } catch (error) {
                toast.error("Erro ao apagar receita.");
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-action">
                <h1>Minhas Receitas</h1>
                <button className="action-btn-positive" onClick={handleOpenModal}>+ Nova Receita</button>
            </div>
            
            {receitas.length > 0 ? (
                <div className="receitas-grid">
                    {receitas.map(receita => (
                        <Card key={receita._id} className="receita-card">
                            <div className="receita-card-header">
                                <h4>{receita.nome}</h4>
                                <button className="remove-btn" onClick={() => handleDeleteReceita(receita._id)}>×</button>
                            </div>
                            <div className="resumo-grid">
                                <div className="resumo-item"><span>{receita.totais.kcal.toFixed(0)}</span><label>Kcal</label></div>
                                <div className="resumo-item"><span>{receita.totais.protein.toFixed(1)}g</span><label>Prot.</label></div>
                                <div className="resumo-item"><span>{receita.totais.carbohydrates.toFixed(1)}g</span><label>Carb.</label></div>
                                <div className="resumo-item"><span>{receita.totais.lipids.toFixed(1)}g</span><label>Gord.</label></div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p>Nenhuma receita criada ainda. Clique em "+ Nova Receita" para começar.</p>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Nova Receita</h2>
                <form onSubmit={handleSaveReceita} className="modal-form anamnese-form">
                    <div className="form-group"><label>Nome da Receita</label><input type="text" value={formState.nome} onChange={(e) => setFormState(prev => ({ ...prev, nome: e.target.value }))} required /></div>
                    <div className="form-section">
                        <h4>Ingredientes</h4>
                        <div className="ingredientes-list">
                            {formState.ingredientes.map((ing, index) => (
                                <div key={index} className="ingrediente-item-form">
                                    <span>{ing.alimento.description}</span>
                                    <div className="ingrediente-inputs">
                                        <input type="number" name="quantidade" value={ing.quantidade} onChange={(e) => handleIngredienteChange(index, e)} />
                                        <span>g</span>
                                        <input type="text" name="medidaCaseira" value={ing.medidaCaseira} onChange={(e) => handleIngredienteChange(index, e)} />
                                        <button type="button" className="remove-btn" onClick={() => handleRemoveIngrediente(index)}>×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="add-item-btn" onClick={() => setIsFoodModalOpen(true)}>+ Adicionar Ingrediente</button>
                    </div>
                    <div className="form-group"><label>Modo de Preparo</label><textarea rows="5" value={formState.modoDePreparo} onChange={(e) => setFormState(prev => ({ ...prev, modoDePreparo: e.target.value }))}></textarea></div>
                    <div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button><button type="submit" className="submit-btn">Guardar Receita</button></div>
                </form>
            </Modal>

            <Modal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)}>
                <BuscaAlimentos onSelectAlimento={handleSelectAlimento} />
            </Modal>
        </div>
    );
};

export default MinhasReceitasPage;