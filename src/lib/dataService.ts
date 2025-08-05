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
  /**
   * Delete a participant and their associated leaderboard entries
   * @param participantId - ID of the participant to delete
   * @param groupId - Group ID for verification
   */
  static async deleteParticipant(participantId: string, groupId: string) {
    try {
      // 1. Verify the participant belongs to the specified group
      const { data: participant, error: verifyError } = await supabase
        .from('participants')
        .select('id')
        .eq('id', participantId)
        .eq('group_id', groupId)
        .single();

      if (verifyError || !participant) {
        console.error('Error verifying participant:', verifyError);
        throw new Error('Participant not found in this group');
      }

      // 2. Get all weeks where this participant has entries
      const { data: entries, error: entriesError } = await supabase
        .from('leaderboard_entries')
        .select('challenge_id')
        .eq('participant_id', participantId);

      if (entriesError) {
        console.error('Error fetching participant entries:', entriesError);
        throw entriesError;
      }

      // 3. Delete all leaderboard entries for this participant
      const { error: deleteEntriesError } = await supabase
        .from('leaderboard_entries')
        .delete()
        .eq('participant_id', participantId);

      if (deleteEntriesError) {
        console.error('Error deleting participant entries:', deleteEntriesError);
        throw deleteEntriesError;
      }

      // 4. Delete the participant
      const { error: deleteParticipantError } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId)
        .eq('group_id', groupId); // Extra safety check

      if (deleteParticipantError) {
        console.error('Error deleting participant:', deleteParticipantError);
        throw deleteParticipantError;
      }

      // 5. Recalculate points for all affected weeks
      const affectedWeeks = [...new Set(entries?.map(entry => entry.challenge_id) || [])];
      for (const weekId of affectedWeeks) {
        await this.recalculatePointsForWeek(weekId);
      }

      return { success: true, affectedWeeks };
    } catch (error) {
      console.error('Error deleting participant:', error);
      throw error;
    }
  }

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
  /**
   * Get leaderboard entries for a specific participant
   * @param participantId - ID of the participant
   * @param groupId - Group ID for verification
   */
  static async getParticipantEntries(participantId: string, groupId: string) {
    try {
      // First verify participant belongs to this group
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('id', participantId)
        .eq('group_id', groupId)
        .single();

      if (participantError || !participant) {
        console.error('Participant not found in this group:', participantError);
        throw new Error('Participant not found in this group');
      }

      // Get all entries with week information
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          challenge:weekly_challenges(
            id,
            week_number,
            year,
            week_start_date,
            week_end_date,
            group_id
          )
        `)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching participant entries:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching participant entries:', error);
      throw error;
    }
  }

  /**
   * Update an existing leaderboard entry
   * @param entryId - ID of the entry to update
   * @param updates - Fields to update (steps, distance_mi)
   * @param participantId - Participant ID for verification
   */
  static async updateLeaderboardEntry(
    entryId: string,
    updates: { steps: number; distance_mi?: number },
    participantId: string
  ) {
    try {
      // First verify this entry belongs to the participant
      const { data: entry, error: entryError } = await supabase
        .from('leaderboard_entries')
        .select('challenge_id')
        .eq('id', entryId)
        .eq('participant_id', participantId)
        .single();

      if (entryError || !entry) {
        console.error('Entry not found for this participant:', entryError);
        throw new Error('Entry not found for this participant');
      }

      // Update the entry
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .update(updates)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating leaderboard entry:', error);
        throw error;
      }

      // Recalculate points for this week
      await this.recalculatePointsForWeek(entry.challenge_id);

      return data;
    } catch (error) {
      console.error('Error updating leaderboard entry:', error);
      throw error;
    }
  }

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
      
      // Recalculate points for all entries in this week
      await this.recalculatePointsForWeek(entry.challenge_id);

      return data;
    } catch (error) {
      console.error('Error creating leaderboard entry:', error);
      throw error;
    }
  }

  /**
   * Recalculate points for all participants in a specific week
   * Using inverse ranking system: 1st place gets total_participants points, 2nd gets total_participants-1, etc.
   * @param weekId - The challenge_id of the week to recalculate
   */
  static async recalculatePointsForWeek(weekId: string) {
    try {
      // 1. Get all entries for this week, sorted by steps (descending)
      const { data: entries, error: fetchError } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('challenge_id', weekId)
        .order('steps', { ascending: false });

      if (fetchError) {
        console.error('Error fetching entries for point recalculation:', fetchError);
        throw fetchError;
      }

      if (!entries || entries.length === 0) {
        console.warn('No entries found for point recalculation for week:', weekId);
        return;
      }

      // 2. Calculate points based on position (inverse ranking)
      const totalParticipants = entries.length;
      
      // Create updates batch with new point values
      const updates = entries.map((entry, index) => ({
        id: entry.id,
        points: totalParticipants - index, // First place gets totalParticipants points, last place gets 1
        rank: index + 1 // Update rank as well
      }));

      // 3. Update all entries with new point values
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('leaderboard_entries')
          .update({ points: update.points, rank: update.rank })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating points for entry ${update.id}:`, updateError);
        }
      }

      console.log(`Successfully recalculated points for ${totalParticipants} participants in week ${weekId}`);
    } catch (error) {
      console.error('Error recalculating points:', error);
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
