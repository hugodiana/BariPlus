import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './DiarioPage.css';
import Modal from '../components/Modal';

const DiarioPage = () => {
    const [dataSelecionada, setDataSelecionada] = useState(new Date());
    const [diarioDoDia, setDiarioDoDia] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchDiario = async () => {
            setLoading(true);
            const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
            try {
                const res = await fetch(`${apiUrl}/api/diario/${dataFormatada}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setDiarioDoDia(data);
            } catch (error) {
                console.error("Erro ao buscar diário:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDiario();
        }
    }, [dataSelecionada, token, apiUrl]);

    const RefeicaoCard = ({ titulo, alimentos }) => (
        <div className="refeicao-card">
            <div className="refeicao-header">
                <h3>{titulo}</h3>
                <button className="add-alimento-btn">+ Adicionar Alimento</button>
            </div>
            <div className="alimentos-list">
                {alimentos && alimentos.length > 0 ? (
                    alimentos.map(alimento => (
                        <div key={alimento._id} className="alimento-item">
                            <span>{alimento.nome} ({alimento.quantidade})</span>
                            <span>{alimento.proteinas}g Prot.</span>
                        </div>
                    ))
                ) : (
                    <p className="alimento-empty">Nenhum alimento registrado.</p>
                )}
            </div>
        </div>
    );

    if (loading) return <div>Carregando diário...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Diário Alimentar</h1>
                <p>Monitore suas refeições e acompanhe seus nutrientes.</p>
            </div>

            <div className="diario-layout">
                <div className="diario-calendario">
                    <DayPicker
                        mode="single"
                        selected={dataSelecionada}
                        onSelect={setDataSelecionada}
                        locale={ptBR}
                        showOutsideDays
                    />
                </div>
                <div className="diario-refeicoes">
                    <h2>Refeições de {format(dataSelecionada, 'dd/MM/yyyy')}</h2>
                    <div className="refeicoes-grid">
                        <RefeicaoCard titulo="Café da Manhã" alimentos={diarioDoDia?.refeicoes.cafeDaManha} />
                        <RefeicaoCard titulo="Almoço" alimentos={diarioDoDia?.refeicoes.almoco} />
                        <RefeicaoCard titulo="Jantar" alimentos={diarioDoDia?.refeicoes.jantar} />
                        <RefeicaoCard titulo="Lanches" alimentos={diarioDoDia?.refeicoes.lanches} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiarioPage;