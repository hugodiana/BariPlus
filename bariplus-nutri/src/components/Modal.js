// src/components/Modal.js
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, children }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div className="modal-content-container" onClick={(e) => e.stopPropagation()} ref={modalRef} tabIndex={-1}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Fechar modal">
                    <span aria-hidden="true">×</span>
                </button>
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;