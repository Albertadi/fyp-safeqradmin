"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

type QRScan = {
  scan_id: string
  user_id: string
  decoded_content: string
  security_status: string
  scanned_at: string
  content_type: string
}

export default function QRScansPage() {
  const [scans, setScans] = useState<QRScan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScans = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("qr_scans")
        .select("scan_id, user_id, decoded_content, security_status, scanned_at, content_type")
        .order("scanned_at", { ascending: false })

      if (error) {
        console.error("Error fetching scans:", error)
      } else {
        setScans(data || [])
      }
      setLoading(false)
    }

    fetchScans()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">QR Scan Records</h1>

      {loading ? (
        <p>Loading scans...</p>
      ) : scans.length === 0 ? (
        <p>No scan data found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan ID</th>
                <th className="px-6 py-4 w-56 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-4 w-56 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scanned At</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.scan_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-sm">{scan.scan_id}</td>
                  <td className="px-4 py-2 border text-sm">{scan.user_id}</td>
                  <td className="px-4 py-2 border text-sm text-blue-600 break-all">
                    <a href={scan.decoded_content} target="_blank" rel="noopener noreferrer">
                      {scan.decoded_content}
                    </a>
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scan.security_status === "Safe"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {scan.security_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border text-sm">{scan.content_type}</td>
                  <td className="px-4 py-2 border text-sm">
                    {new Date(scan.scanned_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
