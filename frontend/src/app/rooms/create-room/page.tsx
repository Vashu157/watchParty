// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { userService } from "../../../utils/userService";

// export default function CreateRoom() {
//   const [hostName, setHostName] = useState("");
//   const [videoUrl, setVideoUrl] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleCreateRoom = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!hostName.trim()) {
//       setError("Please enter your name");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     try {
//       // Generate userId which will become hostId
//       const userId = userService.generateUserId();
      
//       const response = await fetch("http://localhost:5000/api/rooms/create", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           hostId: userId,
//           hostName: hostName.trim(),
//           videoUrl: videoUrl.trim() || null,
//         }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         // Save user data to localStorage (user is host)
//         userService.saveUser(userId, hostName.trim(), true);
        
//         // Redirect to room
//         router.push(`/room/${data.room.roomLink}`);
//       } else {
//         setError(data.error || "Failed to create room");
//       }
//     } catch (error) {
//       console.error("Error creating room:", error);
//       setError("Failed to create room. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
//       <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
//         <h1 className="text-2xl font-bold text-center mb-6">Create Watch Party</h1>
        
//         <form onSubmit={handleCreateRoom} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Your Name *
//             </label>
//             <input
//               type="text"
//               value={hostName}
//               onChange={(e) => setHostName(e.target.value)}
//               required
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="Enter your name"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               YouTube Video URL (Optional)
//             </label>
//             <input
//               type="url"
//               value={videoUrl}
//               onChange={(e) => setVideoUrl(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="https://youtube.com/watch?v=..."
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               You can add or change the video later
//             </p>
//           </div>

//           {error && (
//             <div className="text-red-600 text-sm">{error}</div>
//           )}

//           <button
//             type="submit"
//             disabled={isLoading || !hostName.trim()}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isLoading ? "Creating Room..." : "Create Room"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
