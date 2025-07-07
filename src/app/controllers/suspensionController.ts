'use server'

import { createClient } from '@/utils/supabase/server'
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

// Function to delete expired suspensions
export async function deleteExpiredSuspensions() {
  const supabase = await createClient()
  
  try {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('suspensions')
      .delete()
      .lt('end_date', now)  // Delete rows where end_date is less than current time
      .select()  // Return deleted rows for logging
    
    if (error) {
      console.error('Error deleting expired suspensions:', error)
      return { success: false, deletedCount: 0 }
    }
    
    console.log(`Deleted ${data?.length || 0} expired suspensions`)
    return { success: true, deletedCount: data?.length || 0 }
  } catch (error) {
    console.error('Error deleting expired suspensions:', error)
    return { success: false, deletedCount: 0 }
  }
}

export async function fetchSuspensionByUser(userId: string) {
  const supabase = await createClient()
  
  try {
    // Clean up expired suspensions first
    await deleteExpiredSuspensions()
    
    // First try the RPC function
    const { data, error } = await supabase.rpc(
      'get_suspension',
      { p_user_id: userId }
    )
    
    if (error) {
      console.error('RPC get_suspension error:', error)
      
      // Fallback: Query the suspensions table directly
      // Look for suspensions ordered by end date (most recent first)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('suspensions')
        .select('user_id, start_date, end_date')  
        .eq('user_id', userId)
        .order('end_date', { ascending: false })
        .limit(1)
        .single()
      
      if (fallbackError) {
        console.error('Fallback suspension query error:', fallbackError)
        return null
      }
      
      return fallbackData
    }
    
    // get_suspension returns an array of rows
    return (data as Array<{
      user_id: string
      start_date: string
      end_date: string
    }>)[0] || null
  } catch (error) {
    console.error('Error fetching suspension:', error)
    return null
  }
}

// Function to check if a suspension is currently active based on end date
export async function isUserCurrentlySuspended(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  try {
    // Clean up expired suspensions first
    await deleteExpiredSuspensions()
    
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('suspensions')
      .select('end_date')  
      .eq('user_id', userId)
      .gt('end_date', now)  // end_date is greater than current time
      .limit(1)
      .single()
    
    if (error) {
      // If no active suspension found, user is not suspended
      return false
    }
    
    return data?.end_date !== null
  } catch (error) {
    console.error('Error checking suspension status:', error)
    return false
  }
}

// Function to get all currently active suspensions (not expired)
export async function getActiveSuspensions() {
  const supabase = await createClient()
  
  try {
    // Clean up expired suspensions first
    await deleteExpiredSuspensions()
    
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('suspensions')
      .select('user_id, start_date, end_date')  
      .gt('end_date', now)  // end_date is greater than current time
      .order('end_date', { ascending: true })
    
    if (error) {
      console.error('Error fetching active suspensions:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching active suspensions:', error)
    return []
  }
}

// Function to get expired suspensions (now mainly for historical purposes)
export async function getExpiredSuspensions() {
  const supabase = await createClient()
  
  try {
    const now = new Date().toISOString()
    
    // Get suspensions that have passed their end date
    const { data, error } = await supabase
      .from('suspensions')
      .select('user_id, start_date, end_date')  
      .lt('end_date', now)   // end_date is less than current time
      .order('end_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching expired suspensions:', error)
      return []
    }
    
    // Return only the most recent expired suspension per user
    const uniqueExpiredSuspensions = (data || []).reduce((acc, current) => {
      if (!acc.find(item => item.user_id === current.user_id)) {
        acc.push({
          user_id: current.user_id,
          end_date: current.end_date
        })
      }
      return acc
    }, [] as Array<{user_id: string, end_date: string}>)
    
    return uniqueExpiredSuspensions
  } catch (error) {
    console.error('Error fetching expired suspensions:', error)
    return []
  }
}

// Standalone function to clean up expired suspensions (can be called manually or by cron job)
export async function cleanupExpiredSuspensions() {
  return await deleteExpiredSuspensions()
}