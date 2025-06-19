import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  const { email, password, username, role = 'user' } = await req.json()
  const supabase = createAdminClient()

  console.log('🚀 Creating user with:', { email, username, role })

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { username },
    email_confirm: true
  })

  if (error) {
    console.error("❌ Admin createUser error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }

  console.log('✅ Auth user created:', data.user?.id)

  // Insert into public.users table - INCLUDING EMAIL
  const insertRes = await supabase.from('users').insert({
    user_id: data.user?.id,
    username,
    email, // ← ADD THIS LINE
    account_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  if (insertRes.error) {
    console.error("❌ Error inserting to users table:", insertRes.error)
    return NextResponse.json({ success: false, message: insertRes.error.message }, { status: 400 })
  }

  console.log('✅ User profile created successfully')

  return NextResponse.json({ success: true, user_id: data.user?.id })
}