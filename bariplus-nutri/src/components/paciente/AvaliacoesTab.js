// src/components/paciente/AvaliacoesTab.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Modal from '../Modal';
import AddAvaliacaoModal from './AddAvaliacaoModal'; // Vamos criar este componente a seguir
import '../../pages/ProntuarioPage.css'; // Reutilizar estilos

const AvaliacoesTab = ({ prontuario, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const avaliacoesOrdenadas = [...prontuario.avaliacoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    return (
        <div>
            <div className="card-header-action">
                <h3>Histórico de Avaliações</h3>
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>
                    + Nova Avaliação
                </button>
            </div>

            {avaliacoesOrdenadas.length > 0 ? (
                <div className="admin-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Peso (kg)</th>
                                <th>Altura (cm)</th>
                                <th>IMC</th>
                                <th>Cintura (cm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {avaliacoesOrdenadas.map(av => (
                                <tr key={av._id}>
                                    <td>{format(new Date(av.data), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                    <td>{av.peso || '-'}</td>
                                    <td>{av.altura || '-'}</td>
                                    <td>{av.imc || '-'}</td>
                                    <td>{av.circunferencias?.cintura || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Nenhuma avaliação física registada para este paciente.</p>
            )}

            {isModalOpen && (
                <AddAvaliacaoModal 
                    pacienteId={prontuario.pacienteId}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(updatedProntuario) => {
                        onUpdate(updatedProntuario);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default AvaliacoesTab;