import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Upload,
  Trophy,
  ArrowUpDown,
  Calendar,
  Users,
  Target,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { motion } from "framer-motion";

interface Participant {
  id: string;
  name: string;
  rank: number;
  steps: number;
  distance: number;
  points: number;
  avatar: string;
}

interface LeaderboardProps {
  participants?: Participant[];
  selectedWeek?: string;
  onWeekChange?: (week: string) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  isLoading?: boolean;
}

const defaultParticipants: Participant[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    rank: 1,
    steps: 15847,
    distance: 12.3,
    points: 158,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: "2",
    name: "Mike Chen",
    rank: 2,
    steps: 14523,
    distance: 11.8,
    points: 145,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
  },
  {
    id: "3",
    name: "Emma Davis",
    rank: 3,
    steps: 13891,
    distance: 11.1,
    points: 139,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
  },
  {
    id: "4",
    name: "James Wilson",
    rank: 4,
    steps: 12456,
    distance: 9.8,
    points: 125,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
  },
  {
    id: "5",
    name: "Lisa Brown",
    rank: 5,
    steps: 11234,
    distance: 8.9,
    points: 112,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
  },
];

const Leaderboard = ({
  participants = defaultParticipants,
  selectedWeek = "2024-W03",
  onWeekChange = () => {},
  onSort = () => {},
  sortColumn = "rank",
  sortDirection = "asc",
  isLoading = false,
}: LeaderboardProps) => {
  const [loading, setLoading] = useState(isLoading);
  const [showAdminUpload, setShowAdminUpload] = useState(false);

  // Simulate loading for demo purposes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSort = (column: string) => {
    onSort(column);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-step-orange" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-500 font-medium">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-step-teal mb-2">
              Step Challenge Leaderboard
            </h2>
            <p className="text-gray-600">
              Weekly rankings and participant standings
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-100 border-t-step-green animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-step-green/20 animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium text-gray-500 mt-4">
            Loading leaderboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-step-teal mb-2">
            Step Challenge Leaderboard
          </h2>
          <p className="text-gray-600">
            Weekly rankings and participant standings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedWeek} onValueChange={onWeekChange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-W03">Week 3, 2024</SelectItem>
              <SelectItem value="2024-W02">Week 2, 2024</SelectItem>
              <SelectItem value="2024-W01">Week 1, 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowAdminUpload(!showAdminUpload)}
            className="bg-step-orange hover:bg-step-orange/90 text-white rounded-full px-4 h-9 shadow-sm transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
        </div>
      </div>

      {showAdminUpload && (
        <Card className="mb-6 p-4 bg-step-orange/5 border-step-orange/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-step-teal flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Admin Upload Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-step-orange/30 rounded-lg p-8 text-center hover:border-step-orange/50 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-step-orange/60 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop CSV file here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supported format: CSV with columns for Name, Steps, Distance
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAdminUpload(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-step-green hover:bg-step-green/90 text-white">
                  Process Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("rank")}
                  className="p-0 h-auto font-medium"
                >
                  Rank
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("name")}
                  className="p-0 h-auto font-medium"
                >
                  Participant
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("steps")}
                  className="p-0 h-auto font-medium"
                >
                  Steps
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("distance")}
                  className="p-0 h-auto font-medium"
                >
                  Distance (km)
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("points")}
                  className="p-0 h-auto font-medium"
                >
                  Points
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant) => (
              <TableRow key={participant.id} className="hover:bg-step-green/5">
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center">
                    {getRankIcon(participant.rank)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={participant.avatar}
                        alt={participant.name}
                      />
                      <AvatarFallback className="bg-step-green/20 text-step-teal font-medium">
                        {participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">
                      {participant.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {participant.steps.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {participant.distance.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-step-green/20 text-step-teal">
                    {participant.points}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Leaderboard;
