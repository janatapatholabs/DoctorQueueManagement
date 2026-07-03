import { getDoctors } from './actions'
import { RegistrationForm } from './components/RegistrationForm'
import { Activity } from 'lucide-react'

export const revalidate = 0 // Disable static rendering for this page since we need fresh doctors list

export default async function Home() {
  const doctors = await getDoctors()

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-6">
            <Activity size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Janata Medical Clinic
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Smart Queue Management
          </p>
        </div>

        <RegistrationForm doctors={doctors} />

        <div className="mt-10 text-center text-sm text-slate-500 font-medium">
          <p>Clinic staff? <a href="/reception" className="text-blue-600 hover:text-blue-700 underline underline-offset-4">Login here</a></p>
        </div>
      </div>
    </div>
  )
}
