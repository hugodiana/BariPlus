import React, { useState, useEffect, useMemo } from 'react';
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
    
    // Estados para o modal de busca
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [tipoRefeicaoAtual, setTipoRefeicaoAtual] = useState('');
    const [termoBusca, setTermoBusca] = useState('');
    const [resultadosBusca, setResultadosBusca] = useState([]);
    const [loadingBusca, setLoadingBusca] = useState(false);

    // NOVIDADE: Cesta de alimentos para adicionar múltiplos de uma vez
    const [cestaDeAlimentos, setCestaDeAlimentos] = useState([]);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchDiario = async () => {
        setLoading(true);
        const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
        try {
            const res = await fetch(`${apiUrl}/api/diario/${dataFormatada}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setDiarioDoDia(data);
        } catch (error) { console.error("Erro ao buscar diário:", error); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (token) { fetchDiario(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSelecionada]);

    useEffect(() => {
        if (termoBusca.length < 3) {
            setResultadosBusca([]);
            return;
        }
        const handler = setTimeout(async () => {
            setLoadingBusca(true);
            const urlBusca = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${termoBusca}&search_simple=1&action=process&json=1&page_size=20`;
            try {
                const response = await fetch(urlBusca);
                const data = await response.json();
                setResultadosBusca(data.products || []);
            } catch (error) { console.error("Erro ao buscar alimentos:", error); } 
            finally { setLoadingBusca(false); }
        }, 500);
        return () => clearTimeout(handler);
    }, [termoBusca]);

    const handleOpenFoodModal = (tipoRefeicao) => {
        setTipoRefeicaoAtual(tipoRefeicao);
        setTermoBusca('');
        setResultadosBusca([]);
        setCestaDeAlimentos([]); // Limpa a cesta sempre que abrir o modal
        setIsFoodModalOpen(true);
    };
    
    const handleAddAlimentoNaCesta = (alimento) => {
        // Adiciona um campo de quantidade padrão
        const novoItemNaCesta = { ...alimento, quantidade: '100g' };
        setCestaDeAlimentos(prev => [...prev, novoItemNaCesta]);
    };
    
    const handleUpdateQuantidadeNaCesta = (index, novaQuantidade) => {
        const novaCesta = [...cestaDeAlimentos];
        novaCesta[index].quantidade = novaQuantidade;
        setCestaDeAlimentos(novaCesta);
    };

    const handleSaveCesta = async () => {
        if (cestaDeAlimentos.length === 0) return;

        const alimentosParaSalvar = cestaDeAlimentos.map(alimento => ({
            nome: alimento.product_name_pt || alimento.product_name,
            quantidade: alimento.quantidade,
            calorias: alimento.nutriments?.['energy-kcal_100g'] || 0,
            proteinas: alimento.nutriments?.proteins_100g || 0,
        }));

        const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');

        try {
            await fetch(`${apiUrl}/api/diario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    date: dataFormatada,
                    tipoRefeicao: tipoRefeicaoAtual,
                    alimentos: alimentosParaSalvar,
                }),
            });
            setIsFoodModalOpen(false);
            fetchDiario();
        } catch (error) {
            console.error("Erro ao salvar alimentos:", error);
        }
    };

    const handleDeleteAlimento = async (tipoRefeicao, alimentoId) => {
        if (!window.confirm("Tem certeza que quer apagar este alimento?")) return;
        const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
        try {
            await fetch(`${apiUrl}/api/diario/${dataFormatada}/${tipoRefeicao}/${alimentoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchDiario();
        } catch (error) {
            console.error("Erro ao apagar alimento:", error);
        }
    };

    const totaisDoDia = useMemo(() => {
        const totais = { calorias: 0, proteinas: 0 };
        if (!diarioDoDia?.refeicoes) return totais;
        for (const tipo of Object.keys(diarioDoDia.refeicoes)) {
            if(Array.isArray(diarioDoDia.refeicoes[tipo])) {
                diarioDoDia.refeicoes[tipo].forEach(alimento => {
                    totais.calorias += alimento.calorias || 0;
                    totais.proteinas += alimento.proteinas || 0;
                });
            }
        }
        return totais;
    }, [diarioDoDia]);

    const RefeicaoCard = ({ titulo, alimentos, tipo }) => (
        <div className="refeicao-card">
            <div className="refeicao-header">
                <h3>{titulo}</h3>
                <button className="add-alimento-btn" onClick={() => handleOpenFoodModal(tipo)}>+ Adicionar</button>
            </div>
            <div className="alimentos-list">
                {alimentos && alimentos.length > 0 ? (
                    alimentos.map(alimento => (
                        <div key={alimento._id} className="alimento-item">
                            <span>{alimento.nome} ({alimento.quantidade})</span>
                            <div className="alimento-info-direita">
                                <span>{alimento.proteinas ? alimento.proteinas.toFixed(1) : '0.0'}g Prot.</span>
                                <button onClick={() => handleDeleteAlimento(tipo, alimento._id)} className="delete-alimento-btn">×</button>
                            </div>
                        </div>
                    ))
                ) : <p className="alimento-empty">Nenhum alimento registrado.</p>}
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
                    <DayPicker mode="single" selected={dataSelecionada} onSelect={setDataSelecionada} locale={ptBR} showOutsideDays />
                </div>
                <div className="diario-refeicoes">
                    <h2>Refeições de {format(dataSelecionada, 'dd/MM/yyyy')}</h2>
                    <div className="progresso-card resumo-nutricional-card">
                        <h3>Resumo do Dia</h3>
                        <div className="resumo-stats">
                            <div className="resumo-stat-item"><span>Calorias</span><strong>{totaisDoDia.calorias.toFixed(0)} kcal</strong></div>
                            <div className="resumo-stat-item"><span>Proteínas</span><strong>{totaisDoDia.proteinas.toFixed(1)} g</strong></div>
                        </div>
                    </div>
                    <div className="refeicoes-grid">
                        <RefeicaoCard titulo="Café da Manhã" alimentos={diarioDoDia?.refeicoes.cafeDaManha} tipo="cafeDaManha" />
                        <RefeicaoCard titulo="Almoço" alimentos={diarioDoDia?.refeicoes.almoco} tipo="almoco" />
                        <RefeicaoCard titulo="Jantar" alimentos={diarioDoDia?.refeicoes.jantar} tipo="jantar" />
                        <RefeicaoCard titulo="Lanches" alimentos={diarioDoDia?.refeicoes.lanches} tipo="lanches" />
                    </div>
                </div>
            </div>
            <Modal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)}>
                <h2>Buscar e Adicionar Alimentos</h2>
                <div className="food-search-form"><input type="text" placeholder="Digite para buscar..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} autoFocus /></div>
                
                <div className="cesta-container">
                    <h3>Cesta ({cestaDeAlimentos.length})</h3>
                    {cestaDeAlimentos.length === 0 && <p className="cesta-empty">Selecione os alimentos da busca abaixo para adicioná-los à sua cesta.</p>}
                    {cestaDeAlimentos.map((item, index) => (
                        <div key={item.code} className="cesta-item">
                            <span>{item.product_name_pt || item.product_name}</span>
                            <input type="text" value={item.quantidade} onChange={(e) => handleUpdateQuantidadeNaCesta(index, e.target.value)} className="quantidade-input"/>
                        </div>
                    ))}
                    {cestaDeAlimentos.length > 0 && <button className="submit-button" onClick={handleSaveCesta}>Adicionar {cestaDeAlimentos.length} Itens à Refeição</button>}
                </div>
                
                <div className="search-results">
                    {loadingBusca && <p>Buscando...</p>}
                    <ul>
                        {resultadosBusca.map(alimento => (
                            <li key={alimento.code} onClick={() => handleAddAlimentoNaCesta(alimento)}>
                                <img src={alimento.image_small_url || '/placeholder-image.png'} alt={alimento.product_name_pt || alimento.product_name} />
                                <div className="result-info"><strong>{alimento.product_name_pt || alimento.product_name}</strong><span>{alimento.brands || 'Marca não informada'}</span></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Modal>
        </div>
    );
};
export default DiarioPage;