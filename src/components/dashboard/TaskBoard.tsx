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
import { DataService } from "@/lib/dataService";
import { supabase } from "../../../supabase/supabase";
import { useUnitPreference } from "../../contexts/UnitPreferenceContext";

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
  showUpload?: boolean;
  onUploadClose?: () => void;
  onDataRefresh?: () => Promise<void>;
  groupId?: string;
  isGroupAdmin?: boolean;
  viewMode?: 'weekly' | 'overall';
  onViewModeChange?: (mode: 'weekly' | 'overall') => void;
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

const Leaderboard: React.FC<LeaderboardProps> = ({
  participants,
  selectedWeek = "2024-W03",
  onWeekChange = () => {},
  onSort = () => {},
  sortColumn = "rank",
  sortDirection = "asc",
  isLoading = false,
  showUpload = false,
  onUploadClose = () => {},
  onDataRefresh,
  groupId,
  isGroupAdmin = false,
  viewMode = 'weekly',
  onViewModeChange = () => {},
}) => {
  const [loading, setLoading] = useState(isLoading);
  const [showAdminUpload, setShowAdminUpload] = useState(showUpload);
  const [realParticipants, setRealParticipants] = useState<Participant[]>([]);
  const [overallParticipants, setOverallParticipants] = useState<Participant[]>([]);
  const [hasData, setHasData] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState<Array<{id: string, weekNumber: number, year: number, startDate: string, endDate: string}>>([]);
  
  // Unit preference hook
  const { convertDistance, getDistanceAbbreviation } = useUnitPreference();

  // Sync external showUpload prop with internal state
  useEffect(() => {
    setShowAdminUpload(showUpload);
  }, [showUpload]);

  // Fetch available weeks
  const fetchAvailableWeeks = async () => {
    try {
      let query = supabase
        .from('weekly_challenges')
        .select('id, week_number, year, week_start_date, week_end_date')
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });
      
      if (groupId) {
        query = query.eq('group_id', groupId);
      }
      
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching weeks:', error);
        return;
      }
      
      const weeks = data?.map(week => ({
        id: week.id,
        weekNumber: week.week_number,
        year: week.year,
        startDate: week.week_start_date,
        endDate: week.week_end_date
      })) || [];
      
      setAvailableWeeks(weeks);
      
      // Set current week as default (most recent)
      if (weeks.length > 0 && !selectedWeek) {
        onWeekChange(weeks[0].id);
      }
    } catch (error) {
      console.error('Error fetching available weeks:', error);
    }
  };

  // Fetch overall leaderboard data
  const fetchOverallData = async () => {
    try {
      const overallData = await DataService.getOverallLeaderboard(groupId);
      
      if (overallData.length > 0) {
        const transformedOverallParticipants: Participant[] = overallData.map((entry) => ({
          id: entry.participant_id,
          name: entry.name,
          rank: entry.rank,
          steps: entry.totalSteps,
          distance: entry.totalDistance,
          points: entry.totalPoints,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`,
        }));
        
        setOverallParticipants(transformedOverallParticipants);
      }
    } catch (error) {
      console.error('Error fetching overall leaderboard data:', error);
    }
  };

  // Fetch real data function
  const fetchRealData = async () => {
    try {
      // Use selectedWeek if available, otherwise get all data
      const weekId = selectedWeek || undefined;
      const leaderboardData = await DataService.getRealLeaderboardData(groupId, weekId);
        
        if (leaderboardData.length > 0) {
          const transformedParticipants: Participant[] = leaderboardData.map((entry, index) => ({
            id: entry.participant_id,
            name: entry.participant?.name || 'Unknown',
            rank: entry.rank || index + 1,
            steps: entry.steps,
            distance: parseFloat(entry.distance_mi || '0'),
            points: entry.points,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.participant?.name || 'user'}`,
          }));
          
          setRealParticipants(transformedParticipants);
          setHasData(true);
        } else {
          setHasData(false);
        }
    } catch (error) {
      console.error('Error fetching real leaderboard data:', error);
      setHasData(false);
    }
  };

  // Fetch data when component mounts or groupId changes
  useEffect(() => {
    fetchOverallData();
    fetchAvailableWeeks();
  }, [groupId]);
  
  // Refetch data when selected week changes
  useEffect(() => {
    if (selectedWeek) {
      fetchRealData();
    }
  }, [selectedWeek]);

  // Simulate loading for demo purposes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Use provided participants, real data based on view mode, or show empty state
  const displayParticipants = participants || (hasData ? 
    (viewMode === 'weekly' ? realParticipants : overallParticipants) : []);

  const handleSort = (column: string) => {
    onSort(column);
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please drop a valid CSV file.');
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  // Function to save participants with daily step data to database
  const saveParticipantsToDatabase = async (participantsWithDailyData: any[], csvDates: string[]) => {
    const { supabase } = await import('../../../supabase/supabase');
    
    try {
      // Helper function to get Monday-Sunday week boundaries from any date in the week
      const getMondayWeekBounds = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { monday, sunday };
      };
      
      // Helper function to get week number (ISO week)
      const getWeekNumber = (date: Date) => {
        // Create a new date object to avoid modifying the original
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        const dayNum = d.getDay() || 7;
        d.setDate(d.getDate() + 4 - dayNum);
        
        // Get first day of year
        const yearStart = new Date(d.getFullYear(), 0, 1);
        
        // Calculate full weeks to nearest Thursday
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };
      
      // Calculate week boundaries from the actual CSV dates
      const firstDate = new Date(csvDates[0] + 'T00:00:00'); // Ensure proper timezone handling
      const lastDate = new Date(csvDates[csvDates.length - 1] + 'T00:00:00');
      const { monday: weekStart, sunday: weekEnd } = getMondayWeekBounds(firstDate);
      const weekNumber = getWeekNumber(firstDate);
      const year = firstDate.getFullYear();
      
      console.log('CSV Date Analysis:', {
        csvDates,
        firstDate: firstDate.toISOString().split('T')[0],
        lastDate: lastDate.toISOString().split('T')[0],
        calculatedWeekStart: weekStart.toISOString().split('T')[0],
        calculatedWeekEnd: weekEnd.toISOString().split('T')[0],
        weekNumber,
        year
      });
      
      console.log('Processing week:', { weekStart, weekEnd, weekNumber, year });
      
      // Check if weekly challenge already exists
      if (!groupId) {
        throw new Error('Group ID is required for CSV upload');
      }
      
      let { data: existingChallenge } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('group_id', groupId)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .single();
      
      let challenge = existingChallenge;
      
      // Warn user if updating existing data
      if (existingChallenge) {
        console.log(`⚠️  Updating existing data for Week ${weekNumber}, ${year} (${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]})`);
        console.log('This will overwrite any existing participant data for this week.');
      }
      
      // Create weekly challenge if it doesn't exist
      if (!existingChallenge) {
        const { data: newChallenge, error: challengeError } = await supabase
          .from('weekly_challenges')
          .insert({
            group_id: groupId,
            week_start_date: weekStart.toISOString().split('T')[0],
            week_end_date: weekEnd.toISOString().split('T')[0],
            week_number: weekNumber,
            year: year,
            title: `Week ${weekNumber}, ${year}`,
            description: 'Weekly step challenge',
            is_active: true
          })
          .select()
          .single();
          
        if (challengeError) {
          console.error('Error creating challenge:', challengeError);
          throw new Error('Failed to create weekly challenge');
        }
        challenge = newChallenge;
      }
      
      // Sort participants by total steps (highest first) for proper ranking
      const sortedParticipants = [...participantsWithDailyData].sort((a, b) => b.totalSteps - a.totalSteps);
      const totalParticipants = sortedParticipants.length;
      
      // Process each participant
      for (let i = 0; i < sortedParticipants.length; i++) {
        const participant = sortedParticipants[i];
        const rank = i + 1;
        const points = totalParticipants - i; // Inverse ranking: 1st gets max points, last gets 1
        
        // Check if participant already exists
        let { data: existingParticipant } = await supabase
          .from('participants')
          .select('*')
          .eq('group_id', groupId)
          .eq('name', participant.name)
          .single();
        
        let participantData = existingParticipant;
        
        // Create participant if doesn't exist
        if (!existingParticipant) {
          const { data: newParticipant, error: participantError } = await supabase
            .from('participants')
            .insert({
              group_id: groupId,
              name: participant.name,
              email: `${participant.name.toLowerCase().replace(/\s+/g, '.')}@uploaded.com`,
              is_active: true
            })
            .select()
            .single();
            
          if (participantError) {
            console.error('Error creating participant:', participantError);
            continue;
          }
          participantData = newParticipant;
        }
        
        // Store daily step data in the new daily_steps table
        for (const dailyData of participant.dailyData) {
          // Ensure proper date formatting (YYYY-MM-DD)
          const dateStr = dailyData.date; // Already in YYYY-MM-DD format from CSV
          
          console.log('Processing daily data:', { date: dateStr, steps: dailyData.steps, participantName: participant.name });
          
          // Check if daily entry already exists
          const { data: existingDailyEntry, error: selectError } = await supabase
            .from('daily_steps')
            .select('*')
            .eq('challenge_id', challenge.id)
            .eq('participant_id', participantData.id)
            .eq('step_date', dateStr)
            .single();
          
          if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error checking existing daily entry:', selectError);
            continue;
          }
          
          if (existingDailyEntry) {
            // Update existing daily entry
            const { error: updateError } = await supabase
              .from('daily_steps')
              .update({
                steps: dailyData.steps,
                distance_mi: dailyData.distance.toString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', existingDailyEntry.id);
              
            if (updateError) {
              console.error('Error updating daily steps entry:', updateError);
            } else {
              console.log('Updated daily entry for', participant.name, 'on', dateStr);
            }
          } else {
            // Create new daily entry
            const { error: dailyError } = await supabase
              .from('daily_steps')
              .insert({
                challenge_id: challenge.id,
                participant_id: participantData.id,
                step_date: dateStr,
                steps: dailyData.steps,
                distance_mi: dailyData.distance.toString()
              });
              
            if (dailyError) {
              console.error('Error creating daily steps entry:', dailyError);
            } else {
              console.log('Created daily entry for', participant.name, 'on', dateStr);
            }
          }
        }
        
        // Update or create weekly leaderboard entry (aggregated from daily data)
        const { data: existingEntry } = await supabase
          .from('leaderboard_entries')
          .select('*')
          .eq('challenge_id', challenge.id)
          .eq('participant_id', participantData.id)
          .single();
        
        if (existingEntry) {
          // Update existing entry with fresh data
          const { error: updateError } = await supabase
            .from('leaderboard_entries')
            .update({
              steps: participant.totalSteps,
              distance_mi: participant.totalDistance.toString(),
              points: points,
              rank: rank,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEntry.id);
            
          if (updateError) {
            console.error('Error updating leaderboard entry:', updateError);
          }
        } else {
          // Create new leaderboard entry
          const { error: leaderboardError } = await supabase
            .from('leaderboard_entries')
            .insert({
              challenge_id: challenge.id,
              participant_id: participantData.id,
              steps: participant.totalSteps,
              distance_mi: participant.totalDistance.toString(),
              points: points,
              rank: rank
            });
            
          if (leaderboardError) {
            console.error('Error creating leaderboard entry:', leaderboardError);
          }
        }
      }
      
      console.log(`Successfully processed ${sortedParticipants.length} participants with daily data for week ${weekNumber}, ${year}`);
      
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  };

  const handleUploadProcess = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    setUploadLoading(true);
    try {
      // Parse CSV file
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      console.log('Raw CSV text:', text);
      console.log('Parsed lines:', lines);
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row.');
      }

      // Parse header - handle both comma and semicolon separators
      let separator = ',';
      if (lines[0].includes(';') && !lines[0].includes(',')) {
        separator = ';';
      }
      
      const rawHeaders = lines[0].split(separator);
      const headers = rawHeaders.map(h => h.trim().replace(/"/g, ''));
      
      console.log('Raw headers:', rawHeaders);
      console.log('Processed headers:', headers);
      
      // Find column indices with flexible matching
      const findColumnIndex = (possibleNames: string[], caseSensitive = false) => {
        const searchHeaders = caseSensitive ? headers : headers.map(h => h.toLowerCase());
        const searchNames = caseSensitive ? possibleNames : possibleNames.map(n => n.toLowerCase());
        
        for (const name of searchNames) {
          // First try exact match
          let index = searchHeaders.findIndex(h => h === name);
          if (index !== -1) return index;
          
          // Then try contains match
          index = searchHeaders.findIndex(h => h.includes(name));
          if (index !== -1) return index;
        }
        return -1;
      };
      
      const nameIndex = findColumnIndex(['name']);
      const stepsIndex = findColumnIndex(['total steps', 'steps', 'step count', 'step total']);
      const distanceIndex = findColumnIndex(['total distance', 'distance', 'dist']);
      
      // Extract date columns from headers (YYYY-MM-DD format)
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const dateColumns = [];
      const dateHeaders = [];
      
      for (let i = 0; i < headers.length; i++) {
        if (datePattern.test(headers[i].trim())) {
          dateColumns.push(i);
          dateHeaders.push(headers[i].trim());
        }
      }
      
      console.log('Found date columns:', { dateColumns, dateHeaders });
      
      // Validate required columns
      if (nameIndex === -1) {
        throw new Error(`Name column not found. Found columns: ${headers.join(', ')}. Expected a column containing 'name'.`);
      }
      
      if (dateColumns.length === 0) {
        throw new Error(`No date columns found. Expected columns with YYYY-MM-DD format. Found columns: ${headers.join(', ')}`);
      }

      // Parse data rows with daily step data
      const participantsWithDailyData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        console.log(`Row ${i}:`, values);
        
        if (values.length > nameIndex && values[nameIndex]) {
          const name = values[nameIndex];
          const totalSteps = stepsIndex >= 0 ? parseInt(values[stepsIndex]) || 0 : 0;
          const totalDistance = distanceIndex >= 0 ? parseFloat(values[distanceIndex]) || 0 : 0;
          
          // Extract daily step data
          const dailySteps = [];
          let calculatedTotalSteps = 0;
          
          for (let j = 0; j < dateColumns.length; j++) {
            const dateColumnIndex = dateColumns[j];
            const date = dateHeaders[j];
            const steps = parseInt(values[dateColumnIndex]) || 0;
            
            dailySteps.push({
              date,
              steps
            });
            calculatedTotalSteps += steps;
          }
          
          // Calculate distance per day (proportional to daily steps)
          const dailyStepsWithDistance = dailySteps.map(day => ({
            ...day,
            distance: calculatedTotalSteps > 0 ? (day.steps / calculatedTotalSteps) * totalDistance : 0
          }));
          
          participantsWithDailyData.push({
            name,
            totalSteps: calculatedTotalSteps,
            totalDistance,
            dailyData: dailyStepsWithDistance
          });
        }
      }

      if (participantsWithDailyData.length === 0) {
        throw new Error('No valid participant data found in CSV file.');
      }

      // Save to database
      console.log('Parsed participants with daily data:', participantsWithDailyData);
      
      // Save participants and daily step data
      await saveParticipantsToDatabase(participantsWithDailyData, dateHeaders);
      
      // Create success message with week information
      const weekInfo = dateHeaders.length > 0
        ? `for week ${dateHeaders[0]} to ${dateHeaders[dateHeaders.length - 1]}`
        : 'for the current week';
      
      alert(`Successfully uploaded ${participantsWithDailyData.length} participants to the leaderboard ${weekInfo}!`);
      
      // Reset upload state and refresh data
      setSelectedFile(null);
      setShowAdminUpload(false);
      
      // Refresh the component data
      if (onDataRefresh) {
        await onDataRefresh();
      } else {
        onUploadClose();
      }
      
      // Also refresh overall data
      await fetchOverallData();
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-step-orange" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-500 font-medium">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white/90 dark:bg-[#252847]/90 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#343856]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-step-teal mb-2">
              Step Challenge Leaderboard
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Weekly rankings and participant standings
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="relative">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-gray-100 border-t-step-green animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-step-green/20 animate-pulse" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
            Loading leaderboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white/90 dark:bg-[#252847]/90 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#343856]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-step-teal mb-2">
            Step Challenge Leaderboard
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {viewMode === 'weekly' ? 'Weekly rankings and participant standings' : 'Overall cumulative points and steps across all weeks'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Week Selector - only show in weekly mode */}
          {viewMode === 'weekly' && (
            <Select value={selectedWeek} onValueChange={(value) => onWeekChange(value)}>
              <SelectTrigger className="w-full sm:w-64">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map((week) => {
                  const startDate = new Date(week.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const endDate = new Date(week.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <SelectItem key={week.id} value={week.id} className="text-sm">
                      <span className="hidden sm:inline">Week {week.weekNumber}, {week.year} ({startDate} - {endDate})</span>
                      <span className="sm:hidden">{startDate} - {endDate}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-[#2a2f4a] rounded-lg p-1">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('weekly')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-colors ${
                viewMode === 'weekly' 
                  ? 'bg-step-green text-white hover:bg-step-green/90' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#343856]'
              }`}
            >
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Weekly</span>
            </Button>
            <Button
              variant={viewMode === 'overall' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('overall')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-colors ${
                viewMode === 'overall' 
                  ? 'bg-step-green text-white hover:bg-step-green/90' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#343856]'
              }`}
            >
              <Trophy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Overall</span>
            </Button>
          </div>
          {isGroupAdmin && (
            <Button
              onClick={() => setShowAdminUpload(!showAdminUpload)}
              className="bg-step-orange hover:bg-step-orange/90 text-white rounded-full px-4 h-9 shadow-sm transition-colors w-full sm:w-auto justify-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Upload CSV</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          )}
        </div>
      </div>

      {showAdminUpload && (
        <Card className="mb-6 p-4 bg-step-orange/5 dark:bg-[#2a2f4a] border-step-orange/20 dark:border-[#343856]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-step-teal flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Admin Upload Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-step-orange/30 rounded-lg p-8 text-center hover:border-step-orange/50 transition-colors cursor-pointer relative"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-step-orange/60 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {selectedFile ? selectedFile.name : 'Drop CSV file here or click to browse'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Supported format: CSV with columns for Name, Steps, Distance (optional)
                </p>
                <div className="bg-amber-50 dark:bg-[#2a2f4a] border border-amber-200 dark:border-[#343856] rounded-lg p-3 text-left">
                  <p className="text-xs font-medium text-amber-800 mb-1">📅 Important Upload Requirements:</p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• Include date headers (YYYY-MM-DD format) in your CSV to specify the week</li>
                    <li>• Each CSV should contain data for exactly one Monday-Sunday week period</li>
                    <li>• Re-uploading data for the same week will update existing entries</li>
                    <li>• You can backfill data by uploading CSVs with past week dates</li>
                  </ul>
                </div>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-step-green/10 dark:bg-[#2a2f4a] rounded-lg">
                    <p className="text-sm text-step-green mb-2">
                      ✓ File selected: {selectedFile.name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearFile();
                      }}
                      className="text-xs"
                    >
                      Clear File
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAdminUpload(false);
                    onUploadClose();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-step-green hover:bg-step-green/90 text-white"
                  onClick={handleUploadProcess}
                  disabled={!selectedFile || uploadLoading}
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Process Upload'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      <Card className="bg-white dark:bg-[#252847] border-gray-200 dark:border-[#343856] hidden sm:block">
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
                  {viewMode === 'weekly' ? 'Steps' : 'Total Steps'}
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
                  {viewMode === 'weekly' ? `Distance (${getDistanceAbbreviation()})` : `Total Distance (${getDistanceAbbreviation()})`}
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
                  {viewMode === 'weekly' ? 'Points' : 'Total Points'}
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Trophy className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      No Participants Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {isGroupAdmin ? 'Upload step data to see the leaderboard' : 'No data available yet'}
                    </p>
                    {isGroupAdmin && (
                      <Button
                        onClick={() => setShowAdminUpload(true)}
                        className="bg-step-green hover:bg-step-green/90 text-white"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV Data
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayParticipants.map((participant) => (
                <TableRow key={participant.id} className="hover:bg-step-green/5 dark:hover:bg-[#2a2f4a]">
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
                      <span className="font-medium text-gray-900 dark:text-white">
                        {participant.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {participant.steps.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {convertDistance(participant.distance).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-step-green/20 text-step-teal">
                      {participant.points}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {displayParticipants.length === 0 ? (
          <Card className="bg-white dark:bg-[#252847] border-gray-200 dark:border-[#343856] p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Trophy className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Participants Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {isGroupAdmin ? 'Upload step data to see the leaderboard' : 'No data available yet'}
              </p>
              {isGroupAdmin && (
                <Button
                  onClick={() => setShowAdminUpload(true)}
                  className="bg-step-green hover:bg-step-green/90 text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV Data
                </Button>
              )}
            </div>
          </Card>
        ) : (
          displayParticipants.map((participant) => (
            <Card key={participant.id} className="bg-white dark:bg-[#252847] border-gray-200 dark:border-[#343856] p-4 hover:bg-step-green/5 dark:hover:bg-[#2a2f4a] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center">
                    {getRankIcon(participant.rank)}
                  </div>
                  <Avatar className="h-10 w-10">
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
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {participant.name}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-step-green/20 text-step-teal">
                  {participant.points} pts
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Steps</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {participant.steps.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Distance ({getDistanceAbbreviation()})</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {convertDistance(participant.distance).toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
