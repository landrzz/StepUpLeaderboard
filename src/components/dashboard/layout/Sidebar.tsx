import React from "react";
import { Button } from "@/components/ui/button";
import { Trophy, X } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({
  items = [],
  activeItem = "leaderboard",
  onItemClick = () => {},
  isOpen = false,
  onClose = () => {},
}: SidebarProps) => {
  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-50 w-[280px] h-full 
      bg-white/90 dark:bg-[#252847]/95 backdrop-blur-md border-r border-gray-200 dark:border-[#343856] 
      flex flex-col transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-[#343856]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-step-orange" />
            <h2 className="text-xl font-semibold text-step-teal dark:text-step-green">
              StepUp
            </h2>
          </div>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#2a2f4a]"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Step Challenge Leaderboard
        </p>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {items.map((item) => {
            const isActive = item.label === activeItem;
            return (
              <Button
                key={item.label}
                variant="ghost"
                className={`w-full justify-start gap-3 h-11 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-step-green/10 text-step-teal dark:bg-step-green/20 dark:text-step-green hover:bg-step-green/20 dark:hover:bg-step-green/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f4a]'
                }`}
                onClick={() => onItemClick(item.label)}
              >
                <span className={`${
                  isActive ? 'text-step-green' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.icon}
                </span>
                <span className="capitalize">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
