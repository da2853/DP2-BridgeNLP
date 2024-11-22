"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { dracula } from "@uiw/codemirror-theme-dracula";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { useStore } from "@/store/store";
import { toast } from "sonner";

export default function FunctionsSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [functions, setFunctions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [functionName, setFunctionName] = useState("");
  const [functionDescription, setFunctionDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [editorValue, setEditorValue] = useState("");
  const { isAuthenticated } = useStore((state) => state);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultFunctionsCreated, setDefaultFunctionsCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUserFunctions = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      const response = await axios.get(`${url}api/get_user_functions/`, {
        headers: { Authorization: token },
      });
      setFunctions(response.data.functions);
    } catch (error) {
      console.error("Error fetching user functions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const createDefaultFunctions = async () => {
    if (!isAuthenticated) return;

    const defaultFunctions = [
      {
        name: "Hello World (Public)",
        description: "A simple public Hello World function",
        code: "def hello_world():\n    print('Hello, World!')",
        isPublic: true,
      },
      {
        name: "Hello World (Private)",
        description: "A simple private Hello World function",
        code: "def hello_world():\n    print('Hello, World! (Private)')",
        isPublic: false,
      },
    ];
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";

      for (const func of defaultFunctions) {
        await axios.post(
          `${url}api/save_user_function/`,
          {
            name: func.name,
            description: func.description,
            code: func.code,
            language: "python",
            isPublic: func.isPublic,
          },
          {
            headers: { Authorization: token },
          }
        );
      }

      await fetchUserFunctions();
    } catch (error) {
      console.error("Error creating default functions:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserFunctions();
    }
  }, [isAuthenticated, fetchUserFunctions]);

  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      functions.length === 0 &&
      !defaultFunctionsCreated
    ) {
      createDefaultFunctions().then(() => setDefaultFunctionsCreated(true));
    }
  }, [isAuthenticated, isLoading, functions.length, defaultFunctionsCreated]);

  const handleCreateFunction = useCallback(() => {
    setSelectedFunction({
      id: null,
      name: "New Function",
      description: "",
      code: "# New function code",
      isPublic: false,
    });
    setShowModal(true);
  }, []);

  const handleFunctionClick = useCallback((func) => {
    setSelectedFunction(func);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedFunction(null);
  }, []);

  const filteredFunctions = functions.filter((func) => {
    if (activeTab === "all") return true;
    if (activeTab === "personal") return !func.isPublic;
    return func.isPublic;
  });

  useEffect(() => {
    if (selectedFunction) {
      setEditorValue(selectedFunction.code || "");
      setFunctionName(selectedFunction.name || "");
      setFunctionDescription(selectedFunction.description || "");
      setIsPublic(selectedFunction.isPublic || false);
    }
  }, [selectedFunction]);

  const handleSaveChanges = async () => {
    if (!isAuthenticated) return;

    setLoading(true);

    const updatedFunction = {
      ...selectedFunction,
      functionId: selectedFunction.id,
      name: functionName,
      description: functionDescription,
      code: editorValue,
      isPublic: isPublic,
    };

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      await axios.post(`${url}api/save_user_function/`, updatedFunction, {
        headers: { Authorization: token },
      });
      await fetchUserFunctions();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving function:", error);
    }
  };

  const handleTogglePublic = async (id) => {
    if (!isAuthenticated) return;

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      const response = await axios.post(
        `${url}api/toggle_function_visibility/`,
        { functionId: id },
        {
          headers: { Authorization: token },
        }
      );

      if (response.data.success) {
        // Update the local state
        setFunctions(
          functions.map((func) =>
            func.id === id
              ? { ...func, isPublic: response.data.isPublic }
              : func
          )
        );
      } else {
        console.error(
          "Error toggling function visibility:",
          response.data.error
        );
      }
    } catch (error) {
      console.error("Error toggling function visibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFunction = async (id) => {
    try {
      setLoading(true);
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      const response = await axios.post(
        `${url}api/delete_user_function/`,
        { functionId: id },
        {
          headers: { Authorization: token },
        }
      );
      if (response.data.success) {
        setFunctions(functions.filter((func) => func.id !== id));
        handleCloseModal();
        toast.success("Function deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting function:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen">Loading...</div>;
  }

  return (
    <div className="bg-[#111827] text-white p-5 sm:p-6 rounded-lg min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold">Functions</h2>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="all" className="text-sm sm:text-base">
              All
            </TabsTrigger>
            <TabsTrigger value="personal" className="text-sm sm:text-base">
              Personal
            </TabsTrigger>
            <TabsTrigger value="public" className="text-sm sm:text-base">
              Public
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card
          className="bg-blue-600 border-dashed border-2 border-blue-400 text-white cursor-pointer hover:bg-blue-700 transition-colors"
          onClick={handleCreateFunction}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
            <span className="text-center text-sm sm:text-base">
              Create New Function
            </span>
          </CardContent>
        </Card>
        {filteredFunctions.map((func) => (
          <Card
            key={func.id}
            className="bg-gray-800 cursor-pointer text-white hover:bg-gray-700 transition-colors"
          >
            <CardContent className="flex flex-col items-center justify-between h-full p-4 sm:p-6">
              <span className="text-center text-sm sm:text-base mb-2">
                {func.name}
              </span>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`public-${func.id}`}
                  checked={func.isPublic}
                  onCheckedChange={() => handleTogglePublic(func.id)}
                />
                <Label htmlFor={`public-${func.id}`} className="text-sm">
                  {func.isPublic ? "Public" : "Private"}
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFunctionClick(func)}
                className="mt-2 text-black"
              >
                Open
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
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="function-name">Name</Label>
                <Input
                  disabled={loading}
                  id="function-name"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  placeholder="Function Name"
                  className="bg-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="function-description">Description</Label>
                <Textarea
                  disabled={loading}
                  id="function-description"
                  value={functionDescription}
                  onChange={(e) => setFunctionDescription(e.target.value)}
                  placeholder="Function Description"
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="function-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="function-public">Make function public</Label>
              </div>
              <div>
                <Label htmlFor="function-code">Code</Label>
                <div className="h-[200px]">
                  <CodeMirror
                    value={editorValue}
                    theme={dracula}
                    extensions={[python()]}
                    onChange={(value) => setEditorValue(value)}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 flex gap-3 justify-between w-full">
            <div>
              <Button
                variant="destructive"
                disabled={loading}
                onClick={() => {
                  if (selectedFunction) {
                    handleDeleteFunction(selectedFunction.id);
                  }
                }}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                disabled={loading}
                variant="outline"
                className="text-black"
                onClick={handleCloseModal}
              >
                Close
              </Button>
              <Button disabled={loading} onClick={handleSaveChanges}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
