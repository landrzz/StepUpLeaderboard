import { supabase } from '../../supabase/supabase';

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
   */
  static async getRealLeaderboardData() {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          participant:participants!inner(
            id,
            name,
            email
          ),
          challenge:weekly_challenges(
            id,
            week_start_date,
            week_end_date,
            title
          )
        `)
        .not('participant.email', 'like', '%@example.com')
        .order('rank', { ascending: true });

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
   * Get overall leaderboard with cumulative points across all weeks
   */
  static async getOverallLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          participant_id,
          points,
          participant:participants!inner(
            id,
            name,
            email
          ),
          challenge:weekly_challenges(
            week_number,
            year
          )
        `)
        .not('participant.email', 'like', '%@example.com');

      if (error) {
        console.error('Error fetching overall leaderboard:', error);
        return [];
      }

      // Group by participant and sum points
      const participantPoints = new Map();
      
      data?.forEach((entry: any) => {
        const participantId = entry.participant_id;
        const participant = entry.participant;
        const points = entry.points || 0;
        
        if (participantPoints.has(participantId)) {
          participantPoints.get(participantId).totalPoints += points;
        } else {
          participantPoints.set(participantId, {
            participant_id: participantId,
            name: participant?.name || 'Unknown',
            email: participant?.email || '',
            totalPoints: points,
            weekCount: 1
          });
        }
      });
      
      // Convert to array and sort by total points (highest first)
      const overallLeaderboard = Array.from(participantPoints.values())
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
