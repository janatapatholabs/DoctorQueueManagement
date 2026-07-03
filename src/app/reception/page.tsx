import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from './actions'
import { DashboardView } from '@/app/components/reception/DashboardView'
import { LogOut, Activity } from 'lucide-react'

export const revalidate = 0

export default async function ReceptionDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/reception/login')
  }

  // Fetch doctors
  const { data: doctors } = await supabase
    .from('doctors')
    .select('*')
    .order('name')

  // Fetch today's queue
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: queues } = await supabase
    .from('queue')
    .select('*')
    .gte('created_at', today.toISOString())
    .order('serial_number', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">Staff Dashboard</h1>
            <p className="text-xs text-slate-500 font-medium">Janata Medical Clinic</p>
          </div>
        </div>
        
        <form action={logout}>
          <button type="submit" className="flex items-center text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors">
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </form>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <DashboardView doctors={doctors || []} queues={queues || []} />
      </main>
    </div>
  )
}
