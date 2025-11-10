const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stock", label: "Stock Management" },
  { id: "sales", label: "Sales" },
  { id: "expenses", label: "Expenses" },
];

export function DashboardTabs({ activeTab, onTabChange }) {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                activeTab === tab.id
                  ? "border-[#18B84E] dark:border-[#16A249] text-[#18B84E] dark:text-[#16A249]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
