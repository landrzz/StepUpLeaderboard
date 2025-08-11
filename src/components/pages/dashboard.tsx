import React, { useState, useEffect } from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import DashboardGrid from "../dashboard/DashboardGrid";
import Leaderboard from "../dashboard/TaskBoard";
import EmptyState from "../dashboard/EmptyState";
import Statistics from "../dashboard/Statistics";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, BarChart3, Calendar, Users, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import GroupManager from "../groups/GroupManager";
import ParticipantManager from "@/components/participants/ParticipantManager";
import { DataService } from "@/lib/dataService";
import { GroupService } from "@/lib/groupService";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("leaderboard");
  const [hasRealData, setHasRealData] = useState<boolean | null>(null); // null = loading, boolean = result
  const [showUpload, setShowUpload] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupDescription, setGroupDescription] = useState<string | null>(null);
  const [isGroupAdmin, setIsGroupAdmin] = useState<boolean>(false);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [viewMode, setViewMode] = useState<'weekly' | 'overall'>('weekly');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPublicView = !!groupId && !user;

  // Redirect to user's first group if no groupId is provided and user is authenticated
  useEffect(() => {
    const redirectToDefaultGroup = async () => {
      if (!groupId && user && !isPublicView) {
        try {
          const userGroups = await GroupService.getUserGroups(user.id);
          if (userGroups.length > 0) {
            // Redirect to the first group
            navigate(`/dashboard/${userGroups[0].id}`, { replace: true });
          }
        } catch (error) {
          console.error('Error fetching user groups for redirect:', error);
        }
      }
    };

    redirectToDefaultGroup();
  }, [groupId, user, navigate, isPublicView]);

  // Fetch group name and check admin status when groupId changes
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (groupId) {
        try {
          const group = await GroupService.getGroupById(groupId);
          setGroupName(group?.name || null);
          setGroupDescription(group?.description || null);
          // Check if current user is the group admin
          setIsGroupAdmin(user?.id === group?.created_by);
        } catch (error) {
          console.error('Error fetching group info:', error);
          setGroupName(null);
          setGroupDescription(null);
          setIsGroupAdmin(false);
        }
      } else {
        setGroupName(null);
        setGroupDescription(null);
        setIsGroupAdmin(false);
      }
    };

    fetchGroupInfo();
  }, [groupId, user?.id]);

  // Check for real leaderboard data when component mounts
  useEffect(() => {
    const checkForRealData = async () => {
      try {
        const leaderboardData = await DataService.getRealLeaderboardData(groupId);
        const hasData = leaderboardData.length > 0;
        setHasRealData(hasData);
      } catch (error) {
        console.error('Error checking for real data:', error);
        setHasRealData(false);
      }
    };

    checkForRealData();
  }, [groupId]);

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId);
  };

  const handleViewModeChange = (mode: 'weekly' | 'overall') => {
    setViewMode(mode);
  };

  // Handle upload button click
  const handleUploadClick = () => {
    setShowUpload(true);
    setActiveView("leaderboard"); // Switch to leaderboard view to show the upload interface
  };

  // Refresh data after upload
  const handleDataRefresh = async () => {
    try {
      setHasRealData(null); // Set to loading state
      const leaderboardData = await DataService.getRealLeaderboardData(groupId);
      const hasData = leaderboardData.length > 0;
      setHasRealData(hasData);
      setShowUpload(false); // Close upload modal
    } catch (error) {
      console.error('Error refreshing data:', error);
      setHasRealData(false);
    }
  };

  const sidebarItems = [
    {
      icon: <Trophy size={20} />,
      label: "Leaderboard",
      isActive: activeView === "leaderboard",
    },
    // Statistics page removed - now integrated into Leaderboard
    // Only show Participants for group admins
    ...(isGroupAdmin ? [{
      icon: <Users size={20} />,
      label: "Participants",
      isActive: activeView === "participants",
    }] : []),
    // Only show Groups for authenticated users
    ...(user ? [{
      icon: <Settings size={20} />,
      label: "Groups",
      isActive: activeView === "groups",
    }] : []),
  ];

  const handleSidebarClick = (label: string) => {
    setActiveView(label.toLowerCase().replace(" ", ""));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1e2139] dark:to-[#252847]">
      <TopNavigation 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={!isPublicView}
      />
      <div className="flex pt-16">
        {!isPublicView && (
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <Sidebar
              items={[
                {
                  icon: <Trophy size={20} />,
                  label: "leaderboard",
                  isActive: activeView === "leaderboard",
                },
                {
                  icon: <Users size={20} />,
                  label: "participants",
                  isActive: activeView === "participants",
                },
                {
                  icon: <Settings size={20} />,
                  label: "groups",
                  isActive: activeView === "groups",
                },
              ]}
              activeItem={activeView}
              onItemClick={(item) => {
                setActiveView(item);
                setSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              groupName={groupName || undefined}
              groupDescription={groupDescription || undefined}
            />
          </>
        )}
        <main className="flex-1 overflow-hidden">
          {isPublicView && (
            <div className="bg-white/90 dark:bg-[#252847]/90 backdrop-blur-md rounded-xl border border-gray-200 dark:border-[#343856] shadow-sm">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-step-teal">
                      Step Challenge Leaderboard
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {groupName ? `Group: ${groupName}` : `Group ID: ${groupId}`}
                    </p>
                  </div>
                  <Button
                    onClick={handleDataRefresh}
                    className="bg-step-green hover:bg-step-green/90 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    {loading ? "Loading..." : "Refresh Data"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          {!isPublicView && (
            <div className="container mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-2 flex justify-end">
              <Button
                onClick={handleDataRefresh}
                className="bg-step-green hover:bg-step-green/90 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">{loading ? "Loading..." : "Refresh Data"}</span>
                <span className="sm:hidden">{loading ? "..." : "Refresh"}</span>
              </Button>
            </div>
          )}
          <div
            className={cn(
              "container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8",
              "transition-all duration-300 ease-in-out",
            )}
          >
            {activeView === "leaderboard" && hasRealData === false && !showUpload && (
              <EmptyState onUploadClick={handleUploadClick} isGroupAdmin={isGroupAdmin} />
            )}
            {activeView === "leaderboard" && (hasRealData === true || showUpload) && (
              <>
                <Leaderboard 
                  isLoading={loading} 
                  showUpload={showUpload}
                  onUploadClose={() => setShowUpload(false)}
                  onDataRefresh={handleDataRefresh}
                  groupId={groupId}
                  isGroupAdmin={isGroupAdmin}
                  selectedWeek={selectedWeek}
                  onWeekChange={handleWeekChange}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                />
                {hasRealData === true && <DashboardGrid 
                  isLoading={loading} 
                  groupId={groupId} 
                  selectedWeek={selectedWeek}
                  viewMode={viewMode}
                />}
              </>
            )}
            {activeView === "leaderboard" && hasRealData === null && (
              <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-step-teal mx-auto mb-4" />
                  <p className="text-gray-600">Checking for data...</p>
                </div>
              </div>
            )}
            {/* Statistics page removed - now integrated into Leaderboard */}
            {activeView === "participants" && (
              <ParticipantManager groupId={groupId} />
            )}
            {activeView === "groups" && (
              <GroupManager currentGroupId={groupId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
