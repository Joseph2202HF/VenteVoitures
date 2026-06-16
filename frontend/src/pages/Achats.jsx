import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import Toast from '../components/Toast'
import { 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  TruckIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const fmt = (n) => Number(n).toLocaleString('fr-MG') + ' Ar'
const EMPTY = { numachat: '', idcli: '', idvoit: '', date: new Date().toISOString().split('T')[0], qte: 1 }

export default function Achats() {
  const [achats, setAchats] = useState([])
  const [filteredAchats, setFilteredAchats] = useState([])
  const [clients, setClients] = useState([])
  const [voitures, setVoitures] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [showModal, setShowModal] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedVoiture, setSelectedVoiture] = useState(null)

  const load = useCallback(async (f, t) => {
    setLoading(true)
    try {
      const data = await api.getAchats(f, t)
      setAchats(data)
      setFilteredAchats(data)
    } catch (error) {
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load('', '')
    api.getClients().then(setClients)
    api.getVoitures().then(setVoitures)
  }, [load])

  // Filtrage local
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAchats(achats)
      return
    }
    const filtered = achats.filter(a =>
      a.numachat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.design?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredAchats(filtered)
  }, [searchTerm, achats])

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async () => {
    // Validation
    if (!form.numachat?.trim()) {
      showToast('Le numéro d\'achat est requis', 'error')
      return
    }
    if (!form.idcli) {
      showToast('Veuillez sélectionner un client', 'error')
      return
    }
    if (!form.idvoit) {
      showToast('Veuillez sélectionner une voiture', 'error')
      return
    }
    if (!form.date) {
      showToast('La date est requise', 'error')
      return
    }
    const qte = parseInt(form.qte)
    if (isNaN(qte) || qte <= 0) {
      showToast('La quantité doit être valide', 'error')
      return
    }

    // Vérifier le stock
    const voiture = voitures.find(v => v.idvoit === form.idvoit)
    if (voiture && qte > voiture.nombre) {
      showToast(`Stock insuffisant (${voiture.nombre} disponible(s))`, 'error')
      return
    }

    setLoading(true)
    try {
      await api.createAchat({ ...form, qte: parseInt(form.qte) })
      setShowModal(false)
      load(dateFrom, dateTo)
      api.getVoitures().then(setVoitures)
      showToast('Achat enregistré avec succès', 'success')
    } catch(error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id, numachat) => {
    setDeleteConfirm({ id, numachat })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      await api.deleteAchat(deleteConfirm.id)
      load(dateFrom, dateTo)
      api.getVoitures().then(setVoitures)
      showToast('Achat supprimé', 'success')
      setDeleteConfirm(null)
    } catch(error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    load(dateFrom, dateTo)
  }

  const resetFilters = () => {
    setDateFrom('')
    setDateTo('')
    load('', '')
  }

  // Calcul des totaux
  const totalAchats = achats.length
  const montantTotal = achats.reduce((sum, a) => sum + (Number(a.total) || 0), 0)
  const totalVendus = achats.reduce((sum, a) => sum + (Number(a.qte) || 0), 0)

  const cols = [
    { key: 'numachat', label: 'N° Achat' },
    { key: 'date', label: 'Date' },
    { key: 'nom', label: 'Client' },
    { key: 'design', label: 'Voiture' },
    { key: 'qte', label: 'Qté' },
    { key: 'total', label: 'Total', render: r => fmt(r.total) },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Achats</h1>
              <p className="text-slate-500 text-sm mt-1">
                {filteredAchats.length} achat{filteredAchats.length > 1 ? 's' : ''} enregistré(s)
              </p>
            </div>
            
            <button
              onClick={() => { setForm(EMPTY); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              <PlusIcon className="w-4 h-4" />
              Nouvel achat
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total achats</p>
                <p className="text-xl font-bold text-slate-700">{totalAchats}</p>
              </div>
              <ShoppingBagIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Chiffre d'affaires</p>
                <p className="text-sm font-bold text-slate-700 truncate">{fmt(montantTotal)}</p>
              </div>
              <CurrencyDollarIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Véhicules vendus</p>
                <p className="text-xl font-bold text-slate-700">{totalVendus}</p>
              </div>
              <TruckIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
              />
            </div>
          </div>
          <button
            onClick={applyFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-all"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Filtrer
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-all"
          >
            Reset
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par n° achat, client, voiture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading && filteredAchats.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {cols.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAchats.length === 0 ? (
                    <tr>
                      <td colSpan={cols.length + 1} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBagIcon className="w-10 h-10 text-slate-300" />
                          <p className="text-slate-400 text-sm">
                            {searchTerm ? 'Aucun résultat' : 'Aucun achat enregistré'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAchats.map((achat) => (
                      <tr key={achat.numachat} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-slate-700">
                            {achat.numachat}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{achat.date}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">{achat.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-700">{achat.design}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-700">{achat.qte}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-emerald-600">{fmt(achat.total)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(achat.numachat, achat.numachat)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Supprimer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL - Nouvel achat */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div 
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Nouvel achat</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Enregistrer une vente de véhicule</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    N° Achat <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-slate-400 text-sm font-mono">#</span>
                    </div>
                    <input
                      type="text"
                      value={form.numachat}
                      onChange={(e) => setForm({...form, numachat: e.target.value.toUpperCase()})}
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                      placeholder="ACH001"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Numéro unique de transaction</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Client <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.idcli}
                    onChange={(e) => setForm({...form, idcli: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all bg-white"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map(c => (
                      <option key={c.idcli} value={c.idcli}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Voiture <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.idvoit}
                    onChange={(e) => {
                      setForm({...form, idvoit: e.target.value})
                      const v = voitures.find(v => v.idvoit === e.target.value)
                      setSelectedVoiture(v)
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all bg-white"
                  >
                    <option value="">-- Sélectionner une voiture --</option>
                    {voitures.map(v => (
                      <option key={v.idvoit} value={v.idvoit}>
                        {v.design} — {fmt(v.prix)} (stock: {v.nombre})
                      </option>
                    ))}
                  </select>
                  {selectedVoiture && (
                    <p className="text-xs text-slate-500 mt-2">
                      💰 Prix unitaire: {fmt(selectedVoiture.prix)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({...form, date: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Quantité <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.qte}
                      onChange={(e) => setForm({...form, qte: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Aperçu total */}
                {selectedVoiture && form.qte > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Total</span>
                      <span className="text-lg font-bold text-slate-800">
                        {fmt(selectedVoiture.prix * parseInt(form.qte || 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 px-6 py-5 bg-slate-50 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-3 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-3 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Enregistrement...</span>
                    </div>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmation suppression */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div 
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 text-center">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-red-50 rounded-full">
                  <TrashIcon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Confirmer la suppression</h3>
                <p className="text-sm text-slate-500">
                  Supprimer l'achat <span className="font-medium text-slate-700">"{deleteConfirm.numachat}"</span> ?
                </p>
                <p className="text-xs text-slate-400 mt-2">Le stock sera automatiquement restauré.</p>
              </div>
              <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right">
            <div className={`flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-lg border-l-4 ${
              toast.type === 'success' ? 'border-green-500' : 'border-red-500'
            }`}>
              <span className="text-sm">{toast.message}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .animate-in {
          animation-duration: 200ms;
          animation-fill-mode: both;
        }
        .slide-in-from-right {
          animation-name: slide-in-from-right;
        }
        @keyframes slide-in-from-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
