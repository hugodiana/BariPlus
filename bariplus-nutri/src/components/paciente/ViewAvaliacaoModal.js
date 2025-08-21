// src/components/paciente/ViewAvaliacaoModal.js
import React from 'react';
import Modal from '../Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DetailRow = ({ title, children }) => (
    <div className="detail-row">
        <strong>{title}</strong>
        <div>{children}</div>
    </div>
);

const ViewAvaliacaoModal = ({ avaliacao, pacienteId, onClose, onEdit }) => {
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
            </div>
            <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={onEdit}>Editar Avaliação</button>
                {/* O botão de enviar e-mail foi movido para aqui, mas será implementado depois */}
                <button type="button" className="submit-btn">Enviar por E-mail</button>
            </div>
        </Modal>
    );
};

export default ViewAvaliacaoModal;