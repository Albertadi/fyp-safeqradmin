'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getReports() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('reports') 
    .select('id, username, role, status, created_at, updated_at');

  if (error) {
    console.error('Failed to fetch reports:', error.message);
    return [];
  }

  return data;
}
