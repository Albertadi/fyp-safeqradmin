'use client';

import React, { useState, useEffect } from 'react';
import {
  Link,
  CheckCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
  Plus,
  Search,
  Loader2,
  Filter
} from 'lucide-react';
import {
  fetchVerifiedLinks,
  deleteVerifiedLink,
  toggleSecurityStatus,
  testConnection,
  type VerifiedLink
} from '../controllers/verifiedLinksController';
import { useRouter } from 'next/navigation';

// Security status enum mapping
const SECURITY_STATUS = {
  SAFE: 'Safe' as const,
  MALICIOUS: 'Malicious' as const
};

export default function VerifiedLinksManagement() {
  const router = useRouter();

  const [verifiedLinks, setVerifiedLinks] = useState<VerifiedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Safe' | 'Malicious'>('all');
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  // Test Supabase connection
  const testDatabaseConnection = async () => {
    try {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus(false);
      return false;
    }
  };

  // Fetch verified links
  const loadVerifiedLinks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test connection first
      const isConnected = await testDatabaseConnection();
      if (!isConnected) {
        setError('Unable to connect to database. Please check your Supabase configuration.');
        return;
      }

      const links = await fetchVerifiedLinks();
      setVerifiedLinks(links);
      console.log('Fetched links:', links);
    } catch (error) {
      console.error('Error fetching links:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifiedLinks();
  }, []);

  // Filter links based on search and status
  const filteredLinks = verifiedLinks.filter(link => {
    const matchesSearch = link.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || link.security_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Delete link
  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        await deleteVerifiedLink(linkId);
        await loadVerifiedLinks();
      } catch (error) {
        console.error('Error deleting link:', error);
        alert('Failed to delete link. Please try again.');
      }
    }
  };

  // Toggle verification status
  const handleToggleVerification = async (linkId: string) => {
    const link = verifiedLinks.find(l => l.link_id === linkId);
    if (!link) return;

    try {
      await toggleSecurityStatus(linkId, link.security_status);
      await loadVerifiedLinks();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case SECURITY_STATUS.SAFE:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case SECURITY_STATUS.MALICIOUS:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-white">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading verified links...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 w-full min-h-screen bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadVerifiedLinks}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verified Links Management</h1>
          <p className="text-gray-600">Manage trusted links and domains for QR code validation</p>
        </div>

        <button
          onClick={() => router.push('/links/addlink')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Link
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
            />
          </div>
        </div>
        
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Safe' | 'Malicious')}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white min-w-32"
          >
            <option value="all">Status</option>
            <option value="Safe">Safe</option>
            <option value="Malicious">Malicious</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Safe Links</p>
              <p className="text-2xl font-bold text-green-800">
                {verifiedLinks.filter(link => link.security_status === SECURITY_STATUS.SAFE).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Malicious Links</p>
              <p className="text-2xl font-bold text-red-800">
                {verifiedLinks.filter(link => link.security_status === SECURITY_STATUS.MALICIOUS).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Links</p>
              <p className="text-2xl font-bold text-blue-800">{verifiedLinks.length}</p>
            </div>
            <Link className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Verified Links Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <div className="min-h-96">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-1/2 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security Status
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center text-gray-500">
                      {searchTerm || filterStatus !== 'all' ? (
                        <div className="text-center">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No links found</p>
                          <p className="text-gray-600">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Link className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No verified links yet</p>
                          <p className="text-gray-600 mb-4">
                            Add your first link to get started
                          </p>
                          <button
                            onClick={() => router.push('/links/add')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add New Link
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((link) => (
                    <tr key={link.link_id} className="hover:bg-gray-50 h-16">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 truncate pr-2" title={link.url}>
                            {link.url}
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 flex-shrink-0"
                            title="Open link in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleVerification(link.link_id)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors gap-1 ${getStatusColor(link.security_status)}`}
                          title={`Click to change status to ${link.security_status === SECURITY_STATUS.SAFE ? 'Malicious' : 'Safe'}`}
                        >
                          {link.security_status === SECURITY_STATUS.SAFE ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Safe
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              Malicious
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteLink(link.link_id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}