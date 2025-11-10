"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import { Navigate } from "react-router";
import useUser from "@/utils/useUser";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { user, loading } = useUser();

  if (!loading && !user) {
    return <Navigate to="/account/signin" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] text-gray-600 dark:text-gray-300">
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive flexbox item */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1E1E1E] border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative lg:flex-shrink-0
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main content area - Flexbox container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-150"
            >
              <Menu className="h-6 w-6" />
            </button>
            {/* Mobile logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#18B84E] dark:bg-[#16A249] rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <div className="ml-2 flex items-center">
                <span className="text-[#111111] dark:text-white font-medium text-lg">
                  Production
                </span>
                <span className="text-[#18B84E] dark:text-[#16A249] font-medium text-lg">
                  Manager
                </span>
              </div>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Header - Always visible on desktop, hidden on mobile - Now sticky */}
        <div className="hidden lg:block flex-shrink-0 sticky top-0 z-30">
          <Header />
        </div>

        {/* Main Content - Flexible scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <Dashboard activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
