import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Clients  from './pages/Clients'
import Voitures from './pages/Voitures'
import Achats   from './pages/Achats'
import Facture  from './pages/Facture'
import Stats    from './pages/Stats'

const navItems = [
  { to: '/clients',  label: '👤 Clients' },
  { to: '/voitures', label: '🚗 Voitures' },
  { to: '/achats',   label: '🛒 Achats' },
  { to: '/facture',  label: '🧾 Factures' },
  { to: '/stats',    label: '📊 Statistiques' },
]

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col fixed h-full">
        <div className="px-5 py-5 border-b">
          <span className="font-bold text-gray-800 text-lg">Vente Voitures</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                 ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 p-8">
        <Routes>
          <Route path="/"         element={<Navigate to="/clients" replace />} />
          <Route path="/clients"  element={<Clients />} />
          <Route path="/voitures" element={<Voitures />} />
          <Route path="/achats"   element={<Achats />} />
          <Route path="/facture"  element={<Facture />} />
          <Route path="/stats"    element={<Stats />} />
        </Routes>
      </main>
    </div>
  )
}
