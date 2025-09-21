"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface ChatBoxProps {
  socket: Socket | null;
  roomLink: string;
  currentUser: { userId: string; userName: string };
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date | string;
  type?: "text" | "system";
}

export default function ChatBox({
  socket,
  roomLink,
  currentUser,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleChatHistory = (data: { messages: Message[] }) => {
      setMessages(data.messages);
    };

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("chat-history", handleChatHistory);
    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("chat-history", handleChatHistory);
      socket.off("new-message", handleNewMessage);
    };
  }, [socket]);

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      roomLink,
      userId: currentUser.userId,
      userName: currentUser.userName,
      message: newMessage.trim(),
    };

    socket.emit("send-message", messageData);
    setNewMessage("");
  };

  // Format timestamp
  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[400px] w-[320px] border rounded bg-white shadow">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Chat</h3>
        <p className="text-xs text-gray-500">{messages.length} messages</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-6 text-sm">
            No messages yet... <br />
            <span className="text-xs">Start the conversation 👋</span>
          </div>
        ) : (
          messages.map((msg) =>
            msg.type === "system" ? (
              <div
                key={msg.id}
                className="text-center text-xs text-gray-500 py-1 italic"
              >
                {msg.message}
              </div>
            ) : (
              <div
                key={msg.id}
                className={`flex ${
                  msg.userId === currentUser.userId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg ${
                    msg.userId === currentUser.userId
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {/* Username for others */}
                  {msg.userId !== currentUser.userId && (
                    <p className="text-xs font-medium mb-1 text-gray-600">
                      {msg.userName}
                    </p>
                  )}

                  <p className="break-words text-sm">{msg.message}</p>

                  <p
                    className={`text-xs mt-1 ${
                      msg.userId === currentUser.userId
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                    {msg.userId === currentUser.userId && " (You)"}
                  </p>
                </div>
              </div>
            )
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex p-2 border-t gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
