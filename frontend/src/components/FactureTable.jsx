import React, { useState, useEffect } from 'react'
import { EyeIcon, TrashIcon, MagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon, ClockIcon, XCircleIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { fmt } from '../utils/format'

const STATUS = {
  'EN_ATTENTE': { bg: 'bg-amber-50', text: 'text-amber-700', icon: ClockIcon, label: 'En attente' },
  'PAYEE': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircleIcon, label: 'Payée' },
  'ANNULEE': { bg: 'bg-red-50', text: 'text-red-700', icon: XCircleIcon, label: 'Annulée' }
}

export default function FactureTable({ factures, loading, onView, onDelete, onMarkPaid, onRefresh }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState({ by: 'datefact', asc: false })
  const [filtered, setFiltered] = useState([])

  useEffect(() => {
    let result = [...factures]
    if (search) result = result.filter(f => f.numfact?.toLowerCase().includes(search.toLowerCase()) || f.client_nom?.toLowerCase().includes(search.toLowerCase()))
    if (status) result = result.filter(f => f.statut === status)
    result.sort((a, b) => {
      let va = a[sort.by], vb = b[sort.by]
      if (sort.by === 'datefact') { va = new Date(va).getTime(); vb = new Date(vb).getTime() }
      if (sort.by === 'montant') { va = Number(va); vb = Number(vb) }
      return (va < vb ? -1 : 1) * (sort.asc ? 1 : -1)
    })
    setFiltered(result)
  }, [factures, search, status, sort])

  const toggleSort = (col) => setSort({ by: col, asc: sort.by === col ? !sort.asc : true })

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="">Tous</option><option value="EN_ATTENTE">En attente</option><option value="PAYEE">Payée</option><option value="ANNULEE">Annulée</option>
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"><ArrowPathIcon className="w-4 h-4" /></button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {[{k:'numfact',l:'N° Facture'},{k:'client_nom',l:'Client'},{k:'datefact',l:'Date'},{k:'montant',l:'Montant',r:true}].map(c => (
                <th key={c.k} onClick={() => toggleSort(c.k)} className={`px-5 py-3 font-semibold text-slate-600 cursor-pointer hover:text-slate-900 ${c.r ? 'text-right' : 'text-left'}`}>
                  {c.l} {sort.by === c.k && (sort.asc ? '↑' : '↓')}
                </th>
              ))}
              <th className="px-5 py-3 text-center font-semibold text-slate-600">Statut</th>
              <th className="px-5 py-3 text-center font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-400">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-400">Aucune facture</td></tr>
            ) : filtered.map(f => {
              const s = STATUS[f.statut] || STATUS['EN_ATTENTE']
              const Icon = s.icon
              return (
                <tr key={f.numfact} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => onView(f.numfact)}>
                  <td className="px-5 py-3 font-medium">{f.numfact}</td>
                  <td className="px-5 py-3">{f.client_nom}<p className="text-xs text-slate-400">{f.nb_achats || 0} article(s)</p></td>
                  <td className="px-5 py-3 text-slate-600">{new Date(f.datefact).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmt(f.montant)}</td>
                  <td className="px-5 py-3 text-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}><Icon className="w-3 h-3" />{s.label}</span></td>
                  <td className="px-5 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center gap-1">
                      {f.statut === 'EN_ATTENTE' && <button onClick={() => onMarkPaid(f.numfact)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Marquer payée"><BanknotesIcon className="w-4 h-4" /></button>}
                      <button onClick={() => onView(f.numfact)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><EyeIcon className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(f.numfact)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
