import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HistoryView } from '@/app/components/reception/HistoryView'
import { ArrowLeft, BookOpen } from 'lucide-react'

export const revalidate = 0

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/reception/login')
  }

  const { data: entries } = await supabase
    .from('history')
    .select('*')
    .order('archived_date', { ascending: false })
    .order('serial_number', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">History</h1>
            <p className="text-xs text-slate-500 font-medium">Archived daily records</p>
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
        <HistoryView entries={entries || []} />
      </main>
    </div>
  )
}