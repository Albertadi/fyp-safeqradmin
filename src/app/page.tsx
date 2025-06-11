// src/app/page.tsx
import { redirect } from 'next/navigation'
import LoginPage from './login/page'
import { createClient } from '@/utils/supabase/server'

export default async function RootPage() {
  // initialize Supabase server-side client
  const supabase = await createClient()

  // check if there's an existing session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  // if the user is already logged in, send them to /private
  if (session) {
    redirect('/private')
  }

  // otherwise render the login form
  return <LoginPage />
}
