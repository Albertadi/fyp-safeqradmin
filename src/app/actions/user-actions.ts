// app/actions/user-actions.ts
'use server'

import { createNewUser } from '@/app/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function createUserAction(userData: {
  username: string;
  email: string;
  password: string;
  role: string;
}) {
  try {
    // Call the createNewUser function from your supabase file
    const newUser = await createNewUser(userData);
    
    // Revalidate any pages that might show user data
    revalidatePath('/users'); // Adjust path as needed
    
    return { 
      success: true, 
      user: newUser,
      message: 'User created successfully' 
    };
  } catch (error) {
    console.error('Error in createUserAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    };
  }
}