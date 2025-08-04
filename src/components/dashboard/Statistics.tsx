import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, TrendingUp, Users, Medal, Crown, Calendar, BarChart3 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DataService } from "@/lib/dataService";
import { useUnitPreference } from "@/contexts/UnitPreferenceContext";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

interface StatisticsProps {
  isLoading?: boolean;
  groupId?: string;
  selectedWeek?: string;
}

const StatsCard = ({ title, value, subtitle, icon, color }: StatsCardProps) => {
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<
      string,
      { bg: string; text: string; iconBg: string }
    > = {
      "step-orange": {
        bg: "bg-step-orange/10",
        text: "text-step-orange",
        iconBg: "bg-step-orange/20",
      },
      "step-green": {
        bg: "bg-step-green/10",
        text: "text-step-green",
        iconBg: "bg-step-green/20",
      },
      "step-teal": {
        bg: "bg-step-teal/10",
        text: "text-step-teal",
        iconBg: "bg-step-teal/20",
      },
      "step-yellow": {
        bg: "bg-step-yellow/20",
        text: "text-step-orange",
        iconBg: "bg-step-yellow/30",
      },
      "step-red": {
        bg: "bg-step-red/10",
        text: "text-step-red",
        iconBg: "bg-step-red/20",
      },
    };
    return colorMap[colorName] || colorMap["step-green"];
  };

  const colors = getColorClasses(color);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div
          className={`h-10 w-10 rounded-full ${colors.iconBg} flex items-center justify-center`}
        >
          <span className={colors.text}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const Statistics = ({ isLoading = false, groupId, selectedWeek }: StatisticsProps) => {
  const [loading, setLoading] = useState(isLoading);
  const [viewMode, setViewMode] = useState<'weekly' | 'overall'>('weekly');
  const [weeklyStats, setWeeklyStats] = useState<StatsCardProps[]>([]);
  const [overallStats, setOverallStats] = useState<StatsCardProps[]>([]);
  const [hasData, setHasData] = useState(false);
  const { convertDistance, getDistanceLabel, getDistanceAbbreviation } = useUnitPreference();

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch weekly data (current week or selected week)
        const weeklyData = await DataService.getRealLeaderboardData(groupId, selectedWeek);
        
        // Fetch overall data (all weeks combined)
        const overallData = await DataService.getOverallLeaderboard(groupId);
        
        if (weeklyData.length > 0 || overallData.length > 0) {
          setHasData(true);
          
          // Process weekly statistics
          if (weeklyData.length > 0) {
            const topPerformer = weeklyData[0];
            const totalSteps = weeklyData.reduce((sum, entry) => sum + entry.steps, 0);
            const totalDistance = weeklyData.reduce((sum, entry) => sum + parseFloat(entry.distance_mi || '0'), 0);
            const avgSteps = Math.round(totalSteps / weeklyData.length);
            const mostImproved = weeklyData[1] || weeklyData[0];
            
            const weeklyStatsData: StatsCardProps[] = [
              {
                title: "Top Performer",
                value: topPerformer.participant?.name || "N/A",
                subtitle: `${topPerformer.steps.toLocaleString()} steps this week`,
                icon: <Crown className="h-5 w-5" />,
                color: "step-orange",
              },
              {
                title: "Weekly Leader",
                value: topPerformer.participant?.name || "N/A",
                subtitle: `${topPerformer.points || 0} points earned`,
                icon: <Trophy className="h-5 w-5" />,
                color: "step-green",
              },
              {
                title: "Most Active",
                value: mostImproved.participant?.name || "N/A",
                subtitle: "Great effort this week!",
                icon: <TrendingUp className="h-5 w-5" />,
                color: "step-teal",
              },
              {
                title: "Active Participants",
                value: weeklyData.length.toString(),
                subtitle: "Joined this week's challenge",
                icon: <Users className="h-5 w-5" />,
                color: "step-yellow",
              },
              {
                title: `Total ${getDistanceLabel()}`,
                value: `${convertDistance(totalDistance).toFixed(1)} ${getDistanceAbbreviation()}`,
                subtitle: "Covered by all participants",
                icon: <Target className="h-5 w-5" />,
                color: "step-red",
              },
              {
                title: "Average Steps",
                value: avgSteps.toLocaleString(),
                subtitle: "Across all participants this week",
                icon: <Medal className="h-5 w-5" />,
                color: "step-green",
              },
            ];
            
            setWeeklyStats(weeklyStatsData);
          }
          
          // Process overall statistics
          if (overallData.length > 0) {
            const topOverallPerformer = overallData[0];
            const totalOverallSteps = overallData.reduce((sum, entry) => sum + entry.totalSteps, 0);
            const totalOverallDistance = overallData.reduce((sum, entry) => sum + entry.totalDistance, 0);
            const avgOverallSteps = Math.round(totalOverallSteps / overallData.length);
            const totalWeeks = Math.max(...overallData.map(entry => entry.weekCount));
            const mostConsistent = overallData.find(entry => entry.weekCount === totalWeeks) || overallData[0];
            
            const overallStatsData: StatsCardProps[] = [
              {
                title: "Overall Champion",
                value: topOverallPerformer.name || "N/A",
                subtitle: `${topOverallPerformer.totalPoints} total points`,
                icon: <Crown className="h-5 w-5" />,
                color: "step-orange",
              },
              {
                title: "Most Points",
                value: topOverallPerformer.totalPoints.toString(),
                subtitle: `Across ${topOverallPerformer.weekCount} weeks`,
                icon: <Trophy className="h-5 w-5" />,
                color: "step-green",
              },
              {
                title: "Most Consistent",
                value: mostConsistent.name || "N/A",
                subtitle: `Participated in ${mostConsistent.weekCount} weeks`,
                icon: <TrendingUp className="h-5 w-5" />,
                color: "step-teal",
              },
              {
                title: "Total Participants",
                value: overallData.length.toString(),
                subtitle: "Across all challenges",
                icon: <Users className="h-5 w-5" />,
                color: "step-yellow",
              },
              {
                title: `Total ${getDistanceLabel()}`,
                value: `${convertDistance(totalOverallDistance).toFixed(1)} ${getDistanceAbbreviation()}`,
                subtitle: "Covered by all participants",
                icon: <Target className="h-5 w-5" />,
                color: "step-red",
              },
              {
                title: "Average Steps",
                value: avgOverallSteps.toLocaleString(),
                subtitle: "Per participant across all weeks",
                icon: <Medal className="h-5 w-5" />,
                color: "step-green",
              },
            ];
            
            setOverallStats(overallStatsData);
          }
        } else {
          setHasData(false);
        }
      } catch (error) {
        console.error('Error fetching statistics data:', error);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, selectedWeek, convertDistance, getDistanceLabel, getDistanceAbbreviation]);

  // Get current display data based on view mode
  const currentStats = viewMode === 'weekly' ? weeklyStats : overallStats;
  const currentTitle = viewMode === 'weekly' ? 'Weekly Statistics' : 'Overall Statistics';
  const currentSubtitle = viewMode === 'weekly' 
    ? 'Current week performance highlights and key metrics'
    : 'Cumulative performance across all weeks';

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-step-teal mb-2">
            Challenge Statistics
          </h2>
          <p className="text-gray-600">
            Loading performance data...
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card
              key={index}
              className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm h-[140px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center justify-center p-6">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-4 border-gray-100 border-t-step-green animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-step-green/20 animate-pulse" />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Loading stats...
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!loading && !hasData) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Statistics Available
          </h3>
          <p className="text-gray-500">
            Upload step data to see challenge statistics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      {/* Header with toggle buttons */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-step-teal mb-2">
              {currentTitle}
            </h2>
            <p className="text-gray-600">
              {currentSubtitle}
            </p>
          </div>
          
          {/* View Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('weekly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white text-step-teal shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly
            </Button>
            <Button
              variant={viewMode === 'overall' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('overall')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                viewMode === 'overall'
                  ? 'bg-white text-step-teal shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Overall
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentStats.map((card, index) => (
          <StatsCard key={`${viewMode}-${index}`} {...card} />
        ))}
      </div>
    </div>
  );
};

export default Statistics;
