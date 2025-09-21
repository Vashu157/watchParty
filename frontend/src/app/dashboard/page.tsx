// Update: src/app/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userService } from "../../utils/userService";

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [userName, setUserName] = useState("");
  const [roomLink, setRoomLink] = useState(""); // Add room link state
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false); // Add joining state

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      alert("Please enter your name first");
      return;
    }

    setIsLoading(true);
    try {
      // Generate userId and use it as hostId when creating room
      const userId = userService.generateUserId();
      
      const response = await fetch("http://localhost:5000/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: userId,
          hostName: userName.trim(),
          videoUrl: null
        }),
      });

      const data = await response.json();
      console.log("Room created:", data);

      if (data.success) {
        // Save user data to localStorage (user is host)
        userService.saveUser(userId, userName.trim(), true);
        
       
        router.push(`/join/${data.room.roomLink}`);  // Redirect to room-========================================
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Handle joining room with room link
  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      alert("Please enter your name first");
      return;
    }

    if (!roomLink.trim()) {
      alert("Please enter a room link or room ID");
      return;
    }

    setIsJoining(true);
    try {
      let roomId = roomLink.trim();
      if (roomId.includes('/')) {
        const parts = roomId.split('/');
        roomId = parts[parts.length - 1]; // Get last part of URL
      }
      const userId = userService.generateUserId();

      const checkResponse = await fetch(`http://localhost:5000/api/rooms/${roomId}`);
      const roomData = await checkResponse.json();

      if (!roomData.success) {
        alert("Room not found or inactive. Please check the room link.");
        return;
      }
      const joinResponse = await fetch("http://localhost:5000/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomLink: roomId,
          userId: userId,
          userName: userName.trim(),
        }),
      });

      const joinData = await joinResponse.json();
      console.log("Join room response:", joinData);

      if (joinData.success) {
        userService.saveUser(userId, userName.trim(), false);
        router.push(`/join/${roomId}`);
      } else {
        alert(joinData.error || "Failed to join room. Please try again.");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please check the room link and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 flex flex-col items-center">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome to your dashboard. Here you can manage your rooms, chats, and
        video sessions.
      </p>

      {/* User Name Input */}
      <div className="mb-6 w-full max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Name *
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Room Actions */}
      <div className="w-full max-w-md space-y-6">
        {/* Create Room Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Create a New Room</h3>
          <button
            className={`w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition ${
              isLoading || !userName.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleCreateRoom}
            disabled={isLoading || !userName.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        {/* Join Room Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Join an Existing Room</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={roomLink}
              onChange={(e) => setRoomLink(e.target.value)}
              placeholder="Paste room link or enter room ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              className={`w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition ${
                isJoining || !userName.trim() || !roomLink.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleJoinRoom}
              disabled={isJoining || !userName.trim() || !roomLink.trim()}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You can paste the full room URL or just the room ID
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;