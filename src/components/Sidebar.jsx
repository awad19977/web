"use client";

import { useState } from "react";
import {
  Search,
  LayoutGrid,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Ruler,
  Settings,
  Bell,
  Gift,
  HelpCircle,
  ExternalLink,
  LogOut,
  BadgeCheck,
  X,
  Loader2,
} from "lucide-react";
import useAuth from "@/utils/useAuth";
import useUser from "@/utils/useUser";
import { DASHBOARD_TABS } from "./Dashboard/tabConfig";

const TAB_ICONS = {
  overview: LayoutGrid,
  stock: Package,
  sales: ShoppingCart,
  expenses: DollarSign,
  users: Users,
  units: Ruler,
};

export default function Sidebar({ onClose, activeTab, onTabChange }) {
  const { signOut } = useAuth();
  const { user, loading } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const featureFlags = user?.features ?? {};

  const workplaceNavItems = DASHBOARD_TABS.filter((tab) => featureFlags[tab.feature] !== false).map(
    (tab) => ({
      icon: TAB_ICONS[tab.id] ?? LayoutGrid,
      label: tab.label,
      tabId: tab.id,
      active: activeTab === tab.id,
    }),
  );

  const accountNavItems = [
    { icon: Settings, label: "Settings" },
    { icon: Bell, label: "Notifications" },
    { icon: Gift, label: "Affiliate Program" },
    { icon: HelpCircle, label: "Help Center", external: true },
  ];

  const handleNavClick = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    if (onClose) {
      onClose(); // Close sidebar on mobile after navigation
    }
  };

  const handleLogout = async (event) => {
    event.preventDefault();
    if (signingOut) return;
    setSigningOut(true);
    try {
      const result = await signOut({ redirect: false, callbackUrl: "/account/signin" });
      if (result?.url) {
        window.location.href = result.url;
      } else {
        window.location.href = "/account/signin";
      }
    } catch (error) {
      console.error("Failed to sign out", error);
      setSigningOut(false);
    }
  };

  const displayName = user?.name || user?.email || "Team Member";
  const displayEmail = user?.email ?? "";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-64 bg-white dark:bg-[#1E1E1E] border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
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
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors duration-150"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-16 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#262626] placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18B84E] dark:focus:ring-[#16A249] focus:border-transparent text-sm transition-colors duration-150"
            placeholder="Search"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
              ⌘F
            </kbd>
          </div>
        </div>
      </div>

      {/* Navigation Items - Scrollable */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* WORKPLACE Section */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            WORKPLACE
          </h3>
          <nav className="space-y-1">
            {workplaceNavItems.length === 0 && !loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sections available for your account.
              </p>
            ) : (
              workplaceNavItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    type="button"
                    className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 w-full text-left
                    ${
                      item.active
                        ? "bg-white dark:bg-[#262626] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700"
                    }
                  `}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.tabId);
                    }}
                  >
                    <Icon
                      className={`
                    flex-shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors duration-150
                    ${item.active ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-[#18B84E] dark:group-hover:text-[#16A249] group-active:text-[#16A249] dark:group-active:text-[#14D45D]"}
                  `}
                    />
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* ACCOUNT Section */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            ACCOUNT
          </h3>
          <nav className="space-y-1">
            {accountNavItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <a
                  key={index}
                  href="#"
                  className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700 transition-colors duration-150"
                >
                  <Icon className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-[#18B84E] dark:group-hover:text-[#16A249] group-active:text-[#16A249] dark:group-active:text-[#14D45D] transition-colors duration-150" />
                  <span className="flex-1">{item.label}</span>
                  {item.external && (
                    <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-active:text-gray-600 dark:group-active:text-gray-300 transition-colors duration-150" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="px-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex items-center px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 active:bg-red-100 dark:active:bg-red-900/30 active:text-red-800 dark:active:text-red-200 transition-colors duration-150 w-full disabled:opacity-60"
            disabled={signingOut}
          >
            {signingOut ? (
              <Loader2 className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 group-active:text-red-700 dark:group-active:text-red-200 transition-colors duration-150" />
            )}
            <span>{signingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </div>

      {/* User Profile Card - Bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="w-full flex items-center rounded-lg p-2 -m-2">
          <div className="relative flex-shrink-0">
            {user?.image ? (
              <img className="h-10 w-10 rounded-full" src={user.image} alt={displayName} />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[#18B84E] dark:bg-[#16A249] flex items-center justify-center text-white font-semibold">
                {avatarLetter || "?"}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-[#18B84E] dark:bg-[#16A249] border-2 border-white dark:border-[#1E1E1E] rounded-full"></div>
          </div>

          <div className="ml-3 flex-1 flex flex-col justify-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {loading ? "Signing in..." : displayName}
            </p>
            {displayEmail && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{displayEmail}</p>
            )}
          </div>

          <div className="flex-shrink-0 text-[#18B84E] dark:text-[#16A249]">
            <BadgeCheck className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
