import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Estilo base reutilizável de borda
const borderBase = {
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: '#bfbfbf',
  borderLeftWidth: 0,
  borderTopWidth: 0,
  padding: 5,
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
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
  chartImage: {
    width: '100%',
    height: 180,
    objectFit: 'contain',
    marginBottom: 20,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
    breakInside: 'avoid',
  },
  tableColHeader: {
    width: "11%",
    ...borderBase,
    backgroundColor: '#f2f2f2',
  },
  tableCol: {
    width: "11%",
    ...borderBase,
  },
  tableCellHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 8,
    textAlign: 'center',
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

const ProgressReport = ({ usuario, historico, chartImage }) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <Text style={styles.header} fixed>Relatório Gerado pelo BariPlus</Text>
      <Text style={styles.title}>Relatório de Progresso</Text>
      <Text style={styles.subtitle}>
        Paciente: {usuario?.nome || '-'} {usuario?.sobrenome || ''}
      </Text>

      {chartImage && <Image src={chartImage} style={styles.chartImage} />}

      <View style={styles.table}>
        {/* Cabeçalho da Tabela */}
        <View style={styles.tableRow}>
          {[
            "Data", "Peso (kg)", "Pescoço", "Tórax", "Cintura",
            "Abdômen", "Quadril", "Braço D.", "Braço E."
          ].map((label, index) => (
            <View key={index} style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Dados da Tabela */}
        {historico?.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.data ? format(new Date(item.data), 'dd/MM/yyyy') : '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.peso && !isNaN(item.peso) ? item.peso.toFixed(1) : '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.medidas?.pescoco ?? '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.medidas?.torax ?? '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.medidas?.cintura ?? '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.medidas?.abdomen ?? '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.medidas?.quadril ?? '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.medidas?.bracoDireito ?? '-'}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item?.medidas?.bracoEsquerdo ?? '-'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Rodapé com data e número de página */}
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages} • Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
        }
        fixed
      />
    </Page>
  </Document>
);

export default ProgressReport;
