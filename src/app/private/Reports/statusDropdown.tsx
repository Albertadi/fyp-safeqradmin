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

  const getTextColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'Closed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`px-2 py-1 text-xs rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getTextColor(status)}`}
    >
      <option value="Pending" className="text-yellow-600">Pending</option>
      <option value="Closed" className="text-red-600">Closed</option>
    </select>
  );
}
