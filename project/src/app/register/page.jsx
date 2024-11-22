"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
} from "firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FaGoogle } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/store/store";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    setIsAuthenticated,
    isAuthenticated,
    initializeApp,
    setInitializeApp,
    auth,
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

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/chat");
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe(); // Check if unsubscribe is a function before calling it
      }
    };
  }, [auth, router]);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors
            ? data.errors.join(", ")
            : "An error occurred during registration."
        );
      }

      setIsAuthenticated(true);
      toast.success("Registration successful!");
      router.push("/chat");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors
            ? data.errors.join(", ")
            : "An error occurred during Google sign-up."
        );
      }

      setIsAuthenticated(true);
      toast.success("Registration successful!");
      router.push("/chat");
    } catch (error) {
      setError(error.message);
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
            Join Us
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Create an account to get started
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
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-200"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:border-[#C084FC] focus:ring-[#C084FC] transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-200"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:border-[#C084FC] focus:ring-[#C084FC] transition-all duration-300"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#60A5FA] to-[#C084FC] hover:from-[#3B82F6] hover:to-[#A855F7] text-white transition-all duration-300 transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>
          <div className="relative">
            <Separator className="my-4" />
            <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 px-2 text-gray-400 text-sm">
              Or
            </span>
          </div>
          <Button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
          >
            <FaGoogle className="text-red-500" />
            <span>Sign up with Google</span>
          </Button>
          {error && (
            <p className="mt-4 text-sm text-red-500 text-center bg-red-100/10 p-2 rounded">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-400">
            Already have an account?
            <a
              href="/login"
              className="text-[#C084FC] hover:text-[#A855F7] transition-colors duration-300 ml-1"
            >
              Log in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
