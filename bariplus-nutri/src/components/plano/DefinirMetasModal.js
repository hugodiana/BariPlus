// src/components/plano/DefinirMetasModal.js
import React, { useState } from 'react';
import Modal from '../Modal';
import { toast } from 'react-toastify';

const DefinirMetasModal = ({ onSave, onClose }) => {
    const [metas, setMetas] = useState({
        vet: 1200, // Kcal
        proteinas_percent: 40,
        carboidratos_percent: 30,
        gorduras_percent: 30,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMetas(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const totalPercent = metas.proteinas_percent + metas.carboidratos_percent + metas.gorduras_percent;
        if (totalPercent !== 100) {
            return toast.warn(`A soma das percentagens dos macros deve ser 100%, mas está em ${totalPercent}%.`);
        }
        onSave(metas);
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Definir Objetivos do Plano</h2>
            <p>Comece por definir as metas de calorias e a distribuição de macronutrientes para este plano alimentar.</p>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>Valor Energético Total (VET) em Kcal</label>
                    <input type="number" name="vet" value={metas.vet} onChange={handleChange} required />
                </div>
                <h4>Distribuição de Macronutrientes (%)</h4>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Proteínas (%)</label>
                        <input type="number" name="proteinas_percent" value={metas.proteinas_percent} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Carboidratos (%)</label>
                        <input type="number" name="carboidratos_percent" value={metas.carboidratos_percent} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Gorduras (%)</label>
                        <input type="number" name="gorduras_percent" value={metas.gorduras_percent} onChange={handleChange} required />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-btn">Definir Metas e Continuar</button>
                </div>
            </form>
        </Modal>
    );
};

export default DefinirMetasModal;