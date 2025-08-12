import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './DailyGoalsCard.css';
import Card from '../ui/Card';
import Modal from '../Modal';
import { fetchApi } from '../../utils/api'; // Importar o fetchApi

// O novo Modal para personalizar as metas
const CustomizeGoalsModal = ({ usuario, onClose, onSave }) => {
    // ✅ CORREÇÃO: Lê as metas do local correto
    const [metaAgua, setMetaAgua] = useState(usuario.metaAguaDiaria || 2000);
    const [metaProteina, setMetaProteina] = useState(usuario.metaProteinaDiaria || 60);
    const [isLoading, setIsLoading] = useState(false);

    // Sugestão de metas com base no peso atual
    const pesoAtual = usuario.detalhesCirurgia?.pesoAtual || 0;
    const sugestaoAgua = pesoAtual > 0 ? pesoAtual * 35 : 2000;
    const sugestaoProteina = pesoAtual > 0 ? Math.round(pesoAtual * 1.2) : 60;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetchApi('/api/user/goals', { // Usa o fetchApi
                method: 'PUT',
                body: JSON.stringify({ metaAguaDiaria: metaAgua, metaProteinaDiaria: metaProteina })
            });
            if (!res.ok) throw new Error("Falha ao salvar metas.");
            const updatedUser = await res.json();
            onSave(updatedUser); // Atualiza o estado do usuário na Dashboard
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
                <div className="suggestion-box">
                    <p>Com base no seu peso atual de <strong>{pesoAtual.toFixed(1)} kg</strong>, sugerimos:</p>
                    <ul>
                        <li><strong>Água:</strong> {sugestaoAgua.toFixed(0)} ml</li>
                        <li><strong>Proteína:</strong> {sugestaoProteina.toFixed(0)} g</li>
                    </ul>
                </div>
                <div className="form-group">
                    <label>Minha meta de Água (ml)</label>
                    <input type="number" value={metaAgua} onChange={(e) => setMetaAgua(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Minha meta de Proteína (g)</label>
                    <input type="number" value={metaProteina} onChange={(e) => setMetaProteina(e.target.value)} />
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
    
    // ✅ CORREÇÃO: Lê as metas do local correto (raiz do objeto usuario)
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