'use client'

import { useState } from 'react'
import { closeDayAndArchive } from '@/app/reception/actions'
import { Archive, Loader2 } from 'lucide-react'

export function CloseDayButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleCloseDay = async () => {
    if (!confirm(
      'Close today\'s clinic day?\n\nThis will:\n• Archive all queue records to History\n• Clear today\'s queue\n• Reset all doctors to absent\n\nThis action cannot be undone.'
    )) return

    setLoading(true)
    const result = await closeDayAndArchive()
    setLoading(false)

    if (result?.error) {
      alert(`Close Day failed: ${result.error}`)
    } else {
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    }
  }

  return (
    <button
      onClick={handleCloseDay}
      disabled={loading}
      className="flex items-center px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-70 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
    >
      {loading ? (
        <><Loader2 size={16} className="mr-2 animate-spin" /> Closing...</>
      ) : done ? (
        <><Archive size={16} className="mr-2 text-green-600" /> Archived!</>
      ) : (
        <><Archive size={16} className="mr-2" /> Close Day</>
      )}
    </button>
  )
}
