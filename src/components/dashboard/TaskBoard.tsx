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
}: LeaderboardProps) => {
  const [loading, setLoading] = useState(isLoading);
  const [showAdminUpload, setShowAdminUpload] = useState(showUpload);
  const [realParticipants, setRealParticipants] = useState<Participant[]>([]);
  const [overallParticipants, setOverallParticipants] = useState<Participant[]>([]);
  const [hasData, setHasData] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState<Array<{id: string, weekNumber: number, year: number, startDate: string, endDate: string}>>([]);
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [viewMode, setViewMode] = useState<'weekly' | 'overall'>('weekly');
  
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
      if (weeks.length > 0) {
        const weekKey = `${weeks[0].year}-W${weeks[0].weekNumber.toString().padStart(2, '0')}`;
        setCurrentWeek(weekKey);
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

  // Fetch real data when component mounts
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const leaderboardData = await DataService.getRealLeaderboardData(groupId);
        
        if (leaderboardData.length > 0) {
          const transformedParticipants: Participant[] = leaderboardData.map((entry, index) => ({
            id: entry.participant_id,
            name: entry.participant?.name || 'Unknown',
            rank: entry.rank || index + 1,
            steps: entry.steps,
            distance: parseFloat(entry.distance_km || '0'),
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

    fetchRealData();
    fetchOverallData();
    fetchAvailableWeeks();
  }, [groupId]);

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

  // Function to save participants to database with proper week handling
  const saveParticipantsToDatabase = async (participants: any[]) => {
    const { supabase } = await import('../../../supabase/supabase');
    
    try {
      // Helper function to get Monday-Sunday week boundaries
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
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };
      
      // For now, assume current week - in future, parse dates from CSV if available
      const currentDate = new Date();
      const { monday: weekStart, sunday: weekEnd } = getMondayWeekBounds(currentDate);
      const weekNumber = getWeekNumber(currentDate);
      const year = currentDate.getFullYear();
      
      console.log('Processing week:', { weekStart, weekEnd, weekNumber, year });
      
      // Check if weekly challenge already exists
      let { data: existingChallenge } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('group_id', '550e8400-e29b-41d4-a716-446655440000')
        .eq('week_number', weekNumber)
        .eq('year', year)
        .single();
      
      let challenge = existingChallenge;
      
      // Create weekly challenge if it doesn't exist
      if (!existingChallenge) {
        const { data: newChallenge, error: challengeError } = await supabase
          .from('weekly_challenges')
          .insert({
            group_id: '550e8400-e29b-41d4-a716-446655440000',
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
      
      // Sort participants by steps (highest first) for proper ranking
      const sortedParticipants = [...participants].sort((a, b) => b.steps - a.steps);
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
          .eq('group_id', '550e8400-e29b-41d4-a716-446655440000')
          .eq('name', participant.name)
          .single();
        
        let participantData = existingParticipant;
        
        // Create participant if doesn't exist
        if (!existingParticipant) {
          const { data: newParticipant, error: participantError } = await supabase
            .from('participants')
            .insert({
              group_id: '550e8400-e29b-41d4-a716-446655440000',
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
        
        // Check if leaderboard entry already exists for this week
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
              steps: participant.steps,
              distance_km: participant.distance.toString(),
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
              steps: participant.steps,
              distance_km: participant.distance.toString(),
              points: points,
              rank: rank
            });
            
          if (leaderboardError) {
            console.error('Error creating leaderboard entry:', leaderboardError);
          }
        }
      }
      
      console.log(`Successfully processed ${sortedParticipants.length} participants for week ${weekNumber}, ${year}`);
      
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
      const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      console.log('Raw headers:', rawHeaders);
      console.log('Processed headers:', headers);
      
      // Find column indices with flexible matching
      const findColumnIndex = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          // First try exact match
          let index = headers.findIndex(h => h === name);
          if (index !== -1) return index;
          
          // Then try contains match, but avoid partial matches
          index = headers.findIndex(h => {
            const words = h.split(' ');
            return words.some(word => word === name) || h.includes(name);
          });
          if (index !== -1) return index;
        }
        return -1;
      };
      
      const nameIndex = findColumnIndex(['name']);
      const stepsIndex = findColumnIndex(['total steps', 'steps', 'step count', 'step total']);
      const distanceIndex = findColumnIndex(['total distance', 'distance', 'dist']);
      
      console.log('Column indices:', { nameIndex, stepsIndex, distanceIndex });
      
      // Validate required columns
      if (nameIndex === -1) {
        throw new Error(`Name column not found. Found columns: ${headers.join(', ')}. Expected a column containing 'name'.`);
      }
      
      if (stepsIndex === -1) {
        throw new Error(`Steps column not found. Found columns: ${headers.join(', ')}. Expected a column containing 'steps', 'total steps', or 'step count'.`);
      }

      // Parse data rows
      const participants = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        console.log(`Row ${i}:`, values);
        if (values.length > Math.max(nameIndex, stepsIndex)) {
          const name = values[nameIndex];
          const steps = parseInt(values[stepsIndex]);
          const distance = distanceIndex >= 0 ? parseFloat(values[distanceIndex]) || 0 : steps * 0.0008; // Estimate distance
          
          if (name && !isNaN(steps)) {
            participants.push({
              name,
              steps,
              distance,
              points: Math.floor(steps / 100), // 1 point per 100 steps
            });
          }
        }
      }

      if (participants.length === 0) {
        throw new Error('No valid participant data found in CSV file.');
      }

      // Save to database
      console.log('Parsed participants:', participants);
      
      // For now, we'll create a simple weekly challenge and save participants
      // In a real app, you'd want to handle groups, weekly challenges, etc. more robustly
      
      // Create participants and leaderboard entries
      // Note: This is a simplified implementation
      await saveParticipantsToDatabase(participants);
      
      alert(`Successfully uploaded ${participants.length} participants to the leaderboard!`);
      
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
            {viewMode === 'weekly' ? 'Weekly rankings and participant standings' : 'Overall cumulative points and steps across all weeks'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Week Selector - only show in weekly mode */}
          {viewMode === 'weekly' && (
            <Select value={currentWeek} onValueChange={(value) => setCurrentWeek(value)}>
              <SelectTrigger className="w-64">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map((week) => {
                  const weekKey = `${week.year}-W${week.weekNumber.toString().padStart(2, '0')}`;
                  const startDate = new Date(week.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const endDate = new Date(week.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <SelectItem key={weekKey} value={weekKey} className="text-sm">
                      Week {week.weekNumber}, {week.year} ({startDate} - {endDate})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'weekly' 
                  ? 'bg-step-green text-white hover:bg-step-green/90' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly
            </Button>
            <Button
              variant={viewMode === 'overall' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('overall')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'overall' 
                  ? 'bg-step-green text-white hover:bg-step-green/90' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Overall
            </Button>
          </div>
          {isGroupAdmin && (
            <Button
              onClick={() => setShowAdminUpload(!showAdminUpload)}
              className="bg-step-orange hover:bg-step-orange/90 text-white rounded-full px-4 h-9 shadow-sm transition-colors"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          )}
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
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {selectedFile ? selectedFile.name : 'Drop CSV file here or click to browse'}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Supported format: CSV with columns for Name, Steps, Distance (optional)
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                  <p className="text-xs font-medium text-amber-800 mb-1">📅 Important Upload Requirements:</p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• Upload CSV files for previous week (Monday-Sunday) every Monday</li>
                    <li>• Do NOT include overlapping dates in your CSV files</li>
                    <li>• Each CSV should contain data for exactly one week period</li>
                    <li>• Fresh uploads will update existing data for the same week</li>
                  </ul>
                </div>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-step-green/10 rounded-lg">
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
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No Participants Yet
                    </h3>
                    <p className="text-gray-500 mb-4">
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
    </div>
  );
};

export default Leaderboard;
