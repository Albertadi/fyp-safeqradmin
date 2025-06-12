"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchUserById, updateUserProfile, User } from "@/app/lib/supabase";

interface UserFormData {
  username: string;
  role: string;
}

interface FormErrors {
  username?: string;
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
    role: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch user data from Supabase
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        
        // Use the real Supabase function to fetch user
        const userData = await fetchUserById(userId);
        
        setUser(userData);
        setFormData({
          username: userData.username,
          role: userData.role
        });
        
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate username
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    // Validate role
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
      // Use the real Supabase function to update user
      await updateUserProfile(userId, {
        username: formData.username,
        role: formData.role
      });
      
      setSuccess(true);
      
      // After a brief delay, redirect back to the user management dashboard
      setTimeout(() => {
        router.push("/private/users");
      }, 2000);
      
    } catch (error) {
      console.error("Error updating user:", error);
      setErrors({
        general: "Failed to update user. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Header */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                User updated successfully! Redirecting...
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
              >
                <option value="regular">Regular</option>
                <option value="admin">Admin</option>
                <option value="tester">Tester</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder-gray-500">
                {user?.account_status === "active" ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Suspended
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
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
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