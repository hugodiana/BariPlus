import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';

// Define os estilos para o PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica'
    },
    header: {
        fontSize: 10,
        marginBottom: 20,
        textAlign: 'center',
        color: 'grey',
    },
    title: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: 'Helvetica-Bold',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 30,
    },
    examBlock: {
        marginBottom: 25,
        // Evita que um bloco quebre no meio da página
        breakInside: 'avoid',
    },
    examTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        backgroundColor: '#f0f0f0',
        padding: 8,
        marginBottom: 10,
        borderRadius: 3,
    },
    chartImage: {
        width: '100%',
        height: 'auto',
        marginBottom: 10,
        alignSelf: 'center',
    },
    table: { 
        display: "table", 
        width: "auto", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderColor: '#bfbfbf',
        borderRightWidth: 0, 
        borderBottomWidth: 0 
    },
    tableRow: { 
        flexDirection: "row" 
    },
    tableColHeader: { 
        width: "33.33%", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderColor: '#bfbfbf',
        borderLeftWidth: 0, 
        borderTopWidth: 0,
        backgroundColor: '#f2f2f2',
        padding: 6
    },
    tableCol: { 
        width: "33.33%", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderColor: '#bfbfbf',
        borderLeftWidth: 0, 
        borderTopWidth: 0,
        padding: 6
    },
    tableCellHeader: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
    },
    tableCell: { 
        fontSize: 10 
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 40,
        textAlign: 'center',
        color: 'grey',
        fontSize: 10,
    },
});

// O nosso componente de Relatório de Exames
const ExamsReport = ({ usuario, examsData, chartImages }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Relatório Gerado pelo BariPlus - www.bariplus.com.br</Text>
            
            <Text style={styles.title}>Relatório de Exames Laboratoriais</Text>
            <Text style={styles.subtitle}>Paciente: {usuario.nome} {usuario.sobrenome}</Text>

            {examsData.examEntries.map((exam) => (
                <View key={exam._id} style={styles.examBlock}>
                    <Text style={styles.examTitle}>{exam.name} ({exam.unit})</Text>
                    
                    {chartImages && chartImages[exam._id] && (
                        <Image src={chartImages[exam._id]} style={styles.chartImage} />
                    )}

                    <View style={styles.table}>
                        {/* Cabeçalho da Tabela */}
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Data</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Valor</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Notas</Text></View>
                        </View>
                        {/* Linhas da Tabela */}
                        {exam.history.sort((a, b) => new Date(b.date) - new Date(a.date)).map((result) => (
                            <View style={styles.tableRow} key={result._id}>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>{format(parseISO(result.date), 'dd/MM/yyyy')}</Text></View>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>{result.value}</Text></View>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>{result.notes || '-'}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
            
            <Text style={styles.footer} fixed>
                Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </Text>
        </Page>
    </Document>
);

export default ExamsReport;