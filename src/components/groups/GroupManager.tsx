import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Calendar, Copy, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { GroupService, Group } from '@/lib/groupService';
import { useAuth } from '../../../supabase/auth';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import CreateGroupModal from './CreateGroupModal';

interface GroupManagerProps {
  currentGroupId?: string;
}

export default function GroupManager({ currentGroupId }: GroupManagerProps) {
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [joinGroupId, setJoinGroupId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
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
    // Navigate to the new group dashboard
    navigate(`/dashboard/${newGroup.id}`);
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
      // Navigate to the joined group dashboard
      navigate(`/dashboard/${joinGroupId.trim()}`);
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
    navigate(`/dashboard/${groupId}`);
  };

  const openDeleteDialog = (group: Group) => {
    setGroupToDelete(group);
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
    setDeleteConfirmation('');
    setIsDeleting(false);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete || deleteConfirmation !== groupToDelete.name) {
      toast({
        title: 'Error',
        description: 'Please type the group name exactly to confirm deletion',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await GroupService.deleteGroup(groupToDelete.id);
      toast({
        title: 'Success',
        description: `Group "${groupToDelete.name}" has been permanently deleted`,
      });
      
      // Refresh the groups list
      await loadUserGroups();
      
      // If we're currently viewing the deleted group, navigate away
      if (currentGroupId === groupToDelete.id) {
        navigate('/dashboard');
      }
      
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete group',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
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
                  className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                    currentGroupId === group.id 
                      ? 'border-step-green bg-step-green/5 shadow-md ring-1 ring-step-green/20' 
                      : ''
                  }`}
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
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => navigateToGroup(group.id)}
                      >
                        <ExternalLink size={14} className="mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(group)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 size={20} />
              Delete Group
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                You are about to permanently delete the group{' '}
                <strong>"{groupToDelete?.name}"</strong>.
              </p>
              <p className="text-destructive font-medium">
                ⚠️ This action is irreversible and will delete:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>All participants in this group</li>
                <li>All weekly challenges</li>
                <li>All leaderboard entries and data</li>
                <li>The group itself</li>
              </ul>
              <p className="font-medium">
                To confirm, type the group name exactly: <code className="bg-muted px-1 rounded">{groupToDelete?.name}</code>
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Type group name to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isDeleting || deleteConfirmation !== groupToDelete?.name}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
