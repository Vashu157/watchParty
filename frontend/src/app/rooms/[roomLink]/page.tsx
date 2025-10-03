"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import RoomPlayer from "@/components/RoomPlayer";
import ChatBox from "@/components/ChatBox";
import VideoCall from "@/components/VideoCall";
import { userService } from "../../../utils/userService";
interface User {
  userId: string;
  userName: string;
}
interface RoomData {
  host: string;
  videoUrl?: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomLink = params?.roomLink as string;

  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState("loading");
  const [hostId, setHostId] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const [videoUrl, setVideoUrl] = useState(""); // NEW state for video URL

  useEffect(() => {
    const user = userService.getUser();
    if (!user || !user.userId) {
      console.error("User info not found, redirecting.");
      router.push(`/join/${params.roomLink}`);
      return;
    }
    setCurrentUser(user);

    const fetchRoom = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/rooms/${roomLink}`
        );
        const data = await response.json();

        if (!data.success) {
          throw new Error("Room not found or has ended.");
        }

        setRoomData(data.room);
        setVideoUrl(data.room.videoUrl || ""); // initialize videoUrl
        if (user.userId === data.room.host) {
          setIsHost(true);
        }
        setHostId(data.room.host);
        setUsers(data.room.users || []);

        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);

        newSocket.on("connect", () => {
          console.log("✅ Connected to server with ID:", newSocket.id);
          newSocket.emit("join-room", {
            roomLink,
            userId: user.userId,
            userName: user.userName,
          });
        });

        // Listen for room updates
        newSocket.on("room-joined", (data: any) => {
          console.log("Room joined data:", data);
          // The userCount will be updated by user-joined/user-left events
          // but we need to ensure our current user is in the list
          setUsers(prevUsers => {
            const currentUserExists = prevUsers.some(u => u.userId === user.userId);
            if (!currentUserExists) {
              return [...prevUsers, { userId: user.userId, userName: user.userName }];
            }
            return prevUsers;
          });
        });

        // Listen for user joins
        newSocket.on("user-joined", (data: any) => {
          console.log("User joined:", data);
          setUsers(prevUsers => {
            const exists = prevUsers.some(u => u.userId === data.userId);
            if (!exists) {
              return [...prevUsers, { userId: data.userId, userName: data.userName }];
            }
            return prevUsers;
          });
        });

        // Listen for user leaves  
        newSocket.on("user-left", (data: any) => {
          console.log("User left:", data);
          setUsers(prevUsers => prevUsers.filter(u => u.userId !== data.userId));
        });

        setStatus("success");
        return newSocket;
      } catch (error) {
        console.error("Failed to setup room:", error);
        setStatus("error");
      }
    };

    let socketInstance: Socket | undefined;
    if (roomLink) {
      fetchRoom().then((sock) => {
        socketInstance = sock;
      });
    }

    return () => {
      if (socketInstance) {
        console.log("🧹 Cleaning up socket.");
        socketInstance.disconnect();
      }
    };
  }, [roomLink, router]);

  const handleVideoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    if (socket) {
      socket.emit("room-update", {
        roomLink,
        updateType: "videoUrl",
        videoUrl,
      });
    }
  };

  if (status === "loading") {
    return <div>Loading Room...</div>;
  }

  if (status === "error") {
    return (
      <div>
        Could not load the room. It may have ended or the link is invalid.
      </div>
    );
  }

  if (!currentUser || !roomData) {
    return <div>Setting up the room...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
        {/* Left side: Video player */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              Watch Party Room {socket?.connected ? "🟢" : "🔴"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              {users.length} user{users.length !== 1 ? 's' : ''} online
              {users.length === 2 && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Video call available
                </span>
              )}
            </div>
          </div>
          {isHost && (
            <div className="mb-4 p-2 bg-blue-100 rounded text-sm text-blue-700">
              You are the host of this room
            </div>
          )}

          {/* Host-only input for video URL */}
          {isHost && (
            <form
              onSubmit={handleVideoUrlSubmit}
              className="mb-4 flex gap-2 items-center"
            >
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter video URL"
                className="flex-1 border p-2 rounded"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Set Video
              </button>
            </form>
          )}

          {/* Video Call component - only show when exactly 2 users */}
          <VideoCall
            socket={socket}
            roomLink={roomLink}
            currentUserId={currentUser.userId}
            userCount={users.length}
          />

          <RoomPlayer
            roomData={{
              roomLink,
              hostId,
              videoUrl,
              userCount: users.length,
            }}
            userId={currentUser.userId}
            userName={currentUser.userName}
          />
        </div>

        {/* Right side: Chat section */}
        <div className="col-span-1">
          <ChatBox
            socket={socket}
            roomLink={roomLink}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}
