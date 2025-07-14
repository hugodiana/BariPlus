import React, { useState, useEffect } from 'react';
import './MedicationPage.css';
import Modal from '../components/Modal';

const MedicationPage = () => {
    const [medicamentos, setMedicamentos] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados para o formulário
    const [nome, setNome] = useState('');
    const [dosagem, setDosagem] = useState('');
    const [frequencia, setFrequencia] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/medication`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setMedicamentos(data.medicamentos || []);
                setHistorico(data.historico || []);
            } catch (error) {
                console.error("Erro ao buscar medicação:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, apiUrl]);

    const handleAddMedicamento = async (e) => {
        e.preventDefault();
        const novoMedicamento = { nome, dosagem, frequencia };
        const res = await fetch(`${apiUrl}/api/medication`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(novoMedicamento)
        });
        const medAdicionado = await res.json();
        setMedicamentos(prev => [...prev, medAdicionado]);
        setIsModalOpen(false);
        setNome(''); setDosagem(''); setFrequencia('');
    };

    const handleDeleteMedicamento = async (medId) => {
        if (!window.confirm("Tem a certeza que quer apagar este medicamento da sua lista?")) return;
        await fetch(`${apiUrl}/api/medication/${medId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setMedicamentos(prev => prev.filter(med => med._id !== medId));
    };

    const foiTomadoHoje = (medId) => {
        return historico.some(log => log.medicamentoId === medId && log.data === hoje);
    };

    const handleToggleToma = async (medId) => {
        const jaTomou = foiTomadoHoje(medId);
        const method = jaTomou ? 'DELETE' : 'POST';
        const body = { medicamentoId: medId, date: hoje };

        const res = await fetch(`${apiUrl}/api/medication/log`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        
        if (jaTomou) {
            setHistorico(prev => prev.filter(log => !(log.medicamentoId === medId && log.data === hoje)));
        } else {
            setHistorico(prev => [...prev, body]);
        }
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
                    {medicamentos.map(med => (
                        <div key={med._id} className={`med-item ${foiTomadoHoje(med._id) ? 'tomado' : ''}`}>
                            <div className="med-checkbox" onClick={() => handleToggleToma(med._id)}>
                                <span className="checkmark">✓</span>
                            </div>
                            <div className="med-info">
                                <strong>{med.nome}</strong>
                                <span>{med.dosagem} - {med.frequencia}</span>
                            </div>
                            <button onClick={() => handleDeleteMedicamento(med._id)} className="delete-med-btn">×</button>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Novo Medicamento</h2>
                <form onSubmit={handleAddMedicamento} className="medication-form">
                    <label>Nome do Medicamento/Vitamina</label>
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                    <label>Dosagem</label>
                    <input type="text" value={dosagem} onChange={e => setDosagem(e.target.value)} placeholder="Ex: 500mg, 1 comprimido" />
                    <label>Frequência</label>
                    <input type="text" value={frequencia} onChange={e => setFrequencia(e.target.value)} placeholder="Ex: Diariamente, 2x ao dia" />
                    <button type="submit">Adicionar à Lista</button>
                </form>
            </Modal>
        </div>
    );
};

export default MedicationPage;