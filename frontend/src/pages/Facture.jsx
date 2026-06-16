import React, { useState, useEffect, useRef } from 'react'
import * as api from '../api/index'
import { 
  PrinterIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const fmt = (n) => Number(n).toLocaleString('fr-MG') + ' Ar'

function nombreEnLettres(n) {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const tens  = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']

  if (n === 0) return 'zéro'
  if (n >= 1000000000) return Math.floor(n/1000000000) + ' milliard' + (Math.floor(n/1000000000) > 1 ? 's' : '') + ' ' + nombreEnLettres(n % 1000000000)
  if (n >= 1000000) return Math.floor(n/1000000) + ' million' + (Math.floor(n/1000000) > 1 ? 's' : '') + ' ' + nombreEnLettres(n % 1000000)
  if (n >= 1000) {
    const mille = Math.floor(n/1000)
    return (mille === 1 ? 'mille' : nombreEnLettres(mille) + ' mille') + ' ' + nombreEnLettres(n % 1000)
  }
  if (n >= 100) {
    const cent = Math.floor(n/100)
    return (cent === 1 ? 'cent' : nombreEnLettres(cent) + ' cent') + (n % 100 ? ' ' + nombreEnLettres(n % 100) : '')
  }
  if (n >= 20) {
    const ten = Math.floor(n/10)
    const unit = n % 10
    if (ten === 7 || ten === 9) {
      return tens[ten] + '-' + nombreEnLettres(10 + unit)
    }
    return tens[ten] + (unit ? '-' + units[unit] : '')
  }
  return units[n]
}

const STATUS_STYLES = {
  'EN_ATTENTE': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: ClockIcon, label: 'En attente' },
  'PAYEE': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircleIcon, label: 'Payée' },
  'ANNULEE': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircleIcon, label: 'Annulée' }
}

