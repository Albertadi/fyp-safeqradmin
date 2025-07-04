'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // 1) validate inputs
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')
  
  if (typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail)) {
    return { error: 'Invalid email format' }
  }
  
  if (typeof rawPassword !== 'string' || !rawPassword) {
    return { error: 'Password is required' }
  }

  const email = rawEmail.trim()
  const password = rawPassword

  // 2) authenticate
  const { data: authData, error: authError } = 
    await supabase.auth.signInWithPassword({ email, password })
    
  if (authError) {
    // Handle specific Supabase auth errors
    if (authError.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password' }
    }
    return { error: 'Authentication failed' }
  }

  // 3) fetch role via RPC
  const userId = authData.user.id
  const { data: role, error: rpcError } = 
    await supabase.rpc('get_user_role', { p_user_id: userId })

  if (!rpcError && role === 'admin') {
    // 4) success → revalidate & redirect
    revalidatePath('/', 'layout')
    redirect('/private')
  }

  // revoke session by default if not authorized
  await supabase.auth.signOut()
  return { error: 'Access denied - admin role required' }
}