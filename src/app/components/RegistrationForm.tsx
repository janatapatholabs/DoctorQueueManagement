'use client'

import { useState } from 'react'
import { joinQueue } from '../actions'
import { CheckCircle2, Loader2, User, Phone } from 'lucide-react'

type Doctor = {
  id: string
  name: string
  specialization: string
  is_present: boolean
}

export function RegistrationForm({ doctors }: { doctors: Doctor[] }) {
  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ serialNumber: number; doctorName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await joinQueue(formData)
    
    if (result.error) {
      setError(result.error)
    } else if (result.success && result.serialNumber) {
      const doctorId = formData.get('doctorId') as string
      const doctor = doctors.find(d => d.id === doctorId)
      setSuccessData({
        serialNumber: result.serialNumber,
        doctorName: doctor?.name || 'the doctor'
      })
    }
    
    setLoading(false)
  }

  if (successData) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/40 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">You're in the queue!</h2>
        <p className="text-slate-600 mb-8 text-lg">Your serial number for {successData.doctorName} is:</p>
        <div className="text-6xl font-black text-blue-600 bg-blue-50/50 py-6 rounded-xl border border-blue-100 mb-8">
          #{successData.serialNumber}
        </div>
        <p className="text-sm text-slate-500 mb-8">We will notify you via SMS when it's your turn.</p>
        <button 
          onClick={() => setSuccessData(null)}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          Register Another Patient
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/40">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Book Your Slot</h2>
        <p className="text-slate-500">Join the waitlist before you reach the clinic.</p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="doctorId" className="text-sm font-semibold text-slate-700 block">
            Select Doctor
          </label>
          <select 
            name="doctorId" 
            id="doctorId" 
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none text-slate-700"
            defaultValue=""
          >
            <option value="" disabled>Choose a specialist...</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialization} {doctor.is_present ? '(Arrived)' : '(Yet to arrive)'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="patientName" className="text-sm font-semibold text-slate-700 block">
            Patient Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <User size={18} />
            </div>
            <input 
              type="text" 
              name="patientName" 
              id="patientName" 
              required
              placeholder="Full Name"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="text-sm font-semibold text-slate-700 block">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Phone size={18} />
            </div>
            <input 
              type="tel" 
              name="phoneNumber" 
              id="phoneNumber" 
              required
              placeholder="e.g. +91 9876543210"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Securing Slot...
            </>
          ) : (
            'Get Queue Number'
          )}
        </button>
      </form>
    </div>
  )
}
