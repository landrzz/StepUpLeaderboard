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
import { Input } from "@/components/ui/input";
import { Home, Search, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import ProfileModal from "../../profile/ProfileModal";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
}

const TopNavigation = ({
  onSearch = () => { },
}: TopNavigationProps) => {
  const { user, signOut } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="w-full h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Link to="/" className="text-gray-900 hover:text-gray-700 transition-colors">
          <Home className="h-5 w-5" />
        </Link>
        {user && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="pl-9 h-10 rounded-full bg-gray-100 border-0 text-sm focus:ring-2 focus:ring-gray-200 focus-visible:ring-gray-200 focus-visible:ring-offset-0"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
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
            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-lg">
              <DropdownMenuLabel className="text-xs text-gray-500">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer" 
                onSelect={() => setIsProfileModalOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onSelect={() => signOut()}>
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
