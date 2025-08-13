import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './MedicationPage.css';

const MedicationPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [historico, setHistorico] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const hoje = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        nome: '', dosagem: '', quantidade: 1, unidade: 'comprimido(s)',
        frequencia: { tipo: 'Diária', horarios: ['08:00'], diaDaSemana: 1 }
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchApi('/api/medication');
            if (!response.ok) throw new Error('Erro ao carregar medicamentos');
            const data = await response.json();
            setMedicamentos(data.medicamentos || []);
            setHistorico(data.historico || {});
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFrequenciaChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, frequencia: { ...prev.frequencia, [name]: value } }));
    };

    const handleHorarioChange = (index, value) => {
        const novosHorarios = [...formData.frequencia.horarios];
        novosHorarios[index] = value;
        setFormData(prev => ({ ...prev, frequencia: { ...prev.frequencia, horarios: novosHorarios } }));
    };

    const addHorario = () => setFormData(prev => ({ ...prev, frequencia: { ...prev.frequencia, horarios: [...prev.frequencia.horarios, ''] } }));
    const removeHorario = (index) => {
        if (formData.frequencia.horarios.length > 1) {
            const novosHorarios = formData.frequencia.horarios.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, frequencia: { ...prev.frequencia, horarios: novosHorarios } }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetchApi('/api/medication', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao adicionar medicamento');
            }
            toast.success('Medicamento adicionado!');
            setIsModalOpen(false);
            setFormData({ nome: '', dosagem: '', quantidade: 1, unidade: 'comprimido(s)', frequencia: { tipo: 'Diária', horarios: ['08:00'], diaDaSemana: 1 }});
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleToggleStatus = async (med) => {
        const novoStatus = med.status === 'Ativo' ? 'Inativo' : 'Ativo';
        try {
            await fetchApi(`/api/medication/${med._id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: novoStatus })
            });
            toast.info(`Medicamento marcado como ${novoStatus}.`);
            fetchData();
        } catch (error) {
            toast.error('Erro ao alterar status.');
        }
    };
    
    const handleDelete = async (medId) => {
        if (window.confirm("Tem certeza que deseja apagar este medicamento?")) {
            try {
                await fetchApi(`/api/medication/${medId}`, { method: 'DELETE' });
                toast.success('Medicamento apagado.');
                fetchData();
            } catch (error) {
                toast.error('Erro ao apagar.');
            }
        }
    };

    const handleToggleToma = async (medId, totalDoses) => {
        const tomasAtuais = historico[hoje]?.[medId] || 0;
        const novasTomas = tomasAtuais >= totalDoses ? 0 : tomasAtuais + 1;
        
        const originalHistorico = { ...historico };
        setHistorico(prev => ({
            ...prev,
            [hoje]: { ...prev[hoje], [medId]: novasTomas }
        }));

        try {
            const response = await fetchApi('/api/medication/log', {
                method: 'POST',
                body: JSON.stringify({ date: hoje, medId, count: novasTomas })
            });
            if (!response.ok) throw new Error("Falha ao salvar registro.");
        } catch (error) {
            toast.error("Erro ao registrar a toma. A reverter.");
            setHistorico(originalHistorico);
        }
    };

    const proximaDose = useMemo(() => {
        const agora = new Date();
        const horaAtual = format(agora, 'HH:mm');
        let proxima = null;

        medicamentos
            .filter(med => med.status === 'Ativo' && med.frequencia.tipo === 'Diária')
            .forEach(med => {
                const tomasDeHoje = historico[hoje]?.[med._id] || 0;
                const horariosOrdenados = [...med.frequencia.horarios].sort();

                const proximoHorarioNaoTomado = horariosOrdenados.find((horario, index) => horario > horaAtual && index >= tomasDeHoje);
                
                if (proximoHorarioNaoTomado) {
                    if (!proxima || proximoHorarioNaoTomado < proxima.horario) {
                        proxima = { ...med, horario: proximoHorarioNaoTomado };
                    }
                }
            });
        return proxima;
    }, [medicamentos, historico, hoje]);

    if (loading) return <LoadingSpinner />;

    const medicamentosAtivos = medicamentos.filter(m => m.status === 'Ativo');
    const medicamentosInativos = medicamentos.filter(m => m.status === 'Inativo');

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minha Medicação</h1>
                <p>Controle os seus medicamentos e vitaminas diárias.</p>
            </div>

            {proximaDose && (
                <Card className="proxima-dose-card">
                    <div className="proxima-dose-header">
                        <span>Próxima Dose</span>
                        <span className="proxima-dose-horario">{proximaDose.horario}</span>
                    </div>
                    <div className="proxima-dose-body">
                        <strong>{proximaDose.nome}</strong>
                        <span>{proximaDose.dosagem || `${proximaDose.quantidade} ${proximaDose.unidade}`}</span>
                    </div>
                </Card>
            )}
            
            <Card>
                <div className="medication-header">
                    <h3>Medicamentos Ativos</h3>
                    <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar</button>
                </div>
                {medicamentosAtivos.length > 0 ? (
                    <div className="medication-list">
                        {medicamentosAtivos.map(med => (
                            <MedicationItem key={med._id} med={med} historicoHoje={historico[hoje] || {}} onToggleToma={handleToggleToma} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">💊</span>
                        <p>Nenhum medicamento ativo cadastrado.</p>
                    </div>
                )}
            </Card>

            {medicamentosInativos.length > 0 && (
                <div className="inactive-toggle" onClick={() => setShowInactive(!showInactive)}>
                    {showInactive ? 'Ocultar' : 'Mostrar'} Arquivados ({medicamentosInativos.length})
                </div>
            )}

            {showInactive && (
                <Card>
                    <div className="medication-header"><h3>Medicamentos Arquivados</h3></div>
                    <div className="medication-list">
                        {medicamentosInativos.map(med => (
                            <MedicationItem key={med._id} med={med} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />
                        ))}
                    </div>
                </Card>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Novo Medicamento</h2>
                <form onSubmit={handleSubmit} className="medication-form">
                    <div className="form-group">
                        <label>Nome do Medicamento</label>
                        <input name="nome" type="text" value={formData.nome} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Dosagem (ex: 500mg)</label>
                        <input name="dosagem" type="text" value={formData.dosagem} onChange={handleInputChange} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantidade</label>
                            <input name="quantidade" type="number" min="1" value={formData.quantidade} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Unidade</label>
                            <select name="unidade" value={formData.unidade} onChange={handleInputChange}>
                                <option>comprimido(s)</option><option>cápsula(s)</option><option>gota(s)</option><option>ml</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Frequência</label>
                        <select name="tipo" value={formData.frequencia.tipo} onChange={handleFrequenciaChange}>
                            <option>Diária</option><option>Semanal</option>
                        </select>
                    </div>
                    {formData.frequencia.tipo === 'Diária' && (
                        <div className="form-group">
                            <label>Horários das Doses</label>
                            {formData.frequencia.horarios.map((horario, index) => (
                                <div key={index} className="horario-input-group">
                                    <input type="time" value={horario} onChange={(e) => handleHorarioChange(index, e.target.value)} required />
                                    <button type="button" onClick={() => removeHorario(index)} className="remove-horario-btn">-</button>
                                </div>
                            ))}
                            <button type="button" onClick={addHorario} className="add-horario-btn">+ Adicionar Horário</button>
                        </div>
                    )}
                    {formData.frequencia.tipo === 'Semanal' && (
                        <div className="form-group">
                            <label>Dia da Semana</label>
                            <select name="diaDaSemana" value={formData.frequencia.diaDaSemana} onChange={handleFrequenciaChange}>
                                <option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option>
                                <option value="4">Quinta-feira</option><option value="5">Sexta-feira</option><option value="6">Sábado</option><option value="0">Domingo</option>
                            </select>
                        </div>
                    )}
                    <button type="submit" className="submit-btn">Adicionar à Lista</button>
                </form>
            </Modal>
        </div>
    );
};

const MedicationItem = ({ med, historicoHoje, onToggleToma, onDelete, onToggleStatus }) => {
    const tomasDeHoje = historicoHoje?.[med._id] || 0;
    // ✅ CORREÇÃO: Usa o tamanho do array de horários para saber o total de doses
    const totalDoses = med.frequencia.horarios?.length || 0;

    return (
        <div className={`med-item status-${med.status.toLowerCase()}`}>
            <div className="med-info">
                <strong>{med.nome}</strong>
                <span>{med.dosagem || `${med.quantidade} ${med.unidade}`}</span>
            </div>
            
            {med.status === 'Ativo' && med.frequencia.tipo === 'Diária' && (
                <div className="med-checks">
                    {med.frequencia.horarios.map((horario, index) => {
                        const foiTomado = index < tomasDeHoje;
                        return (
                            <div key={index} className="dose-item">
                                <button className={`med-checkbox ${foiTomado ? 'taken' : ''}`} onClick={() => onToggleToma(med._id, totalDoses)}>
                                    {foiTomado && '✓'}
                                </button>
                                <span className="dose-time">{horario}</span>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {med.status === 'Ativo' && med.frequencia.tipo === 'Semanal' && (
                 <div className="med-horarios">
                    <span className="horario-tag">
                        Toda {format(new Date(2024, 0, Number(med.frequencia.diaDaSemana) + 1), 'EEEE', { locale: ptBR })}
                    </span>
                 </div>
            )}

            <div className="med-actions">
                <button onClick={() => onToggleStatus(med)} className="action-btn archive-btn">{med.status === 'Ativo' ? 'Arquivar' : 'Reativar'}</button>
                {med.status === 'Inativo' && <button onClick={() => onDelete(med._id)} className="action-btn delete-btn">Apagar</button>}
            </div>
        </div>
    );
};

export default MedicationPage;