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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, RefreshCw, PlusCircle, Trash2, AlertTriangle, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ManualEntryForm from "./ManualEntryForm";
import EntryEditor from "./EntryEditor";

interface ParticipantManagerProps {
  groupId: string;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ groupId }) => {
  const { convertDistance, getDistanceAbbreviation } = useUnitPreference();
  
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("view");
  const [isDeleting, setIsDeleting] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [showEntryEditor, setShowEntryEditor] = useState(false);
  
  // Load participants
  useEffect(() => {
    fetchParticipants();
  }, [groupId]);
  
  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const data = await DataService.getGroupParticipants(groupId);
      setParticipants(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEntryAdded = () => {
    // Refresh participants list
    fetchParticipants();
    // Show success message or feedback
  };

  const handleDeleteClick = (participant: any) => {
    setParticipantToDelete(participant);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setParticipantToDelete(null);
  };

  const handleEditEntries = (participant: any) => {
    setSelectedParticipant(participant);
    setShowEntryEditor(true);
  };

  const handleBackFromEditor = () => {
    setShowEntryEditor(false);
    setSelectedParticipant(null);
    // Refresh participant list to show updated entry counts
    fetchParticipants();
  };
  
  const handleConfirmDelete = async () => {
    if (!participantToDelete) return;
    
    setIsDeleting(true);
    try {
      await DataService.deleteParticipant(participantToDelete.id, groupId);
      
      // Show success message
      toast({
        title: "Participant Deleted Successfully",
        description: `${participantToDelete.name} has been removed and points have been recalculated`,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000
      });
      
      // Refresh participant list
      fetchParticipants();
    } catch (error) {
      console.error("Error deleting participant:", error);
      toast({
        title: "Error",
        description: "Failed to delete participant. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setParticipantToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {showEntryEditor && selectedParticipant ? (
        <EntryEditor 
          participantId={selectedParticipant.id}
          participantName={selectedParticipant.name}
          groupId={groupId}
          onBack={handleBackFromEditor}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-step-teal">Participant Management</h2>
              <p className="text-gray-600">Manage participants and add manual entries</p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="view">
                <Users className="h-4 w-4 mr-2" /> View Participants
              </TabsTrigger>
              <TabsTrigger value="add">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Manual Entry
              </TabsTrigger>
            </TabsList>
        
        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Group Participants</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-step-teal" />
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No participants found in this group</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Total Entries</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.name}</TableCell>
                          <TableCell>{participant.email}</TableCell>
                          <TableCell className="text-right">{participant.entry_count || 0}</TableCell>
                          <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEditEntries(participant)}
                              title="Edit Entries"
                            >
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(participant)}
                              title="Delete Participant"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Add Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualEntryForm 
                groupId={groupId} 
                onEntryAdded={handleEntryAdded}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Delete Participant
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{participantToDelete?.name}</strong>? This will remove all their entries and recalculate points for all affected weeks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ParticipantManager;
