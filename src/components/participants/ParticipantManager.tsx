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
import { Users, Loader2, RefreshCw, PlusCircle } from "lucide-react";
import ManualEntryForm from "./ManualEntryForm";

interface ParticipantManagerProps {
  groupId: string;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ groupId }) => {
  const { convertDistance, getDistanceAbbreviation } = useUnitPreference();
  
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("view");
  
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

  return (
    <div className="container mx-auto py-6 max-w-5xl">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.name}</TableCell>
                          <TableCell>{participant.email}</TableCell>
                          <TableCell className="text-right">{participant.entry_count || 0}</TableCell>
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
    </div>
  );
};

export default ParticipantManager;
