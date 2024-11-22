"use client";
import { useRouter } from "next/navigation";
import Button2 from "./Button2";

export default function Hero() {
  const router = useRouter();
  return (
    <div className=" flex items-center justify-center top-0 bottom-0 text-white overflow-hidden">
      <div className=" z-10 text-center px-6 sm:px-6 lg:px-8 w-full md:max-w-[80%] mt-40">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          <span className="block">Harness the Power of AI with BridgeNLP</span>
          <span className="block mt-2 text-5xl">
            <span className="text-blue-400">Automate</span>{" "}
            <span className="text-purple-400">Execute</span>{" "}
            <span className="text-pink-400">Optimize</span>
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl sm:text-2xl mb-10">
          Leverage our LLM-powered platform to seamlessly execute code, automate
          processes, and unlock powerful insights to accelerate your development
          workflow.
        </p>
        <div className="">
          <Button2
            onClick={() => {
              router.push("/register");
            }}
            className={"font-extrabold text-[1rem] px-12"}
          >
            Try it Now
          </Button2>
        </div>
      </div>
    </div>
  );
}
