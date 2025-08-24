import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const CustomModal = ({ isOpen, onClose, children, title, ariaLabel }) => {
    return (
        <Modal show={isOpen} onHide={onClose} centered aria-labelledby={ariaLabel}>
            <Modal.Header closeButton>
                {title && <Modal.Title>{title}</Modal.Title>}
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            {/* Opcional: Adicionar Modal.Footer se precisar de botões de ação */}
            {<Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Fechar
                </Button>
            </Modal.Footer>}
        </Modal>
    );
};

export default CustomModal;