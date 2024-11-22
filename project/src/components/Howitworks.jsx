'use client';

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Brain, Cog, Play, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Input Command",
    description:
      "Speak or type your natural language command to initiate the process. Our system accepts a wide range of inputs, making it easy for you to communicate your needs.",
  },
  {
    icon: Brain,
    title: "NLP Processing",
    description:
      "Your input is analyzed and understood using advanced Natural Language Processing algorithms. This step ensures accurate interpretation of your commands.",
  },
  {
    icon: Cog,
    title: "Function Matching",
    description:
      "The appropriate function is identified based on your input. Our extensive library of functions allows for a wide range of tasks to be performed efficiently.",
  },
  {
    icon: Play,
    title: "Execution",
    description:
      "The task is performed across various applications and systems. Our platform seamlessly integrates with multiple tools to carry out your requested actions.",
  },
  {
    icon: CheckCircle,
    title: "Result",
    description:
      "The outcome is returned to you in a clear and concise manner. You'll receive feedback on the completed task, along with any relevant information or next steps.",
  },
];

export default function HowItWorks() {
  const scrollRef = useRef (null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  useEffect(() => {
    const handleMouseLeave = () => setIsDragging(false);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section className=" text-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">
          How It Works
        </h2>
        <div
          ref={scrollRef}
          className="overflow-x-scroll scrollbar-hide"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div
            className="flex space-x-7 scrollbar-hide"
            style={{ width: "max-content" }}
          >
            {steps.map((step, index) => (
              <Card
                key={index}
                className="w-80 flex-shrink-0 bg-[#15141d] border-none"
              >
                <CardContent className="flex flex-col items-center justify-between p-6 h-full">
                  <step.icon className="w-16 h-16 text-blue-500 mb-4" />
                  <h3 className="text-2xl font-semibold text-white text-center mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-center text-sm flex-grow">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
