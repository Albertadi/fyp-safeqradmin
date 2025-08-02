// src/app/controllers/verifiedLinksController.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Type definitions
export interface VerifiedLink {
  link_id: string;
  url: string;
  security_status: 'Safe' | 'Malicious';
  added_by: '80a9d353-421f-4589-aea9-37b907398450';

}

export interface CreateVerifiedLinkData {
  url: string;
  security_status: 'Safe' | 'Malicious';
  added_by: '80a9d353-421f-4589-aea9-37b907398450';

}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('verified_links')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
}
/**
 * Fetch all verified links by paginating in 1000-row batches
 */
export async function fetchVerifiedLinks(): Promise<VerifiedLink[]> {
  const supabase = await createClient();
  const batchSize = 1000;
  let start = 0;
  let allLinks: VerifiedLink[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('verified_links')
      .select('*')
      .order('created_at', { ascending: false })
      .range(start, start + batchSize - 1);

    if (error) {
      console.error('Error fetching verified links batch:', error);
      throw new Error(`Failed to fetch verified links: ${error.message}`);
    }

    const batch = data || [];
    allLinks = allLinks.concat(batch);

    if (batch.length < batchSize) break; // No more rows to fetch
    start += batchSize;
  }

  return allLinks;
}


/**
 * Get a single verified link by ID
 */
export async function getVerifiedLink(linkId: string): Promise<VerifiedLink | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('verified_links')
      .select('*')
      .eq('link_id', linkId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Record not found
      }
      console.error('Error fetching verified link:', error);
      throw new Error(`Failed to fetch verified link: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Get verified link error:', error);
    throw error;
  }
}

/**
 * Create a new verified link
 */
export async function createVerifiedLink(linkData: CreateVerifiedLinkData): Promise<VerifiedLink> {
  try {
    // Validate URL format
    if (!isValidUrl(linkData.url)) {
      throw new Error('Invalid URL format');
    }

    // Check if URL already exists
    const existingLink = await getVerifiedLinkByUrl(linkData.url);
    if (existingLink) {
      throw new Error('URL already exists in verified links');
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('verified_links')
      .insert([{
        ...linkData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating verified link:', error);
      throw new Error(`Failed to create verified link: ${error.message}`);
    }

    revalidatePath('/links');
    return data;
  } catch (error) {
    console.error('Create verified link error:', error);
    throw error;
  }
}
/**
 * Delete a verified link and its related URL features
 */
export async function deleteVerifiedLink(linkId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // First delete related records from url_features table
    const { error: deleteFeaturesError } = await supabase
      .from('url_features')
      .delete()
      .eq('link_id', linkId);

    if (deleteFeaturesError) {
      console.error('Error deleting related URL features:', deleteFeaturesError);
      throw new Error(`Failed to delete related URL features: ${deleteFeaturesError.message}`);
    }

    // Then delete the verified link record
    const { error: deleteLinkError } = await supabase
      .from('verified_links')
      .delete()
      .eq('link_id', linkId);

    if (deleteLinkError) {
      console.error('Error deleting verified link:', deleteLinkError);
      throw new Error(`Failed to delete verified link: ${deleteLinkError.message}`);
    }

    revalidatePath('/links');
  } catch (error) {
    console.error('Delete verified link error:', error);
    throw error;
  }
}

/**
 * Toggle security status of a verified link and mark related reports as Closed
 */
export async function toggleSecurityStatus(linkId: string, currentStatus: 'Safe' | 'Malicious'): Promise<VerifiedLink> {
  try {
    const newStatus = currentStatus === 'Safe' ? 'Malicious' : 'Safe';
    const supabase = await createClient();

    // 1. Update the verified link's status
    const { data, error } = await supabase
      .from('verified_links')
      .update({ security_status: newStatus })
      .eq('link_id', linkId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling security status:', error);
      throw new Error(`Failed to toggle security status: ${error.message}`);
    }

    // 2. Also update any reports that are tied to this link ID
    const { error: reportUpdateError } = await supabase
      .from('reports')
      .update({ status: 'Closed' })
      .eq('link_id', linkId);

    if (reportUpdateError) {
      console.error('Error updating related reports:', reportUpdateError);
      throw new Error(`Failed to update related report(s): ${reportUpdateError.message}`);
    }

    // 3. Revalidate cache path
    revalidatePath('/links');

    return data;
  } catch (error) {
    console.error('Toggle security status error:', error);
    throw error;
  }
}


/**
 * Get verified link by URL
 */
export async function getVerifiedLinkByUrl(url: string): Promise<VerifiedLink | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('verified_links')
      .select('*')
      .eq('url', url)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Record not found
      }
      console.error('Error fetching verified link by URL:', error);
      throw new Error(`Failed to fetch verified link by URL: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Get verified link by URL error:', error);
    throw error;
  }
}

