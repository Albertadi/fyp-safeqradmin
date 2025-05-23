import { createClient } from '@/utils/supabase/server'
import ClientWrapper from '@/app/management/ClientWrapper'

export default async function PrivatePage() {
  const supabase = await createClient()

  // You can pass props if needed
  return <ClientWrapper />
}
