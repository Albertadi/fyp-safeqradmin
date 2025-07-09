// src/app/controllers/scanActionsController.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export async function getScanDetails(scanId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('qr_scans')
      .select('scan_id, user_id, decoded_content, security_status, scanned_at')
      .eq('scan_id', scanId)
      .single();

    if (error) {
      console.error('Error fetching scan details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unhandled error fetching scan details:', error);
    return null;
  }
}
