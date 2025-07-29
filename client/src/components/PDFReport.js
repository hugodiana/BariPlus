import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define os estilos para o PDF
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
    header: { position: 'absolute', top: 20, left: 40, right: 40, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logo: { width: 80 },
    headerText: { fontSize: 8, color: 'grey' },
    title: { fontSize: 20, textAlign: 'center', fontFamily: 'Helvetica-Bold', marginTop: 50 },
    subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 25 },
    section: { marginBottom: 20, breakInside: 'avoid' },
    sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', backgroundColor: '#f0f0f0', padding: 5, marginBottom: 10 },
    chartImage: { width: '100%', alignSelf: 'center', marginBottom: 10 },
    table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: '#bfbfbf', borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { flexDirection: "row" },
    tableColHeader: { width: "25%", borderStyle: "solid", borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f2f2f2', padding: 5, fontFamily: 'Helvetica-Bold' },
    tableCol: { width: "25%", borderStyle: "solid", borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
    tableCell: { fontSize: 9 },
    footer: { position: 'absolute', bottom: 20, left: 40, right: 40, textAlign: 'center', color: 'grey', fontSize: 8 },
    disclaimer: { fontSize: 8, color: 'grey', marginTop: 30, textAlign: 'center' },
});

const ProgressReport = ({ usuario, historico, chartImages }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header} fixed>
                <Image style={styles.logo} src={`${window.location.origin}/bariplus_logo.png`} />
                <Text style={styles.headerText}>www.bariplus.com.br</Text>
            </View>
            
            <Text style={styles.title}>Relatório de Progresso</Text>
            <Text style={styles.subtitle}>Paciente: {usuario.nome} {usuario.sobrenome}</Text>

            {/* Seção do Gráfico de Peso */}
            {chartImages && chartImages.peso && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Evolução do Peso (kg)</Text>
                    <Image src={chartImages.peso} style={styles.chartImage} />
                </View>
            )}
            
            {/* Seção do Gráfico de Cintura */}
            {chartImages && chartImages.cintura && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Evolução da Cintura (cm)</Text>
                    <Image src={chartImages.cintura} style={styles.chartImage} />
                </View>
            )}

            {/* ... adicione mais seções de gráficos aqui se desejar ... */}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Histórico de Registros</Text>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <View style={styles.tableColHeader}><Text>Data</Text></View>
                      <View style={styles.tableColHeader}><Text>Peso</Text></View>
                      <View style={styles.tableColHeader}><Text>Pescoço</Text></View>
                      <View style={styles.tableColHeader}><Text>Tórax</Text></View>
                      <View style={styles.tableColHeader}><Text>Cintura</Text></View>
                      <View style={styles.tableColHeader}><Text>Abdômen</Text></View>
                      <View style={styles.tableColHeader}><Text>Quadril</Text></View>
                      <View style={styles.tableColHeader}><Text>Braço D.</Text></View>
                      <View style={styles.tableColHeader}><Text>Braço E.</Text></View>
                </View>
                    {historico.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableCol}><Text>{format(new Date(item.data), 'dd/MM/yyyy')}</Text></View>
                            <View style={styles.tableCol}><Text>{item.peso?.toFixed(1) || '-'}</Text></View>
                            <View style={styles.tableCol}><Text>{item.medidas?.pescoco || '-'}</Text></View>
                            <View style={styles.tableCol}><Text>{item.medidas?.torax || '-'}</Text></View>
                            <View style={styles.tableCol}><Text>{item.medidas?.cintura || '-'}</Text></View>
                            <View style={styles.tableCol}><Text>{item.medidas?.abdomen || '-'}</Text></View>
                            <View style={styles.tableCol}><Text>{item.medidas?.quadril || '-'}</Text></View>
                            <View style={styles.tableCol}><Text>{item.medidas?.bracoDireito || '-'}</Text></View>
                            <View style={styles.tableCol}><Text>{item.medidas?.bracoEsquerdo || '-'}</Text></View>
                        </View>
                    ))}
                </View>
            </View>

            <Text style={styles.disclaimer}>
                Aviso: Os dados contidos neste relatório foram inseridos pelo próprio usuário através do aplicativo BariPlus. Este documento serve como um registo pessoal e não substitui uma avaliação médica profissional.
            </Text>
            
            <Text style={styles.footer} fixed>Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </Page>
    </Document>
);

export default ProgressReport;