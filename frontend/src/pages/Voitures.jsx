import React, { useEffect, useState, useCallback } from 'react'
import * as api from '../api/index'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { 
  PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, PlusIcon,
  ChevronUpDownIcon, ExclamationTriangleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline'
import { fmt } from '../utils/format'

const EMPTY = { idvoit: '', design: '', prix: '', nombre: '' }

const rules = {
  idvoit: (v) => !v.trim() ? 'L\'identifiant du véhicule est obligatoire.' : v.trim().length < 3 ? 'L\'identifiant doit contenir au moins 3 caractères.' : null,
  design: (v) => !v.trim() ? 'La désignation du véhicule est obligatoire.' : v.trim().length < 2 ? 'La désignation est trop courte.' : null,
  prix: (v) => !v || isNaN(v) || Number(v) <= 0 ? 'Veuillez saisir un prix valide supérieur à 0 Ar.' : null,
  nombre: (v) => v === '' || isNaN(v) || Number(v) < 0 ? 'Veuillez saisir un stock valide (0 ou plus).' : null
}

export default function Voitures() {
  const [voitures, setVoitures] = useState([])
  const [filtered, setFiltered] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState({ key: 'idvoit', asc: true })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const data = await api.getVoitures(); setVoitures(data); setFiltered(data) }
    catch(e) { showToast('Erreur lors du chargement des véhicules.', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!search.trim()) { setFiltered(voitures); return }
    const s = search.toLowerCase()
    setFiltered(voitures.filter(v => v.idvoit?.toLowerCase().includes(s) || v.design?.toLowerCase().includes(s)))
  }, [search, voitures])

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sort.key], vb = b[sort.key]
    if (sort.key === 'prix' || sort.key === 'nombre') { va = Number(va)||0; vb = Number(vb)||0 }
    return (va < vb ? -1 : 1) * (sort.asc ? 1 : -1)
  })

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleSort = (key) => setSort({ key, asc: sort.key === key ? !sort.asc : true })

  const errors = {}
  Object.keys(rules).forEach(key => {
    if (key === 'idvoit' && editing) return
    const err = rules[key](form[key])
    if (err) errors[key] = err
  })

  const isValid = Object.keys(errors).length === 0

  const openCreate = () => { setForm(EMPTY); setEditing(null); setTouched({}); setShowModal(true) }
  const openEdit = (v) => { setForm({...v, prix: String(v.prix), nombre: String(v.nombre)}); setEditing(v.idvoit); setTouched({}); setShowModal(true) }

  const handleSubmit = async () => {
    setTouched({ idvoit: true, design: true, prix: true, nombre: true })
    if (!isValid) return
    setLoading(true)
    try {
      const d = { design: form.design, prix: parseInt(form.prix), nombre: parseInt(form.nombre) }
      if (editing) { await api.updateVoiture(editing, d); showToast('Le véhicule a été modifié avec succès.') }
      else { await api.createVoiture({ idvoit: form.idvoit.toUpperCase(), ...d }); showToast('Le véhicule a été créé avec succès.') }
      setShowModal(false)
      load()
    } catch(e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try { await api.deleteVoiture(deleteConfirm.id); load(); showToast('Le véhicule a été supprimé.') }
    catch(e) { showToast(e.message, 'error') }
    finally { setDeleteConfirm(null) }
  }

  const cols = [
    { key: 'idvoit', label: 'Identifiant' },
    { key: 'design', label: 'Désignation' },
    { key: 'prix', label: 'Prix' },
    { key: 'nombre', label: 'Stock' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Véhicules</h1>
          <p className="text-sm text-slate-500">{voitures.length} véhicule{voitures.length > 1 ? 's' : ''} enregistré{voitures.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          <PlusIcon className="w-4 h-4" /> Nouveau véhicule
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher par identifiant ou désignation..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {cols.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)} className={`px-5 py-3 font-semibold text-slate-600 cursor-pointer hover:text-slate-900 select-none ${c.key === 'prix' || c.key === 'nombre' ? 'text-right' : 'text-left'}`}>
                  <span className="inline-flex items-center gap-1">{c.label} {sort.key === c.key && <span className="text-xs">{sort.asc ? '↑' : '↓'}</span>}</span>
                </th>
              ))}
              <th className="px-5 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-400">Chargement des véhicules...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-400">{search ? 'Aucun véhicule ne correspond à cette recherche.' : 'Aucun véhicule enregistré.'}</td></tr>
            ) : sorted.map(v => (
              <tr key={v.idvoit} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-mono font-medium text-slate-700">{v.idvoit}</td>
                <td className="px-5 py-3 text-slate-800">{v.design}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">{fmt(v.prix)}</td>
                <td className="px-5 py-3 text-right">
                  <span className={Number(v.nombre) <= 2 ? 'text-amber-600 font-semibold' : 'text-slate-700'}>{v.nombre}</span>
                  {Number(v.nombre) <= 2 && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(v)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier ce véhicule"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm({ id: v.idvoit, design: v.design })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer ce véhicule"><TrashIcon className="w-4 h-4" /></button>
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editing ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{editing ? 'Modifiez les caractéristiques du véhicule.' : 'Renseignez les informations du véhicule à ajouter.'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {!editing && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Identifiant du véhicule</label>
                  <input type="text" value={form.idvoit} 
                    onChange={e => { setForm({...form, idvoit: e.target.value.toUpperCase()}); setTouched({...touched, idvoit: true}) }}
                    onBlur={() => setTouched({...touched, idvoit: true})}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:ring-1 outline-none transition-colors ${touched.idvoit && errors.idvoit ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'}`} 
                    placeholder="Ex: V004" />
                  {touched.idvoit && errors.idvoit && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.idvoit}</p>}
                  {touched.idvoit && !errors.idvoit && form.idvoit && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Identifiant valide.</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Désignation</label>
                <input type="text" value={form.design} 
                  onChange={e => { setForm({...form, design: e.target.value}); setTouched({...touched, design: true}) }}
                  onBlur={() => setTouched({...touched, design: true})}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-1 outline-none transition-colors ${touched.design && errors.design ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'}`} 
                  placeholder="Ex: TOYOTA HILUX" />
                {touched.design && errors.design && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.design}</p>}
                {touched.design && !errors.design && form.design && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Désignation valide.</p>}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prix unitaire (Ar)</label>
                  <input type="number" value={form.prix} 
                    onChange={e => { setForm({...form, prix: e.target.value}); setTouched({...touched, prix: true}) }}
                    onBlur={() => setTouched({...touched, prix: true})}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-1 outline-none transition-colors ${touched.prix && errors.prix ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'}`} 
                    placeholder="25000000" />
                  {touched.prix && errors.prix && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.prix}</p>}
                  {touched.prix && !errors.prix && form.prix && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Prix valide.</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantité en stock</label>
                  <input type="number" value={form.nombre} 
                    onChange={e => { setForm({...form, nombre: e.target.value}); setTouched({...touched, nombre: true}) }}
                    onBlur={() => setTouched({...touched, nombre: true})}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-1 outline-none transition-colors ${touched.nombre && errors.nombre ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'}`} 
                    placeholder="5" />
                  {touched.nombre && errors.nombre && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />{errors.nombre}</p>}
                  {touched.nombre && !errors.nombre && form.nombre !== '' && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Stock valide.</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Enregistrement en cours...' : editing ? 'Enregistrer les modifications' : 'Ajouter le véhicule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal 
          title="Supprimer le véhicule"
          message={`Êtes-vous sûr de vouloir supprimer le véhicule « ${deleteConfirm.design} » ? Cette action est définitive et entraînera la perte de toutes les données associées.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
