import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  const { email, password, username } = await req.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { username },
  })

  if (error) {
    console.error("Admin createUser error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }

  const insertRes = await supabase.from('users').insert({
    user_id: data.user?.id,
    username,
    account_status: 'active',
  })

  if (insertRes.error) {
    console.error("Error inserting to users table:", insertRes.error)
    return NextResponse.json({ success: false, message: insertRes.error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
