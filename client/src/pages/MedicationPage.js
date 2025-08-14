import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './MedicationPage.css';

const diasDaSemanaOptions = [
    { label: 'Dom', value: 0 },
    { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 },
    { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
];

const MedicationPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [logDoDia, setLogDoDia] = useState({ dosesTomadas: [] });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const [formData, setFormData] = useState({
        nome: '', dosagem: '', quantidade: 1, unidade: 'comprimido(s)',
        frequencia: { tipo: 'Diária', horarios: ['08:00'], diasDaSemana: [] }
    });

    const fetchData = useCallback(async (date) => {
        setLoading(true);
        const dateString = format(date, 'yyyy-MM-dd');
        try {
            const [resMeds, resLog] = await Promise.all([
                fetchApi('/api/medication/list'),
                fetchApi(`/api/medication/log/${dateString}`)
            ]);
            if (!resMeds.ok || !resLog.ok) throw new Error('Erro ao carregar dados de medicação');
            
            const dataMeds = await resMeds.json();
            const dataLog = await resLog.json();
            
            setMedicamentos(dataMeds.medicamentos || []);
            setLogDoDia(dataLog || { dosesTomadas: [] });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate, fetchData]);

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
        const newDias = currentDias.includes(dia)
            ? currentDias.filter(d => d !== dia)
            : [...currentDias, dia];
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
            setFormData({ nome: '', dosagem: '', quantidade: 1, unidade: 'comprimido(s)', frequencia: { tipo: 'Diária', horarios: ['08:00'], diasDaSemana: [] }});
            fetchData(selectedDate);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleToma = async (med, horario) => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const doseInfo = {
            medicationId: med._id,
            nome: med.nome,
            horario: horario,
            dosagem: med.dosagem || `${med.quantidade} ${med.unidade}`
        };
        try {
            const response = await fetchApi('/api/medication/log/toggle', {
                method: 'POST',
                body: JSON.stringify({ date: dateString, doseInfo })
            });
            if (!response.ok) throw new Error("Falha ao salvar registro.");
            const updatedLog = await response.json();
            setLogDoDia(updatedLog);
        } catch (error) {
            toast.error("Erro ao registrar a toma.");
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

    if (loading) return <LoadingSpinner />;

    const medicamentosAtivos = medicamentos.filter(m => m.status === 'Ativo');
    const medicamentosInativos = medicamentos.filter(m => m.status === 'Inativo');

    return (
        <div className="page-container">
            <div className="page-header"><h1>Minha Medicação</h1><p>Controle os seus medicamentos e vitaminas diárias.</p></div>
            <Card className="date-selector-card">
                <button onClick={() => changeDate(-1)} aria-label="Dia anterior">‹</button>
                <input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(parseISO(e.target.value))} />
                <button onClick={() => changeDate(1)} aria-label="Próximo dia">›</button>
            </Card>
            <Card>
                 <div className="medication-header">
                    <h3>Tratamentos para {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}</h3>
                    <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Gerir Lista</button>
                </div>
                {medicamentosAtivos.length > 0 ? (
                    <div className="medication-list">{medicamentosAtivos.map(med => (<MedicationItem key={med._id} med={med} logDoDia={logDoDia} selectedDate={selectedDate} onToggleToma={handleToggleToma} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />))}</div>
                ) : (<div className="empty-state"><span className="empty-icon">💊</span><p>Nenhum medicamento ativo cadastrado.</p></div>)}
            </Card>
            {medicamentosInativos.length > 0 && (<div className="inactive-toggle" onClick={() => setShowInactive(!showInactive)}>{showInactive ? 'Ocultar' : 'Mostrar'} Arquivados ({medicamentosInativos.length})</div>)}
            {showInactive && (
                <Card>
                    <div className="medication-header"><h3>Medicamentos Arquivados</h3></div>
                    <div className="medication-list">{medicamentosInativos.map(med => (<MedicationItem key={med._id} med={med} logDoDia={logDoDia} selectedDate={selectedDate} onToggleStatus={handleToggleStatus} onDelete={handleDelete}/>))}</div>
                </Card>
            )}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Novo Medicamento</h2>
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
                            <div className="dias-semana-group">
                                {diasDaSemanaOptions.map(dia => (
                                    <button type="button" key={dia.value} onClick={() => handleDiasDaSemanaChange(dia.value)} className={formData.frequencia.diasDaSemana.includes(dia.value) ? 'active' : ''}>
                                        {dia.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Horários das Doses</label>
                        {formData.frequencia.horarios.map((horario, index) => (<div key={index} className="horario-input-group"><input type="time" value={horario} onChange={(e) => handleHorarioChange(index, e.target.value)} required /><button type="button" onClick={() => removeHorario(index)} className="remove-horario-btn">-</button></div>))}
                        <button type="button" onClick={addHorario} className="add-horario-btn">+ Horário</button>
                    </div>

                    <button type="submit" className="submit-btn">Adicionar à Lista</button>
                </form>
            </Modal>
        </div>
    );
};

const MedicationItem = ({ med, logDoDia, selectedDate, onToggleToma, onDelete, onToggleStatus }) => {
    
    const diaDaSemanaSelecionado = selectedDate.getDay();
    
    // ✅ CORREÇÃO: Verifica se 'diasDaSemana' existe e é um array antes de usar '.includes()'
    const isTodayWeeklyDose = med.frequencia.tipo === 'Semanal' && 
                              Array.isArray(med.frequencia.diasDaSemana) && 
                              med.frequencia.diasDaSemana.includes(diaDaSemanaSelecionado);
    
    const deveMostrarHorarios = med.frequencia.tipo === 'Diária' || isTodayWeeklyDose;
    const horarios = med.frequencia.horarios || [];

    const formatarDiasSemana = () => {
        // ✅ CORREÇÃO: Garante que o array exista antes de tentar manipulá-lo
        const dias = med.frequencia.diasDaSemana || [];
        if (dias.length === 0) return 'Nenhum dia selecionado';
        
        return dias
            .sort()
            .map(dia => diasDaSemanaOptions.find(d => d.value === dia)?.label)
            .join(', ');
    };

    return (
        <div className={`med-item status-${med.status.toLowerCase()}`}>
            <div className="med-info"><strong>{med.nome}</strong><span>{med.dosagem || `${med.quantidade} ${med.unidade}`}</span></div>
            {med.status === 'Ativo' && deveMostrarHorarios && (
                <div className="med-checks">
                    {horarios.map((horario, index) => {
                        const foiTomado = logDoDia.dosesTomadas.some(dose => dose.medicationId === med._id && dose.horario === horario);
                        return (<div key={index} className="dose-item"><button className={`med-checkbox ${foiTomado ? 'taken' : ''}`} onClick={() => onToggleToma(med, horario)}>{foiTomado && '✓'}</button><span className="dose-time">{horario}</span></div>);
                    })}
                </div>
            )}
            {med.status === 'Ativo' && med.frequencia.tipo === 'Semanal' && !deveMostrarHorarios && (<div className="med-horarios"><span className="horario-tag">Toda {formatarDiasSemana()}</span></div>)}
            <div className="med-actions"><button onClick={() => onToggleStatus(med)} className="action-btn archive-btn">{med.status === 'Ativo' ? 'Arquivar' : 'Reativar'}</button>{med.status === 'Inativo' && <button onClick={() => onDelete(med._id)} className="action-btn delete-btn">Apagar</button>}</div>
        </div>
    );
};

export default MedicationPage;