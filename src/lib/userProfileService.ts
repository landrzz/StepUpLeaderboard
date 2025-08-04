import { supabase } from '../../supabase/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  distance_unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  totalSteps: number;
  totalDistance: number;
  totalPoints: number;
  weeksParticipated: number;
  averageSteps: number;
  bestWeekSteps: number;
  currentRank: number | null;
  participantId: string;
}

export class UserProfileService {
  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  static async upsertUserProfile(userId: string, firstName: string, lastName: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }
  }

  /**
   * Get user statistics by matching name with participants
   */
  static async getUserStats(firstName: string, lastName: string): Promise<UserStats | null> {
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Find participant by name (try exact match first, then case-insensitive)
      let { data: participants, error: participantError } = await supabase
        .from('participants')
        .select('id, name')
        .eq('name', fullName);

      // If exact match fails, try case-insensitive match
      if (participantError || !participants || participants.length === 0) {
        const result = await supabase
          .from('participants')
          .select('id, name')
          .ilike('name', fullName);
        
        participants = result.data;
        participantError = result.error;
      }

      if (participantError) {
        console.error('Error finding participant:', participantError);
        return null;
      }

      if (!participants || participants.length === 0) {
        return null; // No matching participant found
      }

      // Use the first matching participant (in case of duplicates)
      const participant = participants[0];

      // Get all leaderboard entries for this participant
      const { data: entries, error: entriesError } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          challenge:weekly_challenges(
            week_number,
            year,
            week_start_date,
            week_end_date
          )
        `)
        .eq('participant_id', participant.id)
        .order('created_at', { ascending: false });

      if (entriesError) {
        console.error('Error fetching leaderboard entries:', entriesError);
        return null;
      }

      if (!entries || entries.length === 0) {
        return null;
      }

      // Calculate statistics
      const totalSteps = entries.reduce((sum, entry) => sum + (entry.steps || 0), 0);
      const totalDistance = entries.reduce((sum, entry) => sum + parseFloat(entry.distance_mi || '0'), 0);
      const totalPoints = entries.reduce((sum, entry) => sum + (entry.points || 0), 0);
      const weeksParticipated = entries.length;
      const averageSteps = weeksParticipated > 0 ? Math.round(totalSteps / weeksParticipated) : 0;
      const bestWeekSteps = Math.max(...entries.map(entry => entry.steps || 0));

      // Get current rank from most recent entry
      const currentRank = entries.length > 0 ? entries[0].rank : null;

      return {
        totalSteps,
        totalDistance,
        totalPoints,
        weeksParticipated,
        averageSteps,
        bestWeekSteps,
        currentRank,
        participantId: participant.id
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return null;
    }
  }

  /**
   * Update user's distance unit preference
   */
  static async updateDistanceUnit(userId: string, distanceUnit: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          distance_unit: distanceUnit,
        });

      if (error) {
        console.error('Error updating distance unit:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating distance unit:', error);
      return false;
    }
  }

  /**
   * Check if a name exists in participants
   */
  static async checkNameExists(firstName: string, lastName: string): Promise<boolean> {
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Try exact match first, then case-insensitive
      let { data, error } = await supabase
        .from('participants')
        .select('id')
        .eq('name', fullName)
        .limit(1);

      // If exact match fails, try case-insensitive match
      if (error || !data || data.length === 0) {
        const result = await supabase
          .from('participants')
          .select('id')
          .ilike('name', fullName)
          .limit(1);
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error checking name exists:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking name exists:', error);
      return false;
    }
  }
}
