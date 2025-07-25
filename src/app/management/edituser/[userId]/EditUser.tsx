"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader, CheckCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchUserById, updateUserProfile, User } from "@/app/controllers/userController";

interface UserFormData {
  username: string;
  email: string;
  role: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  role?: string;
  general?: string;
}

interface EditUserProps {
  userId: string;
}

export default function EditUser({ userId }: EditUserProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    role: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userData = await fetchUserById(userId);
        setUser(userData);
        
        setFormData({
          username: userData.username,
          email: userData.email || "", // Handle case where email might be null
          role: userData.role
        });
        
        console.log('User data loaded:', userData);
        console.log('Email retrieved:', userData.email); // Debug email specifically
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        setErrors({
          general: "Failed to load user data. Please try again."
        });
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (success) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/management");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [success, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateUserProfile(userId, {
        username: formData.username,
        email: formData.email,
        role: formData.role
      });
      
      setSuccess(true);
      
    } catch (error) {
      console.error("Error updating user:", error);
      setErrors({
        general: "Failed to update user. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRedirect = () => {
    setSuccess(false);
    setCountdown(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <button 
                onClick={() => router.push("/management")}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Edit User</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Editing user {user?.username} ({user?.user_id})
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      User updated successfully!
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      The changes to {user?.username}'s profile have been saved.
                    </p>
                    <p className="mt-2 text-sm text-green-600">
                      Redirecting to management page in {countdown} seconds...
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelRedirect}
                    className="ml-3 text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => router.push("/management")}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Go to Management
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRedirect}
                    className="px-3 py-1 text-xs bg-white text-green-600 border border-green-600 rounded hover:bg-green-50"
                  >
                    Stay Here
                  </button>
                </div>
              </div>
            )}
            
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                {errors.general}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={success}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={success}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                User Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={success}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Select a role</option>
                <option value="end_user">User</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                {user?.account_status === "active" ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : user?.account_status === "suspended" ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {user?.account_status}
                  </span>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  To change account status, use the suspend/activate actions from the user dashboard.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push("/management")}
                disabled={success}
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}