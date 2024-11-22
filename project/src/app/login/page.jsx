"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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
import { useStore } from "@/store/store";
import { FaGoogle } from "react-icons/fa";
import { Separator } from "@radix-ui/react-separator";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setIsAuthenticated(true);
          router.push("/chat");
        }
      });
      return () => unsubscribe();
    }
  }, [auth, setIsAuthenticated, router]);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        toast.success("Login successful");
        router.push("/chat");
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        toast.success("Login successful");
        router.push("/chat");
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setError(error.message || "An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

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
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:border-[#C084FC] focus:ring-[#C084FC] transition-all duration-300"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#60A5FA] to-[#C084FC] hover:from-[#3B82F6] hover:to-[#A855F7] text-white transition-all duration-300 transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>
          <div className="relative">
            <Separator className="my-4" />
            <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 px-2 text-gray-400 text-sm">
              Or
            </span>
          </div>
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
          >
            <FaGoogle className="text-red-500" />
            <span>Login with Google</span>
          </Button>
          {error && (
            <p className="mt-4 text-sm text-red-500 text-center bg-red-100/10 p-2 rounded">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <a
            href="/reset-password"
            className="text-sm text-[#60A5FA] hover:text-[#3B82F6] transition-colors duration-300"
          >
            Forgot password?
          </a>
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?
            <a
              href="/register"
              className="text-[#C084FC] hover:text-[#A855F7] transition-colors duration-300 ml-1"
            >
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
