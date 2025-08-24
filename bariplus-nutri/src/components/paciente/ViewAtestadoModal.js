// src/components/paciente/ViewAtestadoModal.js
import React from 'react';
import Modal from '../Modal';
import { toast } from 'react-toastify';
import '../../pages/ProntuarioPage.css'; // Reutiliza os estilos

const ViewAtestadoModal = ({ atestado, onClose }) => {
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(atestado.textoCompleto);
        toast.info("Atestado copiado para a área de transferência!");
    };

    // A função de imprimir abre a janela de impressão do browser
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Atestado</title>');
        printWindow.document.write('<style>body { font-family: monospace; white-space: pre-wrap; padding: 20px; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(atestado.textoCompleto.replace(/\n/g, '<br/>'));
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Visualizar Atestado</h2>
            <div className="atestado-preview">
                <pre>{atestado.textoCompleto}</pre>
            </div>
            <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={handleCopyToClipboard}>Copiar Texto</button>
                <button type="button" className="secondary-btn" onClick={handlePrint}>Imprimir</button>
                <button type="button" className="submit-btn">Enviar por E-mail</button>
            </div>
        </Modal>
    );
};

export default ViewAtestadoModal;