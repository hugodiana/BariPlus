import React, { useEffect } from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <button
                    className="modal-close-btn"
                    onClick={onClose}
                    aria-label="Fechar modal"
                >
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
