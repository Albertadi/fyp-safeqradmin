// lib/supabase.ts - ENHANCED DEBUG VERSION
import { createClient } from '@/utils/supabase/client';

export interface User {
  user_id: string;
  username: string;
  email?: string;
  role: string;

  account_status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Enhanced error handler for Supabase operations
 */
function handleSupabaseError(error: any, operation: string): never {
  console.error(`${operation} failed:`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    fullError: error
  });
  
  // Provide more specific error messages based on common issues
  if (error?.code === 'PGRST116') {
    throw new Error(`${operation} failed: No matching records found or access denied`);
  }
  if (error?.code === '42501') {
    throw new Error(`${operation} failed: Permission denied - check RLS policies`);
  }
  if (error?.code === 'P0001') {
    throw new Error(`${operation} failed: Custom database constraint violation`);
  }
  if (error?.code === '23503') {
    throw new Error(`${operation} failed: Foreign key constraint - user may have related data`);
  }
  if (error?.message?.includes('JWT')) {
    throw new Error(`${operation} failed: Authentication issue - user may not be logged in`);
  }
  
  const errorMessage = error?.message || 'Unknown database error';
  throw new Error(`${operation} failed: ${errorMessage}`);
}

/**
 * Test RLS policies for DELETE operations
 */
export async function testDeletePermissions(userId: string): Promise<{ canDelete: boolean; details: any }> {
  console.log('🔍 Testing DELETE permissions for user:', userId);
  
  const supabase = createClient();
  
  try {
    // Test 1: Check if user exists and is accessible
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (selectError) {
      return {
        canDelete: false,
        details: {
          error: selectError,
          message: 'Cannot access user - check SELECT permissions'
        }
      };
    }
    
    // Test 2: Check current user's auth status
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      return {
        canDelete: false,
        details: {
          error: authError,
          message: 'No authenticated user - authentication required for delete'
        }
      };
    }
    
    console.log('Current user auth status:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role
    });
    
    return {
      canDelete: true,
      details: {
        targetUser: user,
        currentUser: {
          id: currentUser.id,
          email: currentUser.email
        },
        message: 'User accessible and authenticated'
      }
    };
    
  } catch (error) {
    return {
      canDelete: false,
      details: {
        error,
        message: 'Permission test failed'
      }
    };
  }
}

/**
 * Enhanced delete function with comprehensive debugging
 */
export async function deleteUserWithDebug(userId: string): Promise<void> {
  console.log('🚀 Starting ENHANCED delete process for userId:', userId);
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }
  
  const supabase = createClient();
  
  // Step 1: Test permissions first
  console.log('🔐 Testing delete permissions...');
  const permissionTest = await testDeletePermissions(userId);
  console.log('Permission test result:', permissionTest);
  
  if (!permissionTest.canDelete) {
    throw new Error(`Cannot delete user: ${permissionTest.details.message}`);
  }
  
  // Step 2: Get current user info for logging
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  console.log('🔍 Current authenticated user:', {
    id: currentUser?.id,
    email: currentUser?.email,
    isAuthenticated: !!currentUser
  });
  
  // Step 3: Verify user exists before delete
  console.log('📋 Verifying user exists...');
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (checkError) {
    console.error('❌ User verification failed:', checkError);
    if (checkError.code === 'PGRST116') {
      throw new Error('User not found or access denied');
    }
    handleSupabaseError(checkError, 'Verify user exists');
  }
  
  if (!existingUser) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  console.log('✅ User verified:', {
    id: existingUser.user_id,
    username: existingUser.username,
    role: existingUser.role,
    status: existingUser.account_status
  });
  
  // Step 4: Perform the delete with detailed logging
  console.log('🔥 Attempting delete operation...');
  
  const { data: deleteData, error: deleteError, count, status, statusText } = await supabase
    .from('users')
    .delete()
    .eq('user_id', userId)
    .select(); // This will return the deleted row(s)
  
  // Log detailed delete response
  console.log('🔍 Delete operation response:', {
    data: deleteData,
    error: deleteError,
    count: count,
    status: status,
    statusText: statusText,
    dataLength: deleteData?.length
  });
  
  if (deleteError) {
    console.error('❌ Delete operation failed:', deleteError);
    handleSupabaseError(deleteError, 'Delete user');
  }
  
  // Step 5: Verify deletion was successful
  if (!deleteData || deleteData.length === 0) {
    console.warn('⚠️ Delete operation returned no data - this might indicate RLS policy blocking');
    
    // Try to fetch the user again to see if it still exists
    const { data: stillExists, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!verifyError && stillExists) {
      throw new Error('Delete operation completed but user still exists - check RLS DELETE policies');
    }
    
    console.log('✅ User verified as deleted (not found in verification check)');
  } else {
    console.log('✅ Delete successful - returned deleted user data:', deleteData[0]);
  }
  
  // Step 6: Final verification
  console.log('🔍 Final verification - checking if user still exists...');
  const { data: finalCheck, error: finalError } = await supabase
    .from('users')
    .select('user_id, username')
    .eq('user_id', userId)
    .single();
  
  if (!finalError && finalCheck) {
    console.error('❌ CRITICAL: User still exists after delete operation!');
    console.error('This indicates a Row Level Security (RLS) policy issue');
    throw new Error('Delete failed - user still exists. Check RLS DELETE policies and permissions.');
  }
  
  if (finalError?.code === 'PGRST116') {
    console.log('✅ Final verification passed - user no longer exists');
  } else if (finalError) {
    console.warn('⚠️ Final verification had error (but this might be expected):', finalError.message);
  }
  
  console.log('🎉 User deletion process completed successfully!');
}

