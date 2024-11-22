"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { getAuth, signOut } from "firebase/auth";
import axios from "axios";
import { toast } from "sonner";
import { useStore } from "@/store/store";

export default function ProfileSection() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const {
    setIsAuthenticated,
    isAuthenticated,
    initializeApp,
    setInitializeApp,
  } = useStore((state) => state);

  useEffect(() => {
    if (!initializeApp) {
      setInitializeApp();
    }
  }, [initializeApp, setInitializeApp]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const url = process.env.NEXT_PUBLIC_API_URL || " http://127.0.0.1:8000/";
      const response = await axios.get(`${url}api/get_user_data/`, {
        headers: { Authorization: token },
      });
      console.log("response", response);
      if (response.data.success) {
        setFirstName(response.data.data.firstName || "");
        setLastName(response.data.data.lastName || "");
        setEmail(response.data.data.email || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      console.log("token", token);
      console.log("token", token);
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
      const response = await axios.post(
        `${url}api/save_user_data/`,
        { firstName, lastName },
        { headers: { Authorization: token } }
      );
      console.log("response", response);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
      toast.error(error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="w-full bg-[#111827] min-h-[100vh] ">
      <Card className="w-full max-w-md mx-auto bg-[#1E1C26] mt-10 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              <AvatarImage src="/placeholder.svg" alt="Profile picture" />
              <AvatarFallback>
                {firstName[0]}
                {lastName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            className="text-black"
            onClick={handleLogout}
          >
            Logout
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
