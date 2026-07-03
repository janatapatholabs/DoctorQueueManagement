'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function getTodayStr() {
  // Use IST timezone
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

export async function getDoctors() {
  const supabase = await createClient()
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching doctors:', error)
    return []
  }
  return doctors
}

export async function joinQueue(formData: FormData) {
  const doctorId = formData.get('doctorId') as string
  const patientName = formData.get('patientName') as string
  const phoneNumber = formData.get('phoneNumber') as string
  const appointmentDate = formData.get('appointmentDate') as string

  if (!doctorId || !patientName || !phoneNumber || !appointmentDate) {
    return { error: 'Please fill in all fields.' }
  }

  const supabase = await createClient()
  const today = getTodayStr()
  const isFuture = appointmentDate > today

  // Fetch doctor name to store alongside the record
  const { data: doctorData, error: doctorError } = await supabase
    .from('doctors')
    .select('name')
    .eq('id', doctorId)
    .single()

  if (doctorError || !doctorData) {
    console.error('Error fetching doctor:', doctorError)
    return { error: 'Doctor not found. Please try again.' }
  }

  const doctorName = doctorData.name
  // Future dates → future_schedule table, today → queue table
  const targetTable = isFuture ? 'future_schedule' : 'queue'

  // Find the next serial number in the correct table for this doctor on this date
  const { data: existing, error: lookupError } = await supabase
    .from(targetTable)
    .select('serial_number')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', appointmentDate)
    .order('serial_number', { ascending: false })
    .limit(1)

  if (lookupError) {
    console.error('Error looking up serial:', lookupError)
    return { error: `Lookup failed: ${lookupError.message}` }
  }

  const nextSerialNumber = existing && existing.length > 0 ? existing[0].serial_number + 1 : 1

  const payload: Record<string, unknown> = {
    doctor_id: doctorId,
    doctor_name: doctorName,
    patient_name: patientName,
    phone_number: phoneNumber,
    serial_number: nextSerialNumber,
    appointment_date: appointmentDate,
  }
  // Only queue entries have a status field
  if (!isFuture) payload.status = 'waiting'

  const { error: insertError } = await supabase.from(targetTable).insert([payload])

  if (insertError) {
    console.error('Error inserting:', insertError)
    return { error: `Insert failed: ${insertError.message}` }
  }

  revalidatePath('/')
  revalidatePath('/reception')
  revalidatePath('/reception/future-schedule')

  return { success: true, serialNumber: nextSerialNumber, appointmentDate, isFuture }
}
