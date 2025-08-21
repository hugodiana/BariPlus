// src/pages/MeusAlimentosPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import './PacientesPage.css'; // ✅ CORREÇÃO: Reutilizando o CSS da página de pacientes

const MeusAlimentosPage = () => {
    const [alimentos, setAlimentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: '', kcal: '', protein: '', carbohydrates: '', lipids: ''
    });

    const fetchAlimentos = useCallback(async () => {
        try {
            const nutriData = await fetchApi('/api/nutri/auth/me');
            setAlimentos(nutriData.alimentosPersonalizados || []);
        } catch (error) {
            toast.error("Erro ao carregar alimentos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlimentos();
    }, [fetchAlimentos]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedAlimentos = await fetchApi('/api/nutri/alimentos', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setAlimentos(updatedAlimentos);
            setIsModalOpen(false);
            setFormData({ description: '', kcal: '', protein: '', carbohydrates: '', lipids: '' }); // Limpa o formulário
            toast.success("Alimento adicionado com sucesso!");
        } catch (error) {
            toast.error("Erro ao adicionar alimento.");
        }
    };

    const handleDelete = async (alimentoId) => {
        if (window.confirm("Tem a certeza?")) {
            try {
                const updatedAlimentos = await fetchApi(`/api/nutri/alimentos/${alimentoId}`, { method: 'DELETE' });
                setAlimentos(updatedAlimentos);
                toast.info("Alimento removido.");
            } catch (error) {
                toast.error("Erro ao remover alimento.");
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-action">
                <div className="page-header">
                    <h1>Meus Alimentos</h1>
                    <p>Crie e gira a sua biblioteca de alimentos personalizados.</p>
                </div>
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>
                    + Novo Alimento
                </button>
            </div>
            <Card>
                <div className="admin-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Kcal</th>
                                <th>Proteínas</th>
                                <th>Carbs</th>
                                <th>Gorduras</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alimentos.map(item => (
                                <tr key={item._id}>
                                    <td>{item.description}</td>
                                    <td>{item.kcal}</td>
                                    <td>{item.protein}g</td>
                                    <td>{item.carbohydrates}g</td>
                                    <td>{item.lipids}g</td>
                                    <td className="actions-cell">
                                        <button className="action-btn danger" onClick={() => handleDelete(item._id)}>Apagar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Alimento Personalizado</h2>
                <p>Valores por 100g de alimento.</p>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group"><label>Descrição</label><input type="text" name="description" value={formData.description} onChange={handleInputChange} required /></div>
                    <div className="form-grid">
                        <div className="form-group"><label>Kcal</label><input type="number" name="kcal" value={formData.kcal} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Proteínas (g)</label><input type="number" name="protein" step="0.1" value={formData.protein} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Carboidratos (g)</label><input type="number" name="carbohydrates" step="0.1" value={formData.carbohydrates} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Gorduras (g)</label><input type="number" name="lipids" step="0.1" value={formData.lipids} onChange={handleInputChange} required /></div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="submit-btn">Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MeusAlimentosPage;