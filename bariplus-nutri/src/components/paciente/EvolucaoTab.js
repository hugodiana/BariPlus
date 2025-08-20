// src/components/paciente/EvolucaoTab.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { fetchApi } from '../../utils/api';
import '../../pages/ProntuarioPage.css';

const EvolucaoTab = ({ prontuario, onUpdate }) => {
    const [novaNota, setNovaNota] = useState('');
    const [loading, setLoading] = useState(false);
    const evolucoesOrdenadas = [...prontuario.evolucao].sort((a, b) => new Date(b.data) - new Date(a.data));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!novaNota.trim()) return toast.warn("A nota não pode estar vazia.");
        setLoading(true);
        try {
            const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/evolucao`, {
                method: 'POST',
                body: JSON.stringify({ nota: novaNota })
            });
            onUpdate(updatedProntuario);
            setNovaNota('');
            toast.success("Nota de evolução adicionada!");
        } catch (error) {
            toast.error("Erro ao guardar a nota.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="evolucao-container">
            <form onSubmit={handleSubmit} className="evolucao-form">
                <h4>Adicionar Nova Nota de Evolução</h4>
                <div className="form-group">
                    <textarea 
                        value={novaNota}
                        onChange={(e) => setNovaNota(e.target.value)}
                        placeholder="Descreva a evolução do paciente nesta consulta, novas orientações, etc."
                        rows="4"
                        required
                    />
                </div>
                <div className="form-actions-footer">
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'A guardar...' : 'Guardar Nota'}
                    </button>
                </div>
            </form>

            <div className="evolucao-historico">
                <h4>Histórico de Evolução</h4>
                {evolucoesOrdenadas.length > 0 ? (
                    <ul className="evolucao-list">
                        {evolucoesOrdenadas.map(item => (
                            <li key={item._id} className="evolucao-item">
                                <span className="evolucao-data">
                                    {format(new Date(item.data), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                                </span>
                                <p className="evolucao-nota">{item.nota}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nenhuma nota de evolução registada.</p>
                )}
            </div>
        </div>
    );
};

export default EvolucaoTab;