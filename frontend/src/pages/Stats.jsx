import React, { useEffect, useState, useMemo } from 'react'
import { api } from '../services/api'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { 
  BanknotesIcon, 
  ShoppingCartIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

const fmt = (n) => Number(n || 0).toLocaleString('fr-MG')

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-700">{fmt(payload[0].value)} Ar</p>
      </div>
    )
  }
  return null
}

export default function Stats() {
  const [recettes, setRecettes] = useState([])
  const [clients, setClients] = useState([])
  const [voitures, setVoitures] = useState([])
  const [achats, setAchats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAllData() }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [rec, cli, voi, ach] = await Promise.all([
        api.getRecettes(),
        api.getClients(),
        api.getVoitures(),
        api.getAchats()
      ])
      setRecettes(rec || [])
      setClients(cli || [])
      setVoitures(voi || [])
      setAchats(ach || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  // Conversion des mois anglais en français
  const moisAnglaisToFrancais = {
    'January': 'Janvier', 'February': 'Février', 'March': 'Mars',
    'April': 'Avril', 'May': 'Mai', 'June': 'Juin',
    'July': 'Juillet', 'August': 'Août', 'September': 'Septembre',
    'October': 'Octobre', 'November': 'Novembre', 'December': 'Décembre'
  }

  const recettesMensuelles = useMemo(() => {
    return recettes.map(r => {
      let label = r.label.trim().replace(/\s+/g, ' ')
      
      Object.entries(moisAnglaisToFrancais).forEach(([en, fr]) => {
        if (label.toLowerCase().startsWith(en.toLowerCase())) {
          const annee = label.split(' ').pop()
          label = `${fr} ${annee}`
        }
      })
      
      return {
        ...r,
        label: label,
        total: Number(r.total)
      }
    })
  }, [recettes])

  const totalRevenu = useMemo(() => {
    return recettesMensuelles.reduce((s, r) => s + r.total, 0)
  }, [recettesMensuelles])
  
  const nombreVentes = achats.length
  const nombreClients = clients.length

  const stockTotal = useMemo(() => {
    return voitures.reduce((s, v) => s + Number(v.nombre || 0), 0)
  }, [voitures])

  const totalVendus = useMemo(() => {
    return achats.reduce((s, a) => s + Number(a.qte || 1), 0)
  }, [achats])

  const stockDisponible = stockTotal - totalVendus

  const evolution = useMemo(() => {
    if (recettesMensuelles.length < 2) return 0
    const dernier = recettesMensuelles[recettesMensuelles.length - 1]?.total || 0
    const precedent = recettesMensuelles[recettesMensuelles.length - 2]?.total || 0
    return precedent > 0 ? ((dernier - precedent) / precedent) * 100 : 0
  }, [recettesMensuelles])

  const topClients = useMemo(() => {
    const clientAchats = {}
    achats.forEach(achat => {
      const id = achat.idcli
      const client = clients.find(c => c.idcli === id)
      const nom = client ? client.nom : `Client ${id}`
      const voiture = voitures.find(v => v.idvoit === achat.idvoit)
      const prix = voiture ? Number(voiture.prix) * Number(achat.qte || 1) : 0
      
      if (!clientAchats[id]) {
        clientAchats[id] = { total: 0, count: 0, nom }
      }
      clientAchats[id].total += prix
      clientAchats[id].count += 1
    })
    return Object.values(clientAchats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [achats, clients, voitures])

  const topVoitures = useMemo(() => {
    const voitureVentes = {}
    achats.forEach(achat => {
      const id = achat.idvoit
      const voiture = voitures.find(v => v.idvoit === id)
      const design = voiture ? voiture.design : `Véhicule ${id}`
      
      if (!voitureVentes[id]) {
        voitureVentes[id] = { count: 0, design, prix: voiture ? Number(voiture.prix) : 0 }
      }
      voitureVentes[id].count += Number(achat.qte || 1)
    })
    return Object.values(voitureVentes)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [achats, voitures])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <BanknotesIcon className="w-4 h-4 text-slate-400" />
            {evolution !== 0 && (
              <span className={`text-xs flex items-center gap-0.5 ${evolution > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {evolution > 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                {Math.abs(evolution).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-slate-800">{fmt(totalRevenu)} Ar</p>
          <p className="text-xs text-slate-500">Revenu total</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <ShoppingCartIcon className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-lg font-bold text-slate-800">{nombreVentes}</p>
          <p className="text-xs text-slate-500">Ventes</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <UserGroupIcon className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-lg font-bold text-slate-800">{nombreClients}</p>
          <p className="text-xs text-slate-500">Clients</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <TruckIcon className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-lg font-bold text-slate-800">{stockDisponible}</p>
          <p className="text-xs text-slate-500">En stock</p>
        </div>
      </div>

      {/* Graphique des recettes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-medium text-slate-600 mb-4">Évolution des recettes</h2>
        {recettesMensuelles.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={recettesMensuelles} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                tickLine={false} 
                axisLine={false}
                dy={8}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                tickFormatter={v => (v/1000000)+'M'} 
                tickLine={false} 
                axisLine={false}
                dx={-4}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#64748b" 
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={{ r: 3, fill: '#64748b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5, fill: '#475569', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-slate-400 py-16">Aucune donnée</p>
        )}
      </div>

      {/* Top clients + Top voitures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 clients */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-600 mb-3">Top clients</h2>
          {topClients.length > 0 ? (
            <div className="space-y-1">
              {topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{client.nom}</p>
                      <p className="text-xs text-slate-400">{client.count} achat(s)</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">{fmt(client.total)} Ar</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-8">Aucune vente</p>
          )}
        </div>

        {/* Top 5 voitures */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-600 mb-3">Véhicules les plus vendus</h2>
          {topVoitures.length > 0 ? (
            <div className="space-y-3">
              {topVoitures.map((voiture, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center ${
                        i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{voiture.design}</p>
                        <p className="text-xs text-slate-400">{fmt(voiture.prix)} Ar</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">{voiture.count} vente(s)</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 ml-8">
                    <div 
                      className="bg-slate-400 h-1.5 rounded-full transition-all"
                      style={{ 
                        width: `${(voiture.count / topVoitures[0].count) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-8">Aucune vente</p>
          )}
        </div>
      </div>
    </div>
  )
}
