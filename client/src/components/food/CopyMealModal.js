// client/src/components/food/CopyMealModal.js
import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ptBR } from 'date-fns/locale';
import '../Modal.css'; // ✅ Importar o novo CSS base
import './CopyMealModal.css';

const CopyMealModal = ({ isOpen, onClose, onCopy, mealType }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    if (!isOpen) return null;

    const handleCopy = () => {
        onCopy(mealType, selectedDate);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="copy-meal-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Copiar {mealType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-content">
                    <p>Selecione a data de onde deseja copiar os alimentos:</p>
                    <div className="day-picker-container">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={ptBR}
                            disabled={{ after: new Date() }}
                        />
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button className="primary-btn" onClick={handleCopy} disabled={!selectedDate}>
                        Copiar Alimentos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CopyMealModal;