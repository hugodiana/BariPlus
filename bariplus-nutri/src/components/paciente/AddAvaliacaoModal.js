// src/components/paciente/AddAvaliacaoModal.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';

const AddAvaliacaoModal = ({ pacienteId, avaliacaoToEdit, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        data: format(new Date(), 'yyyy-MM-dd'), peso: '', altura: '',
        circunferencias: { bracoDireito: '', cintura: '', abdomen: '', quadril: '', coxaDireita: '' },
        dobrasCutaneas: { triceps: '', subescapular: '', suprailiaca: '', abdominal: '', coxa: '', panturrilha: '' },
        // ✅ NOVO CAMPO ADICIONADO
        composicaoCorporal: { percentualGordura: '', massaMagraKg: '', massaGordaKg: '', taxaMetabolicaBasal: '' },
        observacoes: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (avaliacaoToEdit) {
            setFormData({
                data: format(new Date(avaliacaoToEdit.data), 'yyyy-MM-dd'),
                peso: avaliacaoToEdit.peso || '', 
                altura: avaliacaoToEdit.altura || '',
                circunferencias: avaliacaoToEdit.circunferencias || {},
                dobrasCutaneas: avaliacaoToEdit.dobrasCutaneas || {},
                composicaoCorporal: avaliacaoToEdit.composicaoCorporal || {}, // ✅ CARREGA DADOS EXISTENTES
                observacoes: avaliacaoToEdit.observacoes || ''
            });
        }
    }, [avaliacaoToEdit]);

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
        const isEditing = !!avaliacaoToEdit;
        const url = isEditing 
            ? `/api/nutri/prontuarios/${pacienteId}/avaliacoes/${avaliacaoToEdit._id}`
            : `/api/nutri/prontuarios/${pacienteId}/avaliacoes`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const updatedProntuario = await fetchApi(url, { method, body: JSON.stringify(formData) });
            toast.success(`Avaliação ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`);
            onSave(updatedProntuario);
        } catch (error) {
            toast.error("Erro ao guardar avaliação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>{avaliacaoToEdit ? 'Editar' : 'Nova'} Avaliação Física</h2>
            <form onSubmit={handleSubmit} className="modal-form anamnese-form">
                {/* ... (Medidas Gerais e Circunferências continuam iguais) ... */}
                <div className="form-section">
                    <h4>Medidas Gerais</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>Data</label><input type="date" name="data" value={formData.data} onChange={handleChange} required /></div>
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
                    </div>
                </div>

                {/* ✅ NOVA SECÇÃO PARA COMPOSIÇÃO CORPORAL */}
                <div className="form-section">
                    <h4>Composição Corporal</h4>
                    <div className="form-grid">
                        <div className="form-group"><label>% Gordura Corporal</label><input type="number" step="0.1" name="percentualGordura" value={formData.composicaoCorporal.percentualGordura} onChange={(e) => handleNestedChange('composicaoCorporal', e)} /></div>
                        <div className="form-group"><label>Taxa Metabólica Basal (kcal)</label><input type="number" name="taxaMetabolicaBasal" value={formData.composicaoCorporal.taxaMetabolicaBasal} onChange={(e) => handleNestedChange('composicaoCorporal', e)} /></div>
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