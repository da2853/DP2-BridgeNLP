"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon } from "lucide-react";
import { ChatList } from "./ChatList";
import { ChatScrollAnchor } from "./ChatScrollAnchor";
import axios from "axios";
import { getAuth } from "firebase/auth";

export default function ChatSection() {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (message) => {
    const auth = getAuth();
    const token = await auth.currentUser.getIdToken();
    const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
    try {
      const response = await axios.post(
        `${url}api/get_response/`,
        {
          message: message,
        },
        {
          headers: { Authorization: token },
        }
      );
      return response.data.response;
    } catch (error) {
      console.error("Error sending message:", error);
      return "Sorry, I couldn't process your message. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const userMessage = { sender: "user", text: newMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      const response = await sendMessage(newMessage);
      const assistantMessage = { sender: "assistant", text: response };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 no_scrollbar">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto no_scrollbar">
        <div className="container mx-auto max-w-4xl h-full">
          <div className="pt-4 md:pt-10">
            <ChatList messages={messages} isLoading={isLoading} />
            <ChatScrollAnchor trackVisibility={true} />
          </div>
        </div>
      </div>

      {/* Input Container */}
      <div className="border-t border-gray-800 bg-gray-900 py-4 no_scrollbar">
        <div className="container mx-auto max-w-4xl px-4 no_scrollbar">
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              onKeyDown={onKeyDown}
              placeholder="Send a message..."
              className="w-full p-4 pr-16 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 resize-none bg-gray-700 text-white transition-all duration-200"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-[0.80rem] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors duration-200"
              disabled={isLoading}
            >
              <ArrowUpIcon className="w-5 h-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
