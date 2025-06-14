import React, { useState, useEffect } from "react";
import { Search, UserPlus, Filter, Trash2, Ban, Check, AlertCircle, Clock, Edit2, Menu, Home, Users, Bell, Shield, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchUsers, toggleUserStatus, deleteUser, User } from "@/app/lib/supabase";
import { suspendUser, liftSuspension, fetchSuspensionByUser } from "@/app/controllers/suspensionController";
import SuspensionModal from "@/app/components/suspensionModal"
import LiftSuspensionModal from "@/app/components/liftSuspensionModal"

export default function UserManagementDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const [isSuspModalOpen, setSuspModalOpen] = useState(false)
  const [suspendTargetId, setSuspendTargetId] = useState<string|null>(null)
  const [suspendDays, setSuspendDays] = useState(1)

  const [isLiftModalOpen, setLiftModalOpen] = useState(false)
  const [liftTargetId, setLiftTargetId] = useState<string | null>(null)
  const [liftDaysLeft, setLiftDaysLeft] = useState(0)

  const [operationLoading, setOperationLoading] = useState<string | null>(null);


  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const userData = await fetchUsers();
        setUsers(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "" || user.role === filterRole;
    const matchesStatus = filterStatus === "" || user.account_status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Ban className="w-3 h-3 mr-1" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const getRoleBadge = (role: string): React.ReactNode => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
            Admin
          </span>
        );
      case "end_user":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
            User
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };

  const handleEditUser = (userId: string) => {
    console.log("Editing user:", userId);
    try {
      router.push(`/management/edituser/${userId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      alert("Failed to navigate to edit page");
    }
  };


  const handleDeleteUser = async (userId: string) => {
    if (operationLoading) return; // Prevent multiple operations
    
    const user = users.find(u => u.user_id === userId);
    if (!user) {
      alert("User not found");
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setOperationLoading(`delete-${userId}`);
      console.log(`Deleting user: ${userId}`);
      
      // Pass userId to deleteUser function
      await deleteUser(userId);
      
      // Update local state to remove the deleted user
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
      
      console.log(`Successfully deleted user ${userId}`);
    } catch (err) {
      console.error("Error deleting user:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user";
      alert(errorMessage);
    } finally {
      setOperationLoading(null);
    }
  };

  // when "Suspend" clicked:
  const openSuspendModal = (userId: string) => {
    setSuspendTargetId(userId)
    setSuspendDays(1)
    setSuspModalOpen(true)
  }

  const confirmSuspend = async () => {
    if (!suspendTargetId) return
    try {
      await suspendUser(suspendTargetId, suspendDays)

      setUsers(u =>
        u.map(x =>
          x.user_id === suspendTargetId
            ? { ...x, account_status: "suspended" }
            : x
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to suspend")
    } finally {
      setSuspModalOpen(false)
      setSuspendTargetId(null)
    }
  }


  const openLiftModal = async (userId: string) => {
    setLiftTargetId(userId)

    try {
      // fetch the suspension record from your suspensions table
      const suspension = await fetchSuspensionByUser(userId)

      // calculate days left
      if (suspension?.end_date) {
        const end    = new Date(suspension.end_date)
        const now    = new Date()
        const diff   = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        setLiftDaysLeft(Math.max(0, diff))
      } else {
        setLiftDaysLeft(0)
      }
    } catch (err) {
      console.error('Failed to load suspension:', err)
      setLiftDaysLeft(0)
    }

    setLiftModalOpen(true)
  }

    return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all registered users in the SafeQR system</p>
                  </div>
                  <button 
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={() => router.push("/management/createuser")}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </button>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="p-6 border-b bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search users by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="end_user">User</option>
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 border-t-indigo-500 animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="flex justify-center items-center p-8 text-red-500">
                    {error}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.user_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.user_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getRoleBadge(user.role)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(user.account_status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.updated_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  className="p-1 rounded-md hover:bg-blue-100 text-blue-600 disabled:opacity-50" 
                                  title="Edit User"
                                  onClick={() => handleEditUser(user.user_id)}
                                  disabled={operationLoading !== null}
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                {user.account_status === "active" ? (
                                  <button 
                                    className="p-1 rounded-md hover:bg-red-100 text-red-600" 
                                    title="Suspend User"
                                    onClick={() => openSuspendModal(user.user_id)}
                                  >
                                    <Ban className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <button 
                                    className="p-1 rounded-md hover:bg-green-100 text-green-600" 
                                    title="Activate User"
                                    onClick={() => openLiftModal(user.user_id)}
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                )}
                                <button 
                                  className="p-1 rounded-md hover:bg-red-100 text-red-600" 
                                  title="Delete User"
                                  onClick={() => handleDeleteUser(user.user_id)}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                            No users found matching your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination - Could be enhanced with server-side pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{" "}
                      <span className="font-medium">{filteredUsers.length}</span> results
                    </p>
                  </div>
                </div>
              </div>

              {/* Suspension Modal */}
              <SuspensionModal
                isOpen={isSuspModalOpen}
                username={
                  users.find(u => u.user_id === suspendTargetId)?.username || ""
                }
                days={suspendDays}
                onDaysChange={setSuspendDays}
                onCancel={() => setSuspModalOpen(false)}
                onConfirm={confirmSuspend}
              />

              <LiftSuspensionModal
                isOpen={isLiftModalOpen}
                userId={liftTargetId!}                     
                username={users.find(u => u.user_id === liftTargetId)?.username || ''}
                daysLeft={liftDaysLeft}
                onCancel={() => setLiftModalOpen(false)}
                onConfirm={async (id) => {
                  try {
                    await liftSuspension(id)

                    setUsers(prev =>
                      prev.map(u =>
                        u.user_id === id
                          ? { ...u, account_status: 'active' }
                          : u
                      )
                    )
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to lift suspension')
                  } finally {
                    setLiftModalOpen(false)
                    setLiftTargetId(null)
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}