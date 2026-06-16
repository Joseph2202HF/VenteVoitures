import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',         label: 'Tableau de bord', icon: '📊' },
  { to: '/clients',  label: 'Clients',          icon: '👥' },
  { to: '/voitures', label: 'Voitures',         icon: '🚗' },
  { to: '/achats',   label: 'Achats',           icon: '🛒' },
  { to: '/rapports', label: 'Rapports',         icon: '📈' },
]

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <span className="text-lg font-bold text-blue-600">Auto</span>
          <span className="text-lg font-bold text-slate-800">Gest</span>
          <p className="text-xs text-slate-400 mt-0.5">Gestion de vente</p>
        </div>
        <nav className="flex-1 py-3 px-2">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">v1.0.0</div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
