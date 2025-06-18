// lib/supabase.ts
import { createClient } from '@/utils/supabase/client';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  
  account_status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches all users from the Supabase database
 */
export async function fetchUsers(): Promise<User[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Fetches a specific user by ID
 */
export async function fetchUserById(userId: string): Promise<User> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('User not found');
  }
  
  return data;
}

/**
 * Toggles a user's status between 'active' and 'suspended'
 */
export async function toggleUserStatus(userId: string, currentStatus: string): Promise<void> {
  const supabase = createClient();
  
  // Set the new status (opposite of the current status)
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  
  const { error } = await supabase
    .from('users')
    .update({ 
      account_status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error updating user status:', error);
    throw new Error(`Failed to update user status: ${error.message}`);
  }
}

/**
 * Deletes a user from the system
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = createClient();
  
  // First, you might want to delete the user from auth.users
  // Note: This requires admin rights and special configuration
  // const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  // if (authError) throw new Error(`Failed to delete auth user: ${authError.message}`);
  
  // Then delete from your users table
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Updates a user's profile information
 */
export async function updateUserProfile(
  userId: string, 
  userData: { username?: string; role?: string; email?: string }
): Promise<void> {
  const supabase = createClient();
  
  // Create the update payload
  const updateData = {
    ...userData,
    updated_at: new Date().toISOString()
  };
  
  // Update the user profile in your users table
  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
  
  // If email was changed, you might want to update the auth user as well
  // This requires admin privileges and special configuration
  if (userData.email) {
    // This is commented out as it requires admin access
    // const { error: authError } = await supabase.auth.admin.updateUserById(
    //   userId,
    //   { email: userData.email }
    // );
    // if (authError) {
    //   throw new Error(`Failed to update auth user: ${authError.message}`);
    // }
  }
}

/**
 * Creates a new user in the system
 */
export async function createNewUser(
  userData: { 
    username: string; 
    email: string; 
    password: string; 
    role: string;
  }
): Promise<User> {
  const supabase = createClient();
  
  // First, create the user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true
  });
  
  if (authError) {
    console.error('Error creating auth user:', authError);
    throw new Error(`Failed to create user: ${authError.message}`);
  }
  
  // Then create the user profile in your users table
  const newUser = {
    user_id: authData.user.id,
    username: userData.username,
    role: userData.role,
    account_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error: profileError } = await supabase
    .from('users')
    .insert(newUser);
  
  if (profileError) {
    console.error('Error creating user profile:', profileError);
    // You might want to clean up the auth user if profile creation fails
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }
  
  return newUser as User;
}