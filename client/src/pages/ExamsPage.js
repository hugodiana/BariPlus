import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';

import './ExamsPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ExamsReport from '../components/ExamsReport';
import { fetchApi } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const predefinedExams = [
    { name: 'Vitamina B12', unit: 'pg/mL', refMin: 200, refMax: 900 },
    { name: 'Vitamina D', unit: 'ng/mL', refMin: 30, refMax: 100 },
    { name: 'Ferritina', unit: 'ng/mL', refMin: 30, refMax: 300 },
    { name: 'Hemoglobina Glicada (A1c)', unit: '%', refMin: 4.0, refMax: 5.6 },
    { name: 'Glicemia em Jejum', unit: 'mg/dL', refMin: 70, refMax: 99 },
    { name: 'Colesterol Total', unit: 'mg/dL', refMin: 0, refMax: 199 },
    { name: 'Triglicerídeos', unit: 'mg/dL', refMin: 0, refMax: 150 },
];

const getResultStatusClass = (value, refMin, refMax) => {
    if (refMin != null && value < refMin) return 'status-low';
    if (refMax != null && value > refMax) return 'status-high';
    return 'status-normal';
};

const DownloadExamsPDFButton = ({ usuario, examsData }) => {
    const [chartImages, setChartImages] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [shouldRenderChartsForPDF, setShouldRenderChartsForPDF] = useState(false);

    useEffect(() => {
        if (!shouldRenderChartsForPDF) return;
        const generateImages = async () => {
            const images = {};
            const examsWithCharts = examsData.examEntries.filter(exam => exam.history.length > 1);
            for (const exam of examsWithCharts) {
                const chartElement = document.getElementById(`pdf-chart-${exam._id}`);
                if (chartElement) {
                    try {
                        const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' });
                        images[exam._id] = canvas.toDataURL('image/png', 0.9);
                    } catch (error) { console.error("Erro ao gerar imagem:", error); }
                }
            }
            setChartImages(images);
            setIsGenerating(false);
            setShouldRenderChartsForPDF(false);
            toast.success("Gráficos prontos! Pode baixar o seu PDF.");
        };
        const timer = setTimeout(generateImages, 500); 
        return () => clearTimeout(timer);
    }, [shouldRenderChartsForPDF, examsData]);

    const handlePreparePDF = () => {
        setIsGenerating(true);
        toast.info("A preparar os gráficos para o relatório...");
        setShouldRenderChartsForPDF(true);
    };

    if (!usuario || !examsData?.examEntries || examsData.examEntries.length === 0) return null;

    return (
        <>
            {chartImages ? (
                <PDFDownloadLink
                    document={<ExamsReport usuario={usuario} examsData={examsData} chartImages={chartImages} />}
                    fileName={`Relatorio_Exames_${usuario.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                    className="pdf-link ready"
                >
                    {({ loading: pdfLoading }) => (pdfLoading ? 'A preparar PDF...' : 'Baixar PDF Agora')}
                </PDFDownloadLink>
            ) : (
                <button onClick={handlePreparePDF} className="pdf-link generate" disabled={isGenerating}>
                    {isGenerating ? 'A gerar gráficos...' : 'Exportar Relatório'}
                </button>
            )}
            <div className="pdf-chart-studio">
                {shouldRenderChartsForPDF && examsData.examEntries.map(exam =>
                    exam.history.length > 1 && (
                        <div key={exam._id} style={{ width: '500px', height: '300px' }} id={`pdf-chart-${exam._id}`}>
                            <Line data={{
                                labels: exam.history.map(h => format(parseISO(h.date), 'dd/MM/yy')),
                                datasets: [{ label: exam.name, data: exam.history.map(h => h.value), borderColor: '#007aff', backgroundColor: 'rgba(0, 122, 255, 0.1)', fill: true }]
                            }} options={{ animation: false, responsive: true }} />
                        </div>
                    )
                )}
            </div>
        </>
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

    const fetchExamsData = useCallback(async () => {
        setLoading(true);
        try {
            const [dataExams, dataMe] = await Promise.all([
                fetchApi('/api/exams'),
                fetchApi('/api/me')
            ]);
            setExamsData(dataExams);
            setUsuario(dataMe);
        } catch (error) { 
            toast.error(error.message); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { fetchExamsData(); }, [fetchExamsData]);

    const toggleAccordion = (examId) => {
        setActiveExamId(prevId => (prevId === examId ? null : examId));
    };
    
    const highlightedExams = useMemo(() => {
        if (!examsData.examEntries) return [];
        const keyExams = ['Vitamina D', 'Vitamina B12', 'Ferritina'];
        return keyExams.map(name => {
            const exam = examsData.examEntries.find(e => e.name === name);
            if (!exam || exam.history.length === 0) {
                return { name, latestResult: null };
            }
            const latestResult = [...exam.history].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            return { ...exam, latestResult };
        });
    }, [examsData]);

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
            
            <Card className="summary-highlights-card">
                {highlightedExams.map(exam => (
                    <div className="highlight-item" key={exam.name}>
                        <span className="highlight-label">{exam.name}</span>
                        {exam.latestResult ? (
                            <span className={`highlight-value ${getResultStatusClass(exam.latestResult.value, exam.refMin, exam.refMax)}`}>
                                <span className="status-indicator"></span>
                                {exam.latestResult.value} <small>{exam.unit}</small>
                            </span>
                        ) : (
                            <span className="highlight-value no-data">-</span>
                        )}
                    </div>
                ))}
            </Card>

            <button className="add-btn-main" onClick={() => setModalType('add_type')}>+ Adicionar Novo Tipo de Exame</button>

            {examsData.examEntries && examsData.examEntries.length > 0 ? (
                <div className="exams-accordion">
                    {examsData.examEntries.map(exam => (
                        <ExamEntry
                            key={exam._id}
                            exam={exam}
                            isActive={activeExamId === exam._id}
                            onToggle={() => toggleAccordion(exam._id)}
                            onAddResult={() => { setCurrentExamEntry(exam); setModalType('add_result'); }}
                            onEditResult={(result) => { setCurrentExamEntry(exam); setCurrentResult(result); setModalType('edit_result'); }}
                            onDataUpdate={fetchExamsData}
                        />
                    ))}
                </div>
            ) : (
                <Card><div className="empty-state"><span className="empty-icon">🧪</span><p>Nenhum exame adicionado. Comece por adicionar o seu primeiro!</p></div></Card>
            )}

            {modalType === 'add_type' && <AddExamTypeModal onClose={() => setModalType(null)} onSave={fetchExamsData} existingExams={examsData.examEntries} />}
            {modalType === 'add_result' && <AddEditResultModal onClose={() => setModalType(null)} onSave={fetchExamsData} examEntry={currentExamEntry} />}
            {modalType === 'edit_result' && <AddEditResultModal onClose={() => setModalType(null)} onSave={fetchExamsData} examEntry={currentExamEntry} resultToEdit={currentResult} />}
        </div>
    );
};

const ExamEntry = ({ exam, isActive, onToggle, onAddResult, onEditResult, onDataUpdate }) => {
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
    const latestResult = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;

    const handleDelete = async (resultId) => {
        if (!window.confirm("Tem certeza que quer apagar este resultado?")) return;
        try {
            await fetchApi(`/api/exams/result/${exam._id}/${resultId}`, { method: 'DELETE' }); // Simplificado
            toast.info("Resultado apagado.");
            onDataUpdate();
        } catch (error) { toast.error(error.message); }
    };

    return (
        <Card className={`exam-entry ${isActive ? 'active' : ''}`}>
            <div className="exam-header" onClick={onToggle}>
                <div className="exam-info">
                    <span className="exam-name">{exam.name} <small>({exam.unit})</small></span>
                    {latestResult && (
                        <span className={`exam-latest-result ${getResultStatusClass(latestResult.value, exam.refMin, exam.refMax)}`}>
                            <span className="status-indicator"></span>
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
                    <button className="add-result-btn" onClick={onAddResult}>+ Adicionar Resultado</button>
                    <div className="table-responsive">
                        <table>
                            <thead><tr><th>Data</th><th>Valor</th><th>Notas</th><th>Ações</th></tr></thead>
                            <tbody>
                                {sortedHistory.slice().reverse().map(result => (
                                    <tr key={result._id}>
                                        <td>{format(parseISO(result.date), 'dd/MM/yyyy')}</td>
                                        <td className={getResultStatusClass(result.value, exam.refMin, exam.refMax)}>
                                            <span className="status-indicator"></span>{result.value}
                                        </td>
                                        <td>{result.notes || '-'}</td>
                                        <td className="actions-cell">
                                            <button onClick={() => onEditResult(result)} className="action-btn edit-btn">✎</button>
                                            <button onClick={() => handleDelete(result._id)} className="action-btn delete-btn">×</button>
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

const AddExamTypeModal = ({ onClose, onSave, existingExams }) => {
    const [selectedPredefined, setSelectedPredefined] = useState('');
    const [customName, setCustomName] = useState('');
    const [customUnit, setCustomUnit] = useState('');
    const [refMin, setRefMin] = useState('');
    const [refMax, setRefMax] = useState('');

    const handlePredefinedChange = (e) => {
        const selectedName = e.target.value;
        setSelectedPredefined(selectedName);
        if (selectedName && selectedName !== 'custom') {
            const exam = predefinedExams.find(ex => ex.name === selectedName);
            if (exam) {
                setRefMin(exam.refMin ?? '');
                setRefMax(exam.refMax ?? '');
            }
        } else {
            setRefMin('');
            setRefMax('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const examData = selectedPredefined === 'custom' 
            ? { name: customName, unit: customUnit, refMin: parseFloat(refMin) || null, refMax: parseFloat(refMax) || null }
            : { ...predefinedExams.find(ex => ex.name === selectedPredefined), refMin: parseFloat(refMin) || null, refMax: parseFloat(refMax) || null };
        
        if (!examData || !examData.name || !examData.unit) return toast.error("Por favor, preencha os dados do exame.");
        if (existingExams.some(ex => ex.name.toLowerCase() === examData.name.toLowerCase())) return toast.warn("Este tipo de exame já foi adicionado.");

        try {
            await fetchApi('/api/exams/type', { // Simplificado
                method: 'POST',
                body: JSON.stringify(examData),
            });
            toast.success("Tipo de exame adicionado!");
            onSave();
            onClose();
        } catch (error) { toast.error("Erro ao adicionar exame."); }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>Adicionar Novo Tipo de Exame</h2>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>Selecione um exame ou crie um novo</label>
                    <select value={selectedPredefined} onChange={handlePredefinedChange}>
                        <option value="">-- Exames Comuns --</option>
                        {predefinedExams.map(ex => <option key={ex.name} value={ex.name}>{ex.name} ({ex.unit})</option>)}
                        <option value="custom">Outro (Personalizado)</option>
                    </select>
                </div>
                {selectedPredefined === 'custom' && (
                    <>
                        <div className="form-group"><label>Nome do Exame</label><input type="text" value={customName} onChange={e => setCustomName(e.target.value)} required /></div>
                        <div className="form-group"><label>Unidade de Medida</label><input type="text" value={customUnit} onChange={e => setCustomUnit(e.target.value)} required /></div>
                    </>
                )}
                <div className="form-row">
                    <div className="form-group"><label>Ref. Mínima</label><input type="number" step="any" value={refMin} onChange={e => setRefMin(e.target.value)} placeholder="(Opcional)" /></div>
                    <div className="form-group"><label>Ref. Máxima</label><input type="number" step="any" value={refMax} onChange={e => setRefMax(e.target.value)} placeholder="(Opcional)" /></div>
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="primary-btn">Adicionar</button>
                </div>
            </form>
        </Modal>
    );
};

const AddEditResultModal = ({ onClose, onSave, examEntry, resultToEdit }) => {
    const [date, setDate] = useState(resultToEdit ? format(parseISO(resultToEdit.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const [value, setValue] = useState(resultToEdit ? resultToEdit.value : '');
    const [notes, setNotes] = useState(resultToEdit ? resultToEdit.notes : '');
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultData = { date: new Date(date).toISOString(), value: parseFloat(value), notes };
        const isEditing = !!resultToEdit;
        const url = isEditing 
            ? `/api/exams/result/${examEntry._id}/${resultToEdit._id}`
            : `/api/exams/result/${examEntry._id}`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await fetchApi(url, { // Simplificado
                method: method,
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
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group"><label>Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
                <div className="form-group"><label>Valor ({examEntry.unit})</label><input type="number" step="any" value={value} onChange={e => setValue(e.target.value)} required /></div>
                <div className="form-group"><label>Notas (opcional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)}></textarea></div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="primary-btn">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default ExamsPage;