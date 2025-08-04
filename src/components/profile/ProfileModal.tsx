import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Trophy, Target, Activity, Edit, Save, X, CheckCircle, Edit2, TrendingUp, Award, Globe } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { UserProfileService, UserProfile, UserStats } from '../../lib/userProfileService';
import { useUnitPreference } from '../../contexts/UnitPreferenceContext';
import { useToast } from '@/components/ui/use-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user } = useAuth();
  const { distanceUnit, setDistanceUnit, convertDistance, getDistanceAbbreviation } = useUnitPreference();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameExists, setNameExists] = useState<boolean | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [originalDistanceUnit, setOriginalDistanceUnit] = useState<'miles' | 'kilometers'>('miles');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  if (!user) return null;

  // Load user profile and stats when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserProfile();
    }
  }, [isOpen, user]);

  // Track distance unit changes
  useEffect(() => {
    setOriginalDistanceUnit(distanceUnit);
    setHasUnsavedChanges(false);
  }, [isOpen]);

  useEffect(() => {
    setHasUnsavedChanges(distanceUnit !== originalDistanceUnit);
  }, [distanceUnit, originalDistanceUnit]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    const profile = await UserProfileService.getUserProfile(user.id);
    setUserProfile(profile);
    
    if (profile?.first_name && profile?.last_name) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      await loadUserStats(profile.first_name, profile.last_name);
    } else {
      setFirstName('');
      setLastName('');
      setUserStats(null);
    }
  };

  const loadUserStats = async (fName: string, lName: string) => {
    setIsLoadingStats(true);
    const stats = await UserProfileService.getUserStats(fName, lName);
    setUserStats(stats);
    setIsLoadingStats(false);
  };

  const handleSaveName = async () => {
    if (!user || !firstName.trim() || !lastName.trim()) return;
    
    setIsSaving(true);
    
    // Check if name exists in participants
    const exists = await UserProfileService.checkNameExists(firstName.trim(), lastName.trim());
    setNameExists(exists);
    
    // Save the profile regardless
    const savedProfile = await UserProfileService.upsertUserProfile(
      user.id, 
      firstName.trim(), 
      lastName.trim()
    );
    
    if (savedProfile) {
      setUserProfile(savedProfile);
      setIsEditing(false);
      
      // Load stats if name exists
      if (exists) {
        await loadUserStats(firstName.trim(), lastName.trim());
      } else {
        setUserStats(null);
      }
    }
    
    setIsSaving(false);
  };

  const handleSaveDistanceUnit = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const success = await UserProfileService.updateDistanceUnit(user.id, distanceUnit);
    
    if (success) {
      setOriginalDistanceUnit(distanceUnit);
      setHasUnsavedChanges(false);
      toast({
        title: "Preferences saved!",
        description: `Distance unit updated to ${distanceUnit}.`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Error saving preferences",
        description: "Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
    
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
    } else {
      setFirstName('');
      setLastName('');
    }
    setIsEditing(false);
    setNameExists(null);
  };

  const hasName = userProfile?.first_name && userProfile?.last_name;
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'Unknown';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-step-teal">
            Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt={user.email || ""}
              />
              <AvatarFallback className="text-2xl bg-step-green/20 text-step-teal">
                {user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {hasName ? `${userProfile?.first_name} ${userProfile?.last_name}` : user.email}
              </h3>
              <p className="text-gray-600 text-sm">{user.email}</p>
              <p className="text-gray-600 flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-2" />
                Joined {joinDate}
              </p>
            </div>
          </div>

          <Separator />

          {/* Name Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-step-teal" />
                Personal Information
              </h4>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {hasName ? 'Edit Name' : 'Add Name'}
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                {nameExists !== null && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    nameExists 
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}>
                    {nameExists ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">✓ Name found in participant list! Statistics will be shown.</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        <span className="text-sm">Name not found in participant list. No statistics available.</span>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveName}
                    disabled={!firstName.trim() || !lastName.trim() || isSaving}
                    className="flex items-center gap-2 bg-step-green hover:bg-step-green/90"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Name'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {hasName ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">First Name</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md">{userProfile?.first_name}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md">{userProfile?.last_name}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Add your name to see your step challenge statistics</p>
                    <p className="text-sm text-gray-500">Your name will be matched with participant data from CSV uploads</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Unit Preferences */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-900">Distance Unit</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant={distanceUnit === 'miles' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDistanceUnit('miles')}
                className="flex-1"
              >
                Miles
              </Button>
              <Button
                variant={distanceUnit === 'kilometers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDistanceUnit('kilometers')}
                className="flex-1"
              >
                Kilometers
              </Button>
            </div>
          </div>

          <Separator />

          {/* Statistics Section */}
          {hasName && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-step-teal" />
                Your Statistics
              </h4>
              
              {isLoadingStats ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-step-teal mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading your statistics...</p>
                </div>
              ) : userStats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-step-orange/10 rounded-lg p-4 text-center">
                      <Activity className="h-8 w-8 text-step-orange mx-auto mb-2" />
                      <div className="text-2xl font-bold text-step-orange">
                        {userStats.totalSteps.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Steps</div>
                    </div>
                    
                    <div className="bg-step-green/10 rounded-lg p-4 text-center">
                      <Target className="h-8 w-8 text-step-green mx-auto mb-2" />
                      <div className="text-2xl font-bold text-step-green">
                        {convertDistance(userStats.totalDistance).toFixed(1)} {getDistanceAbbreviation()}
                      </div>
                      <div className="text-sm text-gray-600">Total Distance</div>
                    </div>
                    
                    <div className="bg-step-teal/10 rounded-lg p-4 text-center">
                      <Trophy className="h-8 w-8 text-step-teal mx-auto mb-2" />
                      <div className="text-2xl font-bold text-step-teal">
                        {userStats.totalPoints}
                      </div>
                      <div className="text-sm text-gray-600">Total Points</div>
                    </div>
                    
                    <div className="bg-purple-100 rounded-lg p-4 text-center">
                      <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {userStats.weeksParticipated}
                      </div>
                      <div className="text-sm text-gray-600">Weeks Joined</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {userStats.averageSteps.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Average Steps/Week</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {userStats.bestWeekSteps.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Best Week Steps</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {userStats.currentRank ? `#${userStats.currentRank}` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Current Rank</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">No statistics available</p>
                  <p className="text-sm text-gray-500">Your name wasn't found in the participant data from CSV uploads</p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {hasUnsavedChanges && (
              <Button
                onClick={handleSaveDistanceUnit}
                disabled={isSaving}
                className="px-6 bg-step-green hover:bg-step-green/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
