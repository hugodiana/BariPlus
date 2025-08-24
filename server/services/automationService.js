// server/services/automationService.js
const cron = require('node-cron');
const admin = require('firebase-admin'); // ✅ 1. IMPORTAR O FIREBASE ADMIN
const Meta = require('../models/Meta');
const DailyLog = require('../models/DailyLog');
const User = require('../models/User'); // ✅ 2. IMPORTAR O MODELO USER
const Agendamento = require('../models/Agendamento'); // ✅ 1. IMPORTAR O MODELO
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');
const resend = new Resend(process.env.RESEND_API_KEY);

// Lógica para verificar uma única meta
const verificarMeta = async (meta) => {
    let metaAtingida = false;
    
    // Por enquanto, vamos focar-nos nas metas de água e proteína
    if (meta.tipo === 'agua' || meta.tipo === 'proteina') {
        const logs = await DailyLog.find({
            userId: meta.pacienteId, // Corrigido de pacienteId para userId para corresponder ao modelo
            date: { $lte: meta.prazo }
        });

        metaAtingida = logs.some(log => 
            meta.tipo === 'agua' ? log.waterConsumed >= meta.valorAlvo : log.proteinConsumed >= meta.valorAlvo
        );
    }
    
    // Atualiza o status da meta
    if (metaAtingida) {
        meta.status = 'concluida';
    } else {
        // Para todos os outros tipos, ou se não foi atingida, marca como não concluída
        meta.status = 'nao_concluida';
    }
    
    await meta.save();

    // ✅ 3. LÓGICA DE NOTIFICAÇÃO
    if (meta.status === 'concluida') {
        try {
            const paciente = await User.findById(meta.pacienteId);
            if (paciente && paciente.fcmToken) {
                const message = {
                    notification: {
                        title: '🏆 Meta Atingida!',
                        body: `Parabéns! Você concluiu a sua meta: "${meta.descricao}"`
                    },
                    token: paciente.fcmToken
                };
                
                await admin.messaging().send(message);
                console.log(`CRON JOB: Notificação de meta concluída enviada para ${paciente.email}`);
            }
        } catch (error) {
            console.error(`CRON JOB: Falha ao enviar notificação para ${meta.pacienteId}`, error);
        }
    }
};


// A tarefa principal que será executada
const verificarMetasExpiradas = async () => {
    console.log('CRON JOB: A executar verificação de metas expiradas...');
    try {
        const agora = new Date();
        const metasAtivasExpiradas = await Meta.find({
            status: 'ativa',
            prazo: { $lt: agora }
        });

        if (metasAtivasExpiradas.length === 0) {
            console.log('CRON JOB: Nenhuma meta expirada encontrada.');
            return;
        }

        console.log(`CRON JOB: Encontradas ${metasAtivasExpiradas.length} metas para verificar.`);
        
        for (const meta of metasAtivasExpiradas) {
            await verificarMeta(meta);
        }

        console.log('CRON JOB: Verificação de metas concluída.');

    } catch (error) {
        console.error('CRON JOB: Erro ao verificar metas:', error);
    }
};

// Exporta a função que inicia o agendamento
exports.iniciarVerificacaoDeMetas = () => {
    cron.schedule('5 0 * * *', verificarMetasExpiradas, {
        timezone: "America/Sao_Paulo"
    });
    
    console.log('Serviço de automação de metas agendado para ser executado diariamente às 00:05.');
};

const enviarLembretesDeConsulta = async () => {
    console.log('CRON JOB: A executar envio de lembretes de consulta...');
    try {
        const amanhaInicio = new Date();
        amanhaInicio.setDate(amanhaInicio.getDate() + 1);
        amanhaInicio.setHours(0, 0, 0, 0);

        const amanhaFim = new Date(amanhaInicio);
        amanhaFim.setHours(23, 59, 59, 999);

        // Encontra agendamentos para amanhã que ainda não receberam lembrete
        const consultas = await Agendamento.find({
            start: { $gte: amanhaInicio, $lte: amanhaFim },
            status: 'Agendado', // Só envia para consultas não confirmadas/canceladas
            lembreteEnviado: false
        }).populate('pacienteId', 'nome email').populate('nutricionistaId', 'nome');

        if (consultas.length === 0) {
            console.log('CRON JOB: Nenhuma consulta para enviar lembrete.');
            return;
        }

        console.log(`CRON JOB: Encontradas ${consultas.length} consultas para notificar.`);

        for (const consulta of consultas) {
            const paciente = consulta.pacienteId;
            if (paciente && paciente.email) {
                const linkConfirmacao = `${process.env.API_URL}/api/public/consultas/${consulta._id}/confirmar/${consulta.confirmationToken}`;
                
                const corpoEmail = `Isto é um lembrete amigável da sua consulta com <strong>${consulta.nutricionistaId.nome}</strong> agendada para amanhã, dia ${amanhaInicio.toLocaleDateString('pt-BR')}, às ${new Date(consulta.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. <br/><br/>Por favor, clique no botão abaixo para confirmar a sua presença.`;
                
                const emailHtml = emailTemplate(
                    'Lembrete de Consulta',
                    corpoEmail,
                    'Confirmar Presença',
                    linkConfirmacao
                );

                await resend.emails.send({
                    from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                    to: [paciente.email],
                    subject: `Lembrete: Sua consulta com ${consulta.nutricionistaId.nome} é amanhã!`,
                    html: emailHtml,
                });
                
                // Marca o lembrete como enviado para não notificar novamente
                consulta.lembreteEnviado = true;
                await consulta.save();
                console.log(`CRON JOB: Lembrete enviado para ${paciente.email}`);
            }
        }
    } catch (error) {
        console.error('CRON JOB: Erro ao enviar lembretes de consulta:', error);
    }
};


exports.iniciarVerificacaoDeMetas = () => {
    // Tarefa para metas (diariamente à 00:05)
    cron.schedule('5 0 * * *', verificarMetasExpiradas, { timezone: "America/Sao_Paulo" });
    
    // ✅ 3. AGENDAR A NOVA TAREFA DE LEMBRETES (diariamente às 09:00)
    cron.schedule('0 9 * * *', enviarLembretesDeConsulta, { timezone: "America/Sao_Paulo" });
    
    console.log('Serviços de automação agendados.');
};