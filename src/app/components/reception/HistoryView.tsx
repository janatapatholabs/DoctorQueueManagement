import { Phone, CheckCircle2, Clock, CalendarDays, Stethoscope, BookOpen } from 'lucide-react'
import { cn } from '@/utils/utils'

type HistoryEntry = {
  id: string
  archived_date: string
  doctor_id: string | null
  doctor_name: string | null
  doctor_specialization: string | null
  patient_name: string
  phone_number: string
  serial_number: number
  status: string
  appointment_date: string | null
  original_created_at: string | null
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function HistoryView({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-24">
        <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-500">No history yet</h3>
        <p className="text-sm text-slate-400 mt-1">Records appear here after a day is closed.</p>
      </div>
    )
  }

  // Group by archived_date (descending — most recent first)
  const dates = [...new Set(entries.map(e => e.archived_date))].sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-10">
      {dates.map(date => {
        const dateEntries = entries.filter(e => e.archived_date === date)
        const completedCount = dateEntries.filter(e => e.status === 'completed').length
        const totalCount = dateEntries.length

        // Group by doctor within the date
        const doctorNames = [...new Set(dateEntries.map(e => e.doctor_name ?? 'Unknown Doctor'))]

        return (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{formatDate(date)}</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    {completedCount}/{totalCount} patients seen
                  </p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                  {completedCount} completed
                </span>
                {totalCount - completedCount > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                    {totalCount - completedCount} not seen
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {doctorNames.map(doctorName => {
                const doctorEntries = dateEntries
                  .filter(e => (e.doctor_name ?? 'Unknown Doctor') === doctorName)
                  .sort((a, b) => a.serial_number - b.serial_number)
                const docCompleted = doctorEntries.filter(e => e.status === 'completed').length
                const doctorSpec = doctorEntries[0]?.doctor_specialization

                return (
                  <div key={doctorName} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                      <Stethoscope size={16} className="text-slate-500" />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{doctorName}</h3>
                        {doctorSpec && <p className="text-xs text-slate-500">{doctorSpec}</p>}
                      </div>
                      <span className="ml-auto text-xs text-slate-500 font-semibold">
                        {docCompleted}/{doctorEntries.length} seen
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      {doctorEntries.map(entry => (
                        <div
                          key={entry.id}
                          className={cn(
                            'flex items-center p-3 rounded-xl border',
                            entry.status === 'completed'
                              ? 'bg-green-50 border-green-100'
                              : 'bg-amber-50 border-amber-100'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3',
                            entry.status === 'completed'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-amber-200 text-amber-800'
                          )}>
                            #{entry.serial_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{entry.patient_name}</p>
                            <p className="text-xs text-slate-500 flex items-center mt-0.5">
                              <Phone size={10} className="mr-1" />
                              {entry.phone_number}
                            </p>
                          </div>
                          <div className="ml-3 flex items-center">
                            {entry.status === 'completed' ? (
                              <span className="flex items-center text-xs font-semibold text-green-700">
                                <CheckCircle2 size={14} className="mr-1" /> Seen
                              </span>
                            ) : (
                              <span className="flex items-center text-xs font-semibold text-amber-700">
                                <Clock size={14} className="mr-1" /> Not seen
                              </span>
                            )}
                          </div>
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
