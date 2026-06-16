import React, { useEffect, useState, useCallback, useRef } from 'react'
import * as api from '../api/index'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { 
  TrashIcon, PencilIcon, MagnifyingGlassIcon, XMarkIcon, PlusIcon,
  CalendarIcon, UserIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { fmt } from '../utils/format'

const EMPTY = { numachat: '', idcli: '', idvoit: '', date: new Date().toISOString().split('T')[0], qte: '1' }

const rules = {
  numachat: (v) => !v.trim() ? 'Le numéro d\'achat est obligatoire.' : v.trim().length < 3 ? 'Minimum 3 caractères.' : null,
  idcli: (v) => !v ? 'Veuillez sélectionner un client.' : null,
  idvoit: (v) => !v ? 'Veuillez sélectionner un véhicule.' : null,
  date: (v) => !v ? 'La date est obligatoire.' : null,
  qte: (v) => !v || isNaN(v) || parseInt(v) <= 0 ? 'Quantité invalide.' : null
}

export default function Achats() {
  const [achats, setAchats] = useState([])
  const [filtered, setFiltered] = useState([])
  const [clients, setClients] = useState([])
  const [voitures, setVoitures] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedVoiture, setSelectedVoiture] = useState(null)
  const debounceRef = useRef(null)

  const load = useCallback(async (from, to) => {
    setLoading(true)
    try {
      let data = []
      if (from && to) { data = await api.getAchatsByDate(from, to) }
      else { data = await api.getAchats() }
      const arr = Array.isArray(data) ? data : []
      setAchats(arr)
      setFiltered(arr)
    } catch(e) { 
      showToast('Erreur lors du chargement des achats.', 'error')
      setAchats([])
      setFiltered([])
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load('', ''); api.getClients().then(setClients).catch(() => {}); api.getVoitures().then(setVoitures).catch(() => {}) }, [load])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(dateFrom, dateTo), 300)
    return () => clearTimeout(debounceRef.current)
  }, [dateFrom, dateTo, load])

  useEffect(() => {
    if (!search.trim()) { setFiltered(achats); return }
    const s = search.toLowerCase()
    setFiltered(achats.filter(a => a.numachat?.toLowerCase().includes(s) || a.nom?.toLowerCase().includes(s) || a.design?.toLowerCase().includes(s)))
  }, [search, achats])

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000) }

  const errors = {}
  if (!editing) { const e = rules.numachat(form.numachat); if (e) errors.numachat = e }
  Object.entries({ idcli: rules.idcli, idvoit: rules.idvoit, date: rules.date, qte: rules.qte }).forEach(([k, fn]) => { const e = fn(form[k]); if (e) errors[k] = e })

  const stockError = selectedVoiture && parseInt(form.qte) > selectedVoiture.nombre
    ? `Stock insuffisant. Disponible : ${selectedVoiture.nombre}` : null

  const isValid = Object.keys(errors).length === 0 && !stockError

  const openCreate = () => { setForm(EMPTY); setEditing(null); setTouched({}); setSelectedVoiture(null); setShowModal(true) }
  
  const openEdit = (achat) => {
    setForm({ numachat: achat.numachat, idcli: achat.idcli, idvoit: achat.idvoit, date: achat.date, qte: String(achat.qte) })
    setEditing(achat.numachat)
    setSelectedVoiture(voitures.find(v => v.idvoit === achat.idvoit))
    setTouched({})
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setTouched({ numachat: true, idcli: true, idvoit: true, date: true, qte: true })
    if (!isValid) return
    setLoading(true)
    try {
      const payload = { idcli: form.idcli, idvoit: form.idvoit, date: form.date, qte: parseInt(form.qte) }
      if (editing) {
        await api.updateAchat(editing, payload)
        showToast('Achat modifié avec succès.')
      } else {
        await api.createAchat({ numachat: form.numachat.toUpperCase(), ...payload })
        showToast('Achat enregistré avec succès.')
      }
      setShowModal(false)
      load(dateFrom, dateTo)
      api.getVoitures().then(setVoitures)
    } catch(e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await api.deleteAchat(deleteConfirm.id)
      load(dateFrom, dateTo)
      api.getVoitures().then(setVoitures)
      showToast('Achat supprimé. Le stock a été restauré.')
    } catch(e) { showToast(e.message, 'error') }
    finally { setDeleteConfirm(null) }
  }

  const total = Array.isArray(filtered) ? filtered.reduce((s, a) => s + (Number(a.total) || 0), 0) : 0

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Achats</h1>
          <p className="text-sm text-slate-500">{filtered.length} achat(s) · Total : {fmt(total)}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          <PlusIcon className="w-4 h-4" /> Nouvel achat
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Du</label>
            <div className="relative"><CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-300 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Au</label>
            <div className="relative"><CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-300 outline-none" />
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <XMarkIcon className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          )}
          {loading && <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-400 ml-2" />}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher par n° achat, client, véhicule..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-300 outline-none" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><XMarkIcon className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3 font-semibold text-slate-600">N° Achat</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Client</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Véhicule</th>
            <th className="text-center px-5 py-3 font-semibold text-slate-600">Qté</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Total</th>
            <th className="text-center px-5 py-3 font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
            {loading && filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400">Chargement des achats...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                {search ? 'Aucun achat trouvé.' : dateFrom || dateTo ? 'Aucun achat sur cette période.' : 'Aucun achat enregistré.'}
              </td></tr>
            ) : filtered.map(a => (
              <tr key={a.numachat} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-mono font-medium">{a.numachat}</td>
                <td className="px-5 py-3 text-slate-600">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-5 py-3"><div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-slate-400" />{a.nom}</div></td>
                <td className="px-5 py-3">{a.design}</td>
                <td className="px-5 py-3 text-center font-medium">{a.qte}</td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-700">{fmt(a.total)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ id: a.numachat, label: a.numachat })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
              <div><h2 className="text-lg font-bold text-slate-900">{editing ? 'Modifier l\'achat' : 'Nouvel achat'}</h2><p className="text-xs text-slate-500 mt-0.5">{editing ? 'Modifiez les informations de l\'achat.' : 'Enregistrez une vente de véhicule.'}</p></div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {!editing && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Numéro d'achat</label>
                  <input type="text" value={form.numachat}
                    onChange={e => { setForm({...form, numachat: e.target.value.toUpperCase()}); setTouched({...touched, numachat: true}) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono outline-none ${touched.numachat && errors.numachat ? 'border-red-300' : 'border-slate-200 focus:border-slate-400'}`} placeholder="ACH004" />
                  {touched.numachat && errors.numachat && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.numachat}</p>}
                  {touched.numachat && !errors.numachat && form.numachat && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Numéro valide.</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                <select value={form.idcli} onChange={e => { setForm({...form, idcli: e.target.value}); setTouched({...touched, idcli: true}) }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none bg-white ${touched.idcli && errors.idcli ? 'border-red-300' : 'border-slate-200 focus:border-slate-400'}`}>
                  <option value="">Sélectionner un client...</option>
                  {clients.map(c => <option key={c.idcli} value={c.idcli}>{c.nom}</option>)}
                </select>
                {touched.idcli && errors.idcli && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.idcli}</p>}
                {touched.idcli && !errors.idcli && form.idcli && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Client sélectionné.</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Véhicule</label>
                <select value={form.idvoit}
                  onChange={e => { setForm({...form, idvoit: e.target.value, qte: '1'}); setSelectedVoiture(voitures.find(v => v.idvoit === e.target.value)); setTouched({...touched, idvoit: true, qte: true}) }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none bg-white ${touched.idvoit && errors.idvoit ? 'border-red-300' : 'border-slate-200 focus:border-slate-400'}`}>
                  <option value="">Sélectionner un véhicule...</option>
                  {voitures.map(v => <option key={v.idvoit} value={v.idvoit}>{v.design} — {fmt(v.prix)} (stock: {v.nombre})</option>)}
                </select>
                {touched.idvoit && errors.idvoit && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.idvoit}</p>}
                {touched.idvoit && !errors.idvoit && form.idvoit && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Véhicule sélectionné.</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => { setForm({...form, date: e.target.value}); setTouched({...touched, date: true}) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none ${touched.date && errors.date ? 'border-red-300' : 'border-slate-200 focus:border-slate-400'}`} />
                  {touched.date && errors.date && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantité</label>
                  <input type="number" min="1" value={form.qte}
                    onChange={e => { setForm({...form, qte: e.target.value}); setTouched({...touched, qte: true}) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none ${(touched.qte && errors.qte) || stockError ? 'border-red-300' : 'border-slate-200 focus:border-slate-400'}`} />
                  {touched.qte && errors.qte && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.qte}</p>}
                  {stockError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{stockError}</p>}
                  {touched.qte && !errors.qte && !stockError && form.qte && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Quantité valide.</p>}
                </div>
              </div>
              {selectedVoiture && form.qte > 0 && !stockError && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-sm text-slate-600">Montant total</span>
                  <span className="text-lg font-bold text-slate-900">{fmt(selectedVoiture.prix * parseInt(form.qte || 0))}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
                {loading ? 'Enregistrement...' : editing ? 'Enregistrer les modifications' : 'Enregistrer l\'achat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal 
          title="Supprimer l'achat"
          message={`Êtes-vous sûr de vouloir supprimer l'achat « ${deleteConfirm.label} » ? Le stock du véhicule sera automatiquement restauré.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
