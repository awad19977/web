import { ArrowLeft, ChevronDown, Filter, Calendar } from "lucide-react";

export default function Header() {
  return (
    <div className="h-16 bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 flex items-center justify-between shadow-sm dark:shadow-none">
      {/* Left cluster - brand + quick back action */}
      <div className="flex items-center">
        {/* Logo */}
        <div className="flex items-center">
          {/* Square icon with PM */}
          <div className="w-8 h-8 bg-[#18B84E] dark:bg-[#16A249] rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">PM</span>
          </div>

          {/* Wordmark */}
          <div className="ml-2 flex items-center">
            <span className="text-[#111111] dark:text-white font-medium text-lg">
              Production
            </span>
            <span className="text-[#18B84E] dark:text-[#16A249] font-medium text-lg">
              Manager
            </span>
          </div>
        </div>

        {/* Divider + back arrow */}
        <div className="flex items-center ml-4">
          <div className="w-px h-6 bg-[#E4E4E4] dark:bg-gray-700"></div>
          <button className="ml-4 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 rounded transition-colors duration-150">
            <ArrowLeft
              size={24}
              strokeWidth={1.5}
              className="text-[#B0B0B0] dark:text-gray-400 hover:text-[#8A8A8A] dark:hover:text-gray-300 transition-colors duration-150"
            />
          </button>
        </div>
      </div>

      {/* Center cluster - section tabs */}
      <div className="flex items-center space-x-7">
        <button className="relative text-[#18B84E] dark:text-[#16A249] font-medium text-[15px] tracking-[-0.15px] hover:text-[#16A249] dark:hover:text-[#14D45D] active:text-[#149142] dark:active:text-[#12C151] transition-colors duration-150">
          Dashboard
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#18B84E] dark:bg-[#16A249]"></div>
        </button>
        <button className="text-[#6F6F6F] dark:text-gray-400 font-medium text-[15px] tracking-[-0.15px] hover:text-[#333333] dark:hover:text-gray-200 active:text-[#111111] dark:active:text-white transition-colors duration-150">
          Stock
        </button>
        <button className="text-[#6F6F6F] dark:text-gray-400 font-medium text-[15px] tracking-[-0.15px] hover:text-[#333333] dark:hover:text-gray-200 active:text-[#111111] dark:active:text-white transition-colors duration-150">
          Production
        </button>
        <button className="text-[#6F6F6F] dark:text-gray-400 font-medium text-[15px] tracking-[-0.15px] hover:text-[#333333] dark:hover:text-gray-200 active:text-[#111111] dark:active:text-white transition-colors duration-150">
          Sales
        </button>
        <button className="text-[#6F6F6F] dark:text-gray-400 font-medium text-[15px] tracking-[-0.15px] hover:text-[#333333] dark:hover:text-gray-200 active:text-[#111111] dark:active:text-white transition-colors duration-150">
          Reports
        </button>
        <button className="flex items-center text-[#6F6F6F] dark:text-gray-400 font-medium text-[15px] tracking-[-0.15px] hover:text-[#333333] dark:hover:text-gray-200 active:text-[#111111] dark:active:text-white transition-colors duration-150 group">
          <Calendar
            size={16}
            className="mr-2 group-hover:text-[#333333] dark:group-hover:text-gray-200 group-active:text-[#111111] dark:group-active:text-white transition-colors duration-150"
          />
          Monthly Summary
        </button>
      </div>

      {/* Right cluster - contextual controls */}
      <div className="flex items-center space-x-3">
        {/* Date-range dropdown */}
        <button className="flex items-center px-5 py-2 border border-[#D1D1D1] dark:border-gray-700 rounded-lg bg-white dark:bg-[#262626] hover:border-[#B8B8B8] dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 active:border-[#A0A0A0] dark:active:border-gray-500 transition-colors duration-150">
          <span className="text-[#2A2A2A] dark:text-white font-medium text-[15px] tracking-[-0.1px]">
            Last 30 Days
          </span>
          <ChevronDown
            size={14}
            className="ml-2 text-[#8A8A8A] dark:text-gray-400"
          />
        </button>

        {/* Filters button */}
        <button className="flex items-center px-5 py-2 border border-[#D1D1D1] dark:border-gray-700 rounded-lg bg-transparent hover:border-[#B8B8B8] dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 active:border-[#A0A0A0] dark:active:border-gray-500 transition-colors duration-150 group">
          <Filter
            size={16}
            className="text-[#8A8A8A] dark:text-gray-400 group-hover:text-[#333333] dark:group-hover:text-gray-200 group-active:text-[#111111] dark:group-active:text-white transition-colors duration-150"
          />
          <span className="ml-2 text-[#6F6F6F] dark:text-gray-400 font-medium text-[15px] group-hover:text-[#333333] dark:group-hover:text-gray-200 group-active:text-[#111111] dark:group-active:text-white transition-colors duration-150">
            Filters
          </span>
        </button>
      </div>
    </div>
  );
}
