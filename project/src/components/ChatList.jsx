import { FaRobot } from "react-icons/fa";
import FormattedMessage from "./FormattedMessage";

export function ChatList({ messages, isLoading }) {
  if (!messages.length && !isLoading) return null;

  return (
    <div className="px-4 scrollbar-hide">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`pb-4 ${
            message.sender === "user" ? "text-right" : "text-left"
          }`}
        >
          <div
            className={`inline-block p-2 rounded-lg scrollbar-hide max-w-[80%] ${
              message.sender === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-white"
            }`}
          >
            {message.sender === "user" ? (
              message.text
            ) : (
              <FormattedMessage text={message.text} />
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="max-w-[80%] p-3 rounded-lg bg-gray-700 text-white">
            <FaRobot className="inline-block mr-2 mb-1" />
            Thinking...
          </div>
        </div>
      )}
    </div>
  );
}
