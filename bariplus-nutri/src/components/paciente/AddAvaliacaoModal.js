// src/components/paciente/AddAvaliacaoModal.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';

const AddAvaliacaoModal = ({ pacienteId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        data: format(new Date(), 'yyyy-MM-dd'),
        peso: '', altura: '',
        circunferencias: { bracoDireito: '', cintura: '', abdomen: '', quadril: '', coxaDireita: '' },
        dobrasCutaneas: { triceps: '', subescapular: '', suprailiaca: '', abdominal: '', coxa: '', panturrilha: '' },
        observacoes: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (category, e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [category]: { ...prev[category], [name]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${pacienteId}/avaliacoes`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success("Avaliação adicionada com sucesso!");
            onSave(updatedProntuario);
        } catch (error) {
            toast.error("Erro ao guardar avaliação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Nova Avaliação Física</h2>
            <form onSubmit={handleSubmit} className="modal-form anamnese-form">
                <div className="form-section">
                    <h4>Medidas Gerais</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Data da Avaliação</label>
                            <input type="date" name="data" value={formData.data} onChange={handleChange} required />
                        </div>
                        <div className="form-group"><label>Peso (kg)</label><input type="number" step="0.1" name="peso" value={formData.peso} onChange={handleChange} /></div>
                        <div className="form-group"><label>Altura (cm)</label><input type="number" step="0.1" name="altura" value={formData.altura} onChange={handleChange} /></div>
                    </div>
                </div>
                <div className="form-section">
                    <h4>Circunferências (cm)</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>Braço Direito</label><input type="number" step="0.1" name="bracoDireito" value={formData.circunferencias.bracoDireito} onChange={(e) => handleNestedChange('circunferencias', e)} /></div>
                        <div className="form-group"><label>Cintura</label><input type="number" step="0.1" name="cintura" value={formData.circunferencias.cintura} onChange={(e) => handleNestedChange('circunferencias', e)} /></div>
                        <div className="form-group"><label>Abdómen</label><input type="number" step="0.1" name="abdomen" value={formData.circunferencias.abdomen} onChange={(e) => handleNestedChange('circunferencias', e)} /></div>
                        <div className="form-group"><label>Quadril</label><input type="number" step="0.1" name="quadril" value={formData.circunferencias.quadril} onChange={(e) => handleNestedChange('circunferencias', e)} /></div>
                        <div className="form-group"><label>Coxa Direita</label><input type="number" step="0.1" name="coxaDireita" value={formData.circunferencias.coxaDireita} onChange={(e) => handleNestedChange('circunferencias', e)} /></div>
                    </div>
                </div>
                <div className="form-section">
                    <h4>Dobras Cutâneas (mm)</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>Tríceps</label><input type="number" step="0.1" name="triceps" value={formData.dobrasCutaneas.triceps} onChange={(e) => handleNestedChange('dobrasCutaneas', e)} /></div>
                        <div className="form-group"><label>Subescapular</label><input type="number" step="0.1" name="subescapular" value={formData.dobrasCutaneas.subescapular} onChange={(e) => handleNestedChange('dobrasCutaneas', e)} /></div>
                        <div className="form-group"><label>Supra-ilíaca</label><input type="number" step="0.1" name="suprailiaca" value={formData.dobrasCutaneas.suprailiaca} onChange={(e) => handleNestedChange('dobrasCutaneas', e)} /></div>
                        <div className="form-group"><label>Abdominal</label><input type="number" step="0.1" name="abdominal" value={formData.dobrasCutaneas.abdominal} onChange={(e) => handleNestedChange('dobrasCutaneas', e)} /></div>
                        <div className="form-group"><label>Coxa</label><input type="number" step="0.1" name="coxa" value={formData.dobrasCutaneas.coxa} onChange={(e) => handleNestedChange('dobrasCutaneas', e)} /></div>
                        <div className="form-group"><label>Panturrilha</label><input type="number" step="0.1" name="panturrilha" value={formData.dobrasCutaneas.panturrilha} onChange={(e) => handleNestedChange('dobrasCutaneas', e)} /></div>
                    </div>
                </div>
                <div className="form-actions-footer">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'A guardar...' : 'Guardar Avaliação'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddAvaliacaoModal;