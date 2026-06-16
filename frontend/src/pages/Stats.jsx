import React, { useEffect, useState, useMemo } from 'react'
import * as api from '../api/index'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  BanknotesIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

/* ── Formatage ───────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString('fr-FR') + ' Ar'

/* ── Tooltip personnalisé ────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #d0d0d0',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      fontSize: 13
    }}>
      <p style={{ color: '#888', fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 500, color: '#1c1c1e' }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

/* ── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, trend, isMoney, alert }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e0e0e0',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {/* Ligne haute : icône + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ width: 16, height: 16, color: '#5f5f5f' }} />
        </div>

        {trend !== undefined && trend !== 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 99,
            background: trend > 0 ? '#e8f5e9' : '#fce8e6',
            color: trend > 0 ? '#2e7d32' : '#c5221f'
          }}>
            {trend > 0
              ? <ArrowTrendingUpIcon style={{ width: 12, height: 12 }} />
              : <ArrowTrendingDownIcon style={{ width: 12, height: 12 }} />
            }
            {Math.abs(trend).toFixed(0)} %
          </span>
        )}

        {alert > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 99,
            background: '#fff8e1',
            color: '#b06000'
          }}>
            <ExclamationTriangleIcon style={{ width: 12, height: 12 }} />
            {alert} faible{alert > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Valeur */}
      <p style={{
        fontSize: isMoney ? 17 : 24,
        fontWeight: 500,
        color: '#1c1c1e',
        letterSpacing: '-0.02em',
        lineHeight: 1
      }}>
        {isMoney ? fmt(value) : value}
      </p>

      {/* Label */}
      <p style={{ fontSize: 12, color: '#888', marginTop: -2 }}>{label}</p>
    </div>
  )
}

/* ── Section title ───────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 500,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: 12
    }}>
      {children}
    </p>
  )
}

/* ── Card wrapper ────────────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e0e0e0',
      borderRadius: 12,
      padding: '16px 18px',
      ...style
    }}>
      {children}
    </div>
  )
}

/* ── Ligne client/véhicule ───────────────────────────────────── */
function RankedRow({ rank, primary, secondary, right }) {
  const isFirst = rank === 1
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px',
      borderRadius: 8,
      cursor: 'default'
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{
        fontSize: 11,
        fontWeight: 500,
        width: 16,
        textAlign: 'right',
        flexShrink: 0,
        color: isFirst ? '#b06000' : '#bbb'
      }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#1c1c1e',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {primary}
        </p>
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{secondary}</p>
      </div>
      {right && (
        <p style={{ fontSize: 12, fontWeight: 500, color: '#3c3c3e', whiteSpace: 'nowrap' }}>
          {right}
        </p>
      )}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────── */
function Empty({ message = 'Aucune donnée' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 80,
      fontSize: 13,
      color: '#bbb'
    }}>
      {message}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════ */
/*  Composant principal Stats                                     */
/* ══════════════════════════════════════════════════════════════ */
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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  /* ── Calculs ────────────────────────────────────────────────── */
  const totalRevenu = recettes.reduce((s, r) => s + Number(r.total || 0), 0)

  const evolution = useMemo(() => {
    if (recettes.length < 2) return 0
    const a = Number(recettes[recettes.length - 1]?.total || 0)
    const b = Number(recettes[recettes.length - 2]?.total || 0)
    return b > 0 ? ((a - b) / b) * 100 : 0
  }, [recettes])

  const stockTotal = voitures.reduce((s, v) => s + Number(v.nombre || 0), 0)
  const stockFaible = voitures.filter(v => Number(v.nombre) <= 2).length

  const topClients = useMemo(() => {
    const m = {}
    achats.forEach(a => {
      const c = clients.find(x => x.idcli === a.idcli)
      if (!m[a.idcli]) m[a.idcli] = { name: c?.nom || a.idcli, total: 0, count: 0 }
      m[a.idcli].total += Number(a.total || 0)
      m[a.idcli].count += 1
    })
    return Object.values(m).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [achats, clients])

  const topVoitures = useMemo(() => {
    const m = {}
    achats.forEach(a => {
      const v = voitures.find(x => x.idvoit === a.idvoit)
      if (!m[a.idvoit]) m[a.idvoit] = { name: v?.design || a.idvoit, total: 0, count: 0 }
      m[a.idvoit].total += Number(a.total || 0)
      m[a.idvoit].count += Number(a.qte || 1)
    })
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [achats, voitures])

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 320
    }}>
      <div style={{
        width: 28,
        height: 28,
        border: '2px solid #e0e0e0',
        borderTopColor: '#5f5f5f',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  /* ── Rendu ──────────────────────────────────────────────────── */
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      paddingBottom: 32
    }}>

      {/* Titre */}
      <h1 style={{
        fontSize: 18,
        fontWeight: 500,
        color: '#1c1c1e',
        letterSpacing: '-0.01em'
      }}>
        Tableau de bord
      </h1>

      {/* ── KPIs ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10
      }}>
        <KpiCard
          label="Revenu total"
          value={totalRevenu}
          icon={BanknotesIcon}
          trend={evolution}
          isMoney
        />
        <KpiCard
          label="Ventes"
          value={achats.length}
          icon={ShoppingCartIcon}
        />
        <KpiCard
          label="Clients"
          value={clients.length}
          icon={UserGroupIcon}
        />
        <KpiCard
          label="En stock"
          value={stockTotal}
          icon={TruckIcon}
          alert={stockFaible}
        />
      </div>

      {/* ── Graphique recettes ────────────────────────────────── */}
      <Card>
        <SectionLabel>Évolution des recettes</SectionLabel>
        {recettes.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={recettes}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c1c1e" stopOpacity={0.07} />
                  <stop offset="100%" stopColor="#1c1c1e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#aaa', fontWeight: 400 }}
                tickLine={false}
                axisLine={false}
                dy={6}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#aaa', fontWeight: 400 }}
                tickFormatter={v => (v / 1_000_000).toFixed(1) + 'M'}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#1c1c1e"
                strokeWidth={1.5}
                fill="url(#areaGrad)"
                dot={{ r: 3, fill: '#1c1c1e', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#1c1c1e', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty message="Aucune recette enregistrée" />
        )}
      </Card>

      {/* ── Top clients + Top véhicules ───────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 10
      }}>

        {/* Top clients */}
        <Card>
          <SectionLabel>Top clients</SectionLabel>
          {topClients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topClients.map((c, i) => (
                <RankedRow
                  key={i}
                  rank={i + 1}
                  primary={c.name}
                  secondary={`${c.count} achat${c.count > 1 ? 's' : ''}`}
                  right={fmt(c.total)}
                />
              ))}
            </div>
          ) : (
            <Empty message="Aucune vente" />
          )}
        </Card>

        {/* Top véhicules */}
        <Card>
          <SectionLabel>Véhicules les plus vendus</SectionLabel>
          {topVoitures.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topVoitures.map((v, i) => (
                <RankedRow
                  key={i}
                  rank={i + 1}
                  primary={v.name}
                  secondary={`${v.count} vendu${v.count > 1 ? 's' : ''} · ${fmt(v.total)}`}
                />
              ))}
            </div>
          ) : (
            <Empty message="Aucune vente" />
          )}
        </Card>

      </div>
    </div>
  )
}
