'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toggleDoctorPresence, addDoctor, removeDoctor, toggleQueueStatus } from '@/app/reception/actions'
import { useState } from 'react'
import { CheckCircle2, Phone, Power, ArrowRight, Activity, Trash2, Plus, CalendarClock } from 'lucide-react'
import { cn } from '@/utils/utils'

type Doctor = { id: string; name: string; specialization: string; is_present: boolean }
type Queue = { id: string; doctor_id: string; doctor_name: string; patient_name: string; phone_number: string; serial_number: number; status: string; appointment_date: string }

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function DashboardView({
  doctors,
  queues,
  futureQueues,
}: {
  doctors: Doctor[]
  queues: Queue[]
  futureQueues: Queue[]
}) {
  const router = useRouter()
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [router])

  const handleTogglePresence = async (doctorId: string, isPresent: boolean) => {
    setLoadingIds(prev => new Set(prev).add(doctorId))
    await toggleDoctorPresence(doctorId, isPresent)
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(doctorId)
      return next
    })
  }

  const handleToggleQueueStatus = async (queueId: string, currentStatus: string) => {
    setLoadingIds(prev => new Set(prev).add(queueId))
    await toggleQueueStatus(queueId, currentStatus)
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(queueId)
      return next
    })
  }

  const handleRemoveDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to remove this doctor? All their queue records will be deleted.')) return
    setLoadingIds(prev => new Set(prev).add(doctorId))
    await removeDoctor(doctorId)
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(doctorId)
      return next
    })
  }

  const handleAddDoctorSubmit = async (formData: FormData) => {
    setLoadingIds(prev => new Set(prev).add('add-doctor'))
    await addDoctor(formData)
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete('add-doctor')
      return next
    })
    const form = document.getElementById('add-doctor-form') as HTMLFormElement
    if (form) form.reset()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {doctors.map(doctor => {
        const docQueues = queues.filter(q => q.doctor_id === doctor.id)
        const waitingQueues = docQueues.filter(q => q.status === 'waiting')

        // Future schedules grouped by date
        const docFutureQueues = futureQueues.filter(q => q.doctor_id === doctor.id)
        const futureDates = [...new Set(docFutureQueues.map(q => q.appointment_date))].sort()

        return (
          <div key={doctor.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Doctor Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  {doctor.name}
                  {doctor.is_present && (
                    <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      In Clinic
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{doctor.specialization}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRemoveDoctor(doctor.id)}
                  disabled={loadingIds.has(doctor.id)}
                  className="px-3 py-2 rounded-xl text-sm transition-all flex items-center shadow-sm border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-70"
                  title="Remove Doctor"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => handleTogglePresence(doctor.id, !doctor.is_present)}
                  disabled={loadingIds.has(doctor.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center shadow-sm border disabled:opacity-70',
                    doctor.is_present
                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  )}
                >
                  <Power size={16} className="mr-2" />
                  {doctor.is_present ? 'Mark as Left' : 'Mark Arrived'}
                </button>
              </div>
            </div>

            {/* Today's Queue Section */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Today's Queue</h4>
                <div className="text-sm font-medium text-slate-500">
                  {waitingQueues.length} waiting / {docQueues.length} total
                </div>
              </div>

              {docQueues.length === 0 ? (
                <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Activity size={24} className="mx-auto mb-2 text-slate-400" />
                  <p>No patients in queue today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {docQueues.sort((a, b) => a.serial_number - b.serial_number).map((q) => {
                    const isCompleted = q.status === 'completed'
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          'p-4 rounded-xl border flex items-center justify-between transition-all duration-300',
                          isCompleted
                            ? 'bg-slate-50 border-slate-100 opacity-60 grayscale pointer-events-none'
                            : 'bg-white border-slate-200 shadow-sm'
                        )}
                      >
                        <div className="flex items-center">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4',
                            isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-700'
                          )}>
                            #{q.serial_number}
                          </div>
                          <div>
                            <p className={cn(
                              'font-bold',
                              isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                            )}>
                              {q.patient_name}
                            </p>
                            <p className={cn(
                              'text-xs flex items-center mt-1',
                              isCompleted ? 'text-slate-400' : 'text-slate-500'
                            )}>
                              <Phone size={12} className="mr-1" />
                              {q.phone_number}
                            </p>
                          </div>
                        </div>

                        {!isCompleted && (
                          <button
                            onClick={() => handleToggleQueueStatus(q.id, q.status)}
                            disabled={loadingIds.has(q.id)}
                            className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 text-sm font-semibold rounded-lg hover:bg-green-100 transition-colors shadow-sm disabled:opacity-70 flex items-center"
                          >
                            <CheckCircle2 size={16} className="mr-1" /> Done
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Future Schedules Section */}
            {futureDates.length > 0 && (
              <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                <div className="flex items-center mb-4">
                  <CalendarClock size={16} className="mr-2 text-violet-500" />
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Future Schedules</h4>
                </div>
                <div className="space-y-4">
                  {futureDates.map(date => {
                    const datePatients = docFutureQueues.filter(q => q.appointment_date === date)
                    return (
                      <div key={date}>
                        <p className="text-xs font-semibold text-violet-600 mb-2 flex items-center">
                          <ArrowRight size={12} className="mr-1" />
                          {formatDate(date)}
                          <span className="ml-2 bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {datePatients.length} patient{datePatients.length > 1 ? 's' : ''}
                          </span>
                        </p>
                        <div className="space-y-2">
                          {datePatients.map(q => (
                            <div
                              key={q.id}
                              className="flex items-center p-3 rounded-lg bg-violet-50 border border-violet-100"
                            >
                              <div className="w-7 h-7 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold mr-3">
                                #{q.serial_number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-700 truncate">{q.patient_name}</p>
                                <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                  <Phone size={10} className="mr-1" />
                                  {q.phone_number}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Add Doctor Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-center border-dashed">
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-2">
              <Plus size={24} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 text-center mb-6">Add New Doctor</h3>
          
          <form id="add-doctor-form" action={handleAddDoctorSubmit} className="space-y-4 max-w-sm mx-auto">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Doctor Name</label>
              <input 
                type="text" 
                name="name" 
                required
                placeholder="e.g. Dr. Jane Doe"
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none transition-all text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Specialization</label>
              <input 
                type="text" 
                name="specialization" 
                required
                placeholder="e.g. Cardiologist"
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none transition-all text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <button 
              type="submit" 
              disabled={loadingIds.has('add-doctor')}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-70 mt-4"
            >
              {loadingIds.has('add-doctor') ? 'Adding...' : 'Add Doctor'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
