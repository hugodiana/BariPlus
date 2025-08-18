// src/pages/MedicationPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { fetchApi } from '../utils/api';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './MedicationPage.css';

const diasDaSemanaOptions = [
    { label: 'Dom', value: 0 }, { label: 'Seg', value: 1 }, { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 }, { label: 'Qui', value: 4 }, { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
];

const MedicationPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [logDoDia, setLogDoDia] = useState({ dosesTomadas: [] });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [modalView, setModalView] = useState('list'); // 'list' ou 'form'

    const [formData, setFormData] = useState({
        nome: '', dosagem: '', quantidade: 1, unidade: 'comprimido(s)',
        frequencia: { tipo: 'Diária', horarios: ['08:00'], diasDaSemana: [] }
    });

    const fetchData = useCallback(async (date) => {
        setLoading(true);
        const dateString = format(date, 'yyyy-MM-dd');
        try {
            const [dataMeds, dataLog] = await Promise.all([
                fetchApi('/api/medication/list'),
                fetchApi(`/api/medication/log/${dateString}`)
            ]);
            setMedicamentos(dataMeds.medicamentos || []);
            setLogDoDia(dataLog || { dosesTomadas: [] });
        } catch (error) {
            toast.error(error.message || 'Erro ao carregar dados de medicação');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate, fetchData]);

    const handleOpenModal = () => {
        setModalView('list');
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ nome: '', dosagem: '', quantidade: 1, unidade: 'comprimido(s)', frequencia: { tipo: 'Diária', horarios: ['08:00'], diasDaSemana: [] }});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleFrequenciaChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, frequencia: { ...prev.frequencia, [name]: value } }));
    };
    const handleDiasDaSemanaChange = (dia) => {
        const currentDias = formData.frequencia.diasDaSemana || [];
        const newDias = currentDias.includes(dia) ? currentDias.filter(d => d !== dia) : [...currentDias, dia];
        setFormData(prev => ({ ...prev, frequencia: { ...prev.frequencia, diasDaSemana: newDias } }));
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
            await fetchApi('/api/medication', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success('Medicamento adicionado!');
            setModalView('list');
            fetchData(selectedDate);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleToma = async (med, horario) => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const doseInfo = { medicationId: med._id, nome: med.nome, horario: horario, dosagem: med.dosagem || `${med.quantidade} ${med.unidade}` };
        try {
            const updatedLog = await fetchApi('/api/medication/log/toggle', {
                method: 'POST',
                body: JSON.stringify({ date: dateString, doseInfo })
            });
            setLogDoDia(updatedLog);
        } catch (error) {
            toast.error(error.message || "Erro ao registrar a toma.");
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
            fetchData(selectedDate);
        } catch (error) {
            toast.error('Erro ao alterar status.');
        }
    };
    
    const handleDelete = async (medId) => {
        if (window.confirm("Tem certeza que deseja apagar este medicamento? Esta ação é irreversível.")) {
            try {
                await fetchApi(`/api/medication/${medId}`, { method: 'DELETE' });
                toast.success('Medicamento apagado.');
                fetchData(selectedDate);
            } catch (error) {
                toast.error('Erro ao apagar.');
            }
        }
    };

    const changeDate = (amount) => {
        setSelectedDate(current => amount > 0 ? addDays(current, 1) : subDays(current, 1));
    };

    const medicamentosPorHorario = useCallback(() => {
        const diaDaSemanaSelecionado = selectedDate.getDay();
        const medsDoDia = medicamentos.filter(med => {
            if (med.status !== 'Ativo') return false;
            if (med.frequencia.tipo === 'Diária') return true;
            if (med.frequencia.tipo === 'Semanal' && Array.isArray(med.frequencia.diasDaSemana) && med.frequencia.diasDaSemana.includes(diaDaSemanaSelecionado)) {
                return true;
            }
            return false;
        });
        const grouped = {};
        medsDoDia.forEach(med => {
            (med.frequencia.horarios || []).forEach(horario => {
                if (!grouped[horario]) grouped[horario] = [];
                grouped[horario].push(med);
            });
        });
        return Object.keys(grouped).sort().reduce((acc, key) => ({...acc, [key]: grouped[key]}), {});
    }, [medicamentos, selectedDate]);

    if (loading) return <LoadingSpinner />;
    
    const horariosAgrupados = medicamentosPorHorario();

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header">
                    <h1>Minha Medicação</h1>
                    <p>Acompanhe os medicamentos e vitaminas para o dia selecionado.</p>
                </div>
                <button className="add-btn" onClick={handleOpenModal}>+ Gerir Meus Tratamentos</button>
            </div>

            <Card className="date-selector-card">
                <button onClick={() => changeDate(-1)} aria-label="Dia anterior">‹</button>
                <input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(parseISO(e.target.value))} />
                <button onClick={() => changeDate(1)} aria-label="Próximo dia">›</button>
            </Card>
            
            <div className="medication-layout">
                {Object.keys(horariosAgrupados).length > 0 ? (
                    Object.entries(horariosAgrupados).map(([horario, meds]) => (
                        <Card key={horario} className="med-group-card">
                            <div className="med-group-header">
                                <span className="med-group-icon">🕒</span>
                                <h3>{horario}</h3>
                            </div>
                            <ul className="med-group-list">
                                {meds.map(med => (
                                    <MedicationItem
                                        key={med._id} med={med} horario={horario}
                                        logDoDia={logDoDia} onToggleToma={handleToggleToma}
                                    />
                                ))}
                            </ul>
                        </Card>
                    ))
                ) : (
                    <EmptyState
                        title="Nenhum Medicamento Hoje"
                        message="Não há medicamentos ou vitaminas agendados para a data selecionada. Você pode gerir seus tratamentos a qualquer momento."
                        buttonText="Gerir Tratamentos"
                        onButtonClick={handleOpenModal}
                    />
                )}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                {modalView === 'list' ? (
                    <>
                        <h2>Gerir Tratamentos</h2>
                        <ul className="management-list">
                            {medicamentos.map(med => (
                                <li key={med._id} className={med.status === 'Inativo' ? 'inactive' : ''}>
                                    <div className="med-info">
                                        <strong>{med.nome}</strong>
                                        <span>{med.dosagem || `${med.quantidade} ${med.unidade}`} ({med.status})</span>
                                    </div>
                                    <div className="med-actions">
                                        <button onClick={() => handleToggleStatus(med)} className="action-btn-status">
                                            {med.status === 'Ativo' ? 'Arquivar' : 'Reativar'}
                                        </button>
                                        <button onClick={() => handleDelete(med._id)} className="action-btn-delete">Apagar</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button className="submit-btn" onClick={() => setModalView('form')}>+ Adicionar Novo</button>
                    </>
                ) : (
                    <>
                        <h2>Novo Tratamento</h2>
                        <form onSubmit={handleSubmit} className="medication-form">
                            <div className="form-group"><label>Nome</label><input name="nome" type="text" value={formData.nome} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label>Dosagem (ex: 500mg)</label><input name="dosagem" type="text" value={formData.dosagem} onChange={handleInputChange} /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Quantidade</label><input name="quantidade" type="number" min="1" value={formData.quantidade} onChange={handleInputChange} /></div>
                                <div className="form-group"><label>Unidade</label><select name="unidade" value={formData.unidade} onChange={handleInputChange}><option>comprimido(s)</option><option>cápsula(s)</option><option>gota(s)</option><option>ml</option></select></div>
                            </div>
                            <div className="form-group"><label>Frequência</label><select name="tipo" value={formData.frequencia.tipo} onChange={handleFrequenciaChange}><option>Diária</option><option>Semanal</option></select></div>
                            {formData.frequencia.tipo === 'Semanal' && (
                                <div className="form-group">
                                    <label>Dias da Semana</label>
                                    <div className="dias-semana-group">{diasDaSemanaOptions.map(dia => (<button type="button" key={dia.value} onClick={() => handleDiasDaSemanaChange(dia.value)} className={formData.frequencia.diasDaSemana.includes(dia.value) ? 'active' : ''}>{dia.label}</button>))}</div>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Horários das Doses</label>
                                {formData.frequencia.horarios.map((horario, index) => (<div key={index} className="horario-input-group"><input type="time" value={horario} onChange={(e) => handleHorarioChange(index, e.target.value)} required /><button type="button" onClick={() => removeHorario(index)} className="remove-horario-btn">-</button></div>))}
                                <button type="button" onClick={addHorario} className="add-horario-btn">+ Horário</button>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setModalView('list')}>‹ Voltar</button>
                                <button type="submit" className="submit-btn">Adicionar</button>
                            </div>
                        </form>
                    </>
                )}
            </Modal>
        </div>
    );
};

const MedicationItem = ({ med, horario, logDoDia, onToggleToma }) => {
    const foiTomado = logDoDia.dosesTomadas.some(
        dose => dose.medicationId === med._id && dose.horario === horario
    );

    return (
        <li className={`med-list-item ${foiTomado ? 'taken' : ''}`} onClick={() => onToggleToma(med, horario)}>
            <div className="med-item-checkbox">
                {foiTomado && '✓'}
            </div>
            <div className="med-item-info">
                <strong>{med.nome}</strong>
                <span>{med.dosagem || `${med.quantidade} ${med.unidade}`}</span>
            </div>
        </li>
    );
};

export default MedicationPage;