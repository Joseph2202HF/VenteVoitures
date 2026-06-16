const BASE = '/api'

async function req(path, method, body) {
  method = method || 'GET'
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export const api = {
  getClients:    ()        => req('/clients'),
  createClient:  (d)       => req('/clients', 'POST', d),
  updateClient:  (id, d)   => req('/clients/' + id, 'PUT', d),
  deleteClient:  (id)      => req('/clients/' + id, 'DELETE'),
  getVoitures:   (q)       => req('/voitures' + (q ? '?q=' + encodeURIComponent(q) : '')),
  createVoiture: (d)       => req('/voitures', 'POST', d),
  updateVoiture: (id, d)   => req('/voitures/' + id, 'PUT', d),
  deleteVoiture: (id)      => req('/voitures/' + id, 'DELETE'),
  getAchats:     (f, t)    => req('/achats' + (f && t ? '?from=' + f + '&to=' + t : '')),
  createAchat:   (d)       => req('/achats', 'POST', d),
  deleteAchat:   (id)      => req('/achats/' + id, 'DELETE'),
  getRecettes:   ()        => req('/stats/recettes'),
  getFacture:    (idcli)   => req('/stats/facture?idcli=' + idcli),
}
