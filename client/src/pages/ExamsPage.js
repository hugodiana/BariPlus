import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';

import './ExamsPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ExamsReport from '../components/ExamsReport';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const predefinedExams = [
    { name: 'Vitamina B12', unit: 'pg/mL' },
    { name: 'Vitamina D', unit: 'ng/mL' },
    { name: 'Ferritina', unit: 'ng/mL' },
    { name: 'Hemoglobina Glicada (A1c)', unit: '%' },
    { name: 'Glicemia em Jejum', unit: 'mg/dL' },
    { name: 'Colesterol Total', unit: 'mg/dL' },
    { name: 'Triglicerídeos', unit: 'mg/dL' },
];

const DownloadExamsPDFButton = ({ usuario, examsData }) => {
    const [chartImages, setChartImages] = useState({});
    const [loading, setLoading] = useState(false);

    const generateAllChartImages = async () => {
        setLoading(true);
        const images = {};
        const examsWithCharts = examsData.examEntries.filter(exam => exam.history.length > 1);
        
        for (const exam of examsWithCharts) {
            const chartElement = document.getElementById(`exam-chart-${exam._id}`);
            if (chartElement) {
                try {
                    const canvas = await html2canvas(chartElement, { backgroundColor: null });
                    images[exam._id] = canvas.toDataURL('image/png');
                } catch (error) {
                    console.error("Erro ao gerar imagem do gráfico:", error);
                    toast.error(`Falha ao gerar gráfico para ${exam.name}`);
                }
            }
        }
        setChartImages(images);
        setLoading(false);
    };

    if (!usuario || examsData.examEntries.length === 0) return null;

    const allChartsGenerated = Object.keys(chartImages).length === examsData.examEntries.filter(e => e.history.length > 1).length;
    
    return (
        <div className="pdf-link-container">
            {allChartsGenerated ? (
                <PDFDownloadLink
                    document={<ExamsReport usuario={usuario} examsData={examsData} chartImages={chartImages} />}
                    fileName={`Relatorio_Exames_${usuario.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                    className="pdf-link ready"
                >
                    {({ loading: pdfLoading }) => (pdfLoading ? 'A preparar PDF...' : 'Baixar PDF Agora')}
                </PDFDownloadLink>
            ) : (
                <button onClick={generateAllChartImages} className="pdf-link generate" disabled={loading}>
                    {loading ? 'A gerar gráficos...' : 'Exportar Relatório'}
                </button>
            )}
        </div>
    );
};


const ExamsPage = () => {
    const [examsData, setExamsData] = useState({ examEntries: [] });
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeExamId, setActiveExamId] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [currentExamEntry, setCurrentExamEntry] = useState(null);
    const [currentResult, setCurrentResult] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchExamsData = useCallback(async () => {
        setLoading(true);
        try {
            const [resExams, resMe] = await Promise.all([
                fetch(`${apiUrl}/api/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!resExams.ok || !resMe.ok) throw new Error("Falha ao carregar dados.");
            
            const dataExams = await resExams.json();
            const dataMe = await resMe.json();
            
            setExamsData(dataExams);
            setUsuario(dataMe);
        } catch (error) { 
            toast.error(error.message); 
        } finally { 
            setLoading(false); 
        }
    }, [token, apiUrl]);

    useEffect(() => { 
        fetchExamsData(); 
    }, [fetchExamsData]);

    const toggleAccordion = (examId) => {
        setActiveExamId(prevId => (prevId === examId ? null : examId));
    };

    if (loading || !usuario) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header">
                    <h1>Meus Exames</h1>
                    <p>Acompanhe a evolução dos seus exames laboratoriais.</p>
                </div>
                <DownloadExamsPDFButton usuario={usuario} examsData={examsData} />
            </div>
            
            <button className="add-btn-main" onClick={() => setModalType('add_type')}>+ Adicionar Tipo de Exame</button>

            {examsData.examEntries.length > 0 ? (
                <div className="exams-accordion">
                    {examsData.examEntries.map(exam => (
                        <ExamEntry
                            key={exam._id}
                            exam={exam}
                            isActive={activeExamId === exam._id}
                            onToggle={() => toggleAccordion(exam._id)}
                            onAddResult={() => { setCurrentExamEntry(exam); setModalType('add_result'); }}
                            onEditResult={(result) => { setCurrentExamEntry(exam); setCurrentResult(result); setModalType('edit_result'); }}
                            onDeleteResult={fetchExamsData}
                        />
                    ))}
                </div>
            ) : (
                <Card><p style={{textAlign: 'center'}}>Nenhum tipo de exame adicionado. Comece por adicionar o seu primeiro!</p></Card>
            )}

            {modalType === 'add_type' && <AddExamTypeModal onClose={() => setModalType(null)} onSave={fetchExamsData} />}
            {modalType === 'add_result' && <AddEditResultModal onClose={() => setModalType(null)} onSave={fetchExamsData} examEntry={currentExamEntry} />}
            {modalType === 'edit_result' && <AddEditResultModal onClose={() => setModalType(null)} onSave={fetchExamsData} examEntry={currentExamEntry} resultToEdit={currentResult} />}
        </div>
    );
};

