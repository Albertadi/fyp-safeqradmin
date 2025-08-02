"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Search,
  QrCode,
  Shield,
  ShieldAlert,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import ScanModal from "@/app/private/Reports/ScanModal" // Re-using existing ScanModal

type QRScan = {
  scan_id: string
  user_id: string
  decoded_content: string
  security_status: "Safe" | "Malicious" | "Unknown" // Define possible statuses
  scanned_at: string
  content_type: string
}

const ITEMS_PER_PAGE = 10

export default function QRManagementDashboard() {
  const [scans, setScans] = useState<QRScan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "Safe" | "Malicious" | "Unknown">("all")
  const [filterContentType, setFilterContentType] = useState<"all" | string>("all")
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>([])

  // Modal state
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchScans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from("qr_scans")
        .select("scan_id, user_id, decoded_content, security_status, scanned_at, content_type")
        .order("scanned_at", { ascending: false })

      if (dbError) {
        console.error("Error fetching scans:", dbError)
        setError(dbError.message)
        setScans([])
      } else {
        const fetchedScans = data || []
        setScans(fetchedScans as QRScan[])

        // Extract unique content types
        const types = Array.from(new Set(fetchedScans.map((s) => s.content_type || "Unknown")))
        setAvailableContentTypes(types.sort())
      }
    } catch (err) {
      console.error("Unexpected error fetching scans:", err)
      setError("An unexpected error occurred while fetching scan data.")
      setScans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScans()
  }, [fetchScans])

  // Filter and paginate scans
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const matchesSearch =
        searchTerm === "" ||
        scan.decoded_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.scan_id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || scan.security_status === filterStatus
      const matchesContentType = filterContentType === "all" || scan.content_type === filterContentType

      return matchesSearch && matchesStatus && matchesContentType
    })
  }, [scans, searchTerm, filterStatus, filterContentType])

  // Update pagination when filters change
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredScans.length / ITEMS_PER_PAGE)
    setTotalPages(newTotalPages)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1) // Reset to first page if current page becomes invalid
    } else if (newTotalPages === 0) {
      setCurrentPage(1) // Keep current page at 1 if no results
    }
  }, [filteredScans.length, currentPage])

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPageItems = filteredScans.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const getStatusBadge = (status: QRScan["security_status"]) => {
    let bgColor, textColor
    switch (status) {
      case "Safe":
        bgColor = "bg-green-100"
        textColor = "text-green-800"
        break
      case "Malicious":
        bgColor = "bg-red-100"
        textColor = "text-red-800"
        break
      case "Unknown":
      default:
        bgColor = "bg-yellow-100"
        textColor = "text-yellow-800"
        break
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {status === "Safe" && <Shield className="w-3 h-3 mr-1" />}
        {status === "Malicious" && <ShieldAlert className="w-3 h-3 mr-1" />}
        {status === "Unknown" && <AlertCircle className="w-3 h-3 mr-1" />}
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate statistics
  const totalScans = scans.length
  const safeScans = scans.filter((scan) => scan.security_status === "Safe").length
  const maliciousScans = scans.filter((scan) => scan.security_status === "Malicious").length
  const unknownScans = scans.filter((scan) => scan.security_status === "Unknown").length

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
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
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
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">{Math.min(endIndex, filteredScans.length)}</span> of{" "}
              <span className="font-medium">{filteredScans.length}</span> results
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
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
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
    )
  }

  return (
    <div className="p-6 w-full min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Scan Management</h1>
            <p className="text-gray-600">Overview of all QR code scans and their security status</p>
          </div>
          <button
            onClick={fetchScans}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Scans
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search scans by content, user ID, or scan ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
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
                setFilterStatus(e.target.value as "all" | "Safe" | "Malicious" | "Unknown")
                setCurrentPage(1) // Reset to first page when filtering
              }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white min-w-32"
            >
              <option value="all">All Statuses</option>
              <option value="Safe">Safe</option>
              <option value="Malicious">Malicious</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterContentType}
              onChange={(e) => {
                setFilterContentType(e.target.value)
                setCurrentPage(1) // Reset to first page when filtering
              }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white min-w-32"
            >
              <option value="all">All Content Types</option>
              {availableContentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards - Show loading animation when loading */}
        {loading ? (
          renderStatsLoading()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Safe Scans</p>
                  <p className="text-2xl font-bold text-green-800">{safeScans}</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Malicious Scans</p>
                  <p className="text-2xl font-bold text-red-800">{maliciousScans}</p>
                </div>
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Total Scans</p>
                  <p className="text-2xl font-bold text-blue-800">{totalScans}</p>
                </div>
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Search Results Info */}
        {(searchTerm.trim() || filterStatus !== "all" || filterContentType !== "all") && !loading && (
          <div className="mb-4 text-sm text-gray-600">
            {filteredScans.length === 0 ? (
              <p>No scans found matching your criteria</p>
            ) : (
              <p>
                Found {filteredScans.length} scan{filteredScans.length !== 1 ? "s" : ""}
                {searchTerm.trim() && ` matching "${searchTerm}"`}
                {filterStatus !== "all" && ` with status "${filterStatus}"`}
                {filterContentType !== "all" && ` with content type "${filterContentType}"`}
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

        {/* QR Scans Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scan ID
                  </th>
                  <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="w-2/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Decoded Content
                  </th>
                  <th className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned At
                  </th>
                  <th className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading QR scan records...
                      </div>
                    </td>
                  </tr>
                ) : currentPageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                      {error ? (
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">Failed to load scans</p>
                          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
                          <button
                            onClick={fetchScans}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : searchTerm || filterStatus !== "all" || filterContentType !== "all" ? (
                        <div className="text-center">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No scans found</p>
                          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                          <button
                            onClick={() => {
                              setSearchTerm("")
                              setFilterStatus("all")
                              setFilterContentType("all")
                              setCurrentPage(1)
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No QR scans recorded yet</p>
                          <p className="text-gray-600 mb-4">Scans will appear here as users interact with QR codes.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  currentPageItems.map((scan) => (
                    <tr key={scan.scan_id} className="hover:bg-gray-50 h-16">
                      <td className="px-6 py-4 truncate text-sm font-medium text-gray-900" title={scan.scan_id}>
                        {scan.scan_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 truncate text-sm text-gray-500" title={scan.user_id}>
                        {scan.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="text-sm font-medium text-blue-600 hover:underline truncate pr-2"
                            title={scan.decoded_content}
                          >
                            {scan.decoded_content}
                          </div>
                          {scan.decoded_content.startsWith("http") && (
                            <a
                              href={scan.decoded_content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-600 flex-shrink-0"
                              title="Open link in new tab"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(scan.security_status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{scan.content_type || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(scan.scanned_at)}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedScanId(scan.scan_id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View Details
                        </button>
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

      {/* Scan Details Modal */}
      {selectedScanId && <ScanModal scanId={selectedScanId} onClose={() => setSelectedScanId(null)} />}
    </div>
  )
}
