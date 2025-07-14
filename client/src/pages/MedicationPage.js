import React, { useState, useEffect } from 'react';
import './MedicationPage.css';
import Modal from '../components/Modal';

const MedicationPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [historico, setHistorico] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados para o formulário (aqui estava o erro)
    const [nome, setNome] = useState('');
    const [dosagem, setDosagem] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [unidade, setUnidade] = useState('comprimido(s)');
    const [vezesAoDia, setVezesAoDia] = useState(1);
    
    // ✅ A declaração que provavelmente estava em falta
    const [frequencia, setFrequencia] = useState(''); 


    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    const hoje = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/medication`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setMedicamentos(data.medicamentos || []);
                // Garante que o histórico seja um Map
                setHistorico(new Map(Object.entries(data.historico || {})));
            } catch (error) { console.error("Erro ao buscar medicação:", error); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [token, apiUrl]);

    const handleAddMedicamento = async (e) => {
        e.preventDefault();
        const novoMedicamento = { nome, dosagem, quantidade, unidade, vezesAoDia };
        const res = await fetch(`${apiUrl}/api/medication`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(novoMedicamento)
        });
        const medAdicionado = await res.json();
        setMedicamentos(prev => [...prev, medAdicionado]);
        setIsModalOpen(false);
        // Limpa todos os campos do formulário
        setNome(''); 
        setDosagem(''); 
        setQuantidade(1);
        setUnidade('comprimido(s)');
        setVezesAoDia(1);
    };

    const handleDeleteMedicamento = async (medId) => {
        if (!window.confirm("Tem a certeza que quer apagar este medicamento?")) return;
        await fetch(`${apiUrl}/api/medication/${medId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setMedicamentos(prev => prev.filter(med => med._id !== medId));
    };

    const foiTomadoHoje = (medId, tomaIndex) => {
        const logDeHoje = historico.get(hoje);
        if (!logDeHoje) return false;
        return (logDeHoje[medId] || 0) > tomaIndex;
    };

    const handleToggleToma = async (medId, totalDoses) => {
        const logDeHoje = historico.get(hoje) || {};
        const tomasAtuais = logDeHoje[medId] || 0;
        const novasTomas = (tomasAtuais + 1) > totalDoses ? 0 : tomasAtuais + 1;

        const newHistoryState = new Map(historico);
        const newTodayLog = newHistoryState.get(hoje) || {};
        newTodayLog[medId] = novasTomas;
        newHistoryState.set(hoje, newTodayLog);
        setHistorico(newHistoryState);
        
        await fetch(`${apiUrl}/api/medication/log/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ date: hoje, medId: medId, count: novasTomas })
        });
    };

    if (loading) return <div>A carregar...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>A Minha Medicação</h1>
                <p>Controle aqui as suas vitaminas e medicamentos diários.</p>
            </div>
            <div className="medication-content">
                <div className="medication-header">
                    <h3>Lista de Medicamentos</h3>
                    <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar</button>
                </div>
                <div className="medication-list">
                    {medicamentos.map(med => {
                        const checks = Array.from({ length: med.vezesAoDia }, (_, i) => foiTomadoHoje(med._id, i));
                        return (
                            <div key={med._id} className="med-item">
                                <div className="med-info">
                                    <strong>{med.nome}</strong>
                                    <span>{med.dosagem} - {med.quantidade} {med.unidade}, {med.vezesAoDia}x ao dia</span>
                                </div>
                                <div className="daily-med-checks">
                                    {checks.map((checked, index) => (
                                        <div 
                                            key={index} 
                                            className={`med-checkbox-daily ${checked ? 'taken' : ''}`}
                                            onClick={() => handleToggleToma(med._id, med.vezesAoDia)}
                                        >
                                            {checked && '✓'}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleDeleteMedicamento(med._id)} className="delete-med-btn">×</button>
                            </div>
                        );
                    })}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Novo Medicamento</h2>
                <form onSubmit={handleAddMedicamento} className="medication-form">
                    <label>Nome do Medicamento/Vitamina</label>
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                    <label>Dosagem (ex: 500mg, 1000mcg)</label>
                    <input type="text" value={dosagem} onChange={e => setDosagem(e.target.value)} />
                    <div className="form-row">
                        <div className="form-field">
                            <label>Quantidade</label>
                            <input type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>Unidade</label>
                            <select value={unidade} onChange={e => setUnidade(e.target.value)}>
                                <option value="comprimido(s)">comprimido(s)</option>
                                <option value="cápsula(s)">cápsula(s)</option>
                                <option value="gota(s)">gota(s)</option>
                                <option value="ml">ml</option>
                            </select>
                        </div>
                    </div>
                    <label>Frequência (quantas vezes ao dia)</label>
                    <select value={vezesAoDia} onChange={e => setVezesAoDia(Number(e.target.value))}>
                        <option value="1">1 vez ao dia</option>
                        <option value="2">2 vezes ao dia</option>
                        <option value="3">3 vezes ao dia</option>
                        <option value="4">4 vezes ao dia</option>
                    </select>
                    <button type="submit">Adicionar à Lista</button>
                </form>
            </Modal>
        </div>
    );
};

export default MedicationPage;