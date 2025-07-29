import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';

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
        fontFamily: 'Helvetica-Bold',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
    },
    examBlock: {
        marginBottom: 25,
        breakInside: 'avoid',
    },
    examTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        backgroundColor: '#eaeaea',
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
        fontSize: 9
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

const ExamsReport = ({ usuario, examsData, chartImages }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header} fixed>Relatório Gerado pelo BariPlus</Text>

            <Text style={styles.title}>Relatório de Exames Laboratoriais</Text>
            <Text style={styles.subtitle}>
                Paciente: {usuario.nome} {usuario.sobrenome}
            </Text>

            {examsData.examEntries.map((exam) => (
                <View key={exam._id} style={styles.examBlock}>
                    <Text style={styles.examTitle}>
                        Exame: {exam.name} ({exam.unit})
                    </Text>

                    {chartImages && chartImages[exam._id] && (
                        <Image
                            src={chartImages[exam._id]}
                            style={styles.chartImage}
                        />
                    )}

                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Data</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Valor</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Notas</Text>
                            </View>
                        </View>
                        {exam.history
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .map((result) => (
                                <View style={styles.tableRow} key={result._id}>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>
                                            {format(parseISO(result.date), 'dd/MM/yyyy')}
                                        </Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{result.value}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{result.notes || '-'}</Text>
                                    </View>
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
