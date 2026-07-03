import { LoginForm } from '../../components/reception/LoginForm'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/reception')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white shadow-lg mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Staff Login
          </h1>
          <p className="text-slate-600 font-medium">
            Manage clinic queue and doctors
          </p>
        </div>
        <LoginForm />
        
        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
          <p>Don't have an account? Create one in Supabase Dashboard.</p>
        </div>
      </div>
    </div>
  )
}
