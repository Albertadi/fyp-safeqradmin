import React, { useState, useEffect, useCallback  } from "react";
import { Search, UserPlus, Filter, Trash2, Ban, Check, AlertCircle, Clock, Edit2, Menu, Home, Users, Bell, Shield, LogOut, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchUsers, toggleUserStatus, User, autoLiftExpiredSuspensions } from "@/app/lib/supabase";
import { suspendUser, liftSuspension, fetchSuspensionByUser, getExpiredSuspensions, getActiveSuspensions } from "@/app/controllers/suspensionController";
import SuspensionModal from "@/app/components/suspensionModal"
import LiftSuspensionModal from "@/app/components/liftSuspensionModal"

// Role Change Warning Modal Component
const RoleChangeWarningModal = ({ 
  isOpen, 
  targetUser, 
  newRole, 
  onCancel, 
  onConfirm 
}: {
  isOpen: boolean;
  targetUser: User | null;
  newRole: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!isOpen || !targetUser) return null;

  const isEscalatingToAdmin = newRole === 'admin' && targetUser.role !== 'admin';
  const isDemotingFromAdmin = targetUser.role === 'admin' && newRole !== 'admin';
  
  const getWarningMessage = () => {
    if (isEscalatingToAdmin) {
      return {
        title: "Grant Admin Access",
        message: `Grant administrator privileges to "${targetUser.username}"? This gives them full system access.`,
        consequences: [
          "Manage all users and data",
          "Access system settings",
          "Full administrative control"
        ],
        warningLevel: "high"
      };
    } else if (isDemotingFromAdmin) {
      return {
        title: "Remove Admin Access",
        message: `Remove administrator privileges from "${targetUser.username}"? They'll become a regular user.`,
        consequences: [
          "Loss of user management access",
          "No system configuration access",
          "Limited to end-user functions"
        ],
        warningLevel: "medium"
      };
    } else {
      return {
        title: "Role Change Confirmation",
        message: `Change "${targetUser.username}" from "${targetUser.role}" to "${newRole}"?`,
        consequences: [],
        warningLevel: "low"
      };
    }
  };

  const warning = getWarningMessage();
  const bgColor = warning.warningLevel === 'high' ? 'bg-red-50' : 
                 warning.warningLevel === 'medium' ? 'bg-yellow-50' : 'bg-blue-50';
  const borderColor = warning.warningLevel === 'high' ? 'border-red-200' : 
                     warning.warningLevel === 'medium' ? 'border-yellow-200' : 'border-blue-200';
  const textColor = warning.warningLevel === 'high' ? 'text-red-800' : 
                   warning.warningLevel === 'medium' ? 'text-yellow-800' : 'text-blue-800';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center mb-4">
            <AlertTriangle className={`w-6 h-6 mr-3 ${warning.warningLevel === 'high' ? 'text-red-600' : warning.warningLevel === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`} />
            <h3 className="text-lg font-medium text-gray-900">{warning.title}</h3>
          </div>
          
          <div className={`p-4 rounded-md ${bgColor} ${borderColor} border mb-4`}>
            <p className={`text-sm ${textColor} mb-3`}>
              {warning.message}
            </p>
            
            {warning.consequences.length > 0 && (
              <div>
                <p className={`text-sm font-medium ${textColor} mb-2`}>
                  {isEscalatingToAdmin ? "This user will gain:" : "This user will lose:"}
                </p>
                <ul className={`text-sm ${textColor} space-y-1`}>
                  {warning.consequences.map((consequence, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{consequence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <div className="text-sm text-gray-700">
              <p><strong>Current Role:</strong> {targetUser.role}</p>
              <p><strong>New Role:</strong> {newRole}</p>
              <p><strong>User ID:</strong> {targetUser.user_id}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md transition-colors ${
                warning.warningLevel === 'high' 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : warning.warningLevel === 'medium'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isEscalatingToAdmin ? 'Grant Admin Access' : 
               isDemotingFromAdmin ? 'Remove Admin Access' : 
               'Confirm Role Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  
  // Updated state for suspension management
  const [suspensionCheckLoading, setSuspensionCheckLoading] = useState<boolean>(false);
  const [lastSuspensionCheck, setLastSuspensionCheck] = useState<Date | null>(null);
  const [activeSuspensionsCount, setActiveSuspensionsCount] = useState<number>(0);
  const [expiredSuspensionsCount, setExpiredSuspensionsCount] = useState<number>(0);

  // Role change warning modal state
  const [isRoleWarningOpen, setRoleWarningOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<User | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<string>("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const userData = await fetchUsers();
        setUsers(userData);
        
        // Automatically check suspensions when dashboard loads
        await checkSuspensionStatus(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Updated function to check suspension status
  const checkSuspensionStatus = async (isAutomatic = false) => {
    if (suspensionCheckLoading) return;
    
    try {
      setSuspensionCheckLoading(true);
      
      // Get both active and expired suspensions
      const [activeSuspensions, expiredSuspensions] = await Promise.all([
        getActiveSuspensions(),
        getExpiredSuspensions()
      ]);
      
      setActiveSuspensionsCount(activeSuspensions.length);
      setExpiredSuspensionsCount(expiredSuspensions.length);
      
      // Automatically lift expired suspensions without asking for confirmation
      if (expiredSuspensions.length > 0) {
        console.log(`Found ${expiredSuspensions.length} expired suspension${expiredSuspensions.length !== 1 ? 's' : ''}, lifting automatically...`);
        
        const liftedCount = await autoLiftExpiredSuspensions();
        
        // Refresh the users list to reflect the changes
        const updatedUsers = await fetchUsers();
        setUsers(updatedUsers);
        
        // Update the counts after lifting
        const newActiveSuspensions = await getActiveSuspensions();
        setActiveSuspensionsCount(newActiveSuspensions.length);
        setExpiredSuspensionsCount(0); // Should be 0 after lifting
        
        if (!isAutomatic) {
          alert(`Automatically lifted ${liftedCount} expired suspension${liftedCount !== 1 ? 's' : ''}`);
        } else {
          console.log(`Successfully lifted ${liftedCount} expired suspension${liftedCount !== 1 ? 's' : ''} automatically`);
        }
      }
      
      setLastSuspensionCheck(new Date());
    } catch (err) {
      console.error("Error checking suspension status:", err);
      if (!isAutomatic) {
        alert(err instanceof Error ? err.message : "Failed to check suspension status");
      }
    } finally {
      setSuspensionCheckLoading(false);
    }
  };

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

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </span>
        );
      case "end_user":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
            <Users className="w-3 h-3 mr-1" />
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

  const handleRoleChangeClick = (user: User) => {
    setRoleChangeTarget(user);
    // Toggle role for demonstration - in real app, this would be from a form/dropdown
    const newRole = user.role === 'admin' ? 'end_user' : 'admin';
    setPendingRoleChange(newRole);
    setRoleWarningOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!roleChangeTarget || !pendingRoleChange) return;

    try {
      // Here you would call your role update API
      // await updateUserRole(roleChangeTarget.user_id, pendingRoleChange);
      
      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === roleChangeTarget.user_id 
            ? { ...user, role: pendingRoleChange }
            : user
        )
      );

      console.log(`Role changed for user ${roleChangeTarget.username} to ${pendingRoleChange}`);
      
      // Log the role change for security auditing
      console.log(`SECURITY LOG: Role change - User: ${roleChangeTarget.username} (${roleChangeTarget.user_id}), From: ${roleChangeTarget.role}, To: ${pendingRoleChange}, Timestamp: ${new Date().toISOString()}`);
      
    } catch (err) {
      console.error("Error updating user role:", err);
      alert(err instanceof Error ? err.message : "Failed to update user role");
    } finally {
      setRoleWarningOpen(false);
      setRoleChangeTarget(null);
      setPendingRoleChange("");
    }
  };

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
      const suspension = await fetchSuspensionByUser(userId)

      if (suspension?.end_date) {
        const end = new Date(suspension.end_date)
        const now = new Date()
        
        // Calculate days left if suspension end date is in the future
        if (end > now) {
          const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          setLiftDaysLeft(Math.max(0, diff))
        } else {
          // Suspension has expired
          setLiftDaysLeft(0)
        }
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
    <div className="min-h-screen bg-white">
      <div className="px-4 md:px-6 pt-6">
        <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="">
                <div className="flex justify-between items-center">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600">Manage all registered users in the SafeQR system</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      className={`flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${suspensionCheckLoading ? 'bg-gray-100' : ''}`}
                      onClick={() => checkSuspensionStatus(false)}
                      disabled={suspensionCheckLoading}
                      title="Check suspension status"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${suspensionCheckLoading ? 'animate-spin' : ''}`} />
                      {suspensionCheckLoading ? 'Checking...' : 'Check Suspensions'}
                    </button>
                    <button 
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={() => router.push("/management/createuser")}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </button>
                  </div>
                </div>
                
                {/* Suspension Status */}
                {lastSuspensionCheck && (
                  <div className="mt-0 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm text-blue-800">
                          Last check: {formatDateTime(lastSuspensionCheck)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {activeSuspensionsCount > 0 && (
                          <span className="text-sm font-medium text-blue-800">
                            {activeSuspensionsCount} active suspension{activeSuspensionsCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {expiredSuspensionsCount > 0 && (
                          <span className="text-sm font-medium text-orange-800">
                            {expiredSuspensionsCount} expired suspension{expiredSuspensionsCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters and Search */}
              <div className="mt-8 mb-3 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="">Roles</option>
                      <option value="admin">Admin</option>
                      <option value="end_user">User</option>
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">Status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto mt-6 bg-white shadow-md rounded-lg border border-gray-200">
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
                              <button
                                onClick={() => handleRoleChangeClick(user)}
                                className="hover:bg-gray-100 rounded-md p-1 transition-colors"
                                title="Click to change role (with warning)"
                              >
                                {getRoleBadge(user.role)}
                              </button>
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

              {/* Role Change Warning Modal */}
              <RoleChangeWarningModal
                isOpen={isRoleWarningOpen}
                targetUser={roleChangeTarget}
                newRole={pendingRoleChange}
                onCancel={() => {
                  setRoleWarningOpen(false);
                  setRoleChangeTarget(null);
                  setPendingRoleChange("");
                }}
                onConfirm={confirmRoleChange}
              />
            </div>
          </div>

        </div>
        
  );
}