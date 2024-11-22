"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FaComment, FaCode, FaStore, FaHistory, FaUser } from "react-icons/fa";
import ChatSection from "@/components/ChatSection";
import FunctionsSection from "@/components/FunctionsSection";
import StoreSection from "@/components/StoreSection";
import HistorySection from "@/components/HistorySection";
import ProfileSection from "@/components/ProfileSection";
import { LogOut, Menu } from "lucide-react";
import { useStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";

const sections = [
  { id: "chat", icon: FaComment, label: "Chat" },
  { id: "functions", icon: FaCode, label: "Functions" },
  { id: "store", icon: FaStore, label: "Store" },
  { id: "history", icon: FaHistory, label: "History" },
  { id: "profile", icon: FaUser, label: "Profile" },
];

export default function ChatLayout() {
  const [activeSection, setActiveSection] = useState("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { setIsAuthenticated, auth, isAuthenticated } = useStore(
    (state) => state
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, []);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "chat":
        return <ChatSection />;
      case "functions":
        return <FunctionsSection />;
      case "store":
        return <StoreSection />;
      case "history":
        return <HistorySection />;
      case "profile":
        return <ProfileSection />;
      default:
        return null;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col space-y-2 mt-3">
      {sections.map((section) => (
        <Button
          key={section.id}
          variant={activeSection === section.id ? "secondary" : "ghost"}
          className="justify-start"
          onClick={() => {
            setActiveSection(section.id);
            setIsSidebarOpen(false);
          }}
        >
          <section.icon className="mr-2 h-4 w-4" />
          {section.label}
        </Button>
      ))}
    </div>
  );
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const LogOutButton = () => (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full sm:w-auto mt-4"
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Logging out...
        </span>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </>
      )}
    </Button>
  );

  return (
    <div className="bg-gradient-to-br from-[#1E1C26] to-[#2D2B3A] text-white">
      <div className="mx-auto px-4">
        <div className="flex">
          {/* Sidebar for larger screens */}
          <aside className="hidden  w-64 md:flex  flex-col justify-between my-2 bg-gray-800 p-4 rounded-l-lg">
            <SidebarContent />

            <LogOutButton />
          </aside>

          {/* Main content area */}
          <main className="flex-1 bg-gray-900 px-4 rounded-r-lg md:rounded-l-none rounded-l-lg">
            {/* Mobile sidebar toggle */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="md:hidden text-white absolute top-2 left-2"
                >
                  <Menu />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] bg-[#17161D] text-white outline-none flex-col justify-between my-2"
              >
                <SidebarContent />
                <LogOutButton />
              </SheetContent>
            </Sheet>

            {/* Active section content */}
            <div className="bg-gray-800 rounded-lg min-h-[600px]">
              {renderActiveSection()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
