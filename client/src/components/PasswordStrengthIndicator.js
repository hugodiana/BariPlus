import React from 'react';
import './PasswordStrengthIndicator.css'; // Vamos criar este CSS a seguir

const PasswordStrengthIndicator = ({ validations }) => {
    return (
        <div className="password-requirements">
            <ul>
                <li className={validations.length ? 'valid' : 'invalid'}>
                    Pelo menos 8 caracteres
                </li>
                <li className={validations.uppercase ? 'valid' : 'invalid'}>
                    Uma letra maiúscula
                </li>
                <li className={validations.number ? 'valid' : 'invalid'}>
                    Um número
                </li>
                <li className={validations.specialChar ? 'valid' : 'invalid'}>
                    Um caractere especial
                </li>
            </ul>
        </div>
    );
};

// React.memo impede que este componente seja redesenhado desnecessariamente
export default React.memo(PasswordStrengthIndicator);