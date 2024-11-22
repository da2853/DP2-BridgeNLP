import React from "react";

const FormattedMessage = ({ text }) => {
  const formatText = (text) => {
    // Split code blocks
    const parts = text.split(/```([^`]*?)```/);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a code block
        const [language, ...codeLines] = part.trim().split("\n");
        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden ">
            {language && (
              <div className="px-4 py-1 bg-gray-700 text-gray-300 text-sm">
                {language}
              </div>
            )}
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono">{codeLines.join("\n")}</code>
            </pre>
          </div>
        );
      }

      // Process regular text
      return part.split("\n").map((line, lineIndex) => {
        // Handle headers
        if (line.startsWith("#")) {
          const level = line.match(/^#+/)[0].length;
          const text = line.replace(/^#+\s*/, "");
          const sizes = {
            1: "text-2xl",
            2: "text-xl",
            3: "text-lg",
            4: "text-base",
            5: "text-sm",
            6: "text-xs",
          };
          return (
            <div
              key={`${index}-${lineIndex}`}
              className={`${sizes[level]} font-bold my-2`}
            >
              {text}
            </div>
          );
        }

        // Handle bold text
        line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Handle italic text
        line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");

        // Handle bullet points
        if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
          return (
            <div key={`${index}-${lineIndex}`} className="ml-4 my-1">
              • {line.trim().substring(1).trim()}
            </div>
          );
        }

        // Handle numbered lists
        if (line.match(/^\d+\./)) {
          const number = line.match(/^\d+/)[0];
          const text = line.replace(/^\d+\.\s*/, "");
          return (
            <div key={`${index}-${lineIndex}`} className="ml-4 my-1">
              {number}. {text}
            </div>
          );
        }

        // Regular paragraph
        return line.trim() ? (
          <p
            key={`${index}-${lineIndex}`}
            className="my-2"
            dangerouslySetInnerHTML={{ __html: line }}
          />
        ) : (
          <div key={`${index}-${lineIndex}`} className="my-2" />
        );
      });
    });
  };

  return <div className="message-content">{formatText(text)}</div>;
};

export default FormattedMessage;
