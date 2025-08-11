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

      // 3. Delete all daily step entries for this participant (must be done first due to foreign keys)
      const { error: deleteDailyError } = await supabase
        .from('daily_steps')
        .delete()
        .eq('participant_id', participantId);

      if (deleteDailyError) {
        console.error('Error deleting participant daily steps:', deleteDailyError);
        throw deleteDailyError;
      }

      // 4. Delete all leaderboard entries for this participant
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

  /**
   * Create a manual leaderboard entry with daily data distribution
   * Since manual entries don't have daily granularity, we distribute the total across the week
   */
  static async createLeaderboardEntry(entry: LeaderboardEntry) {
    try {
      // First, get the week information to distribute daily data
      const { data: weekInfo, error: weekError } = await supabase
        .from('weekly_challenges')
        .select('week_start_date, week_end_date')
        .eq('id', entry.challenge_id)
        .single();
      
      if (weekError) {
        console.error('Error fetching week info:', weekError);
        throw weekError;
      }
      
      // Calculate daily distribution (spread total steps across 7 days)
      const totalSteps = entry.steps || 0;
      const totalDistance = parseFloat(entry.distance_mi?.toString() || '0');
      const dailySteps = Math.floor(totalSteps / 7);
      const remainderSteps = totalSteps % 7;
      const dailyDistance = totalDistance / 7;
      
      // Generate dates for the week
      const startDate = new Date(weekInfo.week_start_date);
      const dailyEntries = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Add remainder steps to the first few days
        const stepsForDay = dailySteps + (i < remainderSteps ? 1 : 0);
        
        dailyEntries.push({
          participant_id: entry.participant_id,
          challenge_id: entry.challenge_id,
          step_date: dateStr,
          steps: stepsForDay,
          distance_mi: dailyDistance
        });
      }
      
      // Insert daily entries (will update existing ones if they exist)
      for (const dailyEntry of dailyEntries) {
        const { error: dailyError } = await supabase
          .from('daily_steps')
          .upsert(dailyEntry, {
            onConflict: 'participant_id,challenge_id,step_date'
          });
        
        if (dailyError) {
          console.error('Error creating daily entry:', dailyError);
          // Continue with other days even if one fails
        }
      }
      
      // Now create or update the weekly leaderboard entry
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .upsert({
          participant_id: entry.participant_id,
          challenge_id: entry.challenge_id,
          steps: totalSteps,
          distance_mi: entry.distance_mi,
          points: entry.points || 0
        }, {
          onConflict: 'participant_id,challenge_id'
        })
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

  /**
   * Get enhanced weekly analytics for a specific week
   */
  static async getWeeklyAnalytics(groupId?: string, weekId?: string) {
    try {
      if (!groupId || !weekId) return null;

      // Get daily step data for the week
      const { data: dailyData, error } = await supabase
        .from('daily_steps')
        .select(`
          step_date,
          steps,
          distance_mi,
          participant:participants!inner(name, email, group_id)
        `)
        .eq('challenge_id', weekId)
        .eq('participant.group_id', groupId)
        .not('participant.email', 'like', '%@example.com')
        .order('step_date', { ascending: true });

      if (error || !dailyData) {
        console.error('Error fetching weekly analytics:', error);
        return null;
      }

      // Group data by participant
      const participantData = new Map();
      const dailyTotals = new Map();
      const dayOfWeekTotals = new Map();

      dailyData.forEach((entry: any) => {
        const participantId = entry.participant.name;
        const date = entry.step_date;
        const steps = entry.steps || 0;
        const distance = parseFloat(entry.distance_mi || '0');
        const dayOfWeek = new Date(date + 'T12:00:00').getDay();

        // Track participant data
        if (!participantData.has(participantId)) {
          participantData.set(participantId, {
            name: participantId,
            dailySteps: [],
            totalSteps: 0,
            totalDistance: 0,
            activeDays: 0,
            weekdaySteps: 0,
            weekendSteps: 0
          });
        }

        const participant = participantData.get(participantId);
        participant.dailySteps.push({ date, steps, dayOfWeek });
        participant.totalSteps += steps;
        participant.totalDistance += distance;
        participant.activeDays += 1;

        // Weekday (1-5) vs Weekend (0,6)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          participant.weekendSteps += steps;
        } else {
          participant.weekdaySteps += steps;
        }

        // Track daily totals
        if (!dailyTotals.has(date)) {
          dailyTotals.set(date, { steps: 0, participants: 0 });
        }
        const dayTotal = dailyTotals.get(date);
        dayTotal.steps += steps;
        dayTotal.participants += 1;

        // Track day of week totals
        if (!dayOfWeekTotals.has(dayOfWeek)) {
          dayOfWeekTotals.set(dayOfWeek, 0);
        }
        dayOfWeekTotals.set(dayOfWeek, dayOfWeekTotals.get(dayOfWeek) + steps);
      });

      // Calculate analytics
      const participants = Array.from(participantData.values());
      const totalParticipants = participants.length;

      // Daily Champion - highest single day
      let dailyChampion = { name: '', steps: 0, date: '' };
      participants.forEach(p => {
        p.dailySteps.forEach((day: any) => {
          if (day.steps > dailyChampion.steps) {
            dailyChampion = { name: p.name, steps: day.steps, date: day.date };
          }
        });
      });

      // Most Consistent - least variance in daily steps
      let mostConsistent = { name: '', variance: Infinity };
      participants.forEach(p => {
        if (p.dailySteps.length >= 3) {
          const mean = p.totalSteps / p.dailySteps.length;
          const variance = p.dailySteps.reduce((sum: number, day: any) => 
            sum + Math.pow(day.steps - mean, 2), 0) / p.dailySteps.length;
          if (variance < mostConsistent.variance) {
            mostConsistent = { name: p.name, variance };
          }
        }
      });

      // Biggest Improver - largest increase from first to last day
      let biggestImprover = { name: '', improvement: -Infinity };
      participants.forEach(p => {
        if (p.dailySteps.length >= 2) {
          const sortedDays = p.dailySteps.sort((a: any, b: any) => a.date.localeCompare(b.date));
          const improvement = sortedDays[sortedDays.length - 1].steps - sortedDays[0].steps;
          if (improvement > biggestImprover.improvement) {
            biggestImprover = { name: p.name, improvement };
          }
        }
      });

      // Weekend Warrior - highest weekend total
      const weekendWarrior = participants.reduce((best, p) => 
        p.weekendSteps > best.weekendSteps ? p : best, { name: '', weekendSteps: 0 });

      // Weekday Hero - highest weekday total
      const weekdayHero = participants.reduce((best, p) => 
        p.weekdaySteps > best.weekdaySteps ? p : best, { name: '', weekdaySteps: 0 });

      // Perfect Week - participants with 7 days logged
      const perfectWeekCount = participants.filter(p => p.activeDays === 7).length;

      // Most Active Day
      const mostActiveDay = Array.from(dailyTotals.entries())
        .reduce((best, [date, data]) => data.steps > best.steps ? 
          { date, steps: data.steps } : best, { date: '', steps: 0 });

      // Participation Rate
      const participationRate = totalParticipants > 0 ? 
        (participants.reduce((sum, p) => sum + p.activeDays, 0) / (totalParticipants * 7)) * 100 : 0;

      // Week Momentum - comparing early vs late week
      const earlyWeekDays = Array.from(dailyTotals.entries()).slice(0, 3);
      const lateWeekDays = Array.from(dailyTotals.entries()).slice(-3);
      const earlyAvg = earlyWeekDays.reduce((sum, [, data]) => sum + data.steps, 0) / earlyWeekDays.length;
      const lateAvg = lateWeekDays.reduce((sum, [, data]) => sum + data.steps, 0) / lateWeekDays.length;
      const momentum = lateAvg > earlyAvg ? 'up' : lateAvg < earlyAvg ? 'down' : 'steady';

      // Goal Achievers - 10K+ steps per day
      let goalAchievements = 0;
      let totalDayEntries = 0;
      participants.forEach(p => {
        p.dailySteps.forEach((day: any) => {
          totalDayEntries++;
          if (day.steps >= 10000) goalAchievements++;
        });
      });
      const goalAchievementRate = totalDayEntries > 0 ? (goalAchievements / totalDayEntries) * 100 : 0;

      // Weekly Daily Wins - who won the most days this week
      const dailyWins = new Map(); // date -> winner name
      const allDates = [...new Set(dailyData.map((entry: any) => entry.step_date))].sort();
      
      // Find winner for each day in this week
      allDates.forEach(date => {
        const dayEntries = dailyData.filter((entry: any) => entry.step_date === date);
        const dayWinner = dayEntries.reduce((best, current) => 
          (current.steps || 0) > (best.steps || 0) ? current : best
        );
        const winnerName = (dayWinner.participant as any)?.name || 'Unknown';
        dailyWins.set(date, winnerName);
      });

      // Count daily wins for each participant this week
      const weeklyWinCounts = new Map();
      participants.forEach(p => {
        weeklyWinCounts.set(p.name, 0);
      });
      
      dailyWins.forEach(winnerName => {
        if (weeklyWinCounts.has(winnerName)) {
          weeklyWinCounts.set(winnerName, weeklyWinCounts.get(winnerName) + 1);
        }
      });

      // Find participant with most daily wins this week
      const weeklyDailyWinsChampion = Array.from(weeklyWinCounts.entries())
        .reduce((best, [name, wins]) => 
          wins > best.wins ? { name, wins } : best, { name: 'N/A', wins: 0 });

      return {
        dailyChampion,
        mostConsistent: mostConsistent.name || 'N/A',
        biggestImprover: biggestImprover.name || 'N/A',
        biggestImprovementSteps: Math.max(0, biggestImprover.improvement),
        weekendWarrior: weekendWarrior.name || 'N/A',
        weekendSteps: weekendWarrior.weekendSteps || 0,
        weekdayHero: weekdayHero.name || 'N/A',
        weekdaySteps: weekdayHero.weekdaySteps || 0,
        perfectWeekCount,
        weeklyDailyWinsChampion: weeklyDailyWinsChampion.name,
        weeklyDailyWinsCount: weeklyDailyWinsChampion.wins,
        mostActiveDay: {
          date: mostActiveDay.date,
          dayName: mostActiveDay.date ? new Date(mostActiveDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }) : 'N/A',
          steps: mostActiveDay.steps
        },
        participationRate: Math.round(participationRate),
        momentum,
        goalAchievementRate: Math.round(goalAchievementRate),
        totalParticipants,
        totalActiveDays: participants.reduce((sum, p) => sum + p.activeDays, 0)
      };
    } catch (error) {
      console.error('Error fetching weekly analytics:', error);
      return null;
    }
  }

  /**
   * Get enhanced overall analytics across all weeks
   */
  static async getOverallAnalytics(groupId?: string) {
    try {
      if (!groupId) return null;

      // Get all daily step data for the group
      const { data: dailyData, error } = await supabase
        .from('daily_steps')
        .select(`
          step_date,
          steps,
          distance_mi,
          participant:participants!inner(name, email, group_id),
          challenge:weekly_challenges!inner(week_number, year)
        `)
        .eq('participant.group_id', groupId)
        .not('participant.email', 'like', '%@example.com')
        .order('step_date', { ascending: true });

      if (error || !dailyData) {
        console.error('Error fetching overall analytics:', error);
        return null;
      }

      // Group data by participant
      const participantData = new Map();
      const dayOfWeekTotals = new Map();
      let maxSingleDaySteps = { name: '', steps: 0, date: '' };
      let totalGoalAchievements = 0;
      let totalDayEntries = 0;

      dailyData.forEach((entry: any) => {
        const participantName = entry.participant.name;
        const date = entry.step_date;
        const steps = entry.steps || 0;
        const distance = parseFloat(entry.distance_mi || '0');
        const dayOfWeek = new Date(date + 'T12:00:00').getDay();

        // Track max single day
        if (steps > maxSingleDaySteps.steps) {
          maxSingleDaySteps = { name: participantName, steps, date };
        }

        // Track goal achievements
        totalDayEntries++;
        if (steps >= 10000) totalGoalAchievements++;

        // Track participant data
        if (!participantData.has(participantName)) {
          participantData.set(participantName, {
            name: participantName,
            totalSteps: 0,
            totalDistance: 0,
            activeDays: 0,
            dailyEntries: [],
            weeklyCompletions: new Set(),
            dailyWins: 0,
            maxWinStreak: 0
          });
        }

        const participant = participantData.get(participantName);
        participant.totalSteps += steps;
        participant.totalDistance += distance;
        participant.activeDays += 1;
        participant.dailyEntries.push({ date, steps });
        participant.weeklyCompletions.add(`${entry.challenge.year}-W${entry.challenge.week_number}`);

        // Track day of week totals
        if (!dayOfWeekTotals.has(dayOfWeek)) {
          dayOfWeekTotals.set(dayOfWeek, 0);
        }
        dayOfWeekTotals.set(dayOfWeek, dayOfWeekTotals.get(dayOfWeek) + steps);
      });

      // Calculate daily wins for each participant
      const dailyWins = new Map(); // date -> winner name
      const allDates = [...new Set(dailyData.map((entry: any) => entry.step_date))].sort();
      
      // Find winner for each day
      allDates.forEach(date => {
        const dayEntries = dailyData.filter((entry: any) => entry.step_date === date);
        const dayWinner = dayEntries.reduce((best, current) => 
          (current.steps || 0) > (best.steps || 0) ? current : best
        );
        // Use the participant name from the winner entry
        const winnerName = (dayWinner.participant as any)?.name || 'Unknown';
        dailyWins.set(date, winnerName);
      });

      // Track daily wins and win streaks for each participant
      participantData.forEach((participant, name) => {
        participant.dailyWins = 0;
        participant.maxWinStreak = 0;
        
        // Count total daily wins
        dailyWins.forEach(winnerName => {
          if (winnerName === name) {
            participant.dailyWins++;
          }
        });
        
        // Calculate win streaks
        let currentWinStreak = 0;
        let maxWinStreak = 0;
        
        allDates.forEach(date => {
          if (dailyWins.get(date) === name) {
            currentWinStreak++;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
          } else {
            currentWinStreak = 0;
          }
        });
        
        participant.maxWinStreak = maxWinStreak;
      });

      const participants = Array.from(participantData.values());

      // Most Daily Wins - who has won the most individual days
      const mostDailyWins = participants.reduce((best, p) => 
        p.dailyWins > best.dailyWins ? p : best, { name: '', dailyWins: 0 });

      // Longest Win Streak - most consecutive daily victories
      const longestWinStreak = participants.reduce((best, p) => 
        p.maxWinStreak > best.maxWinStreak ? p : best, { name: '', maxWinStreak: 0 });

      // Most Dedicated - highest participation rate
      const totalPossibleDays = dailyData.length > 0 ? 
        Math.max(...participants.map(p => p.activeDays)) : 0;
      const mostDedicated = participants.reduce((best, p) => {
        const participationRate = totalPossibleDays > 0 ? (p.activeDays / totalPossibleDays) * 100 : 0;
        return participationRate > (best.participationRate || 0) ? 
          { ...p, participationRate } : best;
      }, { name: '', participationRate: 0 });

      // Peak Performance Day
      const peakDay = Array.from(dayOfWeekTotals.entries())
        .reduce((best, [day, steps]) => steps > best.steps ? 
          { day, steps } : best, { day: 0, steps: 0 });
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Consistency Champion - most consistent daily performance
      let consistencyChampion = { name: '', variance: Infinity };
      participants.forEach(p => {
        if (p.activeDays >= 7) {
          const mean = p.totalSteps / p.activeDays;
          const variance = p.dailyEntries.reduce((sum: number, entry: any) => 
            sum + Math.pow(entry.steps - mean, 2), 0) / p.activeDays;
          if (variance < consistencyChampion.variance) {
            consistencyChampion = { name: p.name, variance };
          }
        }
      });

      // Goal Achievement Rate
      const overallGoalRate = totalDayEntries > 0 ? (totalGoalAchievements / totalDayEntries) * 100 : 0;

      // Group Growth - unique weeks with data
      const uniqueWeeks = new Set(dailyData.map((entry: any) => 
        `${entry.challenge.year}-W${entry.challenge.week_number}`)).size;

      return {
        // Replace streak master with most daily wins
        streakMaster: mostDailyWins.name || 'N/A',
        longestStreak: mostDailyWins.dailyWins || 0,
        // Replace perfect weeks with longest win streak
        perfectWeeksChampion: longestWinStreak.name || 'N/A',
        perfectWeeksCount: longestWinStreak.maxWinStreak || 0,
        dailyRecordHolder: maxSingleDaySteps.name || 'N/A',
        dailyRecord: maxSingleDaySteps.steps || 0,
        dailyRecordDate: maxSingleDaySteps.date || '',
        mostDedicated: mostDedicated.name || 'N/A',
        dedicationRate: Math.round(mostDedicated.participationRate || 0),
        peakPerformanceDay: dayNames[peakDay.day] || 'N/A',
        peakDaySteps: peakDay.steps || 0,
        consistencyChampion: consistencyChampion.name || 'N/A',
        totalActiveDays: participants.reduce((sum, p) => sum + p.activeDays, 0),
        overallGoalRate: Math.round(overallGoalRate),
        uniqueWeeks,
        totalParticipants: participants.length,
        averageDailySteps: totalDayEntries > 0 ? 
          Math.round(participants.reduce((sum, p) => sum + p.totalSteps, 0) / totalDayEntries) : 0
      };
    } catch (error) {
      console.error('Error fetching overall analytics:', error);
      return null;
    }
  }
}
