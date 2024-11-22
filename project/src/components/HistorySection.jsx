import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, RepeatIcon, ClockIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuth } from "firebase/auth";
import axios from "axios";
import { toast } from "sonner";

const HistorySection = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExecutionHistory();
  }, []);

  const fetchExecutionHistory = async () => {
    const auth = getAuth();
    const token = await auth.currentUser.getIdToken();
    const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";

    try {
      const response = await axios.get(`${url}api/get_execution_history/`, {
        headers: { Authorization: token },
      });
      setHistory(response.data.executions);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to fetch execution history");
    }
  };

  const repeatExecution = async (executionRecord) => {
    setIsLoading(true);
    const auth = getAuth();
    const token = await auth.currentUser.getIdToken();
    const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";

    try {
      const response = await axios.post(
        `${url}api/repeat_execution/`,
        {
          execution_id: executionRecord?.execution_id,
        },
        {
          headers: { Authorization: token },
        }
      );
      toast.success("Execution repeated successfully");
      await fetchExecutionHistory();
    } catch (error) {
      console.error("Error repeating execution:", error);
      toast.error("Failed to repeat execution");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordClick = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };


  const filteredHistory = history.filter((record) =>
    record.function_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#111827] text-white p-6 rounded-lg min-h-[100vh]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold">Execution History</h2>
        <div className="relative w-full md:w-64">
          <Input
            type="text"
            placeholder="Search executions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredHistory.length === 0 && (
            <div className="col-span-full text-center text-gray-400">
              No executions found
            </div>
          )}
          {filteredHistory.map((record) => (
            <Card
              key={record.id}
              className="bg-gray-800 cursor-pointer text-white hover:bg-gray-700 transition-colors"
            >
              <CardContent className="flex flex-col items-center justify-between h-full p-6">
                <span className="text-center mb-2 text-blue-400">
                  {record.function_name}
                </span>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <ClockIcon className="w-4 h-4" />
                  {formatDate(record.timestamp)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecordClick(record)}
                    className="text-black"
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => repeatExecution(record)}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RepeatIcon className="w-4 h-4 mr-2" />
                    Repeat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-gray-800 text-white max-w-[90%] w-full md:max-w-[800px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto pr-2">
            <div>
              <Label>Function Name</Label>
              <Input
                value={selectedRecord?.function_name || ""}
                className="bg-gray-700 text-white cursor-default"
                readOnly
              />
            </div>
            <div>
              <Label>Execution Time</Label>
              <Input
                value={
                  selectedRecord ? formatDate(selectedRecord.timestamp) : ""
                }
                className="bg-gray-700 text-white cursor-default"
                readOnly
              />
            </div>

            <div>
              <Label>Input Parameters</Label>
              <div className="relative">
                <pre className="bg-gray-700 p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-words max-h-[200px] w-full">
                  {selectedRecord
                    ? JSON.stringify(selectedRecord.parameters, null, 2)
                    : ""}
                </pre>
              </div>
            </div>
            <div>
              <Label>Result</Label>
              <div className="relative">
                <pre className="bg-gray-700 p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-words max-h-[200px] w-full">
                  {selectedRecord
                    ? JSON.stringify(selectedRecord.result, null, 2)
                    : ""}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="text-black"
              onClick={handleCloseModal}
            >
              Close
            </Button>
            <Button
              onClick={() => repeatExecution(selectedRecord)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RepeatIcon className="w-4 h-4 mr-2" />
              Repeat Execution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistorySection;
