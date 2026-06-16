import React, { useState } from 'react'
import * as api from '../api/index'
import { XMarkIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { fmt, nombreEnLettres } from '../utils/format'

export default function FactureModal({ clients, formData, setFormData, clientAchats, setClientAchats, onSubmit, onClose }) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statut, setStatut] = useState('EN_ATTENTE')

  const handleClientChange = async (idcli) => {
    setFormData({ ...formData, idcli })
    if (!idcli) { setClientAchats([]); return }
    setLoading(true)
    try { setClientAchats(await api.getAchatsNonFactures(idcli)) }
    catch(e) { setClientAchats([]) }
    finally { setLoading(false) }
  }

  const total = clientAchats.reduce((s, a) => s + Number(a.total || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.idcli || clientAchats.length === 0) return
    setSubmitting(true)
    try { 
      await onSubmit({ 
        idcli: formData.idcli, 
        datefact: formData.datefact, 
        montant: total, 
        achats: clientAchats.map(a => a.numachat),
        statut: statut
      }) 
    }
    catch(e) { alert('Erreur: ' + e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex justify-between z-10">
          <div><h2 className="text-lg font-bold">Nouvelle facture</h2><p className="text-xs text-slate-500">Achats non facturés automatiques</p></div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Client</label>
              <select value={formData.idcli} onChange={e => handleClientChange(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" required>
                <option value="">Sélectionner...</option>
                {clients.map(c => <option key={c.idcli} value={c.idcli}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Statut</label>
              <select value={statut} onChange={e => setStatut(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm">
                <option value="EN_ATTENTE">En attente</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Date</label>
            <input type="date" value={formData.datefact} onChange={e => setFormData({...formData, datefact: e.target.value})} className="w-full px-3 py-2.5 border rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Achats</label>
            {!formData.idcli ? <div className="bg-slate-50 border rounded-lg p-6 text-center text-sm text-slate-400">Sélectionnez un client</div>
            : loading ? <div className="bg-slate-50 border rounded-lg p-6 text-center"><ArrowPathIcon className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" /><p className="text-sm text-slate-400">Chargement...</p></div>
            : clientAchats.length === 0 ? <div className="bg-amber-50 border border-amber-100 rounded-lg p-6 text-center text-sm text-amber-700">Aucun achat à facturer</div>
            : <div className="border rounded-lg overflow-hidden"><table className="w-full text-sm">
                <thead><tr className="bg-slate-50"><th className="text-left px-3 py-2">N°</th><th className="text-left px-3 py-2">Véhicule</th><th className="text-center px-3 py-2">Qté</th><th className="text-right px-3 py-2">Total</th></tr></thead>
                <tbody>{clientAchats.map((a,i) => <tr key={i}><td className="px-3 py-2">{a.numachat}</td><td className="px-3 py-2">{a.design}</td><td className="px-3 py-2 text-center">{a.qte}</td><td className="px-3 py-2 text-right font-medium">{fmt(a.total)}</td></tr>)}</tbody>
                <tfoot><tr className="bg-emerald-50 border-t-2 border-emerald-200"><td colSpan={3} className="px-3 py-2 text-right font-bold">TOTAL</td><td className="px-3 py-2 text-right font-bold text-emerald-700">{fmt(total)}</td></tr></tfoot>
              </table></div>
            }
          </div>
          {clientAchats.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Articles</span><span className="font-medium">{clientAchats.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold text-emerald-700">{fmt(total)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">En lettres</span><span className="italic">{nombreEnLettres(total)} ariary</span></div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
            <button type="submit" disabled={clientAchats.length === 0 || submitting} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {submitting ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /></> : <><PlusIcon className="w-4 h-4" />Générer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
