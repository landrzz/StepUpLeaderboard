import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import ProfileModal from "../../profile/ProfileModal";
import { ThemeToggle } from "../../ui/theme-toggle";

interface TopNavigationProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const TopNavigation = ({ onMenuClick, showMenuButton = false }: TopNavigationProps) => {
  const { user, signOut } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="w-full h-16 border-b border-gray-200 dark:border-[#343856] bg-white/80 dark:bg-[#252847]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 fixed top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link to="/" className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <Home className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 hover:cursor-pointer">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.email || ""}
                />
                <AvatarFallback>
                  {user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-lg dark:bg-[#2a2f4a] dark:border-[#343856]">
              <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-300">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer" 
                onSelect={() => setIsProfileModalOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer touch-manipulation" 
                onSelect={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login">
            <Button className="bg-step-green hover:bg-step-green/90 text-white px-4 py-2 text-sm font-medium rounded-full">
              Sign In
            </Button>
          </Link>
        )}
      </div>
      
      {/* Profile Modal - only show for authenticated users */}
      {user && (
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default TopNavigation;
