import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Registrar fontes (opcional, mas recomendado para consistência)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v15/Helvetica.ttf' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v15/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Estilos aprimorados
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
  section: {
    marginBottom: 25,
    breakInside: 'avoid',
  },
  sectionTitle: {
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
    width: '12.5%',
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
    width: '12.5%',
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

const ProgressReport = ({ usuario, historico = [], chartImages = {} }) => {
  // Ordenar histórico por data (mais recente primeiro)
  const historicoOrdenado = [...historico].sort((a, b) => 
    new Date(b.data) - new Date(a.data)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header} fixed>
          <Image style={styles.logo} src={`${window.location.origin}/bariplus_logo.png`} />
          <Text style={styles.headerText}>www.bariplus.com.br</Text>
        </View>
        
        {/* Título */}
        <Text style={styles.title}>Relatório de Progresso</Text>
        <Text style={styles.subtitle}>
          Paciente: {usuario?.nome || ''} {usuario?.sobrenome || ''}
          {usuario?.dataNascimento && ` | Nascimento: ${format(new Date(usuario.dataNascimento), 'dd/MM/yyyy', { locale: ptBR })}`}
        </Text>

        {/* Seção de Gráficos */}
        {chartImages.peso && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Evolução do Peso (kg)</Text>
            <View style={styles.chartContainer}>
              <Image src={chartImages.peso} style={styles.chartImage} />
            </View>
          </View>
        )}
        
        {chartImages.cintura && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Evolução da Cintura (cm)</Text>
            <View style={styles.chartContainer}>
              <Image src={chartImages.cintura} style={styles.chartImage} />
            </View>
          </View>
        )}

        {/* Tabela de Histórico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Registros</Text>
          <View style={styles.table}>
            {/* Cabeçalho da tabela */}
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text>Data</Text></View>
              <View style={styles.tableColHeader}><Text>Peso (kg)</Text></View>
              <View style={styles.tableColHeader}><Text>Pescoço (cm)</Text></View>
              <View style={styles.tableColHeader}><Text>Tórax (cm)</Text></View>
              <View style={styles.tableColHeader}><Text>Cintura (cm)</Text></View>
              <View style={styles.tableColHeader}><Text>Abdômen (cm)</Text></View>
              <View style={styles.tableColHeader}><Text>Quadril (cm)</Text></View>
              <View style={styles.tableColHeader}><Text>Braço D. (cm)</Text></View>
              <View style={styles.tableColHeader}><Text>Braço E. (cm)</Text></View>
            </View>

            {/* Linhas da tabela */}
            {historicoOrdenado.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text>{format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR })}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.peso ? item.peso.toFixed(1) : '-'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.medidas?.pescoco || '-'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.medidas?.torax || '-'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.medidas?.cintura || '-'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.medidas?.abdomen || '-'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.medidas?.quadril || '-'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.medidas?.bracoDireito || '-'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{item.medidas?.bracoEsquerdo || '-'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Rodapé */}
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

export default ProgressReport;