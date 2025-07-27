import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Registra a fonte (opcional, mas deixa o PDF mais bonito)
// Font.register({ family: 'Inter', src: 'URL_DA_FONTE_INTER_AQUI' }); // Podemos adicionar depois

// Define os estilos para o PDF, como se fosse CSS
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica' // Fonte padrão segura
    },
    header: {
        fontSize: 12,
        marginBottom: 20,
        textAlign: 'center',
        color: 'grey',
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    table: { 
        display: "table", 
        width: "auto", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderRightWidth: 0, 
        borderBottomWidth: 0 
    },
    tableRow: { 
        margin: "auto", 
        flexDirection: "row" 
    },
    tableColHeader: { 
        width: "25%", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderLeftWidth: 0, 
        borderTopWidth: 0,
        backgroundColor: '#f2f2f2',
        padding: 5
    },
    tableCol: { 
        width: "25%", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderLeftWidth: 0, 
        borderTopWidth: 0,
        padding: 5
    },
    tableCellHeader: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    tableCell: { 
        margin: "auto", 
        fontSize: 10 
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: 'grey',
        fontSize: 10,
    },
});

// O nosso componente de Relatório de Progresso
const ProgressReport = ({ usuario, historico }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Relatório Gerado pelo BariPlus - www.bariplus.com.br</Text>
            
            <Text style={styles.title}>Relatório de Progresso</Text>
            <Text style={styles.subtitle}>Paciente: {usuario.nome} {usuario.sobrenome}</Text>

            <View style={styles.table}>
                {/* Cabeçalho da Tabela */}
                <View style={styles.tableRow}>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Data</Text></View>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Peso (kg)</Text></View>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Cintura (cm)</Text></View>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Quadril (cm)</Text></View>
                </View>
                {/* Linhas da Tabela */}
                {historico.map((item, index) => (
                    <View style={styles.tableRow} key={index}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{format(new Date(item.data), 'dd/MM/yyyy')}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{item.peso?.toFixed(1) || '-'}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{item.medidas?.cintura || '-'}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{item.medidas?.quadril || '-'}</Text></View>
                    </View>
                ))}
            </View>
            
            <Text style={styles.footer}>Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </Page>
    </Document>
);

export default ProgressReport;