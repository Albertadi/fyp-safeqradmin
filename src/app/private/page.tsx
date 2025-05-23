// src/app/private/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getDashboardStats } from './actions';

export default async function PrivatePage() {
  const supabase = await createClient();

  // guard — redirect if not logged in
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // fetch all stats at once
  const { totalUsers, activeUsers, suspendedUsers, totalScans } =
    await getDashboardStats();

  return (
    <main style={{ padding: '2rem' }}>
      <h1>SafeQR Admin Dashboard</h1>

      <p><strong>Total Registered Users:</strong> {totalUsers}</p>
      <p><strong>Active Users:</strong>           {activeUsers}</p>
      <p><strong>Suspended Users:</strong>        {suspendedUsers}</p>
      <p><strong>Total QR Scans:</strong>         {totalScans}</p>
    </main>
  );
}
