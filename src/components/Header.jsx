import { ArrowLeft, ChevronDown, Filter, Calendar } from "lucide-react";

function splitTitle(title) {
  if (!title) return ["", ""];
  const parts = String(title).trim().split(" ");
  if (parts.length === 1) return [parts[0], ""];
  const last = parts.pop();
  return [parts.join(" "), last];
}

export default function Header() {
  const appTitle = process.env.NEXT_PUBLIC_APP_TITLE || "Production Manager";
  const [first, last] = splitTitle(appTitle);

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
            <span className="text-[#111111] dark:text-white font-medium text-lg">{first}</span>
            {last ? (
              <span className="text-[#18B84E] dark:text-[#16A249] font-medium text-lg"> {last}</span>
            ) : null}
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
        
      </div>

      {/* Right cluster - contextual controls */}
      <div className="flex items-center space-x-3">
       
      </div>
    </div>
  );
}
