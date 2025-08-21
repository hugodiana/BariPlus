// src/components/paciente/AnamneseForm.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { fetchApi } from '../../utils/api';

const AnamneseForm = ({ prontuario, onSave }) => {
    const [formData, setFormData] = useState(prontuario);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: { ...prev[keys[0]], [keys[1]]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDoencasChange = (e) => {
        const { value, checked } = e.target;
        const currentDoencas = formData.historicoClinico?.doencasPrevias || [];
        const newDoencas = checked
            ? [...currentDoencas, value]
            : currentDoencas.filter(d => d !== value);
        
        setFormData(prev => ({
            ...prev,
            historicoClinico: { ...prev.historicoClinico, doencasPrevias: newDoencas }
        }));
    };

    const handleSaveAnamnese = async () => {
        setLoading(true);
        try {
            const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/anamnese`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            onSave(updatedProntuario);
            toast.success("Anamnese guardada com sucesso!");
        } catch (error) {
            toast.error("Erro ao guardar anamnese.");
        } finally {
            setLoading(false);
        }
    };

    const doencasOptions = ['Diabetes', 'Hipertensão', 'Dislipidemia', 'Doença Cardíaca', 'Doença Renal', 'Outra'];

    return (
        <div className="anamnese-form">
            <div className="form-section">
                <h4>Dados Pessoais</h4>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Data de Nascimento</label>
                        <input type="date" name="dadosPessoais.dataNascimento" value={formData.dadosPessoais?.dataNascimento ? format(parseISO(formData.dadosPessoais.dataNascimento), 'yyyy-MM-dd') : ''} onChange={handleChange} />
                    </div>
                    <div className="form-group"><label>Telefone</label><input type="tel" name="dadosPessoais.telefone" value={formData.dadosPessoais?.telefone || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>Profissão</label><input type="text" name="dadosPessoais.profissao" value={formData.dadosPessoais?.profissao || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>Estado Civil</label><input type="text" name="dadosPessoais.estadoCivil" value={formData.dadosPessoais?.estadoCivil || ''} onChange={handleChange} /></div>
                </div>
            </div>

            <div className="form-section">
                <h4>Histórico Clínico</h4>
                <div className="form-group">
                    <label>Doenças Prévias</label>
                    <div className="checkbox-list">
                        {doencasOptions.map(doenca => (
                            <div className="checkbox-item" key={doenca}>
                                <label>
                                    <input type="checkbox" value={doenca} checked={formData.historicoClinico?.doencasPrevias?.includes(doenca) || false} onChange={handleDoencasChange} />
                                    {doenca}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-grid">
                    <div className="form-group"><label>Alergias</label><textarea name="historicoClinico.alergias" value={formData.historicoClinico?.alergias || ''} onChange={handleChange} rows="2" /></div>
                    <div className="form-group"><label>Intolerâncias</label><textarea name="historicoClinico.intolerancias" value={formData.historicoClinico?.intolerancias || ''} onChange={handleChange} rows="2" /></div>
                    <div className="form-group"><label>Medicamentos e Suplementos em Uso</label><textarea name="historicoClinico.medicamentosEmUso" value={formData.historicoClinico?.medicamentosEmUso || ''} onChange={handleChange} rows="2" /></div>
                    <div className="form-group"><label>Histórico Familiar</label><textarea name="historicoClinico.historicoFamiliar" value={formData.historicoClinico?.historicoFamiliar || ''} onChange={handleChange} rows="2" /></div>
                </div>
            </div>
            
             <div className="form-section">
                <h4>Hábitos de Vida e Sociais</h4>
                <div className="form-grid">
                    <div className="form-group"><label>Atividade Física (Tipo, Frequência)</label><input type="text" name="habitosDeVida.atividadeFisica" value={formData.habitosDeVida?.atividadeFisica || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>Qualidade do Sono</label><input type="text" name="habitosDeVida.qualidadeSono" value={formData.habitosDeVida?.qualidadeSono || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>Consumo de Álcool</label><input type="text" name="habitosDeVida.consumoAlcool" value={formData.habitosDeVida?.consumoAlcool || ''} onChange={handleChange} /></div>
                    <div className="form-group"><label>Tabagismo</label><input type="text" name="habitosDeVida.tabagismo" value={formData.habitosDeVida?.tabagismo || ''} onChange={handleChange} /></div>
                </div>
            </div>

            <div className="form-actions-footer">
                <button className="submit-btn" onClick={handleSaveAnamnese} disabled={loading}>
                    {loading ? 'A guardar...' : 'Guardar Anamnese'}
                </button>
            </div>
        </div>
    );
};

export default AnamneseForm;