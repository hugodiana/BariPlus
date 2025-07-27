import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define os estilos para o PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica'
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
    examBlock: {
        marginBottom: 20,
    },
    examTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        backgroundColor: '#f2f2f2',
        padding: 5,
        marginBottom: 10,
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
        width: "33.33%", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderLeftWidth: 0, 
        borderTopWidth: 0,
        backgroundColor: '#f2f2f2',
        padding: 5
    },
    tableCol: { 
        width: "33.33%", 
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

// O nosso componente de Relatório de Exames
const ExamsReport = ({ usuario, examsData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Relatório Gerado pelo BariPlus - www.bariplus.com.br</Text>
            
            <Text style={styles.title}>Relatório de Exames Laboratoriais</Text>
            <Text style={styles.subtitle}>Paciente: {usuario.nome} {usuario.sobrenome}</Text>

            {examsData.examEntries.map((exam, examIndex) => (
                <View key={examIndex} style={styles.examBlock}>
                    <Text style={styles.examTitle}>{exam.name} ({exam.unit})</Text>
                    <View style={styles.table}>
                        {/* Cabeçalho da Tabela */}
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Data</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Valor</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Notas</Text></View>
                        </View>
                        {/* Linhas da Tabela */}
                        {exam.history.sort((a, b) => new Date(b.date) - new Date(a.date)).map((result, resultIndex) => (
                            <View style={styles.tableRow} key={resultIndex}>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>{format(new Date(result.date), 'dd/MM/yyyy')}</Text></View>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>{result.value}</Text></View>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>{result.notes || '-'}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
            
            <Text style={styles.footer}>Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </Page>
    </Document>
);

export default ExamsReport;