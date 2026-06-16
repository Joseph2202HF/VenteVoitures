// Bouton
export function Btn({ children, onClick, variant = 'primary', size = 'md', type = 'button', disabled }) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    danger:  'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:   'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  }
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]}`}>{children}</button>
}

// Input
export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</label>}
      <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" {...props} />
    </div>
  )
}

// Select
export function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</label>}
      <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" {...props}>
        {children}
      </select>
    </div>
  )
}

// Modal
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Table wrapper
export function Table({ cols, rows, renderRow }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-600 text-left">
            {cols.map(c => <th key={c} className="px-4 py-3 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0
            ? <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-slate-400">Aucun enregistrement</td></tr>
            : rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  )
}

// Toast
export function Toast({ msg, type = 'success', onClose }) {
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600' }
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 ${colors[type]} text-white px-4 py-3 rounded-xl shadow-xl text-sm`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">&times;</button>
    </div>
  )
}

// Badge stock
export function StockBadge({ n }) {
  const cls = n === 0 ? 'bg-red-100 text-red-700' : n < 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{n}</span>
}
