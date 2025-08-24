import React from 'react';
import { ListGroup } from 'react-bootstrap';

const PasswordStrengthIndicator = ({ validations }) => {
    return (
        <div className="mb-3 small text-start">
            <ListGroup variant="flush">
                <ListGroup.Item className={validations.length ? 'text-success' : 'text-muted'}>
                    {validations.length ? '✓' : '✗'} Pelo menos 8 caracteres
                </ListGroup.Item>
                <ListGroup.Item className={validations.uppercase ? 'text-success' : 'text-muted'}>
                    {validations.uppercase ? '✓' : '✗'} Uma letra maiúscula
                </ListGroup.Item>
                <ListGroup.Item className={validations.number ? 'text-success' : 'text-muted'}>
                    {validations.number ? '✓' : '✗'} Um número
                </ListGroup.Item>
                <ListGroup.Item className={validations.specialChar ? 'text-success' : 'text-muted'}>
                    {validations.specialChar ? '✓' : '✗'} Um caractere especial
                </ListGroup.Item>
            </ListGroup>
        </div>
    );
};

// React.memo é uma otimização que impede re-renderizações desnecessárias
export default React.memo(PasswordStrengthIndicator);