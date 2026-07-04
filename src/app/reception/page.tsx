// import { createClient } from '@/utils/supabase/server'
// import { redirect } from 'next/navigation'
// import { logout } from './actions'
// import { DashboardView } from '@/app/components/reception/DashboardView'
// import { LogOut, Activity } from 'lucide-react'

// export const revalidate = 0

// export default async function ReceptionDashboard() {
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()

//   if (!user) {
//     redirect('/reception/login')
//   }

//   // Fetch doctors
//   const { data: doctors } = await supabase
//     .from('doctors')
//     .select('*')
//     .order('name')

//   // Today's date string in YYYY-MM-DD format (local)
//   const now = new Date()
//   const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

//   // Fetch today's queue entries
//   const { data: queues } = await supabase
//     .from('queue')
//     .select('*')
//     .eq('appointment_date', todayStr)
//     .order('serial_number', { ascending: true })

//   // Fetch future scheduled appointments (appointment_date > today)
//   const { data: futureQueues } = await supabase
//     .from('queue')
//     .select('*')
//     .gt('appointment_date', todayStr)
//     .order('appointment_date', { ascending: true })
//     .order('serial_number', { ascending: true })

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//         <div className="flex items-center space-x-3">
//           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
//             <Activity size={24} />
//           </div>
//           <div>
//             <h1 className="font-bold text-slate-900 text-lg">Staff Dashboard</h1>
//             <p className="text-xs text-slate-500 font-medium">Janata Medical Clinic</p>
//           </div>
//         </div>
        
//         <form action={logout}>
//           <button type="submit" className="flex items-center text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors">
//             <LogOut size={16} className="mr-2" />
//             Logout
//           </button>
//         </form>
//       </nav>

//       <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
//         <DashboardView
//           doctors={doctors || []}
//           queues={queues || []}
//           futureQueues={futureQueues || []}
//         />
//       </main>
//     </div>
//   )
// }


import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout, migrateToday } from './actions'
import { DashboardView } from '@/app/components/reception/DashboardView'
import { CloseDayButton } from '@/app/components/reception/CloseDayButton'
import { LogOut, Activity, CalendarClock, BookOpen } from 'lucide-react'

export const revalidate = 0

export default async function ReceptionDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/reception/login')
  }

  // Migrate any future_schedule entries due today into the live queue
  await migrateToday()

  // Fetch doctors
  const { data: doctors } = await supabase
    .from('doctors')
    .select('*')
    .order('name')

  // Today's date string in YYYY-MM-DD format (local)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Fetch today's queue entries
  const { data: queues } = await supabase
    .from('queue')
    .select('*')
    .eq('appointment_date', todayStr)
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

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/reception/future-schedule"
            className="flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <CalendarClock size={16} className="mr-2" />
            <span className="hidden sm:inline">Future Schedule</span>
          </Link>
          <Link
            href="/reception/history"
            className="flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <BookOpen size={16} className="mr-2" />
            <span className="hidden sm:inline">History</span>
          </Link>

          <CloseDayButton />

          <form action={logout}>
            <button type="submit" className="flex items-center text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors px-3 py-2">
              <LogOut size={16} className="mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <DashboardView
          doctors={doctors || []}
          queues={queues || []}
        />
      </main>
    </div>
  )
}