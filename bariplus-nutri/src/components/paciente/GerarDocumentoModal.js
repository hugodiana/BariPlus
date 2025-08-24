// src/components/paciente/GerarDocumentoModal.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';

const GerarDocumentoModal = ({ paciente, nutricionista, onClose, onSave }) => {
    const [tipoAtestado, setTipoAtestado] = useState('simples');
    const [motivo, setMotivo] = useState('Acompanhamento nutricional para cirurgia bariátrica.');
    const [nomeAcompanhante, setNomeAcompanhante] = useState('');
    const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
    const [horaInicio, setHoraInicio] = useState('09:00');
    const [horaFim, setHoraFim] = useState('10:00');
    const [loading, setLoading] = useState(false);

    const handleGerarAtestado = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const body = { tipo: tipoAtestado, motivo, nomeAcompanhante, dataConsulta, horaInicio, horaFim };
            const data = await fetchApi(`/api/nutri/prontuarios/${paciente._id}/gerar-atestado`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            toast.success("Atestado gerado e guardado no histórico com sucesso!");
            onSave(); // Avisa a página principal para recarregar o histórico
            onClose(); // Fecha o modal
        } catch (error) {
            toast.error(error.message || "Erro ao gerar atestado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Gerar Novo Documento</h2>
            <form onSubmit={handleGerarAtestado} className="modal-form">
                <div className="form-group">
                    <label>Tipo de Documento</label>
                    <select value={tipoAtestado} onChange={(e) => setTipoAtestado(e.target.value)}>
                        <option value="simples">Atestado de Acompanhamento</option>
                        <option value="acompanhante">Atestado de Acompanhante</option>
                    </select>
                </div>
                {tipoAtestado === 'simples' ? (
                    <div className="form-group">
                        <label>Motivo</label>
                        <textarea rows="3" value={motivo} onChange={(e) => setMotivo(e.target.value)}></textarea>
                    </div>
                ) : (
                     <div className="form-group">
                        <label>Nome Completo do Acompanhante</label>
                        <input type="text" value={nomeAcompanhante} onChange={(e) => setNomeAcompanhante(e.target.value)} required />
                    </div>
                )}
                <div className="form-grid">
                    <div className="form-group"><label>Data da Consulta</label><input type="date" value={dataConsulta} onChange={(e) => setDataConsulta(e.target.value)} /></div>
                    <div className="form-group"><label>Início</label><input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} /></div>
                    <div className="form-group"><label>Fim</label><input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} /></div>
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'A gerar...' : 'Gerar Documento'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GerarDocumentoModal;