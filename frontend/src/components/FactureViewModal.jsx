import React, { useRef } from 'react'
import FacturePreview from './FacturePreview'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon, BanknotesIcon } from '@heroicons/react/24/outline'

export default function FactureViewModal({ facture, onClose, onMarkPaid }) {
  const printRef = useRef(null)

  const handlePrint = () => {
    if (!printRef.current) return
    const content = printRef.current.innerHTML
    const orig = document.body.innerHTML
    document.body.innerHTML = content
    window.print()
    document.body.innerHTML = orig
    window.location.reload()
  }

  const generatePDF = async () => {
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default
    
    const element = document.getElementById('facture-print')
    if (!element) return
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
    
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const doc = new jsPDF('p', 'mm', 'a4')
    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    doc.save(`facture-${facture.numfact}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
          <h2 className="text-lg font-bold text-slate-900">Facture {facture.numfact}</h2>
          <div className="flex items-center gap-1">
            {facture.statut === 'EN_ATTENTE' && (
              <button onClick={() => onMarkPaid(facture.numfact)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Marquer payée">
                <BanknotesIcon className="w-5 h-5" />
              </button>
            )}
            <button onClick={generatePDF} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Télécharger PDF">
              <DocumentArrowDownIcon className="w-5 h-5" />
            </button>
            <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg" title="Imprimer">
              <PrinterIcon className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div ref={printRef}><FacturePreview facture={facture} /></div>
      </div>
    </div>
  )
}