/**
 * Check RLS policies and provide recommendations
 */
export async function diagnoseRLSPolicies(): Promise<void> {
  console.log('🔍 Diagnosing RLS policies...');
  
  const supabase = createClient();
  
  try {
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user ? { id: user.id, email: user.email } : 'Not authenticated');
    
    // Test SELECT permission
    const { data: selectTest, error: selectError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    console.log('SELECT test:', selectError ? 'FAILED' : 'PASSED', selectError?.message);
    
    // Test INSERT permission (with fake data)
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        user_id: 'test-fake-id',
        username: 'test-user',
        email: 'test@test.com',
        role: 'user',
        account_status: 'active'
      })
      .select();
    
    console.log('INSERT test:', insertError ? 'FAILED' : 'PASSED', insertError?.message);
    
    // Clean up the test insert if it succeeded
    if (!insertError) {
      await supabase.from('users').delete().eq('user_id', 'test-fake-id');
    }
    
    console.log('📋 RLS Diagnosis Complete');
    console.log('💡 Common RLS issues for DELETE:');
    console.log('   - Missing DELETE policy');
    console.log('   - DELETE policy only allows users to delete themselves');
    console.log('   - DELETE policy requires specific role (admin, moderator)');
    console.log('   - Authentication required but user not logged in');
    
  } catch (error) {
    console.error('RLS diagnosis failed:', error);
  }
}

/**
 * Original delete function (for comparison)
 */
export async function deleteUser(userId: string): Promise<void> {
  console.log('🗑️ Starting delete process for userId:', userId);
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }
  
  const supabase = createClient();
  
  // Step 1: Check if user exists
  console.log('📋 Checking if user exists...');
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('user_id, username, role')
    .eq('user_id', userId)
    .single();
  
  if (checkError) {
    if (checkError.code === 'PGRST116') {
      throw new Error('User not found or access denied');
    }
    handleSupabaseError(checkError, 'Check user exists');
  }
  
  if (!existingUser) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  console.log(`✅ User found: ${existingUser.username}`);
  
  // Step 2: Delete the user
  console.log('🔥 Deleting user...');
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('user_id', userId);
  
  if (deleteError) {
    console.error('❌ Delete failed:', deleteError);
    handleSupabaseError(deleteError, 'Delete user');
  }
  
  console.log(`🎉 User ${existingUser.username} deleted successfully!`);
}

// Export all other functions from original file
export async function testDatabaseConnection(): Promise<{ success: boolean; details: any }> {
  console.log('🧪 Testing database connection and permissions...');
  
  try {
    const supabase = createClient();
    
    // Test 1: Basic connectivity and SELECT
    console.log('📋 Test 1: SELECT permissions...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('SELECT test failed:', testError);
      return {
        success: false,
        details: {
          error: testError,
          failedOperation: 'SELECT',
          suggestion: 'Check table name, RLS policies for SELECT, or user authentication'
        }
      };
    }
    
    console.log('✅ Database connection test completed');
    return {
      success: true,
      details: {
        rowCount: testData,
        permissions: {
          select: true
        },
        message: 'Database accessible'
      }
    };
    
  } catch (error) {
    console.error('❌ Connection test exception:', error);
    return {
      success: false,
      details: {
        error,
        suggestion: 'Check Supabase configuration and network connectivity'
      }
    };
  }
}

