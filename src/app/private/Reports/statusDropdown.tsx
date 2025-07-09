'use client';

import { useState, useTransition } from 'react';
import { updateReportStatus } from './actions';

interface Props {
  reportId: string;
  initialStatus: string;
}

export default function StatusDropdown({ reportId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);

    startTransition(() => {
      updateReportStatus(reportId, newStatus);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'Closed':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer
        ${getStatusColor(status)}
        border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        appearance-none pr-4
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="currentColor" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>'
        )}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 4px center',
        backgroundSize: '8px'
      }}
    >
      <option value="Pending" className="bg-white text-gray-900">Pending</option>
      <option value="Closed" className="bg-white text-gray-900">Closed</option>
    </select>
  );
}