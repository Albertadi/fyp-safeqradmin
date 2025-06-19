'use server'

import { createClient }   from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function suspendUser(userId: string, days: number) {
  const supabase = await createClient()

  const { error } = await supabase.rpc(
    'suspend_user',
    { p_user_id: userId, p_days: days }
  )
  if (error) throw error

  revalidatePath('/private/management')
  return true
}

export async function liftSuspension(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc(
    'lift_suspension',
    { p_user_id: userId }
  )
  if (error) throw error

  revalidatePath('/private/management')
  return true
}

export async function fetchSuspensionByUser(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_suspension',
    { p_user_id: userId }
  )
  if (error) throw error

  // get_suspension returns an array of rows
  return (data as Array<{
    user_id: string
    start_date: string
    end_date: string
  }>)[0] || null
}
