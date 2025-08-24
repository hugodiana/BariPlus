const User = require('../models/User');
const Peso = require('../models/Peso');
const Checklist = require('../models/Checklist');
const DailyLog = require('../models/DailyLog');
const Consulta = require('../models/Consulta');
const Exams = require('../models/Exam');
// ✅ CORREÇÃO: A função 'format' que faltava foi importada aqui
const { subDays, isSameDay, format } = require('date-fns');

const todasAsConquistas = [
    // Conquistas de Início
    { idConquista: 'CADASTRO_COMPLETO', nome: 'Primeiro Passo', icone: '🚀', descricao: 'Completou o seu cadastro inicial.' },
    { idConquista: 'PRIMEIRO_REGISTRO_PESO', nome: 'Começo da Jornada', icone: '👣', descricao: 'Você registou o seu primeiro peso.' },
    
    // Conquistas de Perda de Peso (Expandido)
    { idConquista: 'PERDEU_5KG', nome: 'Guerreiro dos 5kg', icone: '⚖️', descricao: 'Você perdeu os seus primeiros 5 quilos!' },
    { idConquista: 'PERDEU_10KG', nome: 'Guerreiro dos 10kg', icone: '🔥', descricao: 'Você perdeu 10 quilos! Continue assim!' },
    { idConquista: 'PERDEU_15KG', nome: 'Guerreiro dos 15kg', icone: '💪', descricao: 'Uau! 15 quilos a menos na sua jornada!' },
    { idConquista: 'PERDEU_20KG', nome: 'Guerreiro dos 20kg', icone: '💥', descricao: 'Incrível! Você já eliminou 20 quilos!' },
    { idConquista: 'PERDEU_25KG', nome: 'Guerreiro dos 25kg', icone: '🌟', descricao: 'Fantástico! 25 quilos de pura determinação!' },
    { idConquista: 'PERDEU_30KG', nome: 'Guerreiro dos 30kg', icone: '🏆', descricao: 'Parabéns! Você alcançou a marca de 30 quilos perdidos!' },
    
    // Conquistas de Engajamento e Consistência
    { idConquista: 'PRIMEIRA_FOTO', nome: 'Para a Posteridade', icone: '📸', descricao: 'Adicionou a sua primeira foto de progresso.' },
    { idConquista: 'PRIMEIRA_CONSULTA', nome: 'Compromisso Marcado', icone: '🗓️', descricao: 'Agendou a sua primeira consulta no app.' },
    { idConquista: 'PRIMEIRO_EXAME', nome: 'Foco na Saúde', icone: '⚕️', descricao: 'Registou o seu primeiro resultado de exame.' },
    { idConquista: 'CHECKLIST_PREOP_100', nome: 'Tudo Pronto!', icone: '✅', descricao: 'Você completou todas as tarefas do pré-operatório!' },
    { idConquista: 'PRIMEIRA_META_AGUA', nome: 'Super Hidratado', icone: '💧', descricao: 'Você bateu a sua meta diária de água pela primeira vez!' },
    { idConquista: 'PRIMEIRA_META_PROTEINA', nome: 'Força Total', icone: '💪', descricao: 'Você bateu a sua meta diária de proteína pela primeira vez!' },
    { idConquista: 'CONSISTENCIA_7_DIAS_PESO', nome: 'Ritmo Certo', icone: '📅', descricao: 'Você registou o seu peso por 7 dias seguidos!' },
];

const verificarConsistenciaPeso = (registros) => {
    if (registros.length < 7) return false;
    
    const hoje = new Date();
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => format(subDays(hoje, i), 'yyyy-MM-dd'));
    
    const datasDosRegistros = registros.map(r => format(new Date(r.data), 'yyyy-MM-dd'));

    return ultimos7Dias.every(dia => datasDosRegistros.some(dataRegistro => dataRegistro === dia));
};

exports.verificarConquistas = async (userId) => {
    const usuario = await User.findById(userId);
    if (!usuario) return [];

    const [historicoPeso, checklist, dailyLogs, consultas, exames] = await Promise.all([
        Peso.findOne({ userId }),
        Checklist.findOne({ userId }),
        DailyLog.find({ userId }).sort({ date: -1 }).limit(7),
        Consulta.findOne({ userId }),
        Exams.findOne({ userId })
    ]);

    const novasConquistasDesbloqueadas = [];
    const conquistasAtuais = usuario.conquistas || [];

    const adicionarConquista = (id) => {
        if (!conquistasAtuais.includes(id)) {
            novasConquistasDesbloqueadas.push(id);
        }
    };

    if (usuario.onboardingCompleto) adicionarConquista('CADASTRO_COMPLETO');
    
    if (historicoPeso?.registros.length > 0) {
        adicionarConquista('PRIMEIRO_REGISTRO_PESO');
        if (historicoPeso.registros.some(r => r.fotoUrl)) {
            adicionarConquista('PRIMEIRA_FOTO');
        }
        if (verificarConsistenciaPeso(historicoPeso.registros)) {
            adicionarConquista('CONSISTENCIA_7_DIAS_PESO');
        }
    }

    if (usuario.detalhesCirurgia?.pesoInicial && usuario.detalhesCirurgia?.pesoAtual) {
        const pesoPerdido = usuario.detalhesCirurgia.pesoInicial - usuario.detalhesCirurgia.pesoAtual;
        if (pesoPerdido >= 5) adicionarConquista('PERDEU_5KG');
        if (pesoPerdido >= 10) adicionarConquista('PERDEU_10KG');
        if (pesoPerdido >= 15) adicionarConquista('PERDEU_15KG');
        if (pesoPerdido >= 20) adicionarConquista('PERDEU_20KG');
        if (pesoPerdido >= 25) adicionarConquista('PERDEU_25KG');
        if (pesoPerdido >= 30) adicionarConquista('PERDEU_30KG');
    }
    
    if (checklist?.preOp.length > 0 && checklist.preOp.every(task => task.concluido)) {
        adicionarConquista('CHECKLIST_PREOP_100');
    }
    
    if (dailyLogs && dailyLogs.length > 0) {
        const logDeHoje = dailyLogs.find(log => isSameDay(new Date(log.date), new Date()));
        if (logDeHoje) {
            if (logDeHoje.waterConsumed >= (usuario.metaAguaDiaria || 2000)) adicionarConquista('PRIMEIRA_META_AGUA');
            if (logDeHoje.proteinConsumed >= (usuario.metaProteinaDiaria || 60)) adicionarConquista('PRIMEIRA_META_PROTEINA');
        }
    }

    if (consultas?.consultas.length > 0) adicionarConquista('PRIMEIRA_CONSULTA');
    if (exames?.examEntries.some(e => e.history.length > 0)) adicionarConquista('PRIMEIRO_EXAME');


    if (novasConquistasDesbloqueadas.length > 0) {
        usuario.conquistas.push(...novasConquistasDesbloqueadas);
        await usuario.save();
    }
    
    return todasAsConquistas.filter(c => novasConquistasDesbloqueadas.includes(c.idConquista));
};

exports.getTodasAsConquistas = () => {
    return todasAsConquistas;
};