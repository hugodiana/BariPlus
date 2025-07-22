import React, { useState, useEffect, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './GastosPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(ArcElement, Tooltip, Legend);

const GastosPage = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estados para o formulário
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [categoria, setCategoria] = useState('Consultas');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);

    // Estados para o filtro de data
    const [currentDate, setCurrentDate] = useState(new Date());

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchGastos = async () => {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            try {
                const res = await fetch(`${apiUrl}/api/gastos?year=${year}&month=${month}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setGastos(data);
            } catch (error) {
                toast.error("Erro ao carregar gastos.");
            } finally {
                setLoading(false);
            }
        };
        fetchGastos();
    }, [currentDate, token, apiUrl]);

    const handleAddGasto = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/gastos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ descricao, valor, categoria, data })
            });
            const novoGasto = await res.json();
            setGastos(prev => [novoGasto, ...prev].sort((a, b) => new Date(b.data) - new Date(a.data)));
            setIsModalOpen(false);
            setDescricao(''); setValor(''); setCategoria('Consultas'); setData(new Date().toISOString().split('T')[0]);
            toast.success("Gasto adicionado com sucesso!");
        } catch (error) {
            toast.error("Erro ao adicionar gasto.");
        }
    };
    
    const handleDeleteGasto = async (gastoId) => {
        if (!window.confirm("Tem certeza que quer apagar este gasto?")) return;
        try {
            await fetch(`${apiUrl}/api/gastos/${gastoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setGastos(prev => prev.filter(g => g._id !== gastoId));
            toast.info("Gasto apagado.");
        } catch (error) {
            toast.error("Erro ao apagar gasto.");
        }
    };

    // Lógica para os resumos e gráfico
    const { totalGasto, dadosDoGrafico } = useMemo(() => {
        const total = gastos.reduce((sum, gasto) => sum + gasto.valor, 0);

        const gastosPorCategoria = gastos.reduce((acc, gasto) => {
            acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.valor;
            return acc;
        }, {});

        const dadosDoGrafico = {
            labels: Object.keys(gastosPorCategoria),
            datasets: [{
                data: Object.values(gastosPorCategoria),
                backgroundColor: ['#37715b', '#007aff', '#ff9f40', '#ff6384', '#36a2eb', '#cc65fe'],
            }]
        };
        return { totalGasto: total, dadosDoGrafico };
    }, [gastos]);

    const changeMonth = (amount) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    return (
        <div className="page-container">
            <div className="page-header"><h1>Controle de Gastos</h1><p>Organize suas despesas da jornada bariátrica.</p></div>
            <div className="gastos-content">
                <div className="date-filter">
                    <button onClick={() => changeMonth(-1)}>&lt; Mês Anterior</button>
                    <h2>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                    <button onClick={() => changeMonth(1)}>Próximo Mês &gt;</button>
                </div>

                <div className="summary-grid">
                    <div className="summary-card">
                        <span>Total Gasto no Mês</span>
                        <strong>{totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </div>
                    {/* Pode adicionar mais cards aqui, ex: Categoria com maior gasto */}
                </div>

                <div className="gastos-main-grid">
                    <div className="gastos-list-card">
                        <div className="list-header">
                            <h3>Lançamentos do Mês</h3>
                            <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar Gasto</button>
                        </div>
                        {gastos.length > 0 ? (
                            <ul>
                                {gastos.map(gasto => (
                                    <li key={gasto._id}>
                                        <span className="gasto-categoria" data-category={gasto.categoria}>{gasto.categoria}</span>
                                        <div className="gasto-info">
                                            <span>{gasto.descricao}</span>
                                            <small>{format(new Date(gasto.data), 'dd/MM/yyyy')}</small>
                                        </div>
                                        <span className="gasto-valor">{gasto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        <button onClick={() => handleDeleteGasto(gasto._id)} className="delete-btn">×</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="empty-state">Nenhum gasto registrado para este mês.</p>)}
                    </div>
                    <div className="gastos-chart-card">
                        <h3>Distribuição por Categoria</h3>
                        {gastos.length > 0 ? <Doughnut data={dadosDoGrafico} /> : <p className="empty-state">Sem dados para o gráfico.</p>}
                    </div>
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Novo Gasto</h2>
                <form onSubmit={handleAddGasto} className="gasto-form">
                    <label>Descrição</label>
                    <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required />
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} required />
                    <label>Categoria</label>
                    <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                        <option>Consultas</option>
                        <option>Suplementos</option>
                        <option>Farmácia</option>
                        <option>Alimentação</option>
                        <option>Academia</option>
                        <option>Outros</option>
                    </select>
                    <label>Data do Gasto</label>
                    <input type="date" value={data} onChange={e => setData(e.target.value)} required />
                    <button type="submit">Salvar Gasto</button>
                </form>
            </Modal>
        </div>
    );
};

export default GastosPage;