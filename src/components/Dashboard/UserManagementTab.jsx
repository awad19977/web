"use client";

import { FEATURE_LIST, FEATURE_KEYS } from "@/constants/featureFlags";
import { useUserManagement } from "@/hooks/useUserManagement";
import useUser from "@/utils/useUser";

const cellClasses = "px-4 py-3 text-sm text-gray-700 dark:text-gray-200";

export function UserManagementTab() {
  const { user: currentUser } = useUser();
  const {
    users,
    usersLoading,
    usersError,
    updatePermission,
    updatePermissionLoading,
  } = useUserManagement();

  if (usersLoading) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg p-6 text-red-700 dark:text-red-200">
        Unable to load users. Refresh the page or verify your permissions.
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No users found</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Invite team members or create accounts to manage feature-level access.
        </p>
      </div>
    );
  }

  const isActingUser = (userId) => currentUser?.id === userId;

  const handleToggle = (userId, featureKey) => (event) => {
    updatePermission({ userId, featureKey, enabled: event.target.checked });
  };

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Grant or revoke access to product areas per user. Changes take effect immediately.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-[#262626]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                User
              </th>
              {FEATURE_LIST.map((feature) => (
                <th
                  key={feature.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {feature.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#1E1E1E]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className={`${cellClasses} whitespace-nowrap`}>
                  <div className="font-medium text-gray-900 dark:text-white">{user.name || "(No name)"}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                </td>
                {FEATURE_LIST.map((feature) => {
                  const allowed = Boolean(user.features?.[feature.key]);
                  const disablingOwnAdmin =
                    isActingUser(user.id) && feature.key === FEATURE_KEYS.USERS && allowed;
                  return (
                    <td key={feature.key} className={`${cellClasses} text-center`}>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[#18B84E] focus:ring-[#18B84E]"
                          checked={allowed}
                          disabled={updatePermissionLoading || disablingOwnAdmin}
                          onChange={handleToggle(user.id, feature.key)}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {allowed ? "On" : "Off"}
                        </span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Note: The currently signed-in administrator cannot remove their own user-management access.
      </p>
    </div>
  );
}
