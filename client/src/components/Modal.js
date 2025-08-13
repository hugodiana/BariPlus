import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, children, ariaLabel = "Modal" }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (!focusableElements?.length) return;
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            modalRef.current?.focus();
        }
        // ✅ CORREÇÃO: Esta função de limpeza é chamada quando o modal fecha (unmounts).
        // Ela garante que o estilo do body seja sempre restaurado.
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div 
            className="modal-backdrop" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
        >
            <div 
                className="modal-content-container" 
                onClick={(e) => e.stopPropagation()}
                ref={modalRef}
                tabIndex={-1}
            >
                <button 
                    className="modal-close-btn" 
                    onClick={onClose}
                    aria-label="Fechar modal"
                >
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