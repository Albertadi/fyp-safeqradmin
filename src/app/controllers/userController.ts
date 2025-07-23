// lib/supabase.ts
import { createAdminClient } from '@/utils/supabase/admin';
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
 * Create user
 */

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user?: any;
  error?: any;
}

export async function createUser(userData: CreateUserData): Promise<CreateUserResponse> {
  try {
    const supabase = createClient();

    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username, 
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.status,
        name: error.name,
      });
      
      // Handle specific Supabase error messages
      if (error.message.includes('User already registered')) {
        return {
          success: false,
          message: 'A user with this email already exists',
          error
        };
      }
      
      if (error.message.includes('Database error saving new user')) {
        return {
          success: false,
          message: 'Database configuration issue detected. This usually indicates a database trigger or constraint problem. Please contact support.',
          error
        };
      }
      
      if (error.message.includes('unexpected_failure')) {
        return {
          success: false,
          message: 'Service temporarily unavailable. Please try again in a few moments.',
          error
        };
      }
      
      if (error.message.includes('Password should be at least')) {
        return {
          success: false,
          message: 'Password does not meet requirements',
          error
        };
      }
      
      if (error.message.includes('Invalid email')) {
        return {
          success: false,
          message: 'Please provide a valid email address',
          error
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to create user',
        error
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'User creation failed - no user data returned',
      };
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          user_id: data.user.id,           // FK → auth.users.id
          username: userData.username,                   // username
          email: userData.email,
          role: 'end_user',           // default role
          account_status: 'active'    // default status
        }
      ])
      .select()                      // return the inserted row
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return {
        success: false,
        message: 'User created but profile setup failed',
        error: profileError
      };
    }

    return {
      success: true,
      message: data.user.email_confirmed_at 
        ? 'User created successfully' 
        : 'User created successfully. Please check email for verification.',
      user: data.user
    };

  } catch (error: any) {
    console.error('Unexpected error creating user:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while creating the user',
      error
    };
  }
}