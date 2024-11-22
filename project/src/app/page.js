'use client'

import BackToTopButton from "@/components/Backtotop";
import DemoComponent from "@/components/Demo";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Howitworks from "@/components/Howitworks";
import UserReviews from "@/components/Reviews";
import Separater from "@/components/Separater";
import { useStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function App() {
  const router = useRouter();
  const {
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
  return (
    <div className="relative min-h-screen">
      <div className="relative min-h-screen">
        <div
          style={{
            backgroundImage: "url('/herobackground.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: -1,
          }}
          className="after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-gradient-to-b after:from-transparent after:to-[#1e1c26] after:z-0"
        />
        <div className="relative z-10">
          <Header />
          <Hero />
          <Separater />
        </div>
      </div>
      <div className="bg-[#1e1c26] px-5 md:px-3">
        <Features />
        <Howitworks />
        <UserReviews />
        <DemoComponent />
        <Footer />
        <BackToTopButton />
      </div>
    </div>
  );
}
