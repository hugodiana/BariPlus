// src/components/paciente/NutriReportPDF.js
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Estilos para o documento PDF
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: '#e0e0e0', paddingBottom: 10, marginBottom: 20 },
    logo: { width: 80 },
    headerInfo: { textAlign: 'right' },
    nutriName: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
    nutriCRN: { fontSize: 9, color: 'grey' },
    title: { fontSize: 18, textAlign: 'center', fontFamily: 'Helvetica-Bold', marginBottom: 10, color: '#2c3e50' },
    subtitle: { fontSize: 11, textAlign: 'center', marginBottom: 25, color: '#7f8c8d' },
    section: { marginBottom: 20, breakInside: 'avoid' },
    sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', backgroundColor: '#f0f0f0', padding: 5, marginBottom: 10, color: '#34495e', borderRadius: 3 },
    chartImage: { width: '100%', height: 200, alignSelf: 'center', objectFit: 'contain', marginVertical: 10 },
    table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { flexDirection: 'row' },
    tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', backgroundColor: '#f0f0f0', padding: 5, fontFamily: 'Helvetica-Bold' },
    tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', padding: 5 },
    footer: { position: 'absolute', bottom: 20, left: 40, right: 40, textAlign: 'center', color: 'grey', fontSize: 8, borderTop: 1, borderColor: '#e0e0e0', paddingTop: 5 },
});

const NutriReportPDF = ({ nutricionista, paciente, progresso, chartImage }) => {
    const historicoOrdenado = [...(progresso?.historico || [])].sort((a, b) => new Date(b.data) - new Date(a.data));

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header} fixed>
                    <Image style={styles.logo} src="/bariplus_logo.png" />
                    <View style={styles.headerInfo}>
                        <Text style={styles.nutriName}>{nutricionista?.nome || 'Nutricionista'}</Text>
                        <Text style={styles.nutriCRN}>CRN: {nutricionista?.crn || 'N/A'}</Text>
                    </View>
                </View>
                
                <Text style={styles.title}>Relatório de Acompanhamento Nutricional</Text>
                <Text style={styles.subtitle}>Paciente: {paciente?.nome} {paciente?.sobrenome}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Evolução do Peso</Text>
                    {chartImage && <Image src={chartImage} style={styles.chartImage} />}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Histórico de Registos</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}><Text>Data</Text></View>
                            <View style={styles.tableColHeader}><Text>Peso (kg)</Text></View>
                            <View style={styles.tableColHeader}><Text>Cintura (cm)</Text></View>
                            <View style={styles.tableColHeader}><Text>Quadril (cm)</Text></View>
                        </View>
                        {historicoOrdenado.slice(0, 15).map((item) => ( // Limita a 15 registos para o PDF não ficar muito longo
                            <View style={styles.tableRow} key={item._id}>
                                <View style={styles.tableCol}><Text>{format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR })}</Text></View>
                                <View style={styles.tableCol}><Text>{item.peso?.toFixed(1) || '-'}</Text></View>
                                <View style={styles.tableCol}><Text>{item.medidas?.cintura || '-'}</Text></View>
                                <View style={styles.tableCol}><Text>{item.medidas?.quadril || '-'}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>
                
                <Text style={styles.footer} fixed>
                    Relatório gerado via BariPlus em {format(new Date(), "dd/MM/yyyy")}
                </Text>
            </Page>
        </Document>
    );
};

export default NutriReportPDF;