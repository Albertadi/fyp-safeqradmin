// src/app/private/Reports/UserModal.tsx
'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserDetails } from '../../controllers/userActionsController';

interface UserDetails {
  user_id: string;
  role: string;
  account_status: string;
  created_at: string;
  updated_at: string;
  email: string;
}

interface UserModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserModal({ userId, onClose }: UserModalProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const result = await getUserDetails(userId);

        if (result) {
          const user: UserDetails = {
            user_id: result.user_id,
            role: result.role,
            account_status: result.account_status,
            created_at: result.created_at,
            updated_at: result.updated_at,
            email: result.email,
          };
          setUserDetails(user);
        } else {
          setUserDetails(null);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setUserDetails(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserDetails();
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading user details...</div>
            </div>
          ) : userDetails ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.user_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <span
                  className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    userDetails.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : userDetails.role === 'user'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {userDetails.role}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Status</label>
                <span
                  className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    userDetails.account_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : userDetails.account_status === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {userDetails.account_status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(userDetails.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Updated At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(userDetails.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">User details not found</div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
