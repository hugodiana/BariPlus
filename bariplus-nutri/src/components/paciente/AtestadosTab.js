// src/components/paciente/AtestadosTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../../utils/api';
import Card from '../ui/Card';
import LoadingSpinner from '../LoadingSpinner';
import '../../pages/ProntuarioPage.css';

const AtestadosTab = ({ paciente, nutricionista }) => {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados do formulário
    const [tipoAtestado, setTipoAtestado] = useState('simples');
    const [motivo, setMotivo] = useState('Acompanhamento nutricional para cirurgia bariátrica.');
    const [nomeAcompanhante, setNomeAcompanhante] = useState('');
    const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
    const [horaInicio, setHoraInicio] = useState('09:00');
    const [horaFim, setHoraFim] = useState('10:00');

    const [atestadoGerado, setAtestadoGerado] = useState('');

    const fetchHistorico = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`/api/nutri/prontuarios/${paciente._id}/atestados`);
            setHistorico(data);
        } catch (error) {
            toast.error("Erro ao carregar histórico de atestados.");
        } finally {
            setLoading(false);
        }
    }, [paciente._id]);

    useEffect(() => {
        fetchHistorico();
    }, [fetchHistorico]);

    const handleGerarAtestado = async () => {
        setLoading(true);
        try {
            const body = { tipo: tipoAtestado, motivo, nomeAcompanhante, dataConsulta, horaInicio, horaFim };
            const data = await fetchApi(`/api/nutri/prontuarios/${paciente._id}/gerar-atestado`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            setAtestadoGerado(data.atestado);
            toast.success("Atestado gerado com sucesso!");
            fetchHistorico(); // Atualiza o histórico
        } catch (error) {
            toast.error(error.message || "Erro ao gerar atestado.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(atestadoGerado);
        toast.info("Atestado copiado para a área de transferência!");
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="atestado-container">
            <div className="atestado-form-coluna">
                <Card>
                    <div className="form-section">
                        <h4>Gerar Novo Documento</h4>
                        <div className="form-group">
                            <label>Tipo de Documento</label>
                            <select value={tipoAtestado} onChange={(e) => setTipoAtestado(e.target.value)}>
                                <option value="simples">Atestado de Acompanhamento</option>
                                <option value="acompanhante">Atestado de Acompanhante</option>
                            </select>
                        </div>
                        {tipoAtestado === 'simples' ? (
                            <div className="form-group">
                                <label>Motivo</label>
                                <textarea rows="3" value={motivo} onChange={(e) => setMotivo(e.target.value)}></textarea>
                            </div>
                        ) : (
                             <div className="form-group">
                                <label>Nome Completo do Acompanhante</label>
                                <input type="text" value={nomeAcompanhante} onChange={(e) => setNomeAcompanhante(e.target.value)} required />
                            </div>
                        )}
                        <div className="form-grid">
                            <div className="form-group"><label>Data da Consulta</label><input type="date" value={dataConsulta} onChange={(e) => setDataConsulta(e.target.value)} /></div>
                            <div className="form-group"><label>Início</label><input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} /></div>
                            <div className="form-group"><label>Fim</label><input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} /></div>
                        </div>
                        <button className="submit-btn" onClick={handleGerarAtestado} disabled={loading}>
                            {loading ? 'A gerar...' : 'Gerar Atestado'}
                        </button>
                    </div>
                </Card>
                 <Card>
                    <h4>Histórico de Atestados</h4>
                    {historico.length > 0 ? (
                        <ul className="evolucao-list">
                            {historico.map(item => (
                                <li key={item._id} className="evolucao-item">
                                    <span className="evolucao-data">{format(new Date(item.createdAt), 'dd/MM/yyyy')} - {item.tipo}</span>
                                    <p className="evolucao-nota">{item.textoCompleto.substring(0, 70)}...</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p>Nenhum atestado gerado para este paciente.</p>}
                </Card>
            </div>
            <div className="atestado-preview-coluna">
                <Card>
                    <div className="card-header-action">
                        <h3>Pré-visualização</h3>
                        {atestadoGerado && (
                             <div className="header-buttons">
                                <button className="secondary-btn" onClick={handleCopyToClipboard}>Copiar</button>
                                {/* Futuramente: <button className="action-btn-email">Enviar</button> */}
                            </div>
                        )}
                    </div>
                    <div className="atestado-preview">
                        {atestadoGerado ? (<pre>{atestadoGerado}</pre>) : (<p className="empty-message">Preencha os dados e clique em "Gerar" para ver o resultado aqui.</p>)}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AtestadosTab;