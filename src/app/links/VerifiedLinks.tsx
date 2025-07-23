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
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  fetchVerifiedLinks,
  deleteVerifiedLink,
  toggleSecurityStatus,
  testConnection,
  type VerifiedLink,
} from '../controllers/verifiedLinksController';
import { useRouter } from 'next/navigation';

const SECURITY_STATUS = {
  SAFE: 'Safe' as const,
  MALICIOUS: 'Malicious' as const,
};

const ITEMS_PER_PAGE = 10;

export default function VerifiedLinksManagement() {
  const router = useRouter();

  const [verifiedLinks, setVerifiedLinks] = useState<VerifiedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Safe' | 'Malicious'>('all');
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [linkToDelete, setLinkToDelete] = useState<VerifiedLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const loadVerifiedLinks = async () => {
    try {
      setLoading(true);
      setError(null);

      const isConnected = await testDatabaseConnection();
      if (!isConnected) {
        setError('Unable to connect to database. Please check your Supabase configuration.');
        return;
      }

      const links = await fetchVerifiedLinks();
      setVerifiedLinks(links);
    } catch (error) {
      console.error('Error fetching links:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentData = async () => {
    await loadVerifiedLinks();
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
          setError('Unable to connect to database.');
          return;
        }

        const links = await fetchVerifiedLinks();
        setVerifiedLinks(links);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load links.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Filter links and calculate pagination
  const filteredLinks = verifiedLinks.filter((link) => {
    const matchesSearch = searchTerm === '' || link.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || link.security_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Update pagination when filters change
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredLinks.length / ITEMS_PER_PAGE);
    setTotalPages(newTotalPages);
    
    // Reset to first page if current page is beyond the new total
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredLinks.length, currentPage]);

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageItems = filteredLinks.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleToggleVerification = async (linkId: string) => {
    const link = verifiedLinks.find((l) => l.link_id === linkId);
    if (!link) return;

    try {
      const updatedLink = await toggleSecurityStatus(linkId, link.security_status);
      setVerifiedLinks(prev => prev.map(l => l.link_id === linkId ? updatedLink : l));
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

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

  const openDeleteModal = (link: VerifiedLink) => {
    setLinkToDelete(link);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteVerifiedLink(linkToDelete.link_id);
      setVerifiedLinks(prev => prev.filter(l => l.link_id !== linkToDelete.link_id));
      setLinkToDelete(null);
    } catch (error) {
      setDeleteError('Failed to delete the link. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to render loading skeleton for stats
  const renderStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredLinks.length)}</span> of{' '}
              <span className="font-medium">{filteredLinks.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                </>
              )}

              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    number === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
              />
            </div>
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as 'all' | 'Safe' | 'Malicious');
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white min-w-32"
            >
              <option value="all">All Status</option>
              <option value="Safe">Safe</option>
              <option value="Malicious">Malicious</option>
            </select>
          </div>
        </div>

        {/* Stats Cards - Show loading animation when loading */}
        {loading ? renderStatsLoading() : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Safe Links</p>
                  <p className="text-2xl font-bold text-green-800">
                    {verifiedLinks.filter((link) => link.security_status === SECURITY_STATUS.SAFE).length}
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
                    {verifiedLinks.filter((link) => link.security_status === SECURITY_STATUS.MALICIOUS).length}
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
        )}

        {/* Search Results Info */}
        {(searchTerm.trim() || filterStatus !== 'all') && !loading && (
          <div className="mb-4 text-sm text-gray-600">
            {filteredLinks.length === 0 ? (
              <p>No links found matching your criteria</p>
            ) : (
              <p>
                Found {filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''} 
                {searchTerm.trim() && ` matching "${searchTerm}"`}
                {filterStatus !== 'all' && ` with status "${filterStatus}"`}
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Verified Links Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
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
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading verified links...
                      </div>
                    </td>
                  </tr>
                ) : currentPageItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center text-gray-500">
                      {error ? (
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">Failed to load links</p>
                          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
                          <button
                            onClick={() => loadVerifiedLinks()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : searchTerm || filterStatus !== 'all' ? (
                        <div className="text-center">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No links found</p>
                          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilterStatus('all');
                              setCurrentPage(1);
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Link className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No verified links yet</p>
                          <p className="text-gray-600 mb-4">Add your first link to get started</p>
                          <button
                            onClick={() => router.push('/links/addlink')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add New Link
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  currentPageItems.map((link, index) => (
                    <tr key={`${link.link_id}-${index}`} className="hover:bg-gray-50 h-16">
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
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors gap-1 ${getStatusColor(
                            link.security_status
                          )}`}
                          title={`Click to change status to ${
                            link.security_status === SECURITY_STATUS.SAFE ? 'Malicious' : 'Safe'
                          }`}
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
                            onClick={() => openDeleteModal(link)}
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
          
          {/* Pagination */}
          {renderPagination()}
        </div>
      </div>

      {/* Delete Verified Link Modal */}
      {linkToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black opacity-50 transition-opacity duration-150"></div>

          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transition-all duration-150">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Delete Link</h2>
              <button onClick={() => setLinkToDelete(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-center">
              <p className="text-gray-800">Are you sure you want to delete this link?</p>
              <p className="text-sm text-gray-700 break-words">{linkToDelete.url}</p>
              {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setLinkToDelete(null)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className={`px-4 py-2 text-sm rounded-md text-white ${isDeleting ? "bg-red-300" : "bg-red-600 hover:bg-red-700"}`}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}