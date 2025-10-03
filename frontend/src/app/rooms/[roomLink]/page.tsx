"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import RoomPlayer from "@/components/RoomPlayer";
import ChatBox from "@/components/ChatBox";
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

  const handleVideoUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    try {
      // Save to database via API
      const response = await fetch("http://localhost:5000/api/rooms/update-video", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomLink,
          videoUrl: videoUrl.trim(),
          userId: currentUser.userId,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        alert(data.error || "Failed to update video URL");
        return;
      }

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit("room-update", {
          roomLink,
          updateType: "videoUrl",
          videoUrl: videoUrl.trim(),
        });
      }

      console.log("Video URL updated successfully:", data);
    } catch (error) {
      console.error("Error updating video URL:", error);
      alert("Failed to update video URL. Please try again.");
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
          <h1 className="text-2xl font-bold mb-4">
            Watch Party Room {socket?.connected ? "🟢" : "🔴"}
          </h1>
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
                suppressHydrationWarning={true}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Set Video
              </button>
            </form>
          )}

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
