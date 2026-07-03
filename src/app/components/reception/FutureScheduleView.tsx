'use client'

import { useState } from 'react'
import { deleteFutureScheduleEntry } from '@/app/reception/actions'
import { Phone, CalendarDays, Stethoscope, Trash2, Loader2, CalendarClock } from 'lucide-react'

type FutureEntry = {
  id: string
  doctor_id: string
  doctor_name: string | null
  patient_name: string
  phone_number: string
  serial_number: number
  appointment_date: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatDateShort(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getDaysFromNow(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 1) return 'Tomorrow'
  return `in ${diff} days`
}

export function FutureScheduleView({ entries }: { entries: FutureEntry[] }) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this future appointment?')) return
    setLoadingIds(prev => new Set(prev).add(id))
    await deleteFutureScheduleEntry(id)
    setLoadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-24">
        <CalendarClock size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-500">No future appointments</h3>
        <p className="text-sm text-slate-400 mt-1">Patients can pre-book from the main page.</p>
      </div>
    )
  }

  // Group by date
  const dates = [...new Set(entries.map(e => e.appointment_date))].sort()

  return (
    <div className="space-y-10">
      {dates.map(date => {
        const dateEntries = entries.filter(e => e.appointment_date === date)
        // Group by doctor within each date
        const doctorNames = [...new Set(dateEntries.map(e => e.doctor_name ?? 'Unknown Doctor'))]

        return (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{formatDate(date)}</h2>
                  <p className="text-xs text-violet-600 font-semibold">{getDaysFromNow(date)} · {dateEntries.length} appointment{dateEntries.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {doctorNames.map(doctorName => {
                const doctorEntries = dateEntries.filter(e => (e.doctor_name ?? 'Unknown Doctor') === doctorName)
                return (
                  <div key={doctorName} className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
                    <div className="px-5 py-4 bg-violet-50 border-b border-violet-100 flex items-center gap-3">
                      <Stethoscope size={16} className="text-violet-600" />
                      <h3 className="font-bold text-slate-800 text-sm">{doctorName}</h3>
                      <span className="ml-auto bg-violet-200 text-violet-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {doctorEntries.length} patient{doctorEntries.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {doctorEntries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                              #{entry.serial_number}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{entry.patient_name}</p>
                              <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                <Phone size={10} className="mr-1" />
                                {entry.phone_number}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={loadingIds.has(entry.id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Cancel appointment"
                          >
                            {loadingIds.has(entry.id)
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Trash2 size={15} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