/**
 * Check if a URL is verified and Safe
 */
export async function isUrlVerifiedAndSafe(url: string): Promise<boolean> {
  try {
    const link = await getVerifiedLinkByUrl(url);
    return link !== null && link.security_status === 'Safe';
  } catch (error) {
    console.error('Error checking URL verification:', error);
    return false;
  }
}

/**
 * Get links by security status
 */
export async function getLinksBySecurityStatus(status: 'Safe' | 'Malicious'): Promise<VerifiedLink[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('verified_links')
      .select('*')
      .eq('security_status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching links by security status:', error);
      throw new Error(`Failed to fetch links by security status: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Get links by security status error:', error);
    throw error;
  }
}

/**
 * Search verified links
 */
export async function searchVerifiedLinks(searchTerm: string): Promise<VerifiedLink[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('verified_links')
      .select('*')
      .or(`url.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching verified links:', error);
      throw new Error(`Failed to search verified links: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Search verified links error:', error);
    throw error;
  }
}

/**
 * Get verification statistics
 */
export async function getVerificationStats(): Promise<{
  total: number;
  Safe: number;
  Malicious: number;
}> {
  try {
    const links = await fetchVerifiedLinks();
    
    const stats = {
      total: links.length,
      Safe: links.filter(link => link.security_status === 'Safe').length,
      Malicious: links.filter(link => link.security_status === 'Malicious').length
    };

    return stats;
  } catch (error) {
    console.error('Get verification stats error:', error);
    throw error;
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
/**
 * Get URL from qr_scans table using scan_id
 */
export async function getScanById(scanId: string): Promise<{ url: string } | null> {
  try {
    const supabase = await createClient();
    
    // Add some debugging
    console.log('Looking for scan with ID:', scanId);
    
    const { data, error } = await supabase
      .from('qr_scans')
      .select('decoded_content')
      .eq('scan_id', scanId)
      .single();

    if (error) {
      console.error('Database error:', error);
      if (error.code === 'PGRST116') {
        // Record not found
        console.log('Scan not found in database');
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      console.log('No data returned for scan');
      return null;
    }

    console.log('Found scan data:', data);
    
    // Validate that decoded_content is a valid URL
    if (!data.decoded_content || typeof data.decoded_content !== 'string') {
      throw new Error('Invalid decoded content: not a valid URL');
    }
    
    // Map decoded_content to url
    return { url: data.decoded_content };
  } catch (error) {
    console.error('Error in getScanById:', error);
    throw error;
  }
}

/**
 * Alternative: Get scan with more fields for debugging
 */
export async function getScanByIdDebug(scanId: string) {
  try {
    const supabase = await createClient();
    
    // Get all fields to see what's available
    const { data, error } = await supabase
      .from('qr_scans')
      .select('*')
      .eq('scan_id', scanId);

    console.log('Debug - All scans with this ID:', data);
    console.log('Debug - Error:', error);
    
    return { data, error };
  } catch (error) {
    console.error('Debug error:', error);
    return { data: null, error };
  }
}
export async function addVerifiedLink(url: string, securityStatus: string) {
  const supabase = await createClient(); 

  const { data, error } = await supabase
    .from('verified_links')
    .upsert({
      url: url,
      security_status: securityStatus,
      added_by: '80a9d353-421f-4589-aea9-37b907398450',
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

/**
 * Update report status by report ID
 */
export async function updateReportStatus(reportId: string, newStatus: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('reports')
    .update({ status: newStatus })
    .eq('report_id', reportId);

  if (error) {
    console.error('Error updating report status:', error);
    throw new Error('Failed to update report status');
  }
}

/**
 * Mark report as Closed and update related verified link's security_status to Safe
 */
export async function verifyReportAndMarkSafe(reportId: string, linkId: string): Promise<void> {
  const supabase = await createClient();

  // 1. Update report status to Closed
  const { error: reportError } = await supabase
    .from('reports')
    .update({ status: 'Closed' })
    .eq('report_id', reportId);

  if (reportError) {
    console.error('Failed to update report status:', reportError);
    throw new Error('Failed to close report');
  }

  // 2. Update the associated link to Safe
  const { error: linkError } = await supabase
    .from('verified_links')
    .update({ security_status: 'Safe' })
    .eq('link_id', linkId);

  if (linkError) {
    console.error('Failed to mark link as Safe:', linkError);
    throw new Error('Failed to update link security status');
  }

  revalidatePath('/reports'); // optional
  revalidatePath('/links');
}

/**
 * Check if a given URL already exists in the verified_links table
 */
export async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('verified_links')
      .select('url')
      .eq('url', url)
      .maybeSingle();

    if (error) {
      console.error('Error checking URL existence:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('checkUrlExists error:', err);
    return false;
  }
}
