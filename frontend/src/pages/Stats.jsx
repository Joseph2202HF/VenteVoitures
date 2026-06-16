import React, { useEffect, useState, useMemo } from 'react'
import * as api from '../api/index'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts'
import { 
  BanknotesIcon, ShoppingCartIcon, UserGroupIcon, TruckIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { fmt } from '../utils/format'

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="text-slate-500 mb-0.5">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold text-slate-800">{p.name}: {fmt(p.value)} Ar</p>
        ))}
      </div>
    )
  }
  return null
}

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <ShoppingCartIcon className="w-10 h-10 mb-2" />
    <p className="text-sm">{message}</p>
  </div>
)

export default function Stats() {
  const [recettes, setRecettes] = useState([])
  const [clients, setClients] = useState([])
  const [voitures, setVoitures] = useState([])
  const [achats, setAchats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [rec, cli, voi, ach] = await Promise.all([
        api.getRecetteMensuelle(),
        api.getClients(),
        api.getVoitures(),
        api.getAchats()
      ])
      setRecettes(Array.isArray(rec) ? rec : [])
      setClients(Array.isArray(cli) ? cli : [])
      setVoitures(Array.isArray(voi) ? voi : [])
      setAchats(Array.isArray(ach) ? ach : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Calculs
  const totalRevenu = recettes.reduce((s, r) => s + Number(r.total || 0), 0)
  const nombreVentes = achats.length
  const nombreClients = clients.length
  const stockDisponible = voitures.reduce((s, v) => s + Number(v.nombre || 0), 0)

  const evolution = useMemo(() => {
    if (recettes.length < 2) return 0
    const dernier = recettes[recettes.length - 1]?.total || 0
    const precedent = recettes[recettes.length - 2]?.total || 0
    return precedent > 0 ? ((dernier - precedent) / precedent) * 100 : 0
  }, [recettes])

  // Top clients
  const topClients = useMemo(() => {
    const map = {}
    achats.forEach(a => {
      const client = clients.find(c => c.idcli === a.idcli)
      const nom = client?.nom || a.idcli
      if (!map[a.idcli]) map[a.idcli] = { name: nom, total: 0, count: 0 }
      map[a.idcli].total += Number(a.total || 0)
      map[a.idcli].count += 1
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [achats, clients])

  // Top voitures
  const topVoitures = useMemo(() => {
    const map = {}
    achats.forEach(a => {
      const v = voitures.find(v => v.idvoit === a.idvoit)
      const name = v?.design || a.idvoit
      if (!map[a.idvoit]) map[a.idvoit] = { name, count: 0, value: 0 }
      map[a.idvoit].count += Number(a.qte || 1)
      map[a.idvoit].value += Number(a.total || 0)
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6)
  }, [achats, voitures])

  // Achats par mois (pour le bar chart)
  const achatsParMois = useMemo(() => {
    const map = {}
    achats.forEach(a => {
      const date = new Date(a.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!map[key]) map[key] = { month: key, count: 0, total: 0 }
      map[key].count += 1
      map[key].total += Number(a.total || 0)
    })
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
  }, [achats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <BanknotesIcon className="w-5 h-5 text-slate-400" />
            {evolution !== 0 && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${evolution > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {evolution > 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                {Math.abs(evolution).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-slate-900">{fmt(totalRevenu)} Ar</p>
          <p className="text-xs text-slate-500 mt-0.5">Revenu total</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <ShoppingCartIcon className="w-5 h-5 text-slate-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">{nombreVentes}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ventes réalisées</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <UserGroupIcon className="w-5 h-5 text-slate-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">{nombreClients}</p>
          <p className="text-xs text-slate-500 mt-0.5">Clients enregistrés</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <TruckIcon className="w-5 h-5 text-slate-400 mb-2" />
          <p className="text-xl font-bold text-slate-900">{stockDisponible}</p>
          <p className="text-xs text-slate-500 mt-0.5">Véhicules en stock</p>
        </div>
      </div>

      {/* Graphique des recettes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Évolution des recettes</h2>
        {recettes.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={recettes} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => (v/1e6).toFixed(1)+'M'} tickLine={false} axisLine={false} dx={-4} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={2} fill="url(#rev)"
                dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyState message="Aucune recette enregistrée" />}
      </div>

      {/* Achats par mois + Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart achats par mois */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Achats par mois</h2>
          {achatsParMois.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={achatsParMois} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Achats" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="Aucun achat ce mois" />}
        </div>

        {/* Pie chart répartition */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Répartition par véhicule</h2>
          {topVoitures.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={topVoitures} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                  paddingAngle={2}>
                  {topVoitures.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="Aucune vente" />}
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Meilleurs clients</h2>
        {topClients.length > 0 ? (
          <div className="space-y-1">
            {topClients.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.count} achat(s)</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-700">{fmt(c.total)} Ar</p>
              </div>
            ))}
          </div>
        ) : <EmptyState message="Aucune vente enregistrée" />}
      </div>
    </div>
  )
}
