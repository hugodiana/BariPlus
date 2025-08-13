import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './DailyGoalsCard.css';
import Card from '../ui/Card';
import Modal from '../Modal';
import { fetchApi } from '../../utils/api';

const CustomizeGoalsModal = ({ usuario, onClose, onSave }) => {
    // ✅ ESTADO PARA TODAS AS METAS
    const [metas, setMetas] = useState({
        metaAguaDiaria: usuario.metaAguaDiaria || 2000,
        metaProteinaDiaria: usuario.metaProteinaDiaria || 60,
        metaCalorias: usuario.metaCalorias || 1200,
        metaCarboidratos: usuario.metaCarboidratos || 100,
        metaGorduras: usuario.metaGorduras || 40,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setMetas(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetchApi('/api/user/goals', {
                method: 'PUT',
                body: JSON.stringify(metas) // Envia o objeto completo de metas
            });
            if (!res.ok) throw new Error("Falha ao salvar metas.");
            const updatedUser = await res.json();
            onSave(updatedUser);
            toast.success("Metas atualizadas com sucesso!");
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Personalizar Metas Diárias</h2>
            <form onSubmit={handleSubmit} className="goals-form">
                {/* ✅ NOVOS CAMPOS NO FORMULÁRIO */}
                <div className="form-group">
                    <label>Minha meta de Calorias (kcal)</label>
                    <input type="number" name="metaCalorias" value={metas.metaCalorias} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Minha meta de Proteína (g)</label>
                    <input type="number" name="metaProteinaDiaria" value={metas.metaProteinaDiaria} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Minha meta de Carboidratos (g)</label>
                    <input type="number" name="metaCarboidratos" value={metas.metaCarboidratos} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Minha meta de Gorduras (g)</label>
                    <input type="number" name="metaGorduras" value={metas.metaGorduras} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Minha meta de Água (ml)</label>
                    <input type="number" name="metaAguaDiaria" value={metas.metaAguaDiaria} onChange={handleInputChange} />
                </div>
                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'A salvar...' : 'Salvar Novas Metas'}
                </button>
            </form>
        </Modal>
    );
};


const DailyGoalsCard = ({ log, onTrack, usuario, onUserUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const metaAgua = usuario.metaAguaDiaria || 2000;
    const metaProteina = usuario.metaProteinaDiaria || 60;

    const progressoAgua = Math.min((log.waterConsumed / metaAgua) * 100, 100);
    const progressoProteina = Math.min((log.proteinConsumed / metaProteina) * 100, 100);

    return (
        <>
            <Card className="dashboard-card daily-goals-card" id="metas-diarias">
                <div className="card-header">
                    <h3>Metas Diárias</h3>
                    <button className="customize-btn" onClick={() => setIsModalOpen(true)}>Personalizar</button>
                </div>

                <div className="goal-item">
                    <div className="goal-info">
                        <span>💧 Água</span>
                        <span>{log.waterConsumed} / {metaAgua} ml</span>
                    </div>
                    <div className="progress-bar-background">
                        <div className="progress-bar-foreground" style={{ width: `${progressoAgua}%` }}></div>
                    </div>
                    <div className="goal-actions">
                        <button onClick={() => onTrack('water', 250)}>+250ml</button>
                        <button onClick={() => onTrack('water', 500)}>+500ml</button>
                        <button onClick={() => onTrack('water', 750)}>+750ml</button>
                    </div>
                </div>

                <div className="goal-item">
                    <div className="goal-info">
                        <span>💪 Proteína</span>
                        <span>{log.proteinConsumed.toFixed(1)} / {metaProteina} g</span>
                    </div>
                    <div className="progress-bar-background">
                        <div className="progress-bar-foreground" style={{ width: `${progressoProteina}%` }}></div>
                    </div>
                </div>
            </Card>
            {isModalOpen && <CustomizeGoalsModal usuario={usuario} onClose={() => setIsModalOpen(false)} onSave={onUserUpdate} />}
        </>
    );
};

export default DailyGoalsCard;