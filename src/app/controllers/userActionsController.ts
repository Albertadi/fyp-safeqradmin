// src/app/controllers/userActionsController.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export async function getUserDetails(userId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, role, account_status, created_at, updated_at, email')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unhandled error fetching user details:', error);
    return null;
  }
}
