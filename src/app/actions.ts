'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

  if (!doctorId || !patientName || !phoneNumber) {
    return { error: 'Please fill in all fields.' }
  }

  const supabase = await createClient()

  // Find the next serial number for this doctor for today
  // A simple approach is just count the number of queue entries today for this doctor
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: currentQueue, error: queueError } = await supabase
    .from('queue')
    .select('serial_number')
    .eq('doctor_id', doctorId)
    .gte('created_at', today.toISOString())
    .order('serial_number', { ascending: false })
    .limit(1)

  if (queueError) {
    console.error('Error getting queue:', queueError)
    return { error: 'Failed to join queue. Please try again.' }
  }

  const nextSerialNumber = currentQueue && currentQueue.length > 0 ? currentQueue[0].serial_number + 1 : 1

  const { error: insertError } = await supabase
    .from('queue')
    .insert([
      {
        doctor_id: doctorId,
        patient_name: patientName,
        phone_number: phoneNumber,
        serial_number: nextSerialNumber,
        status: 'waiting'
      }
    ])

  if (insertError) {
    console.error('Error inserting into queue:', insertError)
    return { error: 'Failed to join queue. Please try again.' }
  }

  revalidatePath('/')
  
  return { success: true, serialNumber: nextSerialNumber }
}