export async function fetchUsers(): Promise<User[]> {
  console.log('📋 Fetching all users...');
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    handleSupabaseError(error, 'Fetch users');

  }
  
  console.log(`✅ Fetched ${data?.length || 0} users`);
  return data || [];
}

export async function fetchUserById(userId: string): Promise<User> {
  console.log('🔍 Fetching user by ID:', userId);
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const supabase = createClient();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (userError) {
    console.error('❌ User fetch error:', userError);
    handleSupabaseError(userError, 'Fetch user by ID');
  }

  if (!userData) {
    throw new Error('User not found');
  }

  console.log('✅ User found:', userData.username);
  return userData;
}

export async function toggleUserStatus(userId: string, currentStatus: string): Promise<void> {
  console.log('🔄 Toggling user status:', userId, 'from', currentStatus);
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const supabase = createClient();
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  

  const { error } = await supabase
    .from('users')
    .update({ 
      account_status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  if (error) {
    handleSupabaseError(error, 'Toggle user status');

  }
  
  console.log(`✅ User status changed to: ${newStatus}`);
}



export async function updateUserProfile(
  userId: string, 
  userData: { username?: string; email?: string; role?: string }
): Promise<void> {
  console.log('✏️ Updating user profile for:', userId);
  console.log('📝 Update data:', userData);
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!userData.username && !userData.role && !userData.email) {
    throw new Error('At least one field (username, email, or role) must be provided for update');
  }
  
  const supabase = createClient();
  
  // Step 1: Check if user exists
  console.log('📋 Checking if user exists...');
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('user_id, username, email, role')
    .eq('user_id', userId)
    .single();
  
  if (findError) {
    console.error('❌ Find user error:', findError);
    handleSupabaseError(findError, 'Find user for update');
  }
  
  if (!existingUser) {
    throw new Error(`User not found with ID: ${userId}`);
  }
  
  console.log('✅ Found user:', existingUser.username);
  
  // Step 2: Build update object
  const updates: any = {
    updated_at: new Date().toISOString()
  };
  
  if (userData.username && userData.username !== existingUser.username) {
    updates.username = userData.username;
  }
  if (userData.email && userData.email !== existingUser.email) {
    updates.email = userData.email;
  }
  if (userData.role && userData.role !== existingUser.role) {
    updates.role = userData.role;
  }
  
  // Check if there are actual changes to make
  if (Object.keys(updates).length === 1) { // Only updated_at
    console.log('ℹ️ No changes detected');
    return;
  }
  
  console.log('📝 Applying updates:', updates);
  
  // Step 3: Perform update
  const { data: updatedData, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('user_id', userId)
    .select();
  
  if (updateError) {
    console.error('❌ Update error:', updateError);
    handleSupabaseError(updateError, 'Update user profile');
  }
  
  if (!updatedData || updatedData.length === 0) {
    throw new Error('No rows were updated - check user permissions and RLS policies');
  }
  
  console.log('🎉 User updated successfully!');
}

export async function createNewUser(
  userData: { 
    username: string; 
    email: string; 
    password: string; 
    role: string;
  }
): Promise<User> {
  console.log('👤 Creating new user:', userData.username);
  
  const supabase = createClient();
  
  // Create user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true
  });
  
  if (authError || !authData.user) {
    handleSupabaseError(authError, 'Create auth user');

  }
  
  // Create user profile
  const newUser = {
    user_id: authData.user!.id,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    account_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error: profileError } = await supabase
    .from('users')
    .insert(newUser);
  
  if (profileError) {
    // Clean up auth user if profile creation fails
    try {
      await supabase.auth.admin.deleteUser(authData.user!.id);
    } catch (cleanupError) {
      console.error('Failed to cleanup auth user:', cleanupError);
    }
    handleSupabaseError(profileError, 'Create user profile');
  }
  
  console.log('✅ New user created successfully');
  return newUser as User;
}