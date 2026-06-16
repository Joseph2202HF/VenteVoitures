import React, { useEffect } from 'react'

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  const colors = { success: 'bg-green-600', error: 'bg-red-600' }
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-lg text-white shadow-lg ${colors[type] || 'bg-gray-700'}`}>
      {message}
    </div>
  )
}
