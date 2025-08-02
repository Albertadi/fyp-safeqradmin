// src/app/components/ServiceStatus.tsx
import { Activity } from "lucide-react"

export default function ServiceStatus({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
      <Activity className={`w-5 h-5 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
      <span className={`text-sm font-medium ${isOnline ? 'text-gray-700' : 'text-red-600'}`}>
        {isOnline ? 'Service Online' : 'Service Offline'}
      </span>
    </div>
  )
}