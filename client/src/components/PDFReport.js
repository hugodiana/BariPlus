import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
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
        fontSize: 10,
        marginBottom: 20,
        textAlign: 'center',
        color: 'grey',
    },
    title: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
    },
    chartImage: {
        width: '100%',
        height: 'auto',
        marginBottom: 20,
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
        width: "25%", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderColor: '#bfbfbf',
        borderLeftWidth: 0, 
        borderTopWidth: 0,
        backgroundColor: '#f2f2f2',
        padding: 5
    },
    tableCol: { 
        width: "25%", 
        borderStyle: "solid", 
        borderWidth: 1, 
        borderColor: '#bfbfbf',
        borderLeftWidth: 0, 
        borderTopWidth: 0,
        padding: 5
    },
    tableCellHeader: {
        fontSize: 11,
        fontWeight: 'bold'
    },
    tableCell: { 
        fontSize: 9 
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

const ProgressReport = ({ usuario, historico, chartImage }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Relatório Gerado pelo BariPlus - www.bariplus.com.br</Text>
            
            <Text style={styles.title}>Relatório de Progresso</Text>
            <Text style={styles.subtitle}>Paciente: {usuario.nome} {usuario.sobrenome}</Text>

            {chartImage && <Image src={chartImage} style={styles.chartImage} />}
            
            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Data</Text></View>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Peso (kg)</Text></View>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Cintura (cm)</Text></View>
                    <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Quadril (cm)</Text></View>
                </View>
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
