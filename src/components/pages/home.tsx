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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  Settings,
  User,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Upload,
  Calendar,
  Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { GroupService } from "@/lib/groupService";
import { useState } from "react";

function FindGroupButton() {
  const [groupId, setGroupId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFindGroup = async () => {
    if (!groupId.trim()) return;
    
    setIsSearching(true);
    setError("");
    
    try {
      const searchTerm = groupId.trim();
      let foundGroup = null;
      
      // First try to search by name (case-insensitive)
      try {
        foundGroup = await GroupService.searchGroupByName(searchTerm);
      } catch (err) {
        // If name search fails, continue to ID search
        console.log('Name search failed, trying ID search');
      }
      
      // If not found by name, try by ID
      if (!foundGroup) {
        try {
          foundGroup = await GroupService.getGroupById(searchTerm);
        } catch (err) {
          console.log('ID search also failed');
        }
      }
      
      if (foundGroup) {
        navigate(`/group/${foundGroup.id}`);
        setIsOpen(false);
        setGroupId("");
      } else {
        setError("Group not found. Please check the group name or ID and try again.");
      }
    } catch (err) {
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-step-green hover:bg-step-green/90 text-white px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all">
          Find Your Group <Search className="ml-2 h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-step-teal">
            Find Your Step Challenge Group
          </DialogTitle>
          <DialogDescription>
            Enter your group name (e.g., "JackedUp") or group ID to view the leaderboard. No account required!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupId">Group Name or ID</Label>
            <Input
              id="groupId"
              placeholder="Enter group name (JackedUp) or ID (abc-123-def)"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                if (error) setError(""); // Clear error when user types
              }}
              onKeyPress={(e) => e.key === "Enter" && !isSearching && handleFindGroup()}
              disabled={isSearching}
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                setError("");
                setGroupId("");
              }}
              disabled={isSearching}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFindGroup}
              className="bg-step-green hover:bg-step-green/90 text-white"
              disabled={!groupId.trim() || isSearching}
            >
              {isSearching ? "Searching..." : "View Leaderboard"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="light min-h-screen bg-gradient-to-br from-step-green/10 via-white to-step-teal/10 text-gray-900">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-step-green/20 shadow-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-step-orange" />
            <Link to="/" className="font-bold text-2xl text-step-teal">
              StepChallenge
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button className="bg-step-green hover:bg-step-green/90 text-white font-medium px-6">
                    View Leaderboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-10 w-10 hover:cursor-pointer border-2 border-step-green/30">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback className="bg-step-green text-white">
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl border-none shadow-lg"
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => signOut()}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-step-teal hover:text-step-teal/80 font-medium"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="bg-step-orange hover:bg-step-orange/90 text-white font-medium px-6 rounded-full">
                    Admin Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero section */}
        <section className="py-20 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-step-green/5 via-step-yellow/5 to-step-orange/5" />
          <div className="relative max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-step-green/10 p-4 rounded-full">
                <Trophy className="h-16 w-16 text-step-orange" />
              </div>
            </div>
            <h1 className="text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-step-teal to-step-green bg-clip-text text-transparent">
              Step Challenge Leaderboard
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Track your weekly step challenge results with our automated point
              system. Compete with friends, climb the leaderboard, and celebrate
              your fitness achievements.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              {user ? (
                <Link to="/dashboard">
                  <Button className="bg-step-green hover:bg-step-green/90 text-white px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all">
                    View Leaderboard <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button className="bg-step-green hover:bg-step-green/90 text-white px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all">
                      Join Challenge <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <FindGroupButton />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-step-teal mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to track and celebrate your step challenge
                achievements
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-step-green/10">
                <div className="h-14 w-14 bg-step-green/10 rounded-full flex items-center justify-center mb-6">
                  <Trophy className="h-7 w-7 text-step-green" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-step-teal">
                  Live Leaderboard
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Real-time rankings showing participant standings, total steps,
                  distance, and accumulated points across all weeks.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-step-orange/10">
                <div className="h-14 w-14 bg-step-orange/10 rounded-full flex items-center justify-center mb-6">
                  <Upload className="h-7 w-7 text-step-orange" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-step-teal">
                  Easy CSV Upload
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Admins can quickly upload weekly participant data via CSV
                  files with automatic point calculation and leaderboard
                  updates.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-step-yellow/20">
                <div className="h-14 w-14 bg-step-yellow/20 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="h-7 w-7 text-step-orange" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-step-teal">
                  Weekly History
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Interactive date selector to view historical weekly results
                  and track progress over time with detailed statistics.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-step-teal/10">
                <div className="h-14 w-14 bg-step-teal/10 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="h-7 w-7 text-step-teal" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-step-teal">
                  Smart Sorting
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Sort leaderboard by rank, steps, distance, or points with
                  intuitive controls and responsive table design.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-step-red/10">
                <div className="h-14 w-14 bg-step-red/10 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-step-red" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-step-teal">
                  Stats Highlights
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Visual highlight cards showcasing top performers and
                  interesting weekly statistics to motivate participants.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-step-green/10">
                <div className="h-14 w-14 bg-step-green/10 rounded-full flex items-center justify-center mb-6">
                  <Target className="h-7 w-7 text-step-green" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-step-teal">
                  Mobile Optimized
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Fully responsive design with outdoor-inspired colors and
                  sporty accents that works perfectly on all devices.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-gradient-to-r from-step-green to-step-teal text-white">
          <div className="max-w-4xl mx-auto text-center px-6">
            <Trophy className="h-16 w-16 mx-auto mb-6 text-step-yellow" />
            <h2 className="text-4xl font-bold mb-6">
              Ready to Start Your Challenge?
            </h2>
            <p className="text-xl mb-8 text-step-yellow/90">
              Join thousands of participants tracking their fitness journey and
              competing in weekly step challenges.
            </p>
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-white text-step-teal hover:bg-step-yellow hover:text-step-teal px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all">
                  Go to Dashboard <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <div className="flex justify-center">
                <FindGroupButton />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-step-teal/5 py-12 text-sm text-gray-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="border-b border-step-teal/20 pb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="h-6 w-6 text-step-orange" />
                <h4 className="font-semibold text-step-teal text-base">
                  StepChallenge
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Track your fitness journey and compete in weekly step challenges
                with friends and colleagues.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-step-teal mb-4">Features</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Live Leaderboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    CSV Upload
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Weekly History
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Statistics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-step-teal mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Admin Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-step-teal mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-step-green transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="py-6 text-center">
            <p className="text-gray-500">
              © 2025 StepChallenge. Built for fitness enthusiasts who love
              friendly competition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
