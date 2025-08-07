import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Registrar fontes (consistente com o ProgressReport)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v15/Helvetica.ttf' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v15/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Estilos consistentes com o ProgressReport
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
    lineHeight: 1.4,
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: 10,
  },
  logo: { width: 80 },
  headerText: { fontSize: 8, color: 'grey' },
  title: {
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    marginTop: 50,
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 25,
    color: '#7f8c8d',
  },
  examBlock: {
    marginBottom: 25,
    breakInside: 'avoid',
  },
  examTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginBottom: 10,
    color: '#34495e',
    borderRadius: 3,
  },
  chartContainer: {
    marginVertical: 15,
    padding: 10,
    border: '1px solid #e0e0e0',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  chartImage: {
    width: '100%',
    height: 200,
    alignSelf: 'center',
    marginBottom: 5,
    objectFit: 'contain',
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '33.33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
  },
  tableCol: {
    width: '33.33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    fontSize: 8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
    borderTop: '1px solid #e0e0e0',
    paddingTop: 10,
  },
  disclaimer: {
    fontSize: 8,
    color: 'grey',
    marginTop: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

const ExamsReport = ({ usuario = {}, examsData = { examEntries: [] }, chartImages = {} }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho consistente */}
        <View style={styles.header} fixed>
          <Image style={styles.logo} src={`${window.location.origin}/bariplus_logo.png`} />
          <Text style={styles.headerText}>www.bariplus.com.br</Text>
        </View>
        
        {/* Título e subtítulo */}
        <Text style={styles.title}>Relatório de Exames Laboratoriais</Text>
        <Text style={styles.subtitle}>
          Paciente: {usuario?.nome || ''} {usuario?.sobrenome || ''}
          {usuario?.dataNascimento && ` | Nascimento: ${format(new Date(usuario.dataNascimento), 'dd/MM/yyyy', { locale: ptBR })}`}
        </Text>

        {/* Lista de exames */}
        {examsData.examEntries.map((exam) => (
          <View key={exam._id} style={styles.examBlock} wrap={false}>
            <Text style={styles.examTitle}>
              {exam.name} ({exam.unit})
            </Text>

            {/* Gráfico do exame */}
            {chartImages[exam._id] && (
              <View style={styles.chartContainer}>
                <Image
                  src={chartImages[exam._id]}
                  style={styles.chartImage}
                />
              </View>
            )}

            {/* Tabela de resultados */}
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableColHeader}>
                  <Text>Data</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text>Valor</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text>Notas</Text>
                </View>
              </View>
              
              {exam.history
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Mais recente primeiro
                .map((result) => (
                  <View style={styles.tableRow} key={result._id}>
                    <View style={styles.tableCol}>
                      <Text>{format(parseISO(result.date), 'dd/MM/yyyy', { locale: ptBR })}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{result.value}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{result.notes || '-'}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        ))}

        {/* Rodapé consistente */}
        <Text style={styles.disclaimer}>
          Aviso: Os dados contidos neste relatório foram inseridos pelo próprio usuário através do aplicativo BariPlus. 
          Este documento serve como um registo pessoal e não substitui uma avaliação médica profissional.
        </Text>
        
        <Text style={styles.footer} fixed>
          Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </Text>
      </Page>
    </Document>
  );
};

export default ExamsReport;