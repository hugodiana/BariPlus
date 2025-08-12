const admin = require('firebase-admin');
const User = require('../models/userModel');
const Medication = require('../models/medicationModel');

const checkAndSendNotifications = async () => {
    console.log('A executar verificação de notificações de medicação...');
    const agora = new Date();
    const horaAtual = agora.getHours().toString().padStart(2, '0');
    const minutoAtual = agora.getMinutes().toString().padStart(2, '0');
    const horarioAtual = `${horaAtual}:${minutoAtual}`;

    try {
        // Encontra todos os documentos de medicação que contêm o horário atual
        const medicationDocs = await Medication.find({
            'medicamentos.status': 'Ativo',
            $or: [
                { 'medicamentos.frequencia.tipo': 'Diária', 'medicamentos.frequencia.horarios': horarioAtual },
                { 'medicamentos.frequencia.tipo': 'Semanal', 'medicamentos.frequencia.diaDaSemana': diaDaSemanaAtual, 'medicamentos.frequencia.horarios': horarioAtual }
            ]
        });

        for (const doc of medicationDocs) {
            const usuario = await User.findById(doc.userId);
            if (!usuario || !usuario.fcmToken) continue;

            const medicamentosParaHoje = doc.medicamentos.filter(
                med => med.status === 'Ativo' && med.horarios.includes(horarioAtual)
            );

            for (const med of medicamentosParaHoje) {
                const message = {
                    notification: {
                        title: '🔔 Hora do Remédio!',
                        body: `Não se esqueça de tomar o seu ${med.nome} (${med.dosagem}).`
                    },
                    token: usuario.fcmToken
                };
                
                await admin.messaging().send(message);
                console.log(`Notificação enviada para ${usuario.email} sobre ${med.nome}`);
            }
        }
    } catch (error) {
        console.error('Erro ao enviar notificações de medicação:', error);
    }
};

module.exports = { checkAndSendNotifications };