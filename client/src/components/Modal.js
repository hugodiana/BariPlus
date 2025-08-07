import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, children, ariaLabel = "Modal" }) => {
    const modalRef = useRef(null); // Adicionando a referência

    // Efeito para lidar com o teclado e foco
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
            // Mantém o foco dentro do modal
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
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

    // Efeito para desativar scroll da página quando modal está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px'; // Compensa a barra de rolagem desaparecida
            
            // Focar no modal quando abre
            if (modalRef.current) {
                modalRef.current.focus();
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

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
                tabIndex={-1} // Permite que o modal receba foco
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