import React, { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../services/api'
import Toast from '../components/Toast'
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  ChevronUpDownIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const EMPTY = { idvoit: '', design: '', prix: '', nombre: '' }
const fmt = (n) => Number(n).toLocaleString('fr-MG') + ' Ar'

export default function Voitures() {
  const [voitures, setVoitures] = useState([])
  const [filteredVoitures, setFilteredVoitures] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'idvoit', direction: 'asc' })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const searchTimeoutRef = useRef(null)

  const load = useCallback(async (query = '') => {
    setLoading(true)
    try {
      const data = await api.getVoitures(query)
      setVoitures(data)
      setFilteredVoitures(data)
    } catch (error) {
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load('') }, [load])

  // Filtrage local quand search change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVoitures(voitures)
      return
    }
    const filtered = voitures.filter(v =>
      v.idvoit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.design?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredVoitures(filtered)
  }, [searchTerm, voitures])

  // Tri des données
  const sortedVoitures = [...filteredVoitures].sort((a, b) => {
    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]
    
    // Tri spécial pour le prix (numérique)
    if (sortConfig.key === 'prix') {
      aVal = Number(aVal) || 0
      bVal = Number(bVal) || 0
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Debounce pour la recherche API
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => load(value), 400)
  }

  const openCreate = () => {
    setForm(EMPTY)
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (v) => {
    setForm(v)
    setEditing(v.idvoit)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    // Validation
    if (!form.design?.trim()) {
      showToast('La désignation est requise', 'error')
      return
    }
    
    const prix = parseInt(form.prix)
    const nombre = parseInt(form.nombre)
    
    if (isNaN(prix) || prix <= 0) {
      showToast('Le prix doit être un nombre valide', 'error')
      return
    }
    
    if (isNaN(nombre) || nombre < 0) {
      showToast('Le stock doit être un nombre valide', 'error')
      return
    }

    setLoading(true)
    try {
      const d = { design: form.design, prix, nombre }
      
      if (editing) {
        await api.updateVoiture(editing, d)
        showToast('Voiture modifiée avec succès', 'success')
      } else {
        if (!form.idvoit?.trim()) {
          showToast("L'ID voiture est requis", 'error')
          setLoading(false)
          return
        }
        await api.createVoiture({ idvoit: form.idvoit.toUpperCase(), ...d })
        showToast('Voiture ajoutée avec succès', 'success')
      }
      setShowModal(false)
      load(searchTerm)
    } catch(error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id, design) => {
    setDeleteConfirm({ id, design })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      await api.deleteVoiture(deleteConfirm.id)
      load(searchTerm)
      showToast('Voiture supprimée', 'success')
      setDeleteConfirm(null)
    } catch(error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const requestSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const cols = [
    { key: 'idvoit', label: 'ID Voiture', sortable: true },
    { key: 'design', label: 'Désignation', sortable: true },
    { key: 'prix', label: 'Prix', sortable: true },
    { key: 'nombre', label: 'Stock', sortable: true },
  ]

  // Statistiques
  const totalVoitures = voitures.length
  const valeurStock = voitures.reduce((sum, v) => sum + (Number(v.prix) * Number(v.nombre)), 0)
  const stockFaible = voitures.filter(v => Number(v.nombre) <= 2).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Voitures</h1>
              <p className="text-slate-500 text-sm mt-1">
                {filteredVoitures.length} véhicule{filteredVoitures.length > 1 ? 's' : ''} au total
              </p>
            </div>
            
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              <PlusIcon className="w-4 h-4" />
              Nouvelle voiture
            </button>
          </div>
        </div>

        {/* Mini stats inline */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total véhicules</p>
                <p className="text-xl font-bold text-slate-700">{totalVoitures}</p>
              </div>
              <TruckIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Valeur du stock</p>
                <p className="text-sm font-bold text-slate-700 truncate">{fmt(valeurStock)}</p>
              </div>
              <CurrencyDollarIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg px-4 py-3 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Stock faible</p>
                <p className={`text-xl font-bold ${stockFaible > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {stockFaible}
                </p>
              </div>
              <CubeIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par ID ou désignation..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  load('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading && filteredVoitures.length === 0 ? (
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
                        onClick={() => col.sortable && requestSort(col.key)}
                        className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${
                          col.sortable ? 'cursor-pointer hover:text-slate-700 select-none' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.sortable && <ChevronUpDownIcon className="w-3.5 h-3.5" />}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedVoitures.length === 0 ? (
                    <tr>
                      <td colSpan={cols.length + 1} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <TruckIcon className="w-10 h-10 text-slate-300" />
                          <p className="text-slate-400 text-sm">
                            {searchTerm ? 'Aucun résultat' : 'Aucune voiture enregistrée'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedVoitures.map((voiture) => {
                      const stockFaibleItem = Number(voiture.nombre) <= 2
                      return (
                        <tr key={voiture.idvoit} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-medium text-slate-700">
                              {voiture.idvoit}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-800">{voiture.design}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-slate-700">{fmt(voiture.prix)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-sm font-medium ${stockFaibleItem ? 'text-amber-600' : 'text-slate-700'}`}>
                                {voiture.nombre}
                              </span>
                              {stockFaibleItem && (
                                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" title="Stock faible" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(voiture)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                title="Modifier"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(voiture.idvoit, voiture.design)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                title="Supprimer"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div 
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editing ? 'Modifier la voiture' : 'Ajouter une voiture'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editing ? 'Modifiez les informations' : 'Renseignez les caractéristiques'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-5">
                {!editing && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      ID Voiture <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 text-sm font-mono">#</span>
                      </div>
                      <input
                        type="text"
                        value={form.idvoit}
                        onChange={(e) => setForm({...form, idvoit: e.target.value.toUpperCase()})}
                        className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                        placeholder="V001"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Identifiant unique pour ce véhicule</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Désignation <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.design}
                    onChange={(e) => setForm({...form, design: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                    placeholder="MITSUBISHI PAJERO"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Prix (Ar) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.prix}
                      onChange={(e) => setForm({...form, prix: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                      placeholder="25000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Stock <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.nombre}
                      onChange={(e) => setForm({...form, nombre: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
                      placeholder="5"
                    />
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    💡 Le prix sera affiché au format {fmt(25000000)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-5 bg-slate-50 border-t border-slate-100">
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
                      <span>{editing ? 'Enregistrement...' : 'Création...'}</span>
                    </div>
                  ) : (
                    editing ? 'Enregistrer' : 'Créer'
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
                  Supprimer <span className="font-medium text-slate-700">"{deleteConfirm.design}"</span> ?
                </p>
                <p className="text-xs text-slate-400 mt-2">Cette action est irréversible.</p>
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
