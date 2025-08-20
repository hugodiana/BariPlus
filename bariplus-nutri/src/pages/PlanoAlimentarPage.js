// src/pages/PlanoAlimentarPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import ResumoNutricional from '../components/plano/ResumoNutricional'; // ✅ IMPORTAR
import BuscaAlimentos from '../components/BuscaAlimentos'; // Reutilizando
import './PlanoAlimentarPage.css';

const PlanoAlimentarPage = () => {
    const { pacienteId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [currentRefIndex, setCurrentRefIndex] = useState(null);
    const [plano, setPlano] = useState({
        titulo: '',
        observacoesGerais: '',
        refeicoes: [{ nome: 'Pequeno-almoço', horario: '08:00', itens: [] }]
    });

    const handlePlanoChange = (e) => setPlano(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleRefeicaoChange = (index, e) => {
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[index][e.target.name] = e.target.value;
        setPlano(p => ({ ...p, refeicoes: novasRefeicoes }));
    };

    // ✅ LÓGICA ATUALIZADA PARA ITENS
    const handleItemChange = (refIndex, itemIndex, e) => {
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[refIndex].itens[itemIndex][e.target.name] = e.target.value;
        setPlano(p => ({ ...p, refeicoes: novasRefeicoes }));
    };

    const handleSelectAlimento = (alimento) => {
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[currentRefIndex].itens.push({
            alimento: alimento.description,
            quantidade: '1 porção', // Valor padrão
            porcao: 100, // Valor padrão em gramas
            base_kcal: alimento.kcal,
            base_protein: alimento.protein,
            base_carbs: alimento.carbohydrates,
            base_fats: alimento.lipids,
        });
        setPlano(p => ({ ...p, refeicoes: novasRefeicoes }));
        setIsFoodModalOpen(false);
    };

    const adicionarRefeicao = () => setPlano(p => ({ ...p, refeicoes: [...p.refeicoes, { nome: '', horario: '', itens: [] }] }));
    const removerRefeicao = (index) => setPlano(p => ({ ...p, refeicoes: p.refeicoes.filter((_, i) => i !== index) }));
    const removerItem = (refIndex, itemIndex) => {
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[refIndex].itens.splice(itemIndex, 1);
        setPlano(p => ({ ...p, refeicoes: novasRefeicoes }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetchApi('/api/nutri/planos/criar', {
                method: 'POST',
                body: JSON.stringify({ ...plano, pacienteId })
            });
            toast.success('Plano alimentar criado com sucesso!');
            navigate(`/prontuario/${pacienteId}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container plano-alimentar-layout">
            <div className="plano-form-coluna">
                <Link to={`/prontuario/${pacienteId}`} className="back-link">‹ Voltar para o Prontuário</Link>
                <div className="page-header">
                    <h1>Criar Plano Alimentar</h1>
                </div>
                <form onSubmit={handleSubmit}>
                    <Card className="plano-card">
                        <div className="form-group">
                            <label>Título do Plano</label>
                            <input type="text" name="titulo" value={plano.titulo} onChange={handlePlanoChange} required />
                        </div>

                        {plano.refeicoes.map((refeicao, refIndex) => (
                            <Card key={refIndex} className="refeicao-card">
                                <div className="refeicao-header">
                                    <input type="text" name="nome" value={refeicao.nome} onChange={(e) => handleRefeicaoChange(refIndex, e)} placeholder="Nome da Refeição" required />
                                    <input type="time" name="horario" value={refeicao.horario} onChange={(e) => handleRefeicaoChange(refIndex, e)} />
                                    <button type="button" onClick={() => removerRefeicao(refIndex)} className="remove-btn">×</button>
                                </div>
                                {refeicao.itens.map((item, itemIndex) => (
                                    <div key={itemIndex} className="item-fields-nutri">
                                        <input className="alimento-nome" type="text" name="alimento" value={item.alimento} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} required />
                                        <input className="alimento-porcao" type="number" name="porcao" value={item.porcao} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} required />
                                        <span>g</span>
                                        <input className="alimento-quantidade" type="text" name="quantidade" value={item.quantidade} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} placeholder="Medida caseira" required />
                                        <button type="button" onClick={() => removerItem(refIndex, itemIndex)} className="remove-btn">×</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => { setCurrentRefIndex(refIndex); setIsFoodModalOpen(true); }} className="add-item-btn">+ Buscar Alimento</button>
                            </Card>
                        ))}
                        
                        <button type="button" onClick={adicionarRefeicao} className="add-refeicao-btn">+ Adicionar Refeição</button>
                        <div className="form-group"><label>Observações Gerais</label><textarea name="observacoesGerais" value={plano.observacoesGerais} onChange={handlePlanoChange}></textarea></div>
                        <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'A guardar...' : 'Guardar Plano'}</button>
                    </Card>
                </form>
            </div>
            <div className="plano-resumo-coluna">
                <ResumoNutricional refeicoes={plano.refeicoes} />
            </div>

            <Modal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)}>
                <BuscaAlimentos onSelectAlimento={handleSelectAlimento} />
            </Modal>
        </div>
    );
};

export default PlanoAlimentarPage;