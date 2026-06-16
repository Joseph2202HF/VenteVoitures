import { useEffect, useState } from 'react'
import { getClients, getVoitures, getAchats, getRecetteMensuelle } from '../api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats]   = useState({ clients: 0, voitures: 0, achats: 0 })
  const [recette, setRecette] = useState([])

  useEffect(() => {
    Promise.all([getClients(), getVoitures(), getAchats(), getRecetteMensuelle()])
      .then(([c, v, a, r]) => {
        setStats({ clients: c.length, voitures: v.length, achats: a.length })
        setRecette(r.map(m => ({ mois: m.mois, recette: Number(m.recette) })))
      })
  }, [])

  const cards = [
    { label: 'Clients',  value: stats.clients,  color: 'blue'    },
    { label: 'Voitures', value: stats.voitures, color: 'violet'  },
    { label: 'Achats',   value: stats.achats,   color: 'emerald' },
  ]

  const colorMap = { blue: 'bg-blue-50 text-blue-700 border-blue-200', violet: 'bg-violet-50 text-violet-700 border-violet-200', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200' }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${colorMap[c.color]}`}>
            <p className="text-sm font-medium opacity-70">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recette des 6 derniers mois</h2>
        {recette.length === 0
          ? <p className="text-slate-400 text-sm text-center py-8">Aucune donnée</p>
          : <ResponsiveContainer width="100%" height={240}>
              <BarChart data={recette} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => (v/1000000).toFixed(0) + 'M'} />
                <Tooltip formatter={v => v.toLocaleString('fr-MG') + ' Ar'} />
                <Bar dataKey="recette" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        }
      </div>
    </div>
  )
}
