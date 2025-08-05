import React, { useState, useEffect } from "react";
import { DataService } from "@/lib/dataService";
import { useUnitPreference } from "@/contexts/UnitPreferenceContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, X, ArrowLeft, PencilLine } from "lucide-react";

interface EntryEditorProps {
  participantId: string;
  participantName: string;
  groupId: string;
  onBack: () => void;
}

interface Entry {
  id: string;
  participant_id: string;
  challenge_id: string;
  steps: number;
  distance_mi: number;
  points: number;
  rank: number;
  created_at: string;
  challenge: {
    id: string;
    week_number: number;
    year: number;
    week_start_date: string;
    week_end_date: string;
    group_id: string;
  };
}

const EntryEditor: React.FC<EntryEditorProps> = ({ 
  participantId, 
  participantName, 
  groupId, 
  onBack 
}) => {
  const { convertDistance, getDistanceAbbreviation, distanceUnit } = useUnitPreference();
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editSteps, setEditSteps] = useState<number>(0);
  const [editDistance, setEditDistance] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [participantId, groupId]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await DataService.getParticipantEntries(participantId, groupId);
      setEntries(data);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast({
        title: "Error",
        description: "Failed to load participant entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setEditSteps(entry.steps);
    // Convert distance to user's preferred unit for editing
    setEditDistance(
      distanceUnit === 'kilometers' 
        ? Number((entry.distance_mi / 0.621371).toFixed(2))
        : entry.distance_mi
    );
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
  };

  const handleSave = async (entryId: string) => {
    setIsSaving(true);
    try {
      // Convert distance back to miles if needed for database storage
      const distanceInMiles = distanceUnit === 'kilometers'
        ? Number((editDistance * 0.621371).toFixed(2))
        : editDistance;

      await DataService.updateLeaderboardEntry(
        entryId,
        {
          steps: editSteps,
          distance_mi: distanceInMiles
        },
        participantId
      );

      toast({
        title: "Entry Updated Successfully ✓",
        description: `Updated entry for ${participantName}`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000
      });

      // Refresh entries
      fetchEntries();
      setEditingEntryId(null);
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Error",
        description: "Failed to update entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatWeekDate = (entry: Entry) => {
    const startDate = new Date(entry.challenge.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(entry.challenge.week_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `Week ${entry.challenge.week_number}, ${entry.challenge.year} (${startDate} - ${endDate})`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Participants
        </Button>
        <h2 className="text-2xl font-bold text-step-teal">Editing Entries for {participantName}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-step-teal" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No entries found for this participant
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Steps</TableHead>
                  <TableHead className="text-right">Distance ({getDistanceAbbreviation()})</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Rank</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatWeekDate(entry)}</TableCell>
                    
                    {/* Steps - editable or static */}
                    <TableCell className="text-right">
                      {editingEntryId === entry.id ? (
                        <Input 
                          type="number"
                          value={editSteps}
                          onChange={(e) => setEditSteps(Number(e.target.value))}
                          className="w-24 text-right"
                        />
                      ) : (
                        entry.steps.toLocaleString()
                      )}
                    </TableCell>
                    
                    {/* Distance - editable or static */}
                    <TableCell className="text-right">
                      {editingEntryId === entry.id ? (
                        <Input 
                          type="number"
                          value={editDistance}
                          onChange={(e) => setEditDistance(Number(e.target.value))}
                          className="w-24 text-right"
                          step="0.01"
                        />
                      ) : (
                        distanceUnit === 'kilometers' 
                          ? (entry.distance_mi / 0.621371).toFixed(2)
                          : entry.distance_mi.toFixed(2)
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">{entry.points}</TableCell>
                    <TableCell className="text-right">{entry.rank}</TableCell>
                    
                    {/* Actions */}
                    <TableCell className="text-right">
                      {editingEntryId === entry.id ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-green-500"
                            onClick={() => handleSave(entry.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? 
                              <Loader2 className="h-4 w-4 animate-spin" /> : 
                              <Save className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500"
                          onClick={() => handleEdit(entry)}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EntryEditor;
