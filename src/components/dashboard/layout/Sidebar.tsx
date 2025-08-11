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
  groupName?: string;
  groupDescription?: string;
}

const Sidebar = ({
  items = [],
  activeItem = "leaderboard",
  onItemClick = () => {},
  isOpen = false,
  onClose = () => {},
  groupName,
  groupDescription,
}: SidebarProps) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static top-16 lg:top-0 left-0 bottom-0 lg:inset-y-0 z-50 lg:z-auto
        w-64 h-[calc(100vh-4rem)] lg:h-screen bg-white/95 dark:bg-[#252847]/95 backdrop-blur-sm border-r border-gray-200 dark:border-[#343856]
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-[#343856]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-step-orange" />
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-step-teal dark:text-step-green">
                  {groupName || "StepUp"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {groupDescription || "Step Challenge Leaderboard"}
                </p>
              </div>
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#343856]/50"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
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
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343856]/50'
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
    </>
  );
};

export default Sidebar;
