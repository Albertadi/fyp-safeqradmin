// src/components/ClientWrapper.tsx
'use client'

import dynamic from 'next/dynamic'

//  This is allowed in a client component
const UserManagementDashboard = dynamic(
  () => import('@/app/management/UserManagementDashboard'),
  { ssr: false }
)

export default function ClientWrapper() {
  return <UserManagementDashboard />
}
