import { useState } from "react";
import { useI18n } from '@/i18n';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function UnitsManagementTab({ canManageUnits }) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [formData, setFormData] = useState({ name: "", symbol: "" });
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");

  const {
    data: units = [],
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["stockUnits"],
      queryFn: async () => {
      const response = await fetch("/api/units");
      if (!response.ok) throw new Error(t('units.error.fetch_failed'));
      return response.json();
    },
  });

  const createUnit = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t('units.error.create_failed'));
      }
      return data;
    },
    onSuccess: () => {
      setFormData({ name: "", symbol: "" });
      setFormError("");
      setFeedback(t('units.created'));
      queryClient.invalidateQueries({ queryKey: ["stockUnits"] });
    },
    onError: (error) => {
      setFeedback("");
      setFormError(error.message);
    },
  });

  const deleteUnit = useMutation({
    mutationFn: async (unitId) => {
      const response = await fetch(`/api/units/${unitId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t('units.error.delete_failed'));
      }
      return unitId;
    },
    onSuccess: () => {
      setFeedback(t('units.removed'));
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["stockUnits"] });
    },
    onError: (error) => {
      setFeedback("");
      setFormError(error.message);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canManageUnits) {
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedSymbol = formData.symbol.trim();

    if (!trimmedName) {
      setFormError(t('units.error.name_required'));
      return;
    }

    createUnit.mutate({ name: trimmedName, symbol: trimmedSymbol || null });
  };

  const handleDelete = (unitId) => {
    if (!canManageUnits || !unitId) return;
    let confirmed = true;
    if (typeof window !== "undefined") {
      confirmed = window.confirm(t('units.confirm_remove'));
    }
    if (!confirmed) return;
    deleteUnit.mutate(unitId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('units.add_title')}
        </h2>
        {canManageUnits ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {formError}
              </div>
            )}
            {feedback && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
                {feedback}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('units.label_name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => {
                  const value = event.target.value;
                  setFormData((prev) => ({ ...prev, name: value }));
                  setFormError("");
                }}
                placeholder={t('units.placeholder_name')}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('units.label_symbol')}
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(event) => {
                  const value = event.target.value;
                  setFormData((prev) => ({ ...prev, symbol: value }));
                  setFormError("");
                }}
                placeholder={t('units.placeholder_symbol')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createUnit.isLoading}
                className="px-4 py-2 bg-[#18B84E] dark:bg-[#16A249] text-white rounded-md hover:bg-[#16A249] dark:hover:bg-[#14D45D] disabled:opacity-50"
              >
                {createUnit.isLoading ? t('units.saving') : t('units.save')}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-md border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {t('units.read_only_message')}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('units.catalog_title')}
          </h2>
          {(isLoading || isRefetching) && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('units.refreshing')}</span>
          )}
        </div>
        {units.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('units.no_units')}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-[#262626]">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('units.table.header_name')}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('units.table.header_symbol')}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('units.table.header_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1E1E1E] divide-y divide-gray-200 dark:divide-gray-800">
                {units.map((unit) => {
                  const isDeleting =
                    deleteUnit.isLoading && deleteUnit.variables === unit.id;
                  return (
                    <tr key={unit.id}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {unit.name}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {unit.symbol || t('units.dash')}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm">
                        {canManageUnits ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(unit.id)}
                            disabled={deleteUnit.isLoading}
                            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/40 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                          >
                            {isDeleting ? t('units.removing') : t('units.remove')}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                                      {t('units.view_only')}
                                    </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
