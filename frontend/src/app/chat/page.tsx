"use client";

import { useEffect, useRef, useState } from "react";
import { Socket} from "socket.io-client";

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
  timestamp: Date;
  type?: 'text' | 'system';
}

export default function ChatBox({ socket, roomLink, currentUser }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleChatHistory = (data: { messages: Message[] }) => {
      console.log("📜 Received chat history:", data.messages);
      setMessages(data.messages);
    };

    const handleNewMessage = (message: Message) => {
      console.log("💬 Received new message:", message);
      
      setMessages((prev) => [...prev, message]);
    };

    const handleConnect = () => {
      console.log("✅ Socket connected");
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat-history", handleChatHistory);
    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
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
      message: newMessage.trim(), // ✅ Use 'message' field, not 'text'
    };

    console.log("📤 Sending message:", messageData);
    
    // ✅ Send message to server
    socket.emit("send-message", messageData);
    
    // ✅ Clear input
    setNewMessage("");
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-[400px] w-[300px] border rounded bg-white">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800">Chat</h3>
        <p className="text-xs text-gray-500">{messages.length} messages</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">No messages yet...</p>
            <p className="text-xs">Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="mb-2">
              {/* System messages */}
              {msg.type === 'system' ? (
                <div className="text-center text-xs text-gray-500 py-1">
                  {msg.message}
                </div>
              ) : (
                <div
                  className={`flex ${
                    msg.userId === currentUser.userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.userId === currentUser.userId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {/* Show username for other users */}
                    {msg.userId !== currentUser.userId && (
                      <p className="text-xs font-medium mb-1 text-gray-600">
                        {msg.userName}
                      </p>
                    )}
                    
                    {/* Message content */}
                    <p className="break-words text-sm">{msg.message}</p>
                    
                    {/* Timestamp */}
                    <p className={`text-xs mt-1 ${
                      msg.userId === currentUser.userId 
                        ? 'text-blue-100' 
                        : 'text-gray-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                      {msg.userId === currentUser.userId && " (You)"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
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
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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