import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { GroupService, Group } from '@/lib/groupService';
import { useAuth } from '../../../supabase/auth';
import { useToast } from '@/components/ui/use-toast';

export default function GroupInvite() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (groupId) {
      loadGroupInfo();
    }
  }, [groupId]);

  const loadGroupInfo = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);
      
      const groupData = await GroupService.getGroupById(groupId);
      if (!groupData) {
        setError('Group not found or inactive');
        return;
      }
      
      setGroup(groupData);
      
      // Load participants
      const participantData = await GroupService.getGroupParticipants(groupId);
      setParticipants(participantData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId || !user) return;

    setJoining(true);
    try {
      await GroupService.joinGroup(groupId);
      toast({
        title: 'Success!',
        description: 'You have successfully joined the group.',
      });
      
      // Reload group info to show updated participant count
      await loadGroupInfo();
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join group',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-step-green/5 via-white to-step-teal/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-step-green" />
          <p className="text-gray-600">Loading group information...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-step-green/5 via-white to-step-teal/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Group Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || 'The group you\'re looking for doesn\'t exist or is no longer active.'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isUserInGroup = participants.some(p => p.user_id === user?.id);
  const isGroupOwner = group.created_by === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-step-green/5 via-white to-step-teal/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-step-green/10 p-4 rounded-full">
              <Users className="h-12 w-12 text-step-green" />
            </div>
          </div>
          <CardTitle className="text-2xl text-step-teal">{group.name}</CardTitle>
          {group.description && (
            <p className="text-gray-600 mt-2">{group.description}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Group Info */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{participants.length} member{participants.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="text-center space-y-4">
            {!user ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Sign in to join this step challenge group and compete with others!
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/signup')}>
                    Sign Up
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">or</p>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate(`/dashboard/${groupId}`)}
                    className="text-step-teal hover:text-step-teal/80"
                  >
                    View as Guest
                  </Button>
                </div>
              </div>
            ) : isUserInGroup ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">You're already a member of this group!</span>
                </div>
                {isGroupOwner && (
                  <Badge variant="secondary" className="mx-auto">Group Owner</Badge>
                )}
                <Button onClick={handleGoToDashboard} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Join this group to participate in the step challenge and track your progress!
                </p>
                <Button 
                  onClick={handleJoinGroup}
                  disabled={joining}
                  className="w-full"
                >
                  {joining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining Group...
                    </>
                  ) : (
                    'Join Group'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Group ID for reference */}
          <div className="border-t pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Group ID</p>
              <code className="text-xs bg-gray-100 px-3 py-1 rounded font-mono">
                {group.id}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
