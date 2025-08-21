// src/pages/PlanoAlimentarPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import ResumoNutricional from '../components/plano/ResumoNutricional';
import BuscaAlimentos from '../components/BuscaAlimentos';
import AnalisePlanoTab from '../components/plano/AnalisePlanoTab';
import DefinirMetasModal from '../components/plano/DefinirMetasModal'; 
import './PlanoAlimentarPage.css';

const PlanoAlimentarPage = () => {
    const { pacienteId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [isMetasModalOpen, setIsMetasModalOpen] = useState(true);
    const [metas, setMetas] = useState(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isReceitaModalOpen, setIsReceitaModalOpen] = useState(false);
    const [planoTemplates, setPlanoTemplates] = useState([]);
    const [receitas, setReceitas] = useState([]);
    const [activeTab, setActiveTab] = useState('montagem');
    const [currentRefIndex, setCurrentRefIndex] = useState(null);
    const [plano, setPlano] = useState({
        titulo: '',
        observacoesGerais: '',
        refeicoes: [{ nome: 'Pequeno-almoço', horario: '08:00', itens: [] }]
    });

    const fetchData = useCallback(async () => {
        try {
            const [dataTemplates, dataReceitas] = await Promise.all([
                fetchApi('/api/nutri/planos/templates'),
                fetchApi('/api/nutri/receitas')
            ]);
            setPlanoTemplates(dataTemplates);
            setReceitas(dataReceitas);
        } catch (error) {
            toast.error("Erro ao carregar dados para a criação de planos.");
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveMetas = (metasDefinidas) => {
        setMetas(metasDefinidas);
        setIsMetasModalOpen(false);
    };

    const handleAddReceita = (receita) => {
        const novosItens = receita.ingredientes.map(ing => ({
            alimento: `${ing.alimento.description} (${receita.nome})`,
            quantidade: ing.medidaCaseira, porcao: ing.quantidade,
            base_kcal: ing.alimento.kcal, base_protein: ing.alimento.protein,
            base_carbs: ing.alimento.carbohydrates, base_fats: ing.alimento.lipids,
        }));
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[currentRefIndex].itens.push(...novosItens);
        setPlano(p => ({ ...p, refeicoes: novasRefeicoes }));
        setIsReceitaModalOpen(false);
    };

    const handleUsePlanoTemplate = (template) => {
        setPlano({
            titulo: template.titulo,
            observacoesGerais: template.observacoesGerais,
            refeicoes: template.refeicoes.map(r => ({ ...r, itens: r.itens.map(i => ({...i})) }))
        });
        setIsTemplateModalOpen(false);
        toast.info(`Template "${template.templateName}" carregado!`);
    };

    const handlePlanoChange = (e) => setPlano(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleRefeicaoChange = (index, e) => { const novasRefeicoes = [...plano.refeicoes]; novasRefeicoes[index][e.target.name] = e.target.value; setPlano(p => ({ ...p, refeicoes: novasRefeicoes })); };
    const handleItemChange = (refIndex, itemIndex, e) => { const novasRefeicoes = [...plano.refeicoes]; novasRefeicoes[refIndex].itens[itemIndex][e.target.name] = e.target.value; setPlano(p => ({ ...p, refeicoes: novasRefeicoes })); };
    const handleSelectAlimento = (alimento) => { const novasRefeicoes = [...plano.refeicoes]; novasRefeicoes[currentRefIndex].itens.push({ alimento: alimento.description, quantidade: '1 porção', porcao: 100, base_kcal: alimento.kcal, base_protein: alimento.protein, base_carbs: alimento.carbohydrates, base_fats: alimento.lipids, }); setPlano(p => ({ ...p, refeicoes: novasRefeicoes })); setIsFoodModalOpen(false); };
    const adicionarRefeicao = () => setPlano(p => ({ ...p, refeicoes: [...p.refeicoes, { nome: '', horario: '', itens: [] }] }));
    const removerRefeicao = (index) => setPlano(p => ({ ...p, refeicoes: p.refeicoes.filter((_, i) => i !== index) }));
    const removerItem = (refIndex, itemIndex) => { const novasRefeicoes = [...plano.refeicoes]; novasRefeicoes[refIndex].itens.splice(itemIndex, 1); setPlano(p => ({ ...p, refeicoes: novasRefeicoes })); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const planoData = { ...plano, pacienteId, metas };
            await fetchApi('/api/nutri/planos/criar', { method: 'POST', body: JSON.stringify(planoData) });
            toast.success('Plano alimentar criado com sucesso!');
            navigate(`/prontuario/${pacienteId}`);
        } catch (error) { toast.error(error.message); } 
        finally { setLoading(false); }
    };

    if (!metas) {
        return <DefinirMetasModal onSave={handleSaveMetas} onClose={() => navigate(`/prontuario/${pacienteId}`)} />;
    }

    return (
        <div className="page-container">
            <Link to={`/prontuario/${pacienteId}`} className="back-link">‹ Voltar para o Prontuário</Link>
            <div className="page-header"><h1>Criar Plano Alimentar</h1></div>
            
            <div className="tab-buttons">
                <button className={`tab-btn ${activeTab === 'montagem' ? 'active' : ''}`} onClick={() => setActiveTab('montagem')}>Montagem do Plano</button>
                <button className={`tab-btn ${activeTab === 'analise' ? 'active' : ''}`} onClick={() => setActiveTab('analise')}>Análise Nutricional</button>
            </div>
            
            {activeTab === 'montagem' && (
                <div className="plano-alimentar-layout">
                    <div className="plano-form-coluna">
                        <form onSubmit={handleSubmit}>
                           <Card className="plano-card">
                                <div className="page-header-action" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                                    <div className="form-group" style={{ flexGrow: 1, margin: 0 }}>
                                        <label>Título do Plano</label>
                                        <input type="text" name="titulo" value={plano.titulo} onChange={handlePlanoChange} required />
                                    </div>
                                    <button type="button" className="template-btn" onClick={() => setIsTemplateModalOpen(true)}>Usar Template</button>
                                </div>

                                {plano.refeicoes.map((refeicao, refIndex) => (
                                    <Card key={refIndex} className="refeicao-card">
                                        <div className="refeicao-header"><input type="text" name="nome" value={refeicao.nome} onChange={(e) => handleRefeicaoChange(refIndex, e)} placeholder="Nome da Refeição" required /><input type="time" name="horario" value={refeicao.horario} onChange={(e) => handleRefeicaoChange(refIndex, e)} /><button type="button" onClick={() => removerRefeicao(refIndex)} className="remove-btn">×</button></div>
                                        {refeicao.itens.map((item, itemIndex) => (
                                            <div key={itemIndex} className="item-fields-nutri"><input className="alimento-nome" type="text" name="alimento" value={item.alimento} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} required /><input className="alimento-porcao" type="number" name="porcao" value={item.porcao} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} required /><span>g</span><input className="alimento-quantidade" type="text" name="quantidade" value={item.quantidade} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} placeholder="Medida caseira" required /><button type="button" onClick={() => removerItem(refIndex, itemIndex)} className="remove-btn">×</button></div>
                                        ))}
                                        <div className="add-item-actions">
                                            <button type="button" onClick={() => { setCurrentRefIndex(refIndex); setIsFoodModalOpen(true); }} className="add-item-btn">Buscar Alimento</button>
                                            <button type="button" onClick={() => { setCurrentRefIndex(refIndex); setIsReceitaModalOpen(true); }} className="add-item-btn">Adicionar Receita</button>
                                        </div>
                                    </Card>
                                ))}
                                
                                <button type="button" onClick={adicionarRefeicao} className="add-refeicao-btn">+ Adicionar Refeição</button>
                                <div className="form-group"><label>Observações Gerais</label><textarea name="observacoesGerais" value={plano.observacoesGerais} onChange={handlePlanoChange}></textarea></div>
                                <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'A guardar...' : 'Guardar Plano'}</button>
                            </Card>
                        </form>
                    </div>
                    <div className="plano-resumo-coluna">
                        {metas && <ResumoNutricional refeicoes={plano.refeicoes} metas={metas} />}
                    </div>
                </div>
            )}

            {activeTab === 'analise' && (
                 <Card>
                    {metas ? <AnalisePlanoTab refeicoes={plano.refeicoes} metas={metas} /> : <p>Defina as metas do plano para ver a análise.</p>}
                </Card>
            )}

            <Modal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)}><BuscaAlimentos onSelectAlimento={handleSelectAlimento} /></Modal>
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}>
                <h2>Escolher um Template de Plano</h2>
                {planoTemplates.length > 0 ? (<ul className="template-list">{planoTemplates.map(template => (<li key={template._id} onClick={() => handleUsePlanoTemplate(template)}>{template.templateName}</li>))}</ul>) : <p>Você ainda não guardou nenhum plano como template.</p>}
            </Modal>
            <Modal isOpen={isReceitaModalOpen} onClose={() => setIsReceitaModalOpen(false)}>
                <h2>Adicionar Receita à Refeição</h2>
                {receitas.length > 0 ? (<ul className="template-list">{receitas.map(receita => (<li key={receita._id} onClick={() => handleAddReceita(receita)}>{receita.nome}</li>))}</ul>) : <p>Você ainda não criou nenhuma receita.</p>}
            </Modal>
        </div>
    );
};

export default PlanoAlimentarPage;