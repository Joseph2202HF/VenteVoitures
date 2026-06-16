import React from 'react'

export default function Table({ cols, rows, actions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>{cols.map(c => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
            {actions && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0
            ? <tr><td colSpan={cols.length + 1} className="px-4 py-8 text-center text-gray-400">Aucune donnée</td></tr>
            : rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {cols.map(c => <td key={c.key} className="px-4 py-3">{c.render ? c.render(row) : row[c.key]}</td>)}
                {actions && <td className="px-4 py-3">{actions(row)}</td>}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
