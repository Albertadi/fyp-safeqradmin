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

const TABLE_NAME = 'verified_links';

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
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
 * Fetch all verified links
 */
export async function fetchVerifiedLinks(): Promise<VerifiedLink[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verified links:', error);
      throw new Error(`Failed to fetch verified links: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Fetch verified links error:', error);
    throw error;
  }
}

/**
 * Get a single verified link by ID
 */
export async function getVerifiedLink(linkId: string): Promise<VerifiedLink | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
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
      .from(TABLE_NAME)
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
      .from(TABLE_NAME)
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
 * Toggle security status of a verified link
 */
export async function toggleSecurityStatus(linkId: string, currentStatus: 'Safe' | 'Malicious'): Promise<VerifiedLink> {
  try {
    const newStatus = currentStatus === 'Safe' ? 'Malicious' : 'Safe';
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        security_status: newStatus,
      })
      .eq('link_id', linkId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling security status:', error);
      throw new Error(`Failed to toggle security status: ${error.message}`);
    }

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
      .from(TABLE_NAME)
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
      .from(TABLE_NAME)
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
      .from(TABLE_NAME)
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
