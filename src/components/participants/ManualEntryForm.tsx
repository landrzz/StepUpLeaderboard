import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { DataService } from "@/lib/dataService";
import { useUnitPreference } from "@/contexts/UnitPreferenceContext";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ManualEntryFormProps {
  groupId: string;
  onEntryAdded?: () => void;
}

interface WeekOption {
  id: string;
  label: string;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ 
  groupId,
  onEntryAdded = () => {}
}) => {
  const { unitPreference, convertDistanceToMiles } = useUnitPreference();
  
  // Form state
  const [name, setName] = useState("");
  const [steps, setSteps] = useState("");
  const [distance, setDistance] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  
  // Other state
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available weeks
  useEffect(() => {
    const fetchWeeks = async () => {
      setLoading(true);
      try {
        const availableWeeks = await DataService.getAvailableWeeks(groupId);
        const weekOptions = availableWeeks.map(week => {
          // Format date range: Monday-Sunday format
          const startDate = new Date(week.week_start_date);
          const endDate = new Date(week.week_end_date);
          const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return {
            id: week.id,
            label: `Week ${week.week_number}, ${week.year} (${startFormatted} - ${endFormatted})`
          };
        });
        
        setWeeks(weekOptions);
        
        // Set default to most recent week
        if (weekOptions.length > 0) {
          setSelectedWeek(weekOptions[0].id);
        }
      } catch (error) {
        console.error("Error fetching weeks:", error);
        setError("Failed to load available weeks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchWeeks();
    }
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      setError("Please enter a participant name");
      return;
    }

    if (!steps || isNaN(Number(steps)) || Number(steps) < 0) {
      setError("Please enter a valid step count");
      return;
    }

    if (!selectedWeek) {
      setError("Please select a week");
      return;
    }

    // Calculate distance if not provided
    const stepCount = Number(steps);
    const distanceValue = distance && !isNaN(Number(distance)) 
      ? convertDistanceToMiles(Number(distance)) 
      : (stepCount * 0.0005); // Default conversion if no distance provided
    
    setIsAlertOpen(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Attempt to find existing participant by name
      const participantResults = await DataService.getParticipantByName(name, groupId);
      
      let participantId;
      
      if (participantResults && participantResults.length > 0) {
        // Use existing participant
        participantId = participantResults[0].id;
      } else {
        // Create new participant
        const newParticipant = await DataService.createParticipant({
          name,
          email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@generated.com`,
          group_id: groupId
        });
        participantId = newParticipant.id;
      }
      
      // Create the entry
      await DataService.createLeaderboardEntry({
        participant_id: participantId,
        challenge_id: selectedWeek,
        steps: Number(steps),
        distance_mi: distance && !isNaN(Number(distance)) 
          ? convertDistanceToMiles(Number(distance))
          : (Number(steps) * 0.0005), // Default conversion
        points: 0 // Points will be calculated by backend or updated later
      });
      
      // Success
      toast({
        title: "Entry Added Successfully",
        description: `Added ${steps} steps for ${name}`,
        variant: "default",
      });
      
      // Reset form
      setName("");
      setSteps("");
      setDistance("");
      
      // Notify parent component
      onEntryAdded();
    } catch (error) {
      console.error("Error adding entry:", error);
      setError("Failed to add entry. Please try again.");
    } finally {
      setIsAlertOpen(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">Add Manual Entry</h3>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="week">Week</Label>
          <Select 
            value={selectedWeek || ""} 
            onValueChange={setSelectedWeek}
            disabled={loading || weeks.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a week" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week.id} value={week.id}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Participant Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter participant name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="steps">Step Count</Label>
          <Input
            id="steps"
            type="number"
            min="0"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="Enter total steps"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="distance">
            Distance ({unitPreference === 'miles' ? 'miles' : 'km'}) (Optional)
          </Label>
          <Input
            id="distance"
            type="number"
            min="0"
            step="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder={`Enter distance in ${unitPreference === 'miles' ? 'miles' : 'km'} (calculated from steps if empty)`}
            disabled={isSubmitting}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading || isSubmitting || !selectedWeek}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Entry...
            </>
          ) : (
            'Add Entry'
          )}
        </Button>
      </form>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Manual Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Add {steps} steps ({distance || (Number(steps) * 0.0005).toFixed(2)} {unitPreference === 'miles' ? 'miles' : 'km'}) 
              for {name} to the selected week?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Entry'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManualEntryForm;
