import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Quote } from "lucide-react";

const reviews = [
  {
    name: "John Doe",
    avatar: "/Avatar-1.png",
    quote:
      "BridgeNLP has revolutionized the way I interact with my applications. It's seamless and intuitive!",
  },
  {
    name: "Jane Smith",
    avatar: "/Avatar-3.png",
    quote:
      "An amazing platform that bridges the gap between natural language and technology.",
  },
  {
    name: "Mike Johnson",
    avatar: "/Avatar-2.png",
    quote:
      "The future of application control is here. BridgeNLP is a game-changer!",
  },
];

export default function UserReviews() {
  return (
    <section className="bg-gradient-to-b py-16 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          What Our Users Say
        </h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-xl mx-auto"
        >
          <CarouselContent>
            {reviews.map((review, index) => (
              <CarouselItem key={index}>
                <Card className="bg-[#15141D] text-white border-none shadow-lg">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 border-4 border-blue-500 mb-6">
                      <AvatarImage src={review.avatar} alt={review.name} />
                      <AvatarFallback>
                        {review.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Quote className="text-blue-400 w-8 h-8 mb-4" />
                    <p className="text-lg mb-6 italic">{review.quote}</p>
                    <h3 className="text-xl font-semibold">{review.name}</h3>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 md:-left-12 text-white bg-transparent outline-none border-none hover:bg-transparent hover:text-white" />
          <CarouselNext className="right-0 md:-right-12 text-white bg-transparent outline-none border-none hover:bg-transparent hover:text-white" />
        </Carousel>
      </div>
    </section>
  );
}
