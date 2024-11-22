"use client";

import React, { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function EnhancedDemoComponent() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const simulateCommand = async () => {
    setIsTyping(true);
    setInput("Get trending categories on TikTok");
    setOutput("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate typing
    setIsTyping(false);

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing

    setOutput(`> Executing command...
> Retrieving data from TikTok API...
> Processing results...

Result:
{
  "status": "success",
  "data": {
    "trending_categories": [
      "Dance",
      "Comedy",
      "Food",
      "Fashion",
      "Travel"
    ],
    "timestamp": "2024-09-13T12:34:56Z"
  }
}`);
    setIsLoading(false);
  };

  return (
    <div id="demo" className="flex items-center justify-center p-4 py-16">
      <div className="w-full max-w-3xl">
        <motion.h1
          className="text-4xl font-bold text-center text-white mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          See It In Action
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-[#15141D] border-none shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="bg-[#15141D] border-b border-gray-700">
              <CardTitle className="text-2xl text-white">
                Universal Platform Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <TextareaAutosize
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                className="w-full bg-[#2A2A3C] text-white border-gray-600 rounded-md resize-none overflow-hidden mb-4 p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                minRows={1}
                maxRows={5}
                placeholder="Enter your command here..."
              />
              <div className="bg-[#2A2A3C] border border-gray-700 rounded-md p-4 mb-4 min-h-[150px] relative overflow-hidden">
                <pre className="text-gray-200 font-mono text-sm">
                  {isTyping ? "Typing..." : output}
                </pre>
                {isLoading && (
                  <div className="absolute inset-0 bg-[#2A2A3C] bg-opacity-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              <Button
                onClick={simulateCommand}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full transition duration-200 ease-in-out transform hover:scale-105"
                disabled={isTyping || isLoading}
              >
                {isLoading ? "Processing..." : "Run Demo"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
