import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './GastosPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchApi } from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const GastosPage = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        descricao: '', valor: '', categoria: 'Consultas', data: new Date().toISOString().split('T')[0]
    });
    
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchGastos = useCallback(async () => {
        setLoading(true);
        try {
            // CORREÇÃO APLICADA AQUI
            const data = await fetchApi('/api/gastos'); // Busca todos os gastos
            setGastos(data);
        } catch (error) {
            toast.error(error.message || "Falha ao carregar gastos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGastos(); }, [fetchGastos]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAddGasto = async (e) => {
        e.preventDefault();
        try {
            const res = await fetchApi('/api/gastos', {
                method: 'POST',
                body: JSON.stringify({ ...formData, valor: parseFloat(formData.valor) })
            });
            if (!res.ok) throw new Error("Falha ao adicionar gasto.");
            
            setIsModalOpen(false);
            setFormData({ descricao: '', valor: '', categoria: 'Consultas', data: new Date().toISOString().split('T')[0] });
            toast.success("Gasto adicionado com sucesso!");
            fetchGastos();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleDeleteGasto = async (gastoId) => {
        if (!window.confirm("Tem certeza que quer apagar este gasto?")) return;
        try {
            await fetchApi(`/api/gastos/${gastoId}`, { method: 'DELETE' });
            toast.info("Gasto apagado.");
            fetchGastos();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const { gastosDoMes, totalGastoMes, totalGastoAno, dadosDoGrafico } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const gastosDoMesAtual = gastos.filter(gasto => {
            const dataGasto = parseISO(gasto.data);
            return dataGasto.getFullYear() === year && dataGasto.getMonth() === month;
        });
        
        const gastosDoAno = gastos.filter(gasto => parseISO(gasto.data).getFullYear() === year);

        const totalMes = gastosDoMesAtual.reduce((sum, gasto) => sum + gasto.valor, 0);
        const totalAno = gastosDoAno.reduce((sum, gasto) => sum + gasto.valor, 0);

        const gastosPorCategoria = gastosDoMesAtual.reduce((acc, gasto) => {
            acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.valor;
            return acc;
        }, {});

        const dadosGrafico = {
            labels: Object.keys(gastosPorCategoria),
            datasets: [{
                data: Object.values(gastosPorCategoria),
                backgroundColor: ['#37715b', '#007aff', '#ff9f40', '#e74c3c', '#8e44ad', '#3498db'],
                borderColor: '#ffffff',
                borderWidth: 2,
            }]
        };
        return { gastosDoMes: gastosDoMesAtual, totalGastoMes: totalMes, totalGastoAno: totalAno, dadosDoGrafico: dadosGrafico };
    }, [gastos, currentDate]);

    const changeMonth = (amount) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Controle de Gastos</h1>
                <p>Organize as despesas da sua jornada bariátrica.</p>
            </div>
            
            <Card className="gastos-control-panel">
                <div className="date-filter">
                    <button onClick={() => changeMonth(-1)} aria-label="Mês anterior">‹</button>
                    <h2>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                    <button onClick={() => changeMonth(1)} aria-label="Próximo mês">›</button>
                </div>
                <div className="summary-totals">
                    <div className="summary-item">
                        <span>Total Gasto no Mês</span>
                        <strong>{totalGastoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </div>
                    <div className="summary-item">
                        <span>Total Gasto no Ano</span>
                        <strong>{totalGastoAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </div>
                </div>
            </Card>

            <div className="gastos-main-grid">
                <Card>
                    <div className="list-header">
                        <h3>Lançamentos do Mês</h3>
                        <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar Gasto</button>
                    </div>
                    {gastosDoMes.length > 0 ? (
                        <ul className="gastos-list">
                            {gastosDoMes.map(gasto => (
                                <li key={gasto._id}>
                                    <span className="gasto-categoria" data-category={gasto.categoria}></span>
                                    <div className="gasto-info">
                                        <span>{gasto.descricao}</span>
                                        <small>{format(parseISO(gasto.data), 'dd/MM/yyyy')}</small>
                                    </div>
                                    <span className="gasto-valor">{gasto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <button onClick={() => handleDeleteGasto(gasto._id)} className="delete-btn">×</button>
                                </li>
                            ))}
                        </ul>
                    ) : (<div className="empty-state"><span className="empty-icon">💸</span><p>Nenhum gasto registrado para este mês.</p></div>)}
                </Card>
                <Card>
                    <h3>Distribuição por Categoria</h3>
                    <div className="chart-container">
                        {gastosDoMes.length > 0 ? <Doughnut data={dadosDoGrafico} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /> : <div className="empty-state"><p>Sem dados para o gráfico.</p></div>}
                    </div>
                </Card>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Novo Gasto</h2>
                <form onSubmit={handleAddGasto} className="modal-form">
                    <div className="form-group"><label>Descrição</label><input type="text" name="descricao" value={formData.descricao} onChange={handleInputChange} required /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Valor (R$)</label><input type="number" name="valor" step="0.01" value={formData.valor} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Data do Gasto</label><input type="date" name="data" value={formData.data} onChange={handleInputChange} required /></div>
                    </div>
                    <div className="form-group"><label>Categoria</label><select name="categoria" value={formData.categoria} onChange={handleInputChange}>
                        <option>Consultas</option><option>Suplementos</option><option>Farmácia</option>
                        <option>Alimentação</option><option>Academia</option><option>Outros</option>
                    </select></div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="primary-btn">Salvar Gasto</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GastosPage;