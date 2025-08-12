import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#333', lineHeight: 1.4, },
    header: { position: 'absolute', top: 20, left: 40, right: 40, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: 10, },
    logo: { width: 80 },
    headerText: { fontSize: 8, color: 'grey' },
    title: { fontSize: 20, textAlign: 'center', fontFamily: 'Helvetica-Bold', marginTop: 50, marginBottom: 10, color: '#2c3e50', },
    subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 25, color: '#7f8c8d', },
    section: { marginBottom: 20, breakInside: 'avoid', },
    sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', backgroundColor: '#f0f0f0', padding: 5, marginBottom: 10, color: '#34495e', borderRadius: 3, },
    chartContainer: { marginVertical: 10, padding: 5, border: '1px solid #e0e0e0', borderRadius: 5, backgroundColor: '#f9f9f9', },
    chartImage: { width: '100%', height: 200, alignSelf: 'center', objectFit: 'contain', },
    table: { display: 'table', width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderRightWidth: 0, borderBottomWidth: 0, marginTop: 10, },
    tableRow: { flexDirection: 'row', },
    tableColHeader: { width: '6.25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#2c3e50', color: 'white', padding: 4, fontFamily: 'Helvetica-Bold', fontSize: 7, textAlign: 'center', },
    tableCol: { width: '6.25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, padding: 4, fontSize: 7, textAlign: 'center', },
    footer: { position: 'absolute', bottom: 20, left: 40, right: 40, textAlign: 'center', color: 'grey', fontSize: 8, borderTop: '1px solid #e0e0e0', paddingTop: 10, },
    disclaimer: { fontSize: 8, color: 'grey', marginTop: 20, textAlign: 'center', fontStyle: 'italic', },
});

const allMeasures = {
    peso: { label: 'Peso' }, pescoco: { label: 'Pescoço' }, torax: { label: 'Tórax' }, cintura: { label: 'Cintura' },
    abdomen: { label: 'Abdômen' }, quadril: { label: 'Quadril' }, bracoDireito: { label: 'Braço D.' }, bracoEsquerdo: { label: 'Braço E.' },
    antebracoDireito: { label: 'Ante. D.' }, antebracoEsquerdo: { label: 'Ante. E.' }, coxaDireita: { label: 'Coxa D.' }, coxaEsquerda: { label: 'Coxa E.' },
    panturrilhaDireita: { label: 'Pant. D.' }, panturrilhaEsquerda: { label: 'Pant. E.' },
};

const ProgressReport = ({ usuario, historico = [], chartImages = {} }) => {
    const historicoOrdenado = [...historico].sort((a, b) => new Date(b.data) - new Date(a.data));

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header} fixed>
                    <Image style={styles.logo} src="/bariplus_logo.png" />
                    <Text style={styles.headerText}>www.bariplus.com.br</Text>
                </View>
                
                <Text style={styles.title}>Relatório de Progresso</Text>
                <Text style={styles.subtitle}>
                    Paciente: {usuario?.nome || ''} {usuario?.sobrenome || ''}
                </Text>

                {Object.keys(chartImages).map(key => (
                    <View style={styles.section} wrap={false} key={key}>
                        <Text style={styles.sectionTitle}>Evolução de {allMeasures[key].label}</Text>
                        <View style={styles.chartContainer}>
                            <Image src={chartImages[key]} style={styles.chartImage} />
                        </View>
                    </View>
                ))}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Histórico de Registros</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={{...styles.tableColHeader, width: '12%'}}><Text>Data</Text></View>
                            {Object.keys(allMeasures).map(key => (
                                <View style={{...styles.tableColHeader, width: '6.28%'}} key={key}><Text>{allMeasures[key].label}</Text></View>
                            ))}
                        </View>

                        {historicoOrdenado.map((item, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={{...styles.tableCol, width: '12%'}}>
                                    <Text>{format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR })}</Text>
                                </View>
                                {Object.keys(allMeasures).map(key => (
                                    <View style={{...styles.tableCol, width: '6.28%'}} key={key}>
                                        <Text>{key === 'peso' ? (item.peso?.toFixed(1) || '-') : (item.medidas?.[key] || '-')}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.disclaimer}>
                    Aviso: Os dados contidos neste relatório foram inseridos pelo próprio usuário. Este documento não substitui uma avaliação médica profissional.
                </Text>
                
                <Text style={styles.footer} fixed>
                    Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </Text>
            </Page>
        </Document>
    );
};

export default ProgressReport;