const BASE = '/api'

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export const getClients = () => req('/clients')
export const createClient = (d) => req('/clients', { method: 'POST', body: JSON.stringify(d) })
export const updateClient = (id, d) => req(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteClient = (id) => req(`/clients/${id}`, { method: 'DELETE' })

export const getVoitures = () => req('/voitures')
export const searchVoitures = (q) => req(`/voitures/search?q=${encodeURIComponent(q)}`)
export const createVoiture = (d) => req('/voitures', { method: 'POST', body: JSON.stringify(d) })
export const updateVoiture = (id, d) => req(`/voitures/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteVoiture = (id) => req(`/voitures/${id}`, { method: 'DELETE' })

export const getAchats = () => req('/achats')
export const createAchat = (d) => req('/achats', { method: 'POST', body: JSON.stringify(d) })
export const updateAchat = (id, d) => req(`/achats/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteAchat = (id) => req(`/achats/${id}`, { method: 'DELETE' })
export const getFacture = (numachat) => req(`/achats/facture/${numachat}`)
export const getAchatsByDate = (from, to) => req(`/achats/by-date?from=${from}&to=${to}`)
export const getRecetteMensuelle = () => req('/stats/recettes')

export const getFactures = () => req('/factures')
export const getFactureDetail = (numfact) => req(`/factures/${numfact}`)
export const createFacture = (d) => req('/factures', { method: 'POST', body: JSON.stringify(d) })
export const updateFactureStatus = (numfact, statut) => req(`/factures/${numfact}`, { method: 'PUT', body: JSON.stringify({ statut }) })
export const deleteFacture = (numfact) => req(`/factures/${numfact}`, { method: 'DELETE' })

export const getAchatsNonFactures = (idcli) => req(`/achats/non-factures?idcli=${encodeURIComponent(idcli)}`)
