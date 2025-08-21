// src/components/paciente/ViewAvaliacaoModal.js
import React, { useState } from 'react';
import Modal from '../Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { fetchApi } from '../../utils/api';

const DetailRow = ({ title, children }) => (
    <div className="detail-row">
        <strong>{title}</strong>
        <div>{children}</div>
    </div>
);

const ViewAvaliacaoModal = ({ avaliacao, pacienteId, onClose, onEdit }) => {
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const handleSendEmail = async () => {
        setIsSendingEmail(true);
        try {
            const data = await fetchApi(`/api/nutri/prontuarios/${pacienteId}/avaliacoes/${avaliacao._id}/enviar-email`, {
                method: 'POST'
            });
            toast.success(data.message);
            onClose(); // Fecha o modal após o envio
        } catch (error) {
            toast.error(error.message || "Não foi possível enviar o e-mail.");
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Avaliação de {format(new Date(avaliacao.data), 'dd/MM/yyyy', { locale: ptBR })}</h2>
            <div className="avaliacao-details">
                <DetailRow title="Medidas Gerais">
                    <p>Peso: {avaliacao.peso || '-'} kg</p>
                    <p>Altura: {avaliacao.altura || '-'} cm</p>
                    <p>IMC: {avaliacao.imc || '-'}</p>
                </DetailRow>
                <DetailRow title="Circunferências (cm)">
                    <p>Braço D.: {avaliacao.circunferencias?.bracoDireito || '-'}</p>
                    <p>Cintura: {avaliacao.circunferencias?.cintura || '-'}</p>
                    <p>Abdómen: {avaliacao.circunferencias?.abdomen || '-'}</p>
                    <p>Quadril: {avaliacao.circunferencias?.quadril || '-'}</p>
                </DetailRow>
                 <DetailRow title="Dobras Cutâneas (mm)">
                    <p>Tríceps: {avaliacao.dobrasCutaneas?.triceps || '-'}</p>
                    <p>Subescapular: {avaliacao.dobrasCutaneas?.subescapular || '-'}</p>
                    <p>Supra-ilíaca: {avaliacao.dobrasCutaneas?.suprailiaca || '-'}</p>
                </DetailRow>
                {avaliacao.observacoes && (
                    <DetailRow title="Observações"><p>{avaliacao.observacoes}</p></DetailRow>
                )}
            </div>
            <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={onEdit}>Editar Avaliação</button>
                <button type="button" className="submit-btn" onClick={handleSendEmail} disabled={isSendingEmail}>
                    {isSendingEmail ? 'A enviar...' : 'Enviar por E-mail'}
                </button>
            </div>
        </Modal>
    );
};

export default ViewAvaliacaoModal;