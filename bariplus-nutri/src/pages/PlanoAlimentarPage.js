// src/pages/PlanoAlimentarPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import './PlanoAlimentarPage.css';

const PlanoAlimentarPage = () => {
    const { pacienteId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [plano, setPlano] = useState({
        titulo: '',
        observacoesGerais: '',
        refeicoes: [
            { nome: 'Café da Manhã', horario: '08:00', itens: [{ alimento: '', quantidade: '' }] }
        ]
    });

    const fetchTemplates = useCallback(async () => {
        try {
            const data = await fetchApi('/api/nutri/planos/templates');
            setTemplates(data);
        } catch (error) {
            toast.error("Erro ao carregar os templates.");
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleUseTemplate = (template) => {
        setPlano({
            titulo: template.titulo,
            observacoesGerais: template.observacoesGerais,
            refeicoes: template.refeicoes.map(r => ({
                ...r,
                itens: r.itens.map(i => ({...i})) // Garante cópias profundas
            }))
        });
        setIsTemplateModalOpen(false);
        toast.info(`Template "${template.templateName}" carregado!`);
    };

    const handlePlanoChange = (e) => {
        const { name, value } = e.target;
        setPlano(prev => ({ ...prev, [name]: value }));
    };

    const handleRefeicaoChange = (index, e) => {
        const { name, value } = e.target;
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[index][name] = value;
        setPlano(prev => ({ ...prev, refeicoes: novasRefeicoes }));
    };

    const handleItemChange = (refIndex, itemIndex, e) => {
        const { name, value } = e.target;
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[refIndex].itens[itemIndex][name] = value;
        setPlano(prev => ({ ...prev, refeicoes: novasRefeicoes }));
    };

    const adicionarRefeicao = () => {
        setPlano(prev => ({
            ...prev,
            refeicoes: [...prev.refeicoes, { nome: '', horario: '', itens: [{ alimento: '', quantidade: '' }] }]
        }));
    };

    const removerRefeicao = (index) => {
        const novasRefeicoes = plano.refeicoes.filter((_, i) => i !== index);
        setPlano(prev => ({ ...prev, refeicoes: novasRefeicoes }));
    };
    
    const adicionarItem = (refIndex) => {
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[refIndex].itens.push({ alimento: '', quantidade: '' });
        setPlano(prev => ({ ...prev, refeicoes: novasRefeicoes }));
    };

    const removerItem = (refIndex, itemIndex) => {
        const novasRefeicoes = [...plano.refeicoes];
        novasRefeicoes[refIndex].itens = novasRefeicoes[refIndex].itens.filter((_, i) => i !== itemIndex);
        setPlano(prev => ({ ...prev, refeicoes: novasRefeicoes }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const planoData = { ...plano, pacienteId };
            await fetchApi('/api/nutri/planos/criar', {
                method: 'POST',
                body: JSON.stringify(planoData)
            });
            toast.success('Plano alimentar criado com sucesso!');
            navigate(`/paciente/${pacienteId}`);
        } catch (error) {
            toast.error(error.message || 'Erro ao criar o plano.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <Link to={`/paciente/${pacienteId}`} className="back-link">‹ Voltar para o Paciente</Link>
            <div className="page-header-action">
                <h1>Criar Novo Plano Alimentar</h1>
                <button type="button" className="template-btn" onClick={() => setIsTemplateModalOpen(true)}>
                    Usar Template
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                <Card className="plano-card">
                    {/* ... O resto do seu formulário permanece igual ... */}
                    <div className="form-group">
                        <label>Título do Plano</label>
                        <input type="text" name="titulo" value={plano.titulo} onChange={handlePlanoChange} placeholder="Ex: Plano de Adaptação - Semana 1" required />
                    </div>

                    {plano.refeicoes.map((refeicao, refIndex) => (
                        <Card key={refIndex} className="refeicao-card">
                            <div className="refeicao-header">
                                <input type="text" name="nome" value={refeicao.nome} onChange={(e) => handleRefeicaoChange(refIndex, e)} placeholder="Nome da Refeição" required />
                                <input type="time" name="horario" value={refeicao.horario} onChange={(e) => handleRefeicaoChange(refIndex, e)} />
                                <button type="button" onClick={() => removerRefeicao(refIndex)} className="remove-btn">×</button>
                            </div>
                            {refeicao.itens.map((item, itemIndex) => (
                                <div key={itemIndex} className="item-fields">
                                    <input type="text" name="alimento" value={item.alimento} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} placeholder="Alimento (ex: Ovo cozido)" required />
                                    <input type="text" name="quantidade" value={item.quantidade} onChange={(e) => handleItemChange(refIndex, itemIndex, e)} placeholder="Quantidade (ex: 1 unidade)" required />
                                    <button type="button" onClick={() => removerItem(refIndex, itemIndex)} className="remove-btn">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => adicionarItem(refIndex)} className="add-item-btn">+ Adicionar Alimento</button>
                        </Card>
                    ))}
                    
                    <button type="button" onClick={adicionarRefeicao} className="add-refeicao-btn">+ Adicionar Refeição</button>

                    <div className="form-group">
                        <label>Observações Gerais</label>
                        <textarea name="observacoesGerais" value={plano.observacoesGerais} onChange={handlePlanoChange} placeholder="Instruções gerais para o paciente..."></textarea>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'A guardar...' : 'Guardar Plano Alimentar'}
                    </button>
                </Card>
            </form>

            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}>
                <h2>Escolher um Template</h2>
                {templates.length > 0 ? (
                    <ul className="template-list">
                        {templates.map(template => (
                            <li key={template._id} onClick={() => handleUseTemplate(template)}>
                                {template.templateName}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Você ainda não tem nenhum template guardado.</p>
                )}
            </Modal>
        </div>
    );
};

export default PlanoAlimentarPage;