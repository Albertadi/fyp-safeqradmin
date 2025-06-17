// src/app/private/Reports/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export async function getReports() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select('report_id, scan_id, user_id, reason, status, created_at');

  if (error) {
    console.error('Failed to fetch reports:', error.message);
    return [];
  }

  return data;
}

export async function updateReportStatus(reportId: string, newStatus: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('reports')
    .update({ status: newStatus })
    .eq('report_id', reportId);

  if (error) {
    console.error('Failed to update report status:', error.message);
  }
}
