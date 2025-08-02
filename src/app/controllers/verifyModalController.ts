// src/app/controllers/verifyModalController.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { VerifiedLink, CreateVerifiedLinkData } from './verifiedLinksController';
import { updateReportStatus } from './verifiedLinksController';
import { checkUrlExists } from './verifiedLinksController';
import { getScanById } from './verifiedLinksController';

interface ScanDetails {
  scan_id: string;
  user_id: string;
  decoded_content: string;
  security_status: string;
  scanned_at: string;
}

type VerifyStatus = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

/**
 * Fetch scan details by scan ID
 */
export async function getScanDetails(scanId: string): Promise<ScanDetails | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('qr_scans')
      .select('scan_id, user_id, decoded_content, security_status, scanned_at')
      .eq('scan_id', scanId)
      .single();

    if (error) {
      console.error('Database error fetching scan details:', error);
      if (error.code === 'PGRST116') return null; // Record not found
      throw new Error(`Database error: ${error.message}`);
    }

    return data as ScanDetails || null;
  } catch (error) {
    console.error('Error in getScanDetails:', error);
    throw error;
  }
}

/**
 * Submit verification for a scan
 */
export async function submitVerification(
  scanId: string,
  label: 'Safe' | 'Malicious',
  reportId?: string
): Promise<VerifyStatus> {
  try {
    // Fetch scan details
    const scanDetails = await getScanDetails(scanId);
    if (!scanDetails) {
      return 'error';
    }

    // Check for duplicate URL
    const urlExists = await checkUrlExists(scanDetails.decoded_content);
    if (urlExists) {
      return 'duplicate';
    }

    // Create verified link
    const linkData: CreateVerifiedLinkData = {
      url: scanDetails.decoded_content,
      security_status: label,
      added_by: '80a9d353-421f-4589-aea9-37b907398450',
    };
    await addVerifiedLink(linkData);

    // Update report status if provided
    if (reportId) {
      await updateReportStatus(reportId, 'Closed');
    }

    revalidatePath('/reports');
    revalidatePath('/links');
    return 'success';
  } catch (error) {
    console.error('Error in submitVerification:', error);
    return 'error';
  }
}

async function addVerifiedLink(linkData: CreateVerifiedLinkData): Promise<VerifiedLink> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('verified_links')
    .upsert({
      ...linkData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding verified link:', error);
    throw new Error('Failed to add verified link');
  }

  return data;
}