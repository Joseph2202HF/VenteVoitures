import React, { useState, useEffect } from 'react'
import * as api from '../api/index'
import FactureTable from '../components/FactureTable'
import FactureModal from '../components/FactureModal'
import FactureViewModal from '../components/FactureViewModal'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../components/Toast'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function Facture() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState(null)
  const [formData, setFormData] = useState({ idcli: '', datefact: new Date().toISOString().split('T')[0] })
  const [clients, setClients] = useState([])
  const [clientAchats, setClientAchats] = useState([])
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { loadFactures(); api.getClients().then(setClients) }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadFactures = async () => {
    setLoading(true)
    try { setFactures(await api.getFactures()) }
    catch(e) { showToast('Erreur chargement: ' + e.message, 'error') }
    finally { setLoading(false) }
  }

  const handleCreate = async (data) => {
    try {
      await api.createFacture(data)
      setShowModal(false)
      setFormData({ idcli: '', datefact: new Date().toISOString().split('T')[0] })
      setClientAchats([])
      await loadFactures()
      showToast('Facture créée avec succès')
    } catch(e) { showToast('Erreur: ' + e.message, 'error') }
  }

  const viewFacture = async (numfact) => {
    try {
      setSelectedFacture(await api.getFactureDetail(numfact))
      setShowViewModal(true)
    } catch(e) { showToast('Erreur: ' + e.message, 'error') }
  }

  const requestDelete = (numfact) => {
    setConfirmDelete(numfact)
  }

  const confirmDeleteFacture = async () => {
    if (!confirmDelete) return
    try {
      await api.deleteFacture(confirmDelete)
      await loadFactures()
      if (selectedFacture?.numfact === confirmDelete) setShowViewModal(false)
      showToast('Facture supprimée')
    } catch(e) { showToast('Erreur: ' + e.message, 'error') }
    finally { setConfirmDelete(null) }
  }

  const markAsPaid = async (numfact) => {
    try {
      await api.updateFactureStatus(numfact, 'PAYEE')
      await loadFactures()
      showToast('Facture marquée comme payée')
    } catch(e) { showToast('Erreur: ' + e.message, 'error') }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Facturation</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
          <PlusIcon className="w-4 h-4" /> Nouvelle facture
        </button>
      </div>

      <FactureTable factures={factures} loading={loading} onView={viewFacture} onDelete={requestDelete} onMarkPaid={markAsPaid} onRefresh={loadFactures} />

      {showModal && (
        <FactureModal clients={clients} formData={formData} setFormData={setFormData} clientAchats={clientAchats} setClientAchats={setClientAchats}
          onSubmit={handleCreate} onClose={() => setShowModal(false)} />
      )}

      {showViewModal && selectedFacture && (
        <FactureViewModal facture={selectedFacture} onClose={() => setShowViewModal(false)} onMarkPaid={markAsPaid} />
      )}

      {confirmDelete && (
        <ConfirmModal 
          title="Supprimer la facture"
          message={`Voulez-vous vraiment supprimer la facture ${confirmDelete} ? Les achats seront libérés et pourront être refacturés.`}
          onConfirm={confirmDeleteFacture}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
