import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import Toast from '../components/Toast'
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  UserPlusIcon,
  ChevronUpDownIcon,
  UsersIcon,
  PhoneIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const EMPTY = { idcli: '', nom: '', contact: '' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'idcli', direction: 'asc' })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getClients()
      setClients(data)
      setFilteredClients(data)
    } catch (error) {
      showToast('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.idcli?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredClients(filtered)
  }, [searchTerm, clients])

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Validation d'un champ spécifique
  const validateField = (field, value, formData = form) => {
    switch (field) {
      case 'idcli':
        if (!editing) {
          if (!value?.trim()) {
            return "L'identifiant client est requis."
          } else if (value.trim().length < 2) {
            return "L'identifiant doit comporter au minimum 2 caractères."
          } else if (value.trim().length > 10) {
            return "L'identifiant ne peut excéder 10 caractères."
          } else if (!/^[A-Z0-9]+$/.test(value.trim())) {
            return "Seuls les lettres majuscules et les chiffres sont autorisés."
          } else if (clients.some(c => c.idcli === value.trim())) {
            return "Cet identifiant est déjà attribué à un autre client."
          }
        }
        return ''
      
      case 'nom':
        if (!value?.trim()) {
          return "Le nom du client est requis."
        } else if (value.trim().length < 3) {
          return "Le nom doit comporter au minimum 3 caractères."
        } else if (value.trim().length > 100) {
          return "Le nom ne peut excéder 100 caractères."
        } else if (/\d/.test(value.trim())) {
          return "Le nom ne doit pas contenir de chiffres."
        } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value.trim())) {
          return "Le nom contient des caractères non autorisés."
        }
        return ''
      
      case 'contact':
        if (!value?.trim()) {
          return "Le contact est requis."
        } else {
          const cleanContact = value.trim().replace(/[\s.-]/g, '')
          if (!/^\d{10}$/.test(cleanContact)) {
            return "Le numéro de téléphone doit comporter exactement 10 chiffres."
          }
        }
        return ''
      
      default:
        return ''
    }
  }

  // Validation en temps réel à chaque changement
  const handleInputChange = (field, value) => {
    const newForm = { ...form, [field]: value }
    setForm(newForm)
    
    // Marquer le champ comme touché
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }))
    }
    
    // Valider immédiatement ce champ
    const errorMessage = validateField(field, value, newForm)
    setErrors(prev => ({
      ...prev,
      [field]: errorMessage
    }))
  }

  // Marquer un champ comme touché quand l'utilisateur quitte le champ
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const errorMessage = validateField(field, form[field])
    setErrors(prev => ({
      ...prev,
      [field]: errorMessage
    }))
  }

  // Validation complète avant soumission
  const validateForm = () => {
    const newErrors = {}
    
    if (!editing) {
      newErrors.idcli = validateField('idcli', form.idcli)
    }
    newErrors.nom = validateField('nom', form.nom)
    newErrors.contact = validateField('contact', form.contact)
    
    // Marquer tous les champs comme touchés
    setTouched({
      idcli: true,
      nom: true,
      contact: true
    })
    
    setErrors(newErrors)
    
    // Vérifier s'il y a des erreurs
    return !Object.values(newErrors).some(error => error !== '')
  }

  const openCreate = () => { 
    setForm(EMPTY)
    setErrors({})
    setTouched({})
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (client) => {
    setForm(client)
    setErrors({})
    setTouched({})
    setEditing(client.idcli)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      if (editing) {
        await api.updateClient(editing, { 
          nom: form.nom.trim(), 
          contact: form.contact.trim().replace(/[\s.-]/g, '')
        })
        showToast('Client modifié avec succès', 'success')
      } else {
        await api.createClient({
          idcli: form.idcli.trim(),
          nom: form.nom.trim(),
          contact: form.contact.trim().replace(/[\s.-]/g, '')
        })
        showToast('Client ajouté avec succès', 'success')
      }
      setShowModal(false)
      load()
    } catch(error) {
      showToast(error.message || 'Une erreur est survenue', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id, nom) => {
    setDeleteConfirm({ id, nom })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      await api.deleteClient(deleteConfirm.id)
      load()
      showToast('Client supprimé avec succès', 'success')
      setDeleteConfirm(null)
    } catch(error) {
      showToast(error.message || 'Erreur lors de la suppression', 'error')
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
    { key: 'idcli', label: 'Identifiant', sortable: true },
    { key: 'nom', label: 'Nom complet', sortable: true },
    { key: 'contact', label: 'Contact', sortable: true },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Clients</h1>
              <p className="text-slate-500 text-sm mt-1">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} enregistré{filteredClients.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              <UserPlusIcon className="w-4 h-4" />
              Nouveau client
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
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
          {loading && filteredClients.length === 0 ? (
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
                        className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${
                          col.sortable ? 'cursor-pointer hover:text-slate-700 select-none' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.sortable && <ChevronUpDownIcon className="w-3.5 h-3.5" />}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedClients.length === 0 ? (
                    <tr>
                      <td colSpan={cols.length + 1} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <UsersIcon className="w-10 h-10 text-slate-300" />
                          <p className="text-slate-400 text-sm">
                            {searchTerm ? 'Aucun résultat trouvé' : 'Aucun client enregistré'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedClients.map((client) => (
                      <tr key={client.idcli} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-mono text-sm font-medium text-slate-700">
                            {client.idcli}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-slate-800">{client.nom}</span>
                        </td>
                        <td className="px-6 py-3">
                          {client.contact ? (
                            <div className="flex items-center gap-1.5">
                              <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600">{client.contact}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(client)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="Modifier"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(client.idcli, client.nom)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Ajout/Modification */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div 
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editing ? 'Modifier le client' : 'Nouveau client'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editing ? 'Mettre à jour les informations du client' : 'Compléter les informations du nouveau client'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body avec validation en temps réel */}
              <div className="px-6 py-6 space-y-5">
                {!editing && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Identifiant <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 text-sm font-mono">#</span>
                      </div>
                      <input
                        type="text"
                        value={form.idcli}
                        onChange={(e) => handleInputChange('idcli', e.target.value.toUpperCase())}
                        onBlur={() => handleBlur('idcli')}
                        className={`w-full pl-7 pr-10 py-2.5 text-sm border rounded-lg focus:ring-1 outline-none transition-all ${
                          touched.idcli && errors.idcli
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                            : touched.idcli && !errors.idcli
                            ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'
                        }`}
                        placeholder="Ex: C001"
                        autoFocus
                      />
                      {touched.idcli && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {errors.idcli ? (
                            <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckIcon className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {touched.idcli && errors.idcli ? (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                        <ExclamationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.idcli}</span>
                      </p>
                    ) : touched.idcli && !errors.idcli ? (
                      <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1.5">
                        <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Identifiant valide</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1.5">Identifiant unique attribué au client</p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.nom}
                      onChange={(e) => {
                        // Empêcher la saisie de chiffres
                        const value = e.target.value.replace(/[0-9]/g, '')
                        handleInputChange('nom', value)
                      }}
                      onBlur={() => handleBlur('nom')}
                      className={`w-full px-3 pr-10 py-2.5 text-sm border rounded-lg focus:ring-1 outline-none transition-all ${
                        touched.nom && errors.nom
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                          : touched.nom && !errors.nom
                          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'
                      }`}
                      placeholder="Ex: Rakoto Jean"
                    />
                    {touched.nom && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {errors.nom ? (
                          <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
                        ) : (
                          <CheckIcon className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched.nom && errors.nom ? (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                      <ExclamationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.nom}</span>
                    </p>
                  ) : touched.nom && !errors.nom ? (
                    <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Nom valide</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1.5">Raison sociale ou nom complet du client</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.contact}
                      onChange={(e) => {
                        // Permettre uniquement les chiffres, espaces et tirets
                        const value = e.target.value.replace(/[^\d\s.-]/g, '')
                        // Limiter à 10 chiffres (sans compter les espaces/tirets)
                        const digitsOnly = value.replace(/[\s.-]/g, '')
                        if (digitsOnly.length <= 10) {
                          handleInputChange('contact', value)
                        }
                      }}
                      onBlur={() => handleBlur('contact')}
                      className={`w-full px-3 pr-10 py-2.5 text-sm border rounded-lg focus:ring-1 outline-none transition-all ${
                        touched.contact && errors.contact
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                          : touched.contact && !errors.contact
                          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-200'
                      }`}
                      placeholder="Ex: 034 12 345 67"
                      maxLength={12}
                    />
                    {touched.contact && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {errors.contact ? (
                          <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
                        ) : (
                          <CheckIcon className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched.contact && errors.contact ? (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                      <ExclamationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.contact}</span>
                    </p>
                  ) : touched.contact && !errors.contact ? (
                    <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Contact valide</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1.5">Numéro de téléphone local à 10 chiffres</p>
                  )}
                </div>

                {/* Résumé des champs obligatoires */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="text-red-500">*</span> Champs obligatoires
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
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
                  className="flex-1 px-3 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{editing ? 'Enregistrement...' : 'Création...'}</span>
                    </div>
                  ) : (
                    editing ? 'Enregistrer les modifications' : 'Créer le client'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmation suppression - Style moderne et compact */}
{deleteConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
    <div 
      className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header avec bouton X */}
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold text-slate-800">Supprimer le client</h3>
        <button
          onClick={() => setDeleteConfirm(null)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Corps */}
      <div className="px-5 pb-5">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl">
          <div className="w-9 h-9 flex items-center justify-center bg-red-100 rounded-full flex-shrink-0">
            <TrashIcon className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700">
              supprimer définitivement le client <span className="font-semibold text-slate-900">« {deleteConfirm.nom} »</span> ?
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Cette action est irréversible.
            </p>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={confirmDelete}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Toast notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
            <div className={`flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-lg border-l-4 ${
              toast.type === 'success' ? 'border-emerald-500' : 'border-red-500'
            }`}>
              {toast.type === 'success' ? (
                <CheckIcon className="w-4 h-4 text-emerald-500" />
              ) : (
                <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-slate-700">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
