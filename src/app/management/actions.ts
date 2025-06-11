'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function suspendUser(userId: string, days: number) {
  const supabase = await createClient()

  const startDate = new Date().toISOString()
  const endDate   = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase
    .from('suspensions')
    .insert({ user_id: userId, start_date: startDate, end_date: endDate })

  if (insertError) throw insertError

  const { error: updateError } = await supabase
    .from('users')
    .update({ account_status: 'suspended' })
    .eq('user_id', userId)

  if (updateError) throw updateError

  revalidatePath('/private/management')

  return true
}

export async function liftSuspension(userId: string) {
  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('suspensions')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  const { error: updateError } = await supabase
    .from('users')
    .update({ account_status: 'active' })
    .eq('user_id', userId)

  if (updateError) throw updateError

  revalidatePath('/private/management')

  return true
}