const ExamEntry = ({ exam, isActive, onToggle, onAddResult, onEditResult, onDeleteResult }) => {
    const sortedHistory = useMemo(() => 
        [...exam.history].sort((a, b) => new Date(a.date) - new Date(b.date)), 
    [exam.history]);

    const chartData = {
        labels: sortedHistory.map(h => format(parseISO(h.date), 'dd/MM/yy')),
        datasets: [{
            label: exam.name,
            data: sortedHistory.map(h => h.value),
            borderColor: '#007aff',
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
            fill: true,
            tension: 0.3
        }]
    };
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
    const latestResult = sortedHistory[sortedHistory.length - 1];

    const handleDelete = async (resultId) => {
        if (!window.confirm("Tem certeza que quer apagar este resultado?")) return;
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;
        try {
            await fetch(`${apiUrl}/api/exams/result/${exam._id}/${resultId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.info("Resultado apagado.");
            onDeleteResult();
        } catch (error) { toast.error("Erro ao apagar resultado."); }
    };

    return (
        <Card className={`exam-entry ${isActive ? 'active' : ''}`}>
            <div className="exam-header" onClick={onToggle}>
                <div className="exam-info">
                    <span className="exam-name">{exam.name} ({exam.unit})</span>
                    {latestResult && (
                        <span className="exam-latest-result">
                            Último: <strong>{latestResult.value}</strong> em {format(parseISO(latestResult.date), 'dd/MM/yyyy')}
                        </span>
                    )}
                </div>
                <span className="accordion-icon">{isActive ? '−' : '+'}</span>
            </div>
            {isActive && (
                <div className="exam-content">
                    {sortedHistory.length > 1 && (
                        <div className="exam-chart-container" id={`exam-chart-${exam._id}`}>
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    )}
                    <button className="add-result-btn" onClick={onAddResult}>+ Adicionar Novo Resultado</button>
                    <div className="table-responsive">
                        <table>
                            <thead><tr><th>Data</th><th>Valor ({exam.unit})</th><th>Notas</th><th>Ações</th></tr></thead>
                            <tbody>
                                {sortedHistory.slice().reverse().map(result => (
                                    <tr key={result._id}>
                                        <td>{format(parseISO(result.date), 'dd/MM/yyyy')}</td>
                                        <td>{result.value}</td>
                                        <td>{result.notes || '-'}</td>
                                        <td className="actions">
                                            <button onClick={() => onEditResult(result)} className="action-btn">✎</button>
                                            <button onClick={() => handleDelete(result._id)} className="action-btn">×</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Card>
    );
};

const AddExamTypeModal = ({ onClose, onSave }) => {
    const [selectedPredefined, setSelectedPredefined] = useState('');
    const [customName, setCustomName] = useState('');
    const [customUnit, setCustomUnit] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const examToAdd = selectedPredefined === 'custom' 
            ? { name: customName, unit: customUnit }
            : predefinedExams.find(ex => ex.name === selectedPredefined);
        
        if (!examToAdd || !examToAdd.name || !examToAdd.unit) {
            return toast.error("Por favor, preencha todos os campos.");
        }

        try {
            await fetch(`${apiUrl}/api/exams/type`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(examToAdd),
            });
            toast.success("Tipo de exame adicionado!");
            onSave();
            onClose();
        } catch (error) { toast.error("Erro ao adicionar exame."); }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Adicionar Novo Tipo de Exame</h2>
            <form onSubmit={handleSubmit}>
                <label>Selecione um exame da lista ou crie um novo</label>
                <select value={selectedPredefined} onChange={(e) => setSelectedPredefined(e.target.value)}>
                    <option value="">-- Exames Comuns --</option>
                    {predefinedExams.map(ex => <option key={ex.name} value={ex.name}>{ex.name} ({ex.unit})</option>)}
                    <option value="custom">Outro (Personalizado)</option>
                </select>
                {selectedPredefined === 'custom' && (
                    <>
                        <label>Nome do Exame Personalizado</label>
                        <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} required />
                        <label>Unidade de Medida</label>
                        <input type="text" value={customUnit} onChange={e => setCustomUnit(e.target.value)} required />
                    </>
                )}
                <button type="submit">Adicionar à Minha Lista</button>
            </form>
        </Modal>
    );
};

const AddEditResultModal = ({ onClose, onSave, examEntry, resultToEdit }) => {
    const [date, setDate] = useState(resultToEdit ? format(parseISO(resultToEdit.date), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]);
    const [value, setValue] = useState(resultToEdit ? resultToEdit.value : '');
    const [notes, setNotes] = useState(resultToEdit ? resultToEdit.notes : '');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultData = { date, value: parseFloat(value), notes };
        const isEditing = !!resultToEdit;
        const url = isEditing 
            ? `${apiUrl}/api/exams/result/${examEntry._id}/${resultToEdit._id}`
            : `${apiUrl}/api/exams/result/${examEntry._id}`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(resultData),
            });
            toast.success(`Resultado ${isEditing ? 'atualizado' : 'adicionado'}!`);
            onSave();
            onClose();
        } catch (error) { toast.error("Erro ao salvar resultado."); }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>{resultToEdit ? 'Editar' : 'Adicionar'} Resultado de {examEntry.name}</h2>
            <form onSubmit={handleSubmit}>
                <label>Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                <label>Valor ({examEntry.unit})</label>
                <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)} required />
                <label>Notas (opcional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                <button type="submit">Salvar Resultado</button>
            </form>
        </Modal>
    );
};

export default ExamsPage;