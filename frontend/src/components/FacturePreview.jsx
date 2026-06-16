import React from 'react'
import { fmt, nombreEnLettres } from '../utils/format'

export default function FacturePreview({ facture }) {
  const dateFacture = new Date(facture.datefact).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const lignes = facture.lignes || []

  return (
    <div id="facture-print" className="p-10 bg-white font-sans">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vente Auto</h1>
          <p className="text-sm text-slate-600 mt-0.5">Vente de véhicules</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600">NIF: 1234567890</p>
          <p className="text-xs text-slate-600">STAT: 9876543210</p>
          <p className="text-xs text-slate-500 mt-3">Lot II M 32 Ankadivato</p>
          <p className="text-xs text-slate-500">Fianarantsoa 301</p>
        </div>
      </div>

      <hr className="border-slate-300 mb-8" />

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Facturé à</p>
          <p className="text-base font-semibold text-slate-900">{facture.client_nom}</p>
          <p className="text-sm text-slate-600 mt-1">Contact : {facture.client_contact || '—'}</p>
          <p className="text-sm text-slate-600">Client N° : {facture.idcli}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">Facture</p>
          <p className="text-sm text-slate-600 mt-1">N° {facture.numfact}</p>
          <p className="text-xs text-slate-500 mt-3">{dateFacture}</p>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-slate-300">
            <th className="text-left py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Désignation</th>
            <th className="text-center py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Qté</th>
            <th className="text-right py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Prix unitaire</th>
            <th className="text-right py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          {lignes.length === 0 ? (
            <tr><td colSpan="4" className="py-6 text-center text-slate-400">Aucun achat</td></tr>
          ) : (
            lignes.map((l, i) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="py-3 text-slate-800 font-medium">{l.design}</td>
                <td className="py-3 text-center text-slate-700">{l.qte}</td>
                <td className="py-3 text-right text-slate-600">{fmt(l.prix)}</td>
                <td className="py-3 text-right font-semibold text-slate-900">{fmt(l.total)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-400">
            <td colSpan="3" className="pt-4 text-right font-bold text-base text-slate-900">Total</td>
            <td className="pt-4 text-right font-bold text-base text-slate-900">{fmt(facture.montant)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-6 text-sm text-slate-800 bg-slate-100 rounded-lg p-4 border border-slate-200">
        Arrêté par la présente facture à la somme de <span className="font-bold text-slate-900">{nombreEnLettres(Number(facture.montant))} ariary</span>.
      </div>

      <div className="flex justify-end mt-12">
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-6">Fait à Fianarantsoa, le {dateFacture}</p>
          <p className="text-sm font-semibold text-slate-900">La Direction</p>
          <p className="text-xs text-slate-500 mt-0.5">VENTE AUTO</p>
        </div>
      </div>

      <hr className="border-slate-200 mt-10 mb-3" />
      <p className="text-xs text-slate-500 text-center">
        Règlement à réception de facture &nbsp;·&nbsp; TVA non applicable
      </p>
    </div>
  )
}
