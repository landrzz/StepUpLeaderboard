import React, { useState, useEffect } from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import DashboardGrid from "../dashboard/DashboardGrid";
import Leaderboard from "../dashboard/TaskBoard";
import EmptyState from "../dashboard/EmptyState";
import Statistics from "../dashboard/Statistics";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, BarChart3, Calendar, Users, Settings } from "lucide-react";
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
  const [isGroupAdmin, setIsGroupAdmin] = useState<boolean>(false);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [viewMode, setViewMode] = useState<'weekly' | 'overall'>('weekly');
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
          // Check if current user is the group admin
          setIsGroupAdmin(user?.id === group?.created_by);
        } catch (error) {
          console.error('Error fetching group info:', error);
          setGroupName(null);
          setIsGroupAdmin(false);
        }
      } else {
        setGroupName(null);
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
    <div className="min-h-screen bg-gradient-to-br from-step-green/5 via-white to-step-teal/5">
      <TopNavigation onSearch={(query) => console.log("Search:", query)} />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        {!isPublicView && (
          <div className="w-[280px] h-full bg-white/80 backdrop-blur-md border-r border-step-green/20 flex flex-col">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-6 w-6 text-step-orange" />
                <h2 className="text-xl font-semibold text-step-teal">
                  Step Challenge
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                Track your weekly step rankings!
              </p>
              {groupName && (
                <div className="mt-3 p-2 bg-step-green/5 rounded-lg border border-step-green/20">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Current Group</p>
                  <p className="text-sm font-medium text-step-teal">{groupName}</p>
                </div>
              )}
            </div>
            <div className="flex-1 px-4">
              <div className="space-y-1.5">
                {sidebarItems.map((item) => (
                  <Button
                    key={item.label}
                    variant={"ghost"}
                    className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${
                      item.isActive
                        ? "bg-step-green/10 text-step-teal hover:bg-step-green/20"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSidebarClick(item.label)}
                  >
                    <span
                      className={
                        item.isActive ? "text-step-green" : "text-gray-500"
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-auto">
          {isPublicView && (
            <div className="bg-white/90 backdrop-blur-md border-b border-step-green/20 p-4">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-3">
                  <Trophy className="h-8 w-8 text-step-orange" />
                  <div>
                    <h1 className="text-2xl font-bold text-step-teal">
                      Step Challenge Leaderboard
                    </h1>
                    <p className="text-sm text-gray-600">
                      {groupName ? `Group: ${groupName}` : `Group ID: ${groupId}`}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDataRefresh}
                  className="bg-step-green hover:bg-step-green/90 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Loading..." : "Refresh Data"}
                </Button>
              </div>
            </div>
          )}
          {!isPublicView && (
            <div className="container mx-auto px-6 pt-4 pb-2 flex justify-end">
              <Button
                onClick={handleDataRefresh}
                className="bg-step-green hover:bg-step-green/90 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Loading..." : "Refresh Data"}
              </Button>
            </div>
          )}
          <div
            className={cn(
              "container mx-auto p-6 space-y-8",
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
