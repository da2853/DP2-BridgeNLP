"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordResetRequest = async (email) => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/api/password-reset-request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Request URL:", `${API_URL}/api/password-reset-request/`);

      const text = await response.text();
      console.log("Response body:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return JSON.parse(text);
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
      console.error("Error in password reset request:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");
      const data = await passwordResetRequest(email);
      setIsSuccess(true);
      setMessage(data.message);
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
      setIsSuccess(false);
      setMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E1C26] p-4 bg-gradient-to-br from-[#1E1C26] to-[#2D2B3A]">
      <div className="text-center mb-4">
        <Link href="/" className="text-3xl text-white font-bold">
          BridgeNLP
        </Link>
      </div>
      <Card className="w-full max-w-md bg-[#15141D] text-white shadow-2xl border border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-[#60A5FA] to-[#C084FC] text-transparent bg-clip-text">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-200"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:border-[#C084FC] focus:ring-[#C084FC] transition-all duration-300"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#60A5FA] to-[#C084FC] hover:from-[#3B82F6] hover:to-[#A855F7] text-white transition-all duration-300 transform hover:scale-105"
              disabled={isLoading || isSuccess}
            >
              {isLoading ? "Processing..." : "Reset Password"}
              {isSuccess && "Password reset email sent"}
            </Button>
          </form>
          {error && (
            <p className="mt-4 text-sm text-red-500 text-center bg-red-100/10 p-2 rounded">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
