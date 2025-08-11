import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Target, TrendingUp, Users, Medal, Crown, Zap, Flame, Activity, CheckCircle, Star, Calendar, BarChart3, Award, TrendingDown } from "lucide-react";
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

interface DashboardGridProps {
  statsCards?: StatsCardProps[];
  isLoading?: boolean;
  groupId?: string;
  selectedWeek?: string;
  viewMode?: 'weekly' | 'overall';
}

const defaultStatsCards: StatsCardProps[] = [
  {
    title: "Top Performer",
    value: "Sarah Johnson",
    subtitle: "15,847 steps this week",
    icon: <Crown className="h-5 w-5" />,
    color: "step-orange",
  },
  {
    title: "Weekly Leader",
    value: "Mike Chen",
    subtitle: "127,543 total steps",
    icon: <Trophy className="h-5 w-5" />,
    color: "step-green",
  },
  {
    title: "Most Improved",
    value: "Emma Davis",
    subtitle: "+2,340 steps vs last week",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "step-teal",
  },
  {
    title: "Active Participants",
    value: "24",
    subtitle: "Joined this week's challenge",
    icon: <Users className="h-5 w-5" />,
    color: "step-yellow",
  },
  {
    title: "Total Distance",
    value: "847.2 km",
    subtitle: "Covered by all participants",
    icon: <Target className="h-5 w-5" />,
    color: "step-red",
  },
  {
    title: "Average Weekly Step Count",
    value: "8,924",
    subtitle: "Across all participants this week",
    icon: <Medal className="h-5 w-5" />,
    color: "step-green",
  },
];

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
    <Card className="bg-white/90 dark:bg-[#252847]/90 backdrop-blur-sm border border-gray-100 dark:border-[#343856] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
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
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardGrid: React.FC<DashboardGridProps> = ({ statsCards, isLoading = false, groupId, selectedWeek, viewMode = 'weekly' }) => {
  const { convertDistance, getDistanceAbbreviation } = useUnitPreference();
  const [loading, setLoading] = useState(isLoading);
  const [realStatsCards, setRealStatsCards] = useState<StatsCardProps[]>([]);
  const [hasData, setHasData] = useState(false);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState<any>(null);
  const [overallAnalytics, setOverallAnalytics] = useState<any>(null);

  // Fetch real data when component mounts or when viewMode/selectedWeek changes
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        
        // Fetch enhanced analytics data along with leaderboard data
        const [weeklyAnalyticsData, overallAnalyticsData, weeklyData, overallData] = await Promise.all([
          DataService.getWeeklyAnalytics(groupId, selectedWeek),
          DataService.getOverallAnalytics(groupId),
          DataService.getRealLeaderboardData(groupId, selectedWeek),
          DataService.getOverallLeaderboard(groupId)
        ]);
        
        setWeeklyAnalytics(weeklyAnalyticsData);
        setOverallAnalytics(overallAnalyticsData);
        
        // Determine which data to use based on view mode
        const leaderboardData = viewMode === 'weekly' ? weeklyData : overallData;
        
        if (leaderboardData && leaderboardData.length > 0) {
          let realStats: StatsCardProps[];
          
          if (viewMode === 'weekly' && weeklyAnalyticsData) {
            // Enhanced weekly statistics using analytics data
            const totalSteps = leaderboardData.reduce((sum, participant) => sum + participant.steps, 0);
            const totalDistance = leaderboardData.reduce((sum, participant) => sum + participant.distance_mi, 0);
            const avgSteps = Math.round(totalSteps / leaderboardData.length);
            
            realStats = [
              {
                title: "Daily Champion",
                value: weeklyAnalyticsData.dailyChampion.name || 'N/A',
                subtitle: `${weeklyAnalyticsData.dailyChampion.steps?.toLocaleString() || 0} steps in one day`,
                icon: <Crown className="h-5 w-5" />,
                color: "step-orange"
              },
              {
                title: "Most Consistent",
                value: weeklyAnalyticsData.mostConsistent,
                subtitle: "Steady daily performance",
                icon: <Target className="h-5 w-5" />,
                color: "step-green"
              },
              {
                title: "Biggest Improver",
                value: weeklyAnalyticsData.biggestImprover,
                subtitle: `+${weeklyAnalyticsData.biggestImprovementSteps?.toLocaleString() || 0} steps growth`,
                icon: <TrendingUp className="h-5 w-5" />,
                color: "step-teal"
              },
              {
                title: "Weekend Warrior",
                value: weeklyAnalyticsData.weekendWarrior,
                subtitle: `${weeklyAnalyticsData.weekendSteps?.toLocaleString() || 0} weekend steps`,
                icon: <Zap className="h-5 w-5" />,
                color: "step-yellow"
              },
              {
                title: "Weekday Hero",
                value: weeklyAnalyticsData.weekdayHero,
                subtitle: `${weeklyAnalyticsData.weekdaySteps?.toLocaleString() || 0} weekday steps`,
                icon: <Activity className="h-5 w-5" />,
                color: "step-red"
              },
              {
                title: "Most Daily Wins",
                value: weeklyAnalyticsData.weeklyDailyWinsChampion || 'N/A',
                subtitle: `${weeklyAnalyticsData.weeklyDailyWinsCount || 0} daily victories this week`,
                icon: <Trophy className="h-5 w-5" />,
                color: "step-green"
              },
              {
                title: "Most Active Day",
                value: weeklyAnalyticsData.mostActiveDay.dayName || 'N/A',
                subtitle: `${weeklyAnalyticsData.mostActiveDay.steps?.toLocaleString() || 0} group steps`,
                icon: <Calendar className="h-5 w-5" />,
                color: "step-orange"
              },
              {
                title: "Participation Rate",
                value: `${weeklyAnalyticsData.participationRate || 0}%`,
                subtitle: "Weekly engagement level",
                icon: <Users className="h-5 w-5" />,
                color: "step-teal"
              },
              {
                title: "Week Momentum",
                value: weeklyAnalyticsData.momentum === 'up' ? '↗️ Rising' : weeklyAnalyticsData.momentum === 'down' ? '↘️ Declining' : '➡️ Steady',
                subtitle: "Early vs late week trend",
                icon: weeklyAnalyticsData.momentum === 'up' ? <TrendingUp className="h-5 w-5" /> : weeklyAnalyticsData.momentum === 'down' ? <TrendingDown className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />,
                color: weeklyAnalyticsData.momentum === 'up' ? "step-green" : weeklyAnalyticsData.momentum === 'down' ? "step-red" : "step-yellow"
              },
              {
                title: "Goal Achievers",
                value: `${weeklyAnalyticsData.goalAchievementRate || 0}%`,
                subtitle: "Days with 10K+ steps",
                icon: <Star className="h-5 w-5" />,
                color: "step-green"
              },
              {
                title: "Daily Average",
                value: avgSteps.toLocaleString(),
                subtitle: "Steps per participant per day",
                icon: <BarChart3 className="h-5 w-5" />,
                color: "step-teal"
              },
              {
                title: `Total Distance (${getDistanceAbbreviation()})`,
                value: convertDistance(totalDistance).toFixed(1),
                subtitle: "Group distance this week",
                icon: <Medal className="h-5 w-5" />,
                color: "step-red"
              }
            ];
          } else if (overallAnalyticsData) {
            // Enhanced overall statistics using analytics data
            const overallChampion = leaderboardData[0];
            const totalOverallDistance = leaderboardData.reduce((sum, participant) => sum + participant.totalDistance, 0);
            
            // Fun distance comparisons
            const distanceInMiles = convertDistance === ((d: number) => d) ? totalOverallDistance : totalOverallDistance * 0.621371;
            let distanceComparison = "";
            if (distanceInMiles > 238855) {
              distanceComparison = "to the Moon! 🌙";
            } else if (distanceInMiles > 24901) {
              distanceComparison = "around Earth! 🌍";
            } else if (distanceInMiles > 3000) {
              distanceComparison = "across the US! 🇺🇸";
            } else if (distanceInMiles > 1000) {
              distanceComparison = "cross-country! 🏃";
            } else {
              distanceComparison = "and counting! 📈";
            }
            
            realStats = [
              {
                title: "Most Daily Wins",
                value: overallAnalyticsData.streakMaster,
                subtitle: `${overallAnalyticsData.longestStreak || 0} daily victories 🏆`,
                icon: <Trophy className="h-5 w-5" />,
                color: "step-orange"
              },
              {
                title: "Longest Win Streak",
                value: overallAnalyticsData.perfectWeeksChampion,
                subtitle: `${overallAnalyticsData.perfectWeeksCount || 0} consecutive daily wins`,
                icon: <Flame className="h-5 w-5" />,
                color: "step-green"
              },
              {
                title: "Daily Record Holder",
                value: overallAnalyticsData.dailyRecordHolder,
                subtitle: `${overallAnalyticsData.dailyRecord?.toLocaleString() || 0} steps in one day`,
                icon: <Crown className="h-5 w-5" />,
                color: "step-teal"
              },
              {
                title: "Most Dedicated",
                value: overallAnalyticsData.mostDedicated,
                subtitle: `${overallAnalyticsData.dedicationRate || 0}% participation rate`,
                icon: <Award className="h-5 w-5" />,
                color: "step-yellow"
              },
              {
                title: "Average Daily Trend",
                value: `${overallAnalyticsData.averageDailySteps?.toLocaleString() || 0}`,
                subtitle: "Steps per person per day",
                icon: <TrendingUp className="h-5 w-5" />,
                color: "step-green"
              },
              {
                title: "Peak Performance Day",
                value: overallAnalyticsData.peakPerformanceDay,
                subtitle: `${overallAnalyticsData.peakDaySteps?.toLocaleString() || 0} total steps`,
                icon: <Calendar className="h-5 w-5" />,
                color: "step-orange"
              },
              {
                title: "Consistency Champion",
                value: overallAnalyticsData.consistencyChampion,
                subtitle: "Most steady daily performance",
                icon: <Target className="h-5 w-5" />,
                color: "step-teal"
              },
              {
                title: "Distance Marathon",
                value: convertDistance(totalOverallDistance).toFixed(1),
                subtitle: `${getDistanceAbbreviation()} ${distanceComparison}`,
                icon: <Medal className="h-5 w-5" />,
                color: "step-red"
              },
              {
                title: "Active Days Total",
                value: overallAnalyticsData.totalActiveDays?.toLocaleString() || '0',
                subtitle: "Participant-days of activity recorded",
                icon: <Activity className="h-5 w-5" />,
                color: "step-green"
              },
              {
                title: "Goal Achievement Rate",
                value: `${overallAnalyticsData.overallGoalRate || 0}%`,
                subtitle: "Days with 10K+ steps",
                icon: <Star className="h-5 w-5" />,
                color: "step-green"
              },
              {
                title: "Group Growth",
                value: `${overallAnalyticsData.uniqueWeeks || 0} weeks`,
                subtitle: "Challenge history",
                icon: <TrendingUp className="h-5 w-5" />,
                color: "step-teal"
              },
              {
                title: "Overall Champion",
                value: overallChampion.name || 'N/A',
                subtitle: `${overallChampion.totalPoints || 0} total points`,
                icon: <Trophy className="h-5 w-5" />,
                color: "step-orange"
              }
            ];
          } else {
            // Fallback to basic stats if no analytics data
            const topPerformer = leaderboardData[0];
            const totalSteps = leaderboardData.reduce((sum, participant) => sum + (viewMode === 'weekly' ? participant.steps : participant.totalSteps), 0);
            const totalDistance = leaderboardData.reduce((sum, participant) => sum + (viewMode === 'weekly' ? participant.distance_mi : participant.totalDistance), 0);
            const avgSteps = Math.round(totalSteps / leaderboardData.length);
            
            realStats = [
              {
                title: viewMode === 'weekly' ? "Top Performer" : "Overall Champion",
                value: viewMode === 'weekly' ? (topPerformer.participant?.name || 'N/A') : (topPerformer.name || 'N/A'),
                subtitle: `${(viewMode === 'weekly' ? topPerformer.steps : topPerformer.totalSteps)?.toLocaleString() || 0} ${viewMode === 'weekly' ? 'steps this week' : 'total steps'}`,
                icon: <Crown className="h-5 w-5" />,
                color: "step-orange"
              },
              {
                title: "Active Participants",
                value: leaderboardData.length,
                subtitle: viewMode === 'weekly' ? "participants this week" : "total participants",
                icon: <Users className="h-5 w-5" />,
                color: "step-teal"
              },
              {
                title: `Total Distance (${getDistanceAbbreviation()})`,
                value: convertDistance(totalDistance).toFixed(1),
                subtitle: viewMode === 'weekly' ? "this week" : "overall",
                icon: <Medal className="h-5 w-5" />,
                color: "step-red"
              },
              {
                title: "Average Steps",
                value: avgSteps.toLocaleString(),
                subtitle: viewMode === 'weekly' ? "per participant this week" : "per participant overall",
                icon: <Target className="h-5 w-5" />,
                color: "step-green"
              }
            ];
          }
          
          setRealStatsCards(realStats);
          setHasData(true);
        } else {
          setHasData(false);
        }
      } catch (error) {
        console.error('Error fetching enhanced analytics data:', error);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [groupId, selectedWeek, viewMode, convertDistance, getDistanceAbbreviation]);

  // Simulate loading for demo purposes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Use provided statsCards, real data, or show empty state
  const displayCards = statsCards || (hasData ? realStatsCards : []);

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-step-teal mb-2">
            Challenge Statistics
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {viewMode === 'weekly' ? 'Weekly performance highlights and key metrics' : 'Overall cumulative insights across all challenges'}
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
  if (!loading && displayCards.length === 0) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
    <div className="p-4 sm:p-6 h-full">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-step-teal mb-2">
          Challenge Statistics
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          {viewMode === 'weekly' ? 'Weekly performance highlights and key metrics' : 'Overall performance highlights across all weeks'}
        </p>
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stats Cards */}
        {displayCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

export default DashboardGrid;
