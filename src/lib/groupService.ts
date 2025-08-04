import { supabase } from '../../supabase/supabase';

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateGroupData {
  name: string;
  description?: string;
}

export class GroupService {
  static async createGroup(groupData: CreateGroupData): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create a group');
    }

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }

    // Automatically add the creator as a participant
    await this.addUserToGroup(data.id, user.id, user.user_metadata?.full_name || user.email || 'Unknown User');

    return data;
  }

  static async getUserGroups(userId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('created_by', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user groups: ${error.message}`);
    }

    return data || [];
  }

  static async joinGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to join a group');
    }

    // Check if group exists
    const group = await this.getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found or inactive');
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      throw new Error('User is already a member of this group');
    }

    await this.addUserToGroup(groupId, user.id, user.user_metadata?.full_name || user.email || 'Unknown User');
  }

  private static async addUserToGroup(groupId: string, userId: string, userName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('participants')
      .insert({
        group_id: groupId,
        user_id: userId,
        name: userName,
        email: user?.email,
        avatar_url: user?.user_metadata?.avatar_url,
      });

    if (error) {
      throw new Error(`Failed to add user to group: ${error.message}`);
    }
  }

  static async getGroupById(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw new Error(`Failed to fetch group: ${error.message}`);
    }

    return data;
  }

  static async searchGroupByName(groupName: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .ilike('name', groupName)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw new Error(`Failed to search group by name: ${error.message}`);
    }

    return data;
  }

  static async getGroupParticipants(groupId: string) {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch group participants: ${error.message}`);
    }

    return data || [];
  }
}
