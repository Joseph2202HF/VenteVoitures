import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page:    { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1e293b' },
  title:   { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#1d4ed8' },
  sub:     { fontSize: 11, color: '#64748b', marginBottom: 20 },
  section: { marginBottom: 12 },
  label:   { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  value:   { fontSize: 11 },
  table:   { marginTop: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  thead:   { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '8 6' },
  trow:    { flexDirection: 'row', borderTopWidth: 1, borderColor: '#e2e8f0', padding: '8 6' },
  th:      { flex: 1, fontSize: 9, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
  td:      { flex: 1, fontSize: 10 },
  tdRight: { flex: 1, fontSize: 10, textAlign: 'right' },
  totalRow:{ flexDirection: 'row', backgroundColor: '#eff6ff', padding: '10 6', borderTopWidth: 2, borderColor: '#3b82f6' },
  totalLbl:{ flex: 3, fontSize: 11, fontWeight: 'bold', color: '#1d4ed8' },
  totalVal:{ flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#1d4ed8' },
  arrête:  { marginTop: 20, fontSize: 10, fontStyle: 'italic', color: '#64748b' },
})

function fmt(n) {
  return Number(n).toLocaleString('fr-MG') + ' Ar'
}

function FactureDoc({ facture }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Facture N° {facture.numachat}</Text>
        <Text style={s.sub}>Date de facturation : {new Date(facture.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>

        <View style={s.section}>
          <Text style={s.label}>Client</Text>
          <Text style={s.value}>{facture.client_nom}</Text>
        </View>
        <View style={s.section}>
          <Text style={s.label}>Contact</Text>
          <Text style={s.value}>{facture.contact}</Text>
        </View>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 2 }]}>Désignation</Text>
            <Text style={s.th}>Qté</Text>
            <Text style={s.th}>Prix unitaire</Text>
            <Text style={s.th}>Total</Text>
          </View>
          {facture.lignes.map((l, i) => (
            <View key={i} style={s.trow}>
              <Text style={[s.td, { flex: 2 }]}>{l.design}</Text>
              <Text style={s.td}>{l.qte}</Text>
              <Text style={s.tdRight}>{fmt(l.prix)}</Text>
              <Text style={s.tdRight}>{fmt(l.total_ligne)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLbl}>TOTAL</Text>
            <Text style={s.totalVal}>{fmt(facture.total)}</Text>
          </View>
        </View>

        <Text style={s.arrête}>
          Arrêté par la présente facture à la somme de {fmt(facture.total)}.
        </Text>
      </Page>
    </Document>
  )
}

export default function FacturePDF({ facture }) {
  if (!facture) return null
  return (
    <PDFDownloadLink
      document={<FactureDoc facture={facture} />}
      fileName={`facture-${facture.numachat}.pdf`}
    >
      {({ loading }) => (
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
          📄 {loading ? 'Génération...' : 'Télécharger PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
