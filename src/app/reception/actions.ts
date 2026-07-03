'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Invalid credentials. Please try again.' }
  }

  revalidatePath('/reception')
  redirect('/reception')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/reception/login')
}

export async function toggleDoctorPresence(doctorId: string, isPresent: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('doctors')
    .update({ is_present: isPresent })
    .eq('id', doctorId)

  if (error) {
    console.error('Error toggling presence:', error)
    return { error: 'Failed to update status' }
  }

  revalidatePath('/reception')
  revalidatePath('/')
  return { success: true }
}

export async function advanceQueue(queueId: string) {
  const supabase = await createClient()

  // First, find the current waiting patient and mark them completed (or just handle the specific queueId)
  const { error } = await supabase
    .from('queue')
    .update({ status: 'completed' })
    .eq('id', queueId)

  if (error) {
    console.error('Error advancing queue:', error)
    return { error: 'Failed to advance queue' }
  }

  // MOCK SMS LOGIC
  console.log('--- MOCK SMS SENT ---')
  console.log(`Sending SMS to the patient: "It's your turn to see the doctor!"`)
  console.log('---------------------')

  revalidatePath('/reception')
  return { success: true }
}

export async function addDoctor(formData: FormData) {
  const name = formData.get('name') as string
  const specialization = formData.get('specialization') as string

  if (!name || !specialization) {
    return { error: 'Name and specialization are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('doctors')
    .insert([{ name, specialization, is_present: false }])

  if (error) {
    console.error('Error adding doctor:', error)
    return { error: 'Failed to add doctor' }
  }

  revalidatePath('/reception')
  revalidatePath('/')
  return { success: true }
}

export async function removeDoctor(doctorId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('doctors')
    .delete()
    .eq('id', doctorId)

  if (error) {
    console.error('Error removing doctor:', error)
    return { error: 'Failed to remove doctor' }
  }

  revalidatePath('/reception')
  revalidatePath('/')
  return { success: true }
}
