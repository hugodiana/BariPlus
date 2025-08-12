const User = require('../models/userModel');
const Peso = require('../models/pesoModel');
const Checklist = require('../models/checklistModel');
const DailyLog = require('../models/dailyLogModel');
const { subDays, format } = require('date-fns');

const todasAsConquistas = [
    // Conquistas Existentes
    { idConquista: 'CADASTRO_COMPLETO', nome: 'Primeiro Passo', icone: '🚀', descricao: 'Completou o seu cadastro inicial.' },
    { idConquista: 'PRIMEIRO_REGISTRO_PESO', nome: 'Começo da Jornada', icone: '👣', descricao: 'Você registou o seu primeiro peso.' },
    { idConquista: 'PERDEU_5KG', nome: 'Guerreiro dos 5kg', icone: '⚖️', descricao: 'Você perdeu os seus primeiros 5 quilos!' },
    { idConquista: 'PERDEU_10KG', nome: 'Guerreiro dos 10kg', icone: '🔥', descricao: 'Você perdeu 10 quilos! Continue assim!' },
    
    // ✅ NOVAS CONQUISTAS
    { idConquista: 'CHECKLIST_PREOP_100', nome: 'Tudo Pronto!', icone: '✅', descricao: 'Você completou todas as tarefas do pré-operatório!' },
    { idConquista: 'PRIMEIRA_META_AGUA', nome: 'Super Hidratado', icone: '💧', descricao: 'Você bateu a sua meta diária de água pela primeira vez!' },
    { idConquista: 'PRIMEIRA_META_PROTEINA', nome: 'Força Total', icone: '💪', descricao: 'Você bateu a sua meta diária de proteína pela primeira vez!' },
    { idConquista: 'CONSISTENCIA_7_DIAS', nome: 'Hábito Criado', icone: '📅', descricao: 'Você registou as suas metas por 7 dias seguidos!' },
];

exports.verificarConquistas = async (userId) => {
    const usuario = await User.findById(userId);
    if (!usuario) return [];

    const [historicoPeso, checklist, dailyLogs] = await Promise.all([
        Peso.findOne({ userId }),
        Checklist.findOne({ userId }),
        DailyLog.find({ userId }).sort({ date: -1 }).limit(7) // Busca os últimos 7 logs
    ]);

    const novasConquistasDesbloqueadas = [];
    const conquistasAtuais = usuario.conquistas || [];

    // --- Lógica de Conquistas de Onboarding e Peso (já existente) ---
    if (usuario.onboardingCompleto && !conquistasAtuais.includes('CADASTRO_COMPLETO')) novasConquistasDesbloqueadas.push('CADASTRO_COMPLETO');
    if (historicoPeso?.registros.length > 0 && !conquistasAtuais.includes('PRIMEIRO_REGISTRO_PESO')) novasConquistasDesbloqueadas.push('PRIMEIRO_REGISTRO_PESO');
    if (usuario.detalhesCirurgia?.pesoInicial && usuario.detalhesCirurgia?.pesoAtual) {
        const pesoPerdido = usuario.detalhesCirurgia.pesoInicial - usuario.detalhesCirurgia.pesoAtual;
        if (pesoPerdido >= 5 && !conquistasAtuais.includes('PERDEU_5KG')) novasConquistasDesbloqueadas.push('PERDEU_5KG');
        if (pesoPerdido >= 10 && !conquistasAtuais.includes('PERDEU_10KG')) novasConquistasDesbloqueadas.push('PERDEU_10KG');
    }

    // ✅ NOVA LÓGICA: Conquistas de Checklist
    if (checklist?.preOp.length > 0 && checklist.preOp.every(task => task.concluido) && !conquistasAtuais.includes('CHECKLIST_PREOP_100')) {
        novasConquistasDesbloqueadas.push('CHECKLIST_PREOP_100');
    }
    
    // ✅ NOVA LÓGICA: Conquistas de Metas Diárias
    if (dailyLogs && dailyLogs.length > 0) {
        const logDeHoje = dailyLogs[0];
        // ✅ CORREÇÃO: Usa as metas do perfil do usuário em vez de valores fixos
        const metaAgua = usuario.metaAguaDiaria || 2000;
        const metaProteina = usuario.metaProteinaDiaria || 60;

        if (logDeHoje.waterConsumed >= metaAgua && !conquistasAtuais.includes('PRIMEIRA_META_AGUA')) {
            novasConquistasDesbloqueadas.push('PRIMEIRA_META_AGUA');
        }
        if (logDeHoje.proteinConsumed >= metaProteina && !conquistasAtuais.includes('PRIMEIRA_META_PROTEINA')) {
            novasConquistasDesbloqueadas.push('PRIMEIRA_META_PROTEINA');
        }
    }

    if (novasConquistasDesbloqueadas.length > 0) {
        usuario.conquistas.push(...novasConquistasDesbloqueadas);
        await usuario.save();
    }
    
    return todasAsConquistas.filter(c => novasConquistasDesbloqueadas.includes(c.idConquista));
};

exports.getTodasAsConquistas = () => {
    return todasAsConquistas;
};