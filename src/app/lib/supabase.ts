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

export interface Suspension {
  user_id: string;
  start_date: string;
  end_date: string;
  status?: string;
  reason?: string;
  lifted_at?: string;
  lift_reason?: string;
  created_at?: string;
  updated_at?: string;
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

/**
 * Automatically lifts expired suspensions by updating user status
 * This function should be called periodically or when checking suspension status
 */
export async function autoLiftExpiredSuspensions(): Promise<number> {
  const supabase = createClient();

  try {
    // Get all active suspensions that have expired
    const { data: expiredSuspensions, error: fetchError } = await supabase
      .from('suspensions')
      .select('user_id, end_date')
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired suspensions:', fetchError);
      throw new Error(`Failed to fetch expired suspensions: ${fetchError.message}`);
    }

    if (!expiredSuspensions || expiredSuspensions.length === 0) {
      console.log('No expired suspensions found');
      return 0;
    }

    console.log(`Found ${expiredSuspensions.length} expired suspensions to lift`);

    let liftedCount = 0;

    // Process each expired suspension
    for (const suspension of expiredSuspensions) {
      try {
        // Start a transaction-like operation
        // First, update the user status to 'active'
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            account_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', suspension.user_id);

        if (userUpdateError) {
          console.error(`Error updating user ${suspension.user_id}:`, userUpdateError);
          continue; // Skip this one and continue with others
        }

        // Then, update the suspension status to 'lifted' instead of deleting
        const { error: suspensionUpdateError } = await supabase
          .from('suspensions')
          .update({
            status: 'lifted',
            lifted_at: new Date().toISOString(),
            lift_reason: 'Automatically lifted - suspension period expired'
          })
          .eq('user_id', suspension.user_id)
          .eq('status', 'active'); // Only update active suspensions

        if (suspensionUpdateError) {
          console.error(`Error updating suspension for user ${suspension.user_id}:`, suspensionUpdateError);

          // Rollback user status change if suspension update failed
          await supabase
            .from('users')
            .update({
              account_status: 'suspended',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', suspension.user_id);

          continue;
        }

        liftedCount++;
        console.log(`Successfully lifted suspension for user ${suspension.user_id}`);

      } catch (error) {
        console.error(`Error processing suspension for user ${suspension.user_id}:`, error);
        continue;
      }
    }

    console.log(`Successfully lifted ${liftedCount} out of ${expiredSuspensions.length} expired suspensions`);
    return liftedCount;

  } catch (error) {
    console.error('Error in autoLiftExpiredSuspensions:', error);
    throw error;
  }
}

/**
 * Get all active suspensions (not expired and not lifted)
 */
export async function getActiveSuspensions(): Promise<Suspension[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('suspensions')
    .select('*')
    .eq('status', 'active')
    .gt('end_date', new Date().toISOString());

  if (error) {
    console.error('Error fetching active suspensions:', error);
    throw new Error(`Failed to fetch active suspensions: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all expired suspensions that haven't been lifted yet
 */
export async function getExpiredSuspensions(): Promise<Suspension[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('suspensions')
    .select('*')
    .eq('status', 'active')
    .lt('end_date', new Date().toISOString());

  if (error) {
    console.error('Error fetching expired suspensions:', error);
    throw new Error(`Failed to fetch expired suspensions: ${error.message}`);
  }

  return data || [];
}

/**
 * Checks if a user is currently suspended (has an active suspension)
 */
export async function isUserCurrentlySuspended(userId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('suspensions')
      .select('end_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('end_date', now)  // end_date is greater than current time
      .limit(1)
      .single();

    if (error) {
      // If no active suspension found, user is not suspended
      return false;
    }

    return data?.end_date !== null;
  } catch (error) {
    console.error('Error checking suspension status:', error);
    return false;
  }
}

/**
 * Gets all suspensions for a user (both active and inactive)
 */
export async function getUserSuspensionHistory(userId: string): Promise<Suspension[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('suspensions')
      .select('user_id, start_date, end_date, status, reason, lifted_at, lift_reason, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user suspension history:', error);
      throw new Error(`Failed to fetch suspension history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user suspension history:', error);
    throw error;
  }
}

/**
 * Manually lift a suspension
 */
export async function liftSuspension(userId: string): Promise<void> {
  const supabase = createClient();

  try {
    // Update user status to active
    const { error: userError } = await supabase
      .from('users')
      .update({
        account_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (userError) {
      console.error('Error updating user status:', userError);
      throw new Error(`Failed to update user status: ${userError.message}`);
    }

    // Update suspension status to lifted
    const { error: suspensionError } = await supabase
      .from('suspensions')
      .update({
        status: 'lifted',
        lifted_at: new Date().toISOString(),
        lift_reason: 'Manually lifted by administrator'
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (suspensionError) {
      console.error('Error updating suspension:', suspensionError);

      // Rollback user status change
      await supabase
        .from('users')
        .update({
          account_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      throw new Error(`Failed to update suspension: ${suspensionError.message}`);
    }

    console.log(`Successfully lifted suspension for user ${userId}`);

  } catch (error) {
    console.error('Error in liftSuspension:', error);
    throw error;
  }
}

/**
 * Create a new suspension
 */
export async function suspendUser(userId: string, days: number): Promise<void> {
  const supabase = createClient();

  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    // Update user status to suspended
    const { error: userError } = await supabase
      .from('users')
      .update({
        account_status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (userError) {
      console.error('Error updating user status:', userError);
      throw new Error(`Failed to update user status: ${userError.message}`);
    }

    // Create suspension record
    const { error: suspensionError } = await supabase
      .from('suspensions')
      .insert([{
        user_id: userId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        reason: `Suspended for ${days} day${days !== 1 ? 's' : ''}`,
        created_at: new Date().toISOString()
      }]);

    if (suspensionError) {
      console.error('Error creating suspension:', suspensionError);

      // Rollback user status change
      await supabase
        .from('users')
        .update({
          account_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      throw new Error(`Failed to create suspension: ${suspensionError.message}`);
    }

    console.log(`Successfully suspended user ${userId} for ${days} days`);

  } catch (error) {
    console.error('Error in suspendUser:', error);
    throw error;
  }
}

/**
 * Get suspension details for a specific user
 */
export async function fetchSuspensionByUser(userId: string): Promise<Suspension | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('suspensions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error fetching user suspension:', error);
    throw new Error(`Failed to fetch user suspension: ${error.message}`);
  }

  return data;
}

/**
 * Get current user session
 */
export async function getSession(access_token: string, refresh_token: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })

  if (error) { throw new Error("Failed to restore session: " + error.message) }
}

/**
 * Get current username
 */
export async function getUsername(access_token: string, refresh_token: string) {
  const supabase = createClient()

  const { data, error} = await supabase.auth.getUser()

  console.log(data)

  if (error) { throw new Error("Failed to get user info:" + error.message) }
  return data
}

/**
 * Reset password for users
 */
export async function updatePassword(password: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) { throw new Error("Password reset failed: " + error.message) }
}

/**
 * Exchanges the OAuth code or password reset token from the URL for a session.
 * Should be called once on the reset password page load.
 */
export async function setSession(access_token: string, refresh_token: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error) { throw new Error(`Invalid or expired link: ${error.message}`)}
}

/**
 * Updates the logged-in user's password after exchanging the session.
 */
export async function updatePasswordAfterReset(newPassword: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) { throw new Error(`Failed to update password: ${error.message}`)}
}

/**
 * Force signout to ensure it does not persist a session after resetting.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()
  if (error) { throw new Error(`Failed to sign out: ${error.message}`)}
}