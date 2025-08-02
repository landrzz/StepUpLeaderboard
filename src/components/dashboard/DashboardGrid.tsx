import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Target, TrendingUp, Users, Medal, Crown } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
    title: "Average Steps",
    value: "8,924",
    subtitle: "Per participant this week",
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

const DashboardGrid = ({
  statsCards = defaultStatsCards,
  isLoading = false,
}: DashboardGridProps) => {
  const [loading, setLoading] = useState(isLoading);

  // Simulate loading for demo purposes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-step-teal mb-2">
            Challenge Statistics
          </h2>
          <p className="text-gray-600">
            Weekly performance highlights and key metrics
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

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-step-teal mb-2">
          Challenge Statistics
        </h2>
        <p className="text-gray-600">
          Weekly performance highlights and key metrics
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stats Cards */}
        {statsCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

export default DashboardGrid;
