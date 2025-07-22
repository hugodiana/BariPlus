import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children }) => {
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  return (
    // O 'overlay' que escurece o fundo
    <div className="modal-overlay" onClick={onClose}>
      {/* O conteúdo do modal */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;