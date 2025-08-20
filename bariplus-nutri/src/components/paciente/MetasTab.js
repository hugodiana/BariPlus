// src/components/paciente/MetasTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import '../../pages/PacientesPage.css';

// ✅ FORMULÁRIO ATUALIZADO
const AddMetaForm = ({ pacienteId, onMetaCriada, onClose }) => {
    const [formData, setFormData] = useState({
        descricao: '',
        tipo: 'outro',
        valorAlvo: '',
        unidade: '',
        prazo: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // Atualiza a descrição e unidade automaticamente quando o tipo muda
    const handleTipoChange = (e) => {
        const tipo = e.target.value;
        let descricao = formData.descricao;
        let unidade = '';

        if (tipo === 'agua') {
            descricao = 'Beber pelo menos X ml de água por dia';
            unidade = 'ml';
        } else if (tipo === 'proteina') {
            descricao = 'Consumir pelo menos X g de proteína por dia';
            unidade = 'g';
        }
        
        setFormData(prev => ({ ...prev, tipo, descricao, unidade }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetchApi(`/api/nutri/pacientes/${pacienteId}/metas`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success("Nova meta definida para o paciente!");
            onMetaCriada();
            onClose();
        } catch (error) {
            toast.error(error.message || "Erro ao criar meta.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <h2>Definir Nova Meta</h2>

            <div className="form-group">
                <label>Tipo de Meta</label>
                <select name="tipo" value={formData.tipo} onChange={handleTipoChange}>
                    <option value="outro">Outra (Manual)</option>
                    <option value="agua">Consumo de Água</option>
                    <option value="proteina">Consumo de Proteína</option>
                </select>
            </div>

            <div className="form-group">
                <label>Descrição da Meta</label>
                <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} required />
            </div>

            {(formData.tipo === 'agua' || formData.tipo === 'proteina') && (
                 <div className="form-group">
                    <label>Valor Alvo (por dia)</label>
                    <input type="number" name="valorAlvo" value={formData.valorAlvo} onChange={handleChange} required placeholder={`Valor em ${formData.unidade}`} />
                </div>
            )}

            <div className="form-group">
                <label>Prazo Final</label>
                <input type="date" name="prazo" value={formData.prazo} onChange={handleChange} required />
            </div>

            <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                <button type="submit" className="submit-btn">Definir Meta</button>
            </div>
        </form>
    );
};


const MetasTab = () => {
    // ... (O resto do componente MetasTab continua igual)
    const { pacienteId } = useParams();
    const [metas, setMetas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMetas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`/api/nutri/pacientes/${pacienteId}/metas`);
            setMetas(data);
        } catch (error) {
            toast.error("Erro ao carregar as metas.");
        } finally {
            setLoading(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchMetas();
    }, [fetchMetas]);

    if (loading) return <LoadingSpinner />;
    
    const metasAtivas = metas.filter(m => m.status === 'ativa');
    const historicoMetas = metas.filter(m => m.status !== 'ativa');

    return (
        <div>
            <div className="card-header-action">
                <h3>Metas Ativas</h3>
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>+ Definir Nova Meta</button>
            </div>
            
            {metasAtivas.length > 0 ? (
                <ul className="metas-list">
                    {metasAtivas.map(meta => (
                        <li key={meta._id} className={`status-${meta.status}`}>
                            <span className="meta-descricao">{meta.descricao}</span>
                            <span className="meta-prazo">Prazo: {format(new Date(meta.prazo), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Nenhuma meta ativa definida para este paciente.</p>
            )}
            
            {historicoMetas.length > 0 && (
                <div style={{marginTop: '2rem'}}>
                    <div className="card-header-action">
                        <h3>Histórico de Metas</h3>
                    </div>
                     <ul className="metas-list">
                        {historicoMetas.map(meta => (
                            <li key={meta._id} className={`status-${meta.status}`}>
                                <span className="meta-descricao">{meta.descricao}</span>
                                <span className="meta-prazo">Prazo: {format(new Date(meta.prazo), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <AddMetaForm pacienteId={pacienteId} onMetaCriada={fetchMetas} onClose={() => setIsModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

export default MetasTab;