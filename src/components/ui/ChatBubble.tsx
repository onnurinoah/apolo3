"use client";

interface ChatBubbleProps {
  children: React.ReactNode;
  variant?: "sent" | "received";
  className?: string;
}

export default function ChatBubble({
  children,
  variant = "sent",
  className = "",
}: ChatBubbleProps) {
  const isSent = variant === "sent";

  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"} w-full`}>
      <div
        className={`
          chat-bubble
          ${isSent ? "chat-bubble-sent chat-bubble-tail-right" : "chat-bubble-received chat-bubble-tail-left"}
          ${className}
        `}
      >
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {children}
        </div>
      </div>
    </div>
  );
}
