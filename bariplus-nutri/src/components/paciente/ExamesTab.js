// src/components/paciente/ExamesTab.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';
import '../../pages/ProntuarioPage.css';

const ExamesTab = ({ prontuario, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        nomeExame: '', data: new Date().toISOString().split('T')[0], valor: '', unidade: '', valorReferencia: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/exames`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            onUpdate(updatedProntuario);
            setIsModalOpen(false);
            toast.success("Exame adicionado com sucesso!");
        } catch (error) {
            toast.error("Erro ao adicionar exame.");
        }
    };
    
    const handleDelete = async (exameId) => {
        if (window.confirm("Tem a certeza que quer apagar este registo de exame?")) {
            try {
                const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/exames/${exameId}`, { method: 'DELETE' });
                onUpdate(updatedProntuario);
                toast.info("Registo de exame apagado.");
            } catch (error) {
                toast.error("Erro ao apagar o registo.");
            }
        }
    };

    return (
        <div>
            <div className="card-header-action">
                <h3>Histórico de Exames Bioquímicos</h3>
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>+ Adicionar Exame</button>
            </div>
            
            <div className="admin-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Exame</th>
                            <th>Data</th>
                            <th>Valor</th>
                            <th>Ref.</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prontuario.examesBioquimicos.map(exame => (
                            <tr key={exame._id}>
                                <td>{exame.nomeExame}</td>
                                <td>{format(new Date(exame.data), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                <td>{exame.valor} {exame.unidade}</td>
                                <td>{exame.valorReferencia}</td>
                                <td className="actions-cell">
                                    <button className="action-btn-delete" onClick={() => handleDelete(exame._id)}>Apagar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Registo de Exame</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group"><label>Nome do Exame</label><input type="text" name="nomeExame" onChange={handleInputChange} required /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Data</label><input type="date" name="data" value={formData.data} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Valor</label><input type="text" name="valor" onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Unidade</label><input type="text" name="unidade" onChange={handleInputChange} placeholder="ex: pg/mL" /></div>
                    </div>
                    <div className="form-group"><label>Valor de Referência</label><input type="text" name="valorReferencia" onChange={handleInputChange} placeholder="ex: 200-900" /></div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="submit-btn">Guardar Exame</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ExamesTab;