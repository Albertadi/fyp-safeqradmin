'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server' 

export async function login(formData: FormData) {
  const supabase = await createClient()

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rawEmail = formData.get('email');
  const rawPassword = formData.get('password');

  if (typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail)) {
    redirect('/error?message=Invalid%20email');
  }
  if (typeof rawPassword !== 'string') {
    redirect('/error?message=Invalid%20password');
  }

  const email = rawEmail.trim();
  const password = rawPassword;

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.session) {
    redirect('/error?message=Authentication%20failed')
  }

  const userId = authData.user.id;
  const { data: pubUser, error: pubError } = await supabase
    .from('users') // Public users
    .select('role')
    .eq('user_id', userId) // Where the user id in public and auth is the same
    .single();

  if (pubError || pubUser.role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/error?message=Access%20denied');
  }

  revalidatePath('/', 'layout')
  redirect('/private')
}