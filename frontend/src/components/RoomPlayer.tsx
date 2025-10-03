"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import io, { Socket } from "socket.io-client";
import { extractYouTubeVideoId } from "@/utils/youtube";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
interface RoomData {
  roomLink: string;
  hostId: string;
  videoUrl: string | null;
  userCount: number;
}
export default function RoomPlayer({
  roomData,
  userId = "anonymous_user",
  userName = "Anonymous",
}: {
  roomData: RoomData;
  userId?: string;
  userName?: string;
}) {
  const playerRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastStateChangeRef = useRef<number>(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const handleStateChange = useCallback(
    (event: any) => {
      if (!socketRef.current || !playerRef.current || !window.YT) return;
      
      // Debounce state changes to prevent rapid-fire events
      const now = Date.now();
      if (now - lastStateChangeRef.current < 200) return; // 200ms debounce
      lastStateChangeRef.current = now;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        
        // Only emit if we have valid time data
        if (typeof currentTime !== 'number' || isNaN(currentTime)) return;

        switch (event.data) {
          case window.YT.PlayerState.PLAYING:
            socketRef.current.emit("play", { roomLink: roomData.roomLink, time: currentTime, userId });
            break;
          case window.YT.PlayerState.PAUSED:
            socketRef.current.emit("pause", { roomLink: roomData.roomLink, time: currentTime, userId });
            break;
        }
      } catch (error) {
        console.warn('State change error:', error);
      }
    },
    [roomData.roomLink, userId]
  );

  const onPlayerReady = useCallback((event: any) => {
    playerRef.current = event.target;
    console.log("YouTube player ready");
  }, []);
  const createPlayer = useCallback(
    (videoId: string) => {
      if (!window.YT || !window.YT.Player || !videoId) return;

      if (playerRef.current?.destroy) playerRef.current.destroy();

      new window.YT.Player("player", {
        height: "360",
        width: "640",
        videoId,
        playerVars: {
          controls: 1,
          modestbranding: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: handleStateChange,
        },
      });
    },
    [handleStateChange, onPlayerReady]
  );

  useEffect(() => {
    if (!roomData.videoUrl) return;
    const videoId = extractYouTubeVideoId(roomData.videoUrl);
    if (videoId) setCurrentVideoId(videoId);
  }, [roomData.videoUrl]);

  useEffect(() => {
    if (!roomData) return;

    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("join-room", {
      roomLink: roomData.roomLink,
      userId,
      userName,
    });

    socketRef.current.on("play", ({ time }: any) => {
      if (!playerRef.current || !window.YT) return;
      
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentTime - time);
        
        // Only seek if drift is significant (0.5s threshold)
        if (timeDiff > 0.5) {
          playerRef.current.seekTo(time, true);
        }
        
        // Only play if not already playing
        const playerState = playerRef.current.getPlayerState();
        if (playerState !== window.YT.PlayerState.PLAYING) {
          playerRef.current.playVideo();
        }
      } catch (error) {
        console.warn('Play event error:', error);
      }
    });

    socketRef.current.on("pause", ({ time }: any) => {
      if (!playerRef.current || !window.YT) return;
      
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentTime - time);
        
        // Only seek if drift is significant (0.5s threshold)
        if (timeDiff > 0.5) {
          playerRef.current.seekTo(time, true);
        }
        
        // Only pause if not already paused
        const playerState = playerRef.current.getPlayerState();
        if (playerState === window.YT.PlayerState.PLAYING) {
          playerRef.current.pauseVideo();
        }
      } catch (error) {
        console.warn('Pause event error:', error);
      }
    });

    socketRef.current.on("seek", ({ time }: any) => {
      if (!playerRef.current) return;
      
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentTime - time);
        
        // Only seek if drift is significant (0.5s threshold)
        if (timeDiff > 0.5) {
          playerRef.current.seekTo(time, true);
        }
      } catch (error) {
        console.warn('Seek event error:', error);
      }
    });

    socketRef.current.on("speed-change", ({ rate }: any) => {
      if (!playerRef.current) return;
      playerRef.current.setPlaybackRate(rate);
    });

    socketRef.current.on("room-updated", ({ videoUrl }: any) => {
      if (!videoUrl) return;
      const videoId = extractYouTubeVideoId(videoUrl);
      if (videoId && videoId !== currentVideoId) setCurrentVideoId(videoId);
    });

    socketRef.current.on("video-sync", ({ currentTime, isPlaying }: any) => {
      if (!playerRef.current || !window.YT) return;
      
      const playerTime = playerRef.current.getCurrentTime();
      const timeDifference = Math.abs(playerTime - currentTime);
      const playerState = playerRef.current.getPlayerState();
      const playerIsPlaying = playerState === window.YT.PlayerState.PLAYING;
      
      // Only seek if drift is larger than 0.5 seconds to prevent stuttering
      if (timeDifference > 0.5) {
        playerRef.current.seekTo(currentTime, true); // always allowSeekAhead = true
      }
      
      // Sync play/pause state only if different
      if (isPlaying && !playerIsPlaying) {
        playerRef.current.playVideo();
      } else if (!isPlaying && playerIsPlaying) {
        playerRef.current.pauseVideo();
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomData, userId, userName, currentVideoId]);

  // Periodic sync every 3 seconds (host broadcasts current state)
  useEffect(() => {
    const isHost = userId === roomData.hostId;
    if (!isHost) return;

    const syncInterval = setInterval(() => {
      if (playerRef.current && socketRef.current && window.YT) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const playerState = playerRef.current.getPlayerState();
          const isPlaying = playerState === window.YT.PlayerState.PLAYING;
          
          // Only emit if we have valid data
          if (typeof currentTime === 'number' && !isNaN(currentTime)) {
            socketRef.current.emit("video-sync", {
              roomLink: roomData.roomLink,
              currentTime,
              isPlaying,
              userId
            });
          }
        } catch (error) {
          console.warn('Sync error:', error);
        }
      }
    }, 3000); // Sync every 3 seconds (less aggressive than 5s for better sync)

    return () => clearInterval(syncInterval);
  }, [roomData.roomLink, roomData.hostId, userId]);

  useEffect(() => {
    if (!currentVideoId) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => createPlayer(currentVideoId);
    if (window.YT?.Player) createPlayer(currentVideoId);

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
  }, [currentVideoId, createPlayer]);

  const handleSpeedChange = (rate: number) => {
    if ( !playerRef.current || !socketRef.current) return;
    playerRef.current.setPlaybackRate(rate);
    socketRef.current.emit("speed-change", { roomLink: roomData.roomLink, rate });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Room: {roomData.roomLink}</h3>
        <p className="text-sm text-gray-600">{roomData.userCount} users in room</p>
      </div>

      <div className="relative">
        <div id="player" className="w-full rounded shadow-md"></div>
      </div>   

      { (
        <div className="mt-2 flex items-center gap-2">
          <span>Playback speed:</span>
          {[0.25, 0.5, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedChange(rate)}
              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {rate}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
