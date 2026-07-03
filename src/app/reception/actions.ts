'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

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

export async function toggleQueueStatus(queueId: string, currentStatus: string) {
  const supabase = await createClient()
  const newStatus = currentStatus === 'waiting' ? 'completed' : 'waiting'

  const { error } = await supabase
    .from('queue')
    .update({ status: newStatus })
    .eq('id', queueId)

  if (error) {
    console.error('Error toggling queue status:', error)
    return { error: 'Failed to update status' }
  }

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

/**
 * Idempotently migrates future_schedule entries whose appointment_date is today
 * into the live queue. Safe to call on every dashboard load.
 */
export async function migrateToday() {
  const supabase = await createClient()
  const today = getTodayStr()

  const { data: toMigrate, error: fetchError } = await supabase
    .from('future_schedule')
    .select('*')
    .eq('appointment_date', today)

  if (fetchError) {
    console.error('Migration fetch error:', fetchError)
    return { error: fetchError.message }
  }

  if (!toMigrate || toMigrate.length === 0) return { success: true, migrated: 0 }

  // Group by doctor_id so we can assign serial numbers correctly
  const doctorGroups: Record<string, typeof toMigrate> = {}
  for (const entry of toMigrate) {
    if (!doctorGroups[entry.doctor_id]) doctorGroups[entry.doctor_id] = []
    doctorGroups[entry.doctor_id].push(entry)
  }

  for (const [doctorId, entries] of Object.entries(doctorGroups)) {
    // Get current highest serial number already in queue for this doctor today
    const { data: existing } = await supabase
      .from('queue')
      .select('serial_number')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .order('serial_number', { ascending: false })
      .limit(1)

    let nextSerial = existing && existing.length > 0 ? existing[0].serial_number + 1 : 1

    for (const entry of entries) {
      const { error: insertErr } = await supabase.from('queue').insert([{
        doctor_id: entry.doctor_id,
        doctor_name: entry.doctor_name,
        patient_name: entry.patient_name,
        phone_number: entry.phone_number,
        serial_number: nextSerial,
        status: 'waiting',
        appointment_date: today,
      }])

      if (!insertErr) {
        // Delete from future_schedule only after a successful queue insert (idempotency)
        await supabase.from('future_schedule').delete().eq('id', entry.id)
        nextSerial++
      } else {
        console.error('Migration insert error for entry:', entry.id, insertErr)
      }
    }
  }

  revalidatePath('/reception')
  return { success: true }
}

/**
 * Archives all queue records to the history table, clears the queue,
 * and resets all doctors to not-present. Called manually at end of day.
 */
export async function closeDayAndArchive() {
  const supabase = await createClient()
  const today = getTodayStr()

  // Fetch all current queue records
  const { data: queueRecords, error: queueErr } = await supabase
    .from('queue')
    .select('*')

  if (queueErr) {
    console.error('Error fetching queue for archive:', queueErr)
    return { error: queueErr.message }
  }

  // Fetch all doctors for specialization info (not stored in queue)
  const { data: doctors } = await supabase.from('doctors').select('*')

  // Insert into history
  if (queueRecords && queueRecords.length > 0) {
    const historyRecords = queueRecords.map(q => {
      const doctor = doctors?.find(d => d.id === q.doctor_id)
      return {
        archived_date: today,
        doctor_id: q.doctor_id,
        doctor_name: q.doctor_name,
        doctor_specialization: doctor?.specialization ?? null,
        patient_name: q.patient_name,
        phone_number: q.phone_number,
        serial_number: q.serial_number,
        status: q.status,
        appointment_date: q.appointment_date,
        original_created_at: q.created_at,
      }
    })

    const { error: historyErr } = await supabase.from('history').insert(historyRecords)
    if (historyErr) {
      console.error('Error writing to history:', historyErr)
      return { error: `Archive failed: ${historyErr.message}` }
    }
  }

  // Clear the entire queue
  await supabase.from('queue').delete().not('id', 'is', null)

  // Reset all doctors to not present
  await supabase.from('doctors').update({ is_present: false }).not('id', 'is', null)

  revalidatePath('/reception')
  revalidatePath('/reception/history')
  return { success: true }
}

/**
 * Removes a single entry from the future_schedule table.
 */
export async function deleteFutureScheduleEntry(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('future_schedule').delete().eq('id', id)

  if (error) {
    console.error('Error deleting future schedule entry:', error)
    return { error: error.message }
  }

  revalidatePath('/reception/future-schedule')
  return { success: true }
}
