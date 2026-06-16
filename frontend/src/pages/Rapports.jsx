import { useEffect, useState } from 'react'
import { getAchatsByDate, getRecetteMensuelle } from '../api'
import { Btn, Input, Table } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Rapports() {
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [recette, setRecette]   = useState([])

  useEffect(() => { getRecetteMensuelle().then(r => setRecette(r.map(m => ({ mois: m.mois, recette: Number(m.recette) })))) }, [])

  const search = async () => {
    if (!from || !to) return
    const data = await getAchatsByDate(from, to)
    setResults(data); setSearched(true)
  }

  const totalPeriode = results.reduce((s, r) => s + r.qte * r.prix, 0)

  return (
    <div className="space-y-8">
      {/* Recherche par date */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Achats entre deux dates</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <Input label="Du" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input label="Au" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <Btn onClick={search}>Rechercher</Btn>
        </div>

        {searched && (
          <div className="mt-4">
            <Table
              cols={['N° Achat', 'Client', 'Voiture', 'Date', 'Qté', 'Total']}
              rows={results}
              renderRow={row => (
                <tr key={row.numachat} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.numachat}</td>
                  <td className="px-4 py-3">{row.client_nom}</td>
                  <td className="px-4 py-3">{row.voiture_design}</td>
                  <td className="px-4 py-3">{new Date(row.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-center">{row.qte}</td>
                  <td className="px-4 py-3">{(row.qte * row.prix).toLocaleString('fr-MG')} Ar</td>
                </tr>
              )}
            />
            {results.length > 0 && (
              <p className="text-sm font-semibold text-right mt-3 text-blue-700 pr-4">
                Total période : {totalPeriode.toLocaleString('fr-MG')} Ar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recette mensuelle */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Recette mensuelle (6 derniers mois)</h2>
        {recette.length === 0
          ? <p className="text-slate-400 text-sm text-center py-8">Aucune donnée</p>
          : <ResponsiveContainer width="100%" height={260}>
              <BarChart data={recette} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => (v / 1000000).toFixed(0) + 'M'} />
                <Tooltip formatter={v => v.toLocaleString('fr-MG') + ' Ar'} labelStyle={{ fontWeight: 600 }} />
                <Bar dataKey="recette" name="Recette" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        }
      </div>
    </div>
  )
}
