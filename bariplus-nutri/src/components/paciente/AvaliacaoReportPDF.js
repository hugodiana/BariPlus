// src/components/paciente/AvaliacaoReportPDF.js
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Estilos para o PDF (pode reutilizar e adaptar de outros PDFs)
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
    title: { fontSize: 18, textAlign: 'center', fontFamily: 'Helvetica-Bold', marginBottom: 20 },
    table: { display: 'table', width: 'auto' },
    tableRow: { flexDirection: 'row' },
    tableColHeader: { width: '12.5%', backgroundColor: '#f0f0f0', padding: 5, fontFamily: 'Helvetica-Bold' },
    tableCol: { width: '12.5%', padding: 5 }
});

const AvaliacaoReportPDF = ({ prontuario }) => (
    <Document>
        <Page size="A4" style={styles.page} orientation="landscape">
            <Text style={styles.title}>Relatório de Avaliações Físicas</Text>
            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <View style={styles.tableColHeader}><Text>Data</Text></View>
                    <View style={styles.tableColHeader}><Text>Peso</Text></View>
                    <View style={styles.tableColHeader}><Text>Altura</Text></View>
                    <View style={styles.tableColHeader}><Text>IMC</Text></View>
                    <View style={styles.tableColHeader}><Text>Cintura</Text></View>
                    <View style={styles.tableColHeader}><Text>Abdómen</Text></View>
                    <View style={styles.tableColHeader}><Text>Quadril</Text></View>
                    <View style={styles.tableColHeader}><Text>Tríceps</Text></View>
                </View>
                {prontuario.avaliacoes.map(av => (
                    <View style={styles.tableRow} key={av._id}>
                        <View style={styles.tableCol}><Text>{format(new Date(av.data), 'dd/MM/yy', { locale: ptBR })}</Text></View>
                        <View style={styles.tableCol}><Text>{av.peso || '-'}</Text></View>
                        <View style={styles.tableCol}><Text>{av.altura || '-'}</Text></View>
                        <View style={styles.tableCol}><Text>{av.imc || '-'}</Text></View>
                        <View style={styles.tableCol}><Text>{av.circunferencias?.cintura || '-'}</Text></View>
                        <View style={styles.tableCol}><Text>{av.circunferencias?.abdomen || '-'}</Text></View>
                        <View style={styles.tableCol}><Text>{av.circunferencias?.quadril || '-'}</Text></View>
                        <View style={styles.tableCol}><Text>{av.dobrasCutaneas?.triceps || '-'}</Text></View>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);

export default AvaliacaoReportPDF;