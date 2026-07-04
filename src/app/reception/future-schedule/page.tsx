import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FutureScheduleView } from '@/app/components/reception/FutureScheduleView'
import { ArrowLeft, CalendarClock } from 'lucide-react'

export const revalidate = 0

export default async function FutureSchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/reception/login')
  }

  const { data: entries } = await supabase
    .from('future_schedule')
    .select('*')
    .order('appointment_date', { ascending: true })
    .order('serial_number', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center">
            <CalendarClock size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">Future Schedule</h1>
            <p className="text-xs text-slate-500 font-medium">Upcoming pre-booked appointments</p>
          </div>
        </div>

        <Link
          href="/reception"
          className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Dashboard
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FutureScheduleView entries={entries || []} />
      </main>
    </div>
  )
}