export default function Facture() {
  const [factures, setFactures] = useState([])
  const [filteredFactures, setFilteredFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('datefact')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState(null)
  const [formData, setFormData] = useState({ idcli: '', datefact: new Date().toISOString().split('T')[0] })
  const [clients, setClients] = useState([])
  const [clientAchats, setClientAchats] = useState([])
  const [loadingAchats, setLoadingAchats] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    loadFactures()
    api.getClients().then(setClients).catch(e => console.error(e))
  }, [])

  useEffect(() => {
    filterAndSort()
  }, [factures, searchTerm, filterStatus, sortBy, sortOrder])

  const loadFactures = async () => {
    setLoading(true)
    try {
      const data = await api.getFactures()
      setFactures(data)
    } catch(e) { 
      console.error('Erreur chargement factures:', e)
      setFactures([])
    }
    finally { setLoading(false) }
  }

  const filterAndSort = () => {
    let result = [...factures]

    // Filtre recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(f => 
        f.numfact?.toLowerCase().includes(term) ||
        f.client_nom?.toLowerCase().includes(term) ||
        f.numfact?.toLowerCase().includes(term)
      )
    }

    // Filtre statut
    if (filterStatus) {
      result = result.filter(f => f.statut === filterStatus)
    }

    // Tri
    result.sort((a, b) => {
      let valA = a[sortBy]
      let valB = b[sortBy]
      if (sortBy === 'datefact') {
        valA = new Date(valA).getTime()
        valB = new Date(valB).getTime()
      }
      if (sortBy === 'montant') {
        valA = Number(valA)
        valB = Number(valB)
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredFactures(result)
  }

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortOrder('asc')
    }
  }

  const handleClientChange = async (idcli) => {
    setFormData({ ...formData, idcli })
    if (idcli) {
      setLoadingAchats(true)
      try {
        // Récupère TOUS les achats non facturés du client (automatique)
        const achats = await api.getAchatsNonFactures(idcli)
        setClientAchats(achats)
      } catch(e) {
        console.error(e)
        setClientAchats([])
      }
      finally { setLoadingAchats(false) }
    } else {
      setClientAchats([])
    }
  }

  const totalAchats = clientAchats.reduce((sum, a) => sum + Number(a.total || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.idcli) return alert('Veuillez sélectionner un client')
    if (clientAchats.length === 0) return alert('Aucun achat à facturer pour ce client')

    setSubmitLoading(true)
    try {
      await api.createFacture({
        idcli: formData.idcli,
        datefact: formData.datefact,
        montant: totalAchats,
        achats: clientAchats.map(a => a.numachat)
      })
      setShowModal(false)
      setFormData({ idcli: '', datefact: new Date().toISOString().split('T')[0] })
      setClientAchats([])
      await loadFactures()
    } catch(e) {
      alert('Erreur: ' + e.message)
    }
    finally { setSubmitLoading(false) }
  }

  const viewFacture = async (numfact) => {
    try {
      const facture = await api.getFactureDetail(numfact)
      setSelectedFacture(facture)
      setShowViewModal(true)
    } catch(e) {
      alert('Erreur chargement facture: ' + e.message)
    }
  }

  const deleteFacture = async (numfact) => {
    if (confirm('Supprimer cette facture ? Les achats seront libérés.')) {
      try {
        await api.deleteFacture(numfact)
        await loadFactures()
        if (selectedFacture?.numfact === numfact) setShowViewModal(false)
      } catch(e) {
        alert('Erreur: ' + e.message)
      }
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const printContent = printRef.current.innerHTML
    const originalContent = document.body.innerHTML
    document.body.innerHTML = printContent
    window.print()
    document.body.innerHTML = originalContent
    window.location.reload()
  }

  const totalGeneral = filteredFactures
    .filter(f => f.statut !== 'ANNULEE')
    .reduce((sum, f) => sum + Number(f.montant), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Facturation</h1>
              <p className="text-slate-500 text-sm mt-1">
                {filteredFactures.length} facture(s) • Total {fmt(totalGeneral)}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all shadow-sm"
            >
              <PlusIcon className="w-5 h-5" />
              Nouvelle facture
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une facture, un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-300 focus:ring-1 focus:ring-slate-200 outline-none transition-all bg-white"
              >
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <button
              onClick={loadFactures}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-all"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Tableau des factures */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th 
                    className="text-left px-5 py-4 font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('numfact')}
                  >
                    <div className="flex items-center gap-1">
                      N° Facture
                      {sortBy === 'numfact' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left px-5 py-4 font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('client_nom')}
                  >
                    <div className="flex items-center gap-1">
                      Client
                      {sortBy === 'client_nom' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left px-5 py-4 font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('datefact')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortBy === 'datefact' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right px-5 py-4 font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('montant')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Montant
                      {sortBy === 'montant' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-center px-5 py-4 font-semibold text-slate-600">Statut</th>
                  <th className="text-center px-5 py-4 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <ArrowPathIcon className="w-8 h-8 text-slate-300 mx-auto mb-3 animate-spin" />
                      <p className="text-slate-500">Chargement des factures...</p>
                    </td>
                  </tr>
                ) : filteredFactures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="text-slate-400 text-5xl mb-3">📄</div>
                      <p className="text-slate-500 font-medium">Aucune facture trouvée</p>
                      <p className="text-slate-400 text-sm mt-1">Cliquez sur "Nouvelle facture" pour commencer</p>
                    </td>
                  </tr>
                ) : (
                  filteredFactures.map((facture) => {
                    const statusStyle = STATUS_STYLES[facture.statut] || STATUS_STYLES['EN_ATTENTE']
                    const StatusIcon = statusStyle.icon
                    return (
                      <tr 
                        key={facture.numfact} 
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => viewFacture(facture.numfact)}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{facture.numfact}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700">{facture.client_nom}</p>
                          <p className="text-xs text-slate-400">{facture.nb_achats || 0} article(s)</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-600">
                            {new Date(facture.datefact).toLocaleDateString('fr-FR', { 
                              day: 'numeric', month: 'short', year: 'numeric' 
                            })}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-semibold text-slate-800">{fmt(facture.montant)}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => viewFacture(facture.numfact)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Voir la facture"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteFacture(facture.numfact)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
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
        </div>
      </div>

      {/* Modal - Nouvelle facture */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header modale */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Nouvelle facture</h2>
                <p className="text-sm text-slate-500">Les achats non facturés sont automatiquement sélectionnés</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Sélection client */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Client
                </label>
                <select
                  value={formData.idcli}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all bg-white"
                  required
                >
                  <option value="">Sélectionner un client...</option>
                  {clients.map(c => (
                    <option key={c.idcli} value={c.idcli}>{c.nom} {c.contact ? `(${c.contact})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Date facture */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date de facture
                </label>
                <input
                  type="date"
                  value={formData.datefact}
                  onChange={(e) => setFormData({ ...formData, datefact: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                  required
                />
              </div>

              {/* Achats automatiques */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Achats à facturer <span className="text-slate-400 font-normal">(automatique)</span>
                </label>
                {!formData.idcli ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                    <p className="text-slate-400 text-sm">Sélectionnez d'abord un client</p>
                  </div>
                ) : loadingAchats ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                    <ArrowPathIcon className="w-6 h-6 text-slate-300 mx-auto mb-2 animate-spin" />
                    <p className="text-slate-400 text-sm">Chargement des achats...</p>
                  </div>
                ) : clientAchats.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <p className="text-amber-700 text-sm font-medium">Aucun achat à facturer</p>
                    <p className="text-amber-500 text-xs mt-1">Tous les achats de ce client sont déjà facturés</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-2.5 text-slate-600 font-semibold">N° Achat</th>
                          <th className="text-left px-4 py-2.5 text-slate-600 font-semibold">Véhicule</th>
                          <th className="text-center px-4 py-2.5 text-slate-600 font-semibold">Qté</th>
                          <th className="text-right px-4 py-2.5 text-slate-600 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientAchats.map((achat, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3 text-slate-700">{achat.numachat}</td>
                            <td className="px-4 py-3 text-slate-700">{achat.design}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{achat.qte}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">{fmt(achat.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-50/50 border-t-2 border-emerald-200">
                          <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-700">TOTAL FACTURE</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700 text-lg">{fmt(totalAchats)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Récapitulatif */}
              {clientAchats.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Nombre d'articles</span>
                    <span className="font-medium text-slate-700">{clientAchats.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Montant total</span>
                    <span className="font-bold text-emerald-700">{fmt(totalAchats)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">En lettres</span>
                    <span className="text-slate-600 italic capitalize">{nombreEnLettres(totalAchats)} ariary</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={clientAchats.length === 0 || submitLoading}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Générer la facture
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Vue facture */}
      {showViewModal && selectedFacture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-800">Facture {selectedFacture.numfact}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  title="Imprimer"
                >
                  <PrinterIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div ref={printRef}>
              <FacturePreview facture={selectedFacture} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #facture-print, #facture-print * { visibility: visible; }
          #facture-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  )
}

// Composant FacturePreview réutilisable
function FacturePreview({ facture }) {
  return (
    <div id="facture-print" className="p-6">
      {/* En-tête facture */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-6 text-white rounded-t-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">AUTOGEST</h2>
            <p className="text-slate-300 text-sm mt-1">Vente de véhicules</p>
            <p className="text-slate-300 text-xs mt-2">NIF: 1234567890<br />STAT: 9876543210</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">Facture</p>
            <p className="text-xl font-bold">N° {facture.numfact}</p>
            <p className="text-xs text-slate-300 mt-1">
              {new Date(facture.datefact).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Infos client */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Facturé à</p>
        <p className="font-semibold text-slate-800">{facture.client_nom || facture.client?.nom}</p>
        <p className="text-sm text-slate-500">{facture.client_contact || facture.client?.contact || 'Non renseigné'}</p>
      </div>

      {/* Tableau des achats */}
      <div className="px-6 py-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 text-slate-600 font-semibold">Désignation</th>
              <th className="text-center py-3 text-slate-600 font-semibold">Qté</th>
              <th className="text-right py-3 text-slate-600 font-semibold">Prix unitaire</th>
              <th className="text-right py-3 text-slate-600 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {(facture.lignes || facture.achats || []).map((l, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3 text-slate-700">{l.design}</td>
                <td className="py-3 text-center text-slate-600">{l.qte}</td>
                <td className="py-3 text-right text-slate-600">{fmt(l.prix)}</td>
                <td className="py-3 text-right font-medium text-slate-700">{fmt(l.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td colSpan="3" className="pt-4 text-right font-bold text-slate-700">TOTAL</td>
              <td className="pt-4 text-right font-bold text-emerald-600 text-lg">{fmt(facture.montant)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Montant en lettres */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Arrêté à :</span> {nombreEnLettres(Number(facture.montant))} ariary
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white border-t border-slate-100 text-center text-xs text-slate-400 rounded-b-xl">
        <p>Merci de votre confiance - Règlement à réception de facture</p>
      </div>
    </div>
  )
}
