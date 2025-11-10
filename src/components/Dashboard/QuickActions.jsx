import { Package, ShoppingCart, DollarSign } from "lucide-react";

export function QuickActions({ onActionClick }) {
  const actions = [
    {
      id: "stock",
      icon: Package,
      label: "Manage Stock",
    },
    {
      id: "sales",
      icon: ShoppingCart,
      label: "Record Sale",
    },
    {
      id: "expenses",
      icon: DollarSign,
      label: "Add Expense",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className="flex items-center justify-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <Icon className="w-5 h-5 text-[#18B84E] dark:text-[#16A249]" />
              <span className="font-medium text-gray-900 dark:text-white">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
