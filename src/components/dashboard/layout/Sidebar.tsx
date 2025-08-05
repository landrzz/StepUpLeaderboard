import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  FolderKanban,
} from "lucide-react";

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
}

const defaultNavItems: NavItem[] = [
  { icon: <Home size={20} />, label: "Home", isActive: true },
  { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { icon: <FolderKanban size={20} />, label: "Projects" },
  { icon: <Calendar size={20} />, label: "Calendar" },
  { icon: <Users size={20} />, label: "Team" },
];

const defaultBottomItems: NavItem[] = [
  { icon: <Settings size={20} />, label: "Settings" },
  { icon: <HelpCircle size={20} />, label: "Help" },
];

const Sidebar = ({
  items = defaultNavItems,
  activeItem = "Home",
  onItemClick = () => {},
}: SidebarProps) => {
  return (
    <div className="w-[280px] h-full bg-white/80 dark:bg-[#252847]/90 backdrop-blur-md border-r border-gray-200 dark:border-[#343856] flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Projects</h2>
        <p className="text-sm text-gray-500">
          Manage your projects and tasks
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5">
          {items.map((item) => (
            <Button
              key={item.label}
              variant={"ghost"}
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${item.label === activeItem ? 'bg-blue-50 dark:bg-[#2a2f4a] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-[#343856]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f4a]'}`}
              onClick={() => onItemClick(item.label)}
            >
              <span className={`${item.label === activeItem ? 'text-blue-600' : 'text-gray-500'}`}>{item.icon}</span>
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4 bg-gray-100 dark:bg-[#343856]" />

        <div className="space-y-3">
          <h3 className="text-xs font-medium px-4 py-1 text-gray-500 uppercase tracking-wider">Filters</h3>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f4a]">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Active
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f4a]">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            High Priority
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f4a]">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            In Progress
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-gray-200">
        {defaultBottomItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f4a] mb-1.5"
            onClick={() => onItemClick(item.label)}
          >
            <span className="text-gray-500">{item.icon}</span>
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
