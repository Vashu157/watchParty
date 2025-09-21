"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function JoinRoom() {
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const roomLink = params.roomLink as string;

  useEffect(() => {
    const checkRoom = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/rooms/${roomLink}`);
        const data = await response.json();

        if (data.success) {
          setRoomInfo(data.room);
        } else {
          setError("Room not found or inactive");
        }
      } catch (error) {
        setError("Failed to check room status");
      } finally {
        setLoading(false);
      }
    };

    if (roomLink) {
      checkRoom();
    }
  }, [roomLink]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Checking room...</p>
      </div>
    );
  }

  if (error && !roomInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Room Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">🎉 Room Created!</h1>

        {roomInfo && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md text-left">
            <p className="text-sm text-gray-600">
              <strong>Host:</strong> {roomInfo.hostName || "Host"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Users:</strong> {roomInfo.users?.length || 0} currently in room
            </p>
            {roomInfo.videoUrl && (
              <p className="text-sm text-green-600">🎥 Video is ready</p>
            )}
          </div>
        )}

        {/* Show room link */}
        <div className="p-3 bg-gray-100 rounded border mb-6">
          <code>{`http://localhost:3000/rooms/${roomLink}`}</code>
        </div>

        <button
          onClick={() => router.push(`/rooms/${roomLink}`)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          Enter Room
        </button>
      </div>
    </div>
  );
}
