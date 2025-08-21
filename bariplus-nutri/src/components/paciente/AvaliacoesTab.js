// src/components/paciente/AvaliacoesTab.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { fetchApi } from '../../utils/api';
import AddAvaliacaoModal from './AddAvaliacaoModal';
import ViewAvaliacaoModal from './ViewAvaliacaoModal'; // Vamos criar este
import '../../pages/ProntuarioPage.css';

const AvaliacoesTab = ({ prontuario, onUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewingAvaliacao, setViewingAvaliacao] = useState(null); // Para ver detalhes
    const [editingAvaliacao, setEditingAvaliacao] = useState(null); // Para editar

    const avaliacoesOrdenadas = [...prontuario.avaliacoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    const handleDelete = async (avaliacaoId) => {
        if (window.confirm("Tem a certeza que quer apagar esta avaliação?")) {
            try {
                const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/avaliacoes/${avaliacaoId}`, { method: 'DELETE' });
                onUpdate(updatedProntuario);
                toast.info("Avaliação apagada com sucesso.");
            } catch (error) {
                toast.error("Erro ao apagar avaliação.");
            }
        }
    };

    const handleEdit = (avaliacao) => {
        setEditingAvaliacao(avaliacao);
        setIsAddModalOpen(true); // Reutiliza o modal de adicionar para editar
    };

    return (
        <div>
            <div className="card-header-action">
                <h3>Histórico de Avaliações</h3>
                <button className="action-btn-positive" onClick={() => { setEditingAvaliacao(null); setIsAddModalOpen(true); }}>
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
                                <th>IMC</th>
                                <th>Cintura (cm)</th>
                                <th>Abdómen (cm)</th>
                                <th>Quadril (cm)</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {avaliacoesOrdenadas.map(av => (
                                <tr key={av._id}>
                                    <td>{format(new Date(av.data), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                    <td>{av.peso?.toFixed(1) || '-'}</td>
                                    <td>{av.imc || '-'}</td>
                                    <td>{av.circunferencias?.cintura || '-'}</td>
                                    <td>{av.circunferencias?.abdomen || '-'}</td>
                                    <td>{av.circunferencias?.quadril || '-'}</td>
                                    <td className="actions-cell">
                                        <button className="action-btn-view" onClick={() => setViewingAvaliacao(av)}>Ver Detalhes</button>
                                        <button className="action-btn-delete" onClick={() => handleDelete(av._id)}>Apagar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : ( <p>Nenhuma avaliação física registada.</p> )}

            {(isAddModalOpen || editingAvaliacao) && (
                <AddAvaliacaoModal 
                    pacienteId={prontuario.pacienteId}
                    avaliacaoToEdit={editingAvaliacao}
                    onClose={() => { setIsAddModalOpen(false); setEditingAvaliacao(null); }}
                    onSave={(updatedProntuario) => {
                        onUpdate(updatedProntuario);
                        setIsAddModalOpen(false);
                        setEditingAvaliacao(null);
                    }}
                />
            )}

            {viewingAvaliacao && (
                <ViewAvaliacaoModal
                    avaliacao={viewingAvaliacao}
                    pacienteId={prontuario.pacienteId}
                    onClose={() => setViewingAvaliacao(null)}
                    onEdit={() => {
                        setEditingAvaliacao(viewingAvaliacao);
                        setViewingAvaliacao(null);
                        setIsAddModalOpen(true);
                    }}
                />
            )}
        </div>
    );
};

export default AvaliacoesTab;