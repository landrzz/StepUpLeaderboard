import { supabase } from '../../supabase/supabase';

interface Participant {
  name: string;
  email: string;
  group_id: string;
  [key: string]: any;
}

interface LeaderboardEntry {
  participant_id: string;
  challenge_id: string;
  steps: number;
  distance_mi: number;
  points: number;
  [key: string]: any;
}

export class DataService {
  /**
   * Check if there's real (non-dummy) data in the database
   * We consider data "real" if there are participants with non-example.com emails
   */
  static async hasRealData(): Promise<boolean> {
    try {
      // Check for participants with real email addresses (not @example.com)
      const { data: realParticipants, error } = await supabase
        .from('participants')
        .select('id')
        .not('email', 'like', '%@example.com')
        .limit(1);

      if (error) {
        console.error('Error checking for real data:', error);
        return false;
      }

      return (realParticipants?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking for real data:', error);
      return false;
    }
  }

  /**
   * Get real leaderboard data (excluding dummy data)
   * @param groupId - Optional group ID to filter by
   * @param weekId - Optional week challenge ID to filter by specific week
   */
  static async getRealLeaderboardData(groupId?: string, weekId?: string) {
    try {
      let query = supabase
        .from('leaderboard_entries')
        .select(`
          *,
          participant:participants!inner(
            id,
            name,
            email,
            group_id
          ),
          challenge:weekly_challenges(
            id,
            week_start_date,
            week_end_date,
            title,
            group_id
          )
        `)
        .not('participant.email', 'like', '%@example.com');
      
      // Filter by group if groupId is provided
      if (groupId) {
        query = query.eq('participant.group_id', groupId);
      }
      
      // Filter by week if weekId is provided
      if (weekId) {
        query = query.eq('challenge_id', weekId);
      }
      
      const { data, error } = await query.order('rank', { ascending: true });

      if (error) {
        console.error('Error fetching real leaderboard data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching real leaderboard data:', error);
      return [];
    }
  }

  /**
   * Get real participant statistics (excluding dummy data)
   */
  static async getRealParticipantStats() {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('id, name, email')
        .not('email', 'like', '%@example.com');

      if (error) {
        console.error('Error fetching real participant stats:', error);
        return {
          totalParticipants: 0,
          activeThisWeek: 0,
        };
      }

      const totalParticipants = data?.length || 0;
      
      // For now, assume all real participants are active
      // This could be enhanced to check recent activity
      const activeThisWeek = totalParticipants;

      return {
        totalParticipants,
        activeThisWeek,
      };
    } catch (error) {
      console.error('Error fetching real participant stats:', error);
      return {
        totalParticipants: 0,
        activeThisWeek: 0,
      };
    }
  }

  /**
   * Get overall leaderboard with cumulative points and steps across all weeks
   */
  /**
   * Get available weeks/challenges for a group
   * @param groupId - Group ID to filter by
   */
  static async getAvailableWeeks(groupId: string) {
    try {
      const { data, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('group_id', groupId)
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });

      if (error) {
        console.error('Error fetching available weeks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching available weeks:', error);
      return [];
    }
  }

  /**
   * Get participants for a specific group
   * @param groupId - Group ID to filter by
   */
  static async getGroupParticipants(groupId: string) {
    try {
      // Count entries per participant as well
      const { data, error } = await supabase
        .from('participants')
        .select(`
          *,
          entries:leaderboard_entries(count)
        `)
        .eq('group_id', groupId)
        .not('email', 'like', '%@example.com');

      if (error) {
        console.error('Error fetching group participants:', error);
        return [];
      }

      // Format the participant data with entry counts
      return data?.map(participant => ({
        ...participant,
        entry_count: participant.entries?.[0]?.count || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching group participants:', error);
      return [];
    }
  }

  /**
   * Find a participant by name in a specific group
   * @param name - Participant name to search for
   * @param groupId - Group ID to filter by
   */
  static async getParticipantByName(name: string, groupId: string) {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('group_id', groupId)
        .ilike('name', name.trim());

      if (error) {
        console.error('Error finding participant by name:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding participant by name:', error);
      return null;
    }
  }

  /**
   * Create a new participant
   * @param participant - Participant data to create
   */
  static async createParticipant(participant: Participant) {
    try {
      const { data, error } = await supabase
        .from('participants')
        .insert([participant])
        .select()
        .single();

      if (error) {
        console.error('Error creating participant:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating participant:', error);
      throw error;
    }
  }

  /**
   * Create a new leaderboard entry
   * @param entry - Leaderboard entry data to create
   */
  static async createLeaderboardEntry(entry: LeaderboardEntry) {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        console.error('Error creating leaderboard entry:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating leaderboard entry:', error);
      throw error;
    }
  }

  static async getOverallLeaderboard(groupId?: string) {
    try {
      let query = supabase
        .from('leaderboard_entries')
        .select(`
          participant_id,
          points,
          steps,
          distance_mi,
          participant:participants!inner(
            id,
            name,
            email,
            group_id
          ),
          challenge:weekly_challenges(
            week_number,
            year,
            group_id
          )
        `)
        .not('participant.email', 'like', '%@example.com');
      
      // Filter by group if groupId is provided
      if (groupId) {
        query = query.eq('participant.group_id', groupId);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching overall leaderboard:', error);
        return [];
      }

      // Group by participant and sum points, steps, and distance
      const participantStats = new Map();
      
      data?.forEach((entry: any) => {
        const participantId = entry.participant_id;
        const participant = entry.participant;
        const points = entry.points || 0;
        const steps = entry.steps || 0;
        const distance = parseFloat(entry.distance_mi || '0');
        
        if (participantStats.has(participantId)) {
          const existing = participantStats.get(participantId);
          existing.totalPoints += points;
          existing.totalSteps += steps;
          existing.totalDistance += distance;
          existing.weekCount += 1;
        } else {
          participantStats.set(participantId, {
            participant_id: participantId,
            name: participant?.name || 'Unknown',
            email: participant?.email || '',
            totalPoints: points,
            totalSteps: steps,
            totalDistance: distance,
            weekCount: 1
          });
        }
      });
      
      // Convert to array and sort by total points (highest first)
      const overallLeaderboard = Array.from(participantStats.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));

      return overallLeaderboard;
    } catch (error) {
      console.error('Error fetching overall leaderboard:', error);
      return [];
    }
  }
}
