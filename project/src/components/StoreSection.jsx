import React, { useState, useCallback, useEffect } from "react";
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
import { Search } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { useStore } from "@/store/store";
import { toast } from "sonner";

export default function StoreSection() {
  const [functions, setFunctions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [functionName, setFunctionName] = useState("");
  const [functionDescription, setFunctionDescription] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useStore((state) => state);

  const fetchPublicFunctions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      const response = await axios.get(`${url}api/get_public_functions/`, {
        headers: { Authorization: token },
      });
      setFunctions(response.data.functions);
    } catch (error) {
      console.error("Error fetching public functions:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPublicFunctions();
  }, [fetchPublicFunctions]);

  const handleFunctionClick = useCallback((func) => {
    setSelectedFunction(func);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedFunction(null);
  }, []);

  useEffect(() => {
    if (selectedFunction) {
      setEditorValue(selectedFunction.code || "");
      setFunctionName(selectedFunction.name || "");
      setFunctionDescription(selectedFunction.description || "");
    }
  }, [selectedFunction]);

  const handleAddToLibrary = async () => {
    if (!isAuthenticated || !selectedFunction) return;

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      const response = await axios.post(
        `${url}api/add_public_function_to_library/`,
        { functionId: selectedFunction.id },
        { headers: { Authorization: token } }
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Function added to library successfully"
        );
        handleCloseModal();
      } else {
        toast.error(response.data.error || "Failed to add function to library");
      }
    } catch (error) {
      console.error("Error adding function to library:", error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(
          "An error occurred while adding the function to your library"
        );
      }
    }
  };

  const filteredFunctions = functions.filter(
    (func) =>
      func.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      func.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#111827] text-white p-6 rounded-lg min-h-[100vh]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold">Function Store</h2>
        <div className="relative w-full md:w-64">
          <Input
            type="text"
            placeholder="Search functions..."
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFunctions.length === 0 && (
          <div className="col-span-full text-center text-gray-400">
            No functions found
          </div>
        )}
        {filteredFunctions.map((func) => (
          <Card
            key={func.id}
            className="bg-gray-800 cursor-pointer text-white hover:bg-gray-700 transition-colors"
          >
            <CardContent className="flex flex-col items-center justify-between h-full p-6">
              <span className="text-center mb-2">{func.name}</span>
              <p className="text-sm text-gray-400 mb-4 text-center">
                {func.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFunctionClick(func)}
                className="mt-2 text-black"
              >
                Show Function
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-gray-800 text-white max-w-[90%] mx-auto md:max-w-[70%]">
          <DialogHeader>
            <DialogTitle>Function Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="function-name">Title</Label>
              <Input
                id="function-name"
                value={functionName}
                placeholder="Function Name"
                className="bg-gray-700 text-white cursor-default"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="function-description">Description</Label>
              <Textarea
                id="function-description"
                value={functionDescription}
                readOnly
                placeholder="Function Description"
                className="bg-gray-700 text-white cursor-default"
              />
            </div>
            <div>
              <Label>Function Code</Label>
              <CodeMirror
                value={editorValue}
                theme={dracula}
                extensions={[python()]}
                onChange={(value) => setEditorValue(value)}
                height="200px"
                editable={false}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="text-black"
              onClick={handleCloseModal}
            >
              Close
            </Button>
            <Button onClick={handleAddToLibrary}>Add to My Library</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
