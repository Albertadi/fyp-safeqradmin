// src/app/private/actions.ts
import { createClient } from '@/utils/supabase/server';

export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalScans: number;
};

export async function isBackendOnline(): Promise<boolean> {
  const supabase = await createClient();

  try {
    // simple, lightweight GET of a single row
    const { data, error, status } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    // network or 5xx => error.status >= 500 or thrown
    if (error && status && status >= 500) {
      return false;
    }

    // any other case (no error, or 401/403) => treat as online
    return true;
  } catch (e) {
    // something really went wrong (network down, DNS, etc.)
    return false;
  }
}


export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // total users
  const usersRes = await supabase
    .from('users')
    .select('*', { head: true, count: 'exact' });

  // active users
  const activeRes = await supabase
    .from('users')
    .select('*', { head: true, count: 'exact' })
    .eq('account_status', 'active');

  // suspended users
  const suspendedRes = await supabase
    .from('users')
    .select('*', { head: true, count: 'exact' })
    .eq('account_status', 'suspended');

  // total scans
  const scansRes = await supabase
    .from('qr_scans')
    .select('*', { head: true, count: 'exact' });

  // coalesce null → 0 to satisfy `number` type
  const totalUsers     = usersRes.count     ?? 0;
  const activeUsers    = activeRes.count    ?? 0;
  const suspendedUsers = suspendedRes.count ?? 0;
  const totalScans     = scansRes.count     ?? 0;

  // optional: log any errors
  if (usersRes.error || activeRes.error || suspendedRes.error || scansRes.error) {
    console.error('Dashboard fetch errors:', {
      usersError:     usersRes.error,
      activeError:    activeRes.error,
      suspendedError: suspendedRes.error,
      scansError:     scansRes.error,
    });
  }

  return { totalUsers, activeUsers, suspendedUsers, totalScans };
}
