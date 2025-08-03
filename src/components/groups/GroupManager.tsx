import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Calendar, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { GroupService, Group } from '@/lib/groupService';
import { useAuth } from '../../../supabase/auth';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import CreateGroupModal from './CreateGroupModal';

export default function GroupManager() {
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [joinGroupId, setJoinGroupId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserGroups();
    }
  }, [user]);

  const loadUserGroups = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const groups = await GroupService.getUserGroups(user.id);
      setUserGroups(groups);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load your groups',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupCreated = (newGroup: Group) => {
    setUserGroups(prev => [newGroup, ...prev]);
    // Navigate to the new group
    navigate(`/group/${newGroup.id}`);
  };

  const handleJoinGroup = async () => {
    if (!joinGroupId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a group ID',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      await GroupService.joinGroup(joinGroupId.trim());
      toast({
        title: 'Success!',
        description: 'You have successfully joined the group.',
      });
      setJoinGroupId('');
      // Navigate to the joined group
      navigate(`/group/${joinGroupId.trim()}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join group',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const copyGroupId = (groupId: string) => {
    navigator.clipboard.writeText(groupId);
    toast({
      title: 'Copied!',
      description: 'Group ID copied to clipboard',
    });
  };

  const navigateToGroup = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Group Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Group Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <CreateGroupModal onGroupCreated={handleGroupCreated} />
          </div>
          
          <Separator />
          
          {/* Join Existing Group */}
          <div className="space-y-2">
            <h4 className="font-medium">Join an Existing Group</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter group ID to join"
                value={joinGroupId}
                onChange={(e) => setJoinGroupId(e.target.value)}
                disabled={isJoining}
              />
              <Button 
                onClick={handleJoinGroup}
                disabled={isJoining || !joinGroupId.trim()}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Group'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Your Groups ({userGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {userGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>You haven't created any groups yet.</p>
              <p className="text-sm">Create your first group to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userGroups.map((group) => (
                <div
                  key={group.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{group.name}</h3>
                        <Badge variant="secondary">Owner</Badge>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          Created {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Group ID for sharing */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Group ID:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {group.id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyGroupId(group.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => navigateToGroup(group.id)}
                      className="ml-4"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